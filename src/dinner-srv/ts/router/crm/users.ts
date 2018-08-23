import { UsersValidator } from "./validator"
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import * as Utils from "../../lib/utils"
import { MinioHelper } from "../../lib/miniohelper"
import { checkPassword, md5sum, getSalt, checkCursorLimit } from "../../lib/utils"
import { RedisLogin, LoginInfo } from "../../redis/logindao"
import { SmsCode as MySmsCode } from "../../redis/smscode"
import { Users } from "../../model/users/users"
import { Notice } from "../../model/users/notice"
import { CrmLog } from "../../model/crm/crmlog"
// import { wxSmall } from "../../config/wxpay"
import { sendSms } from "../../lib/sms"
import { BaseHandler } from "../lib/basehandler"
import { CrmlogInfo } from "../lib/crmloginfo"
import * as gettime from "../../lib/gettime"
export const router = new RouterWrap({ prefix: "/crmusers" })


export class CrmUser extends BaseHandler {
    //1.登录
    public static async login(body: any): Promise<any> {
        const { phone, password } = body
        if (phone === "root") {
            validateCgi({ password }, UsersValidator.passwordvalidator)
        } else {
            validateCgi({ phone, password }, UsersValidator.login)
        }
        let users = await Users.getInstance().findByPhone(phone)
        let isExist = false
        let user: any
        if (!users) {
            return super.NotFound("该用户不存在")
        } else {
            users.forEach(r => {
                if (r.role) {
                    isExist = true
                    user = r
                }
            })
        }
        if (!isExist)
            return super.NotFound("该用户不存在")

        checkPassword(user.password, md5sum(password + user.salt))
        delete user.password
        delete user.salte

        let [now, uuid] = [new Date(), user.uuid]
        let [token, key] = [md5sum(`${now.getTime()}_${Math.random()}`), md5sum(`${now.getTime()}_${Math.random()}`)]

        let cache = new LoginInfo(uuid, key, token, now.toLocaleString(), user.role)
        await RedisLogin.setLoginAsync(uuid, cache)

        return { uuid: uuid, token: token, phone: user.phone, role: user.role }
    }

    //2.登出
    public static async logout(ctx: any): Promise<any> {
        let loginInfo: LoginInfo = super.getLoginInfo(ctx)

        RedisLogin.delLogin(loginInfo.getUuid())  // 不等待
        return { "msg": "ok" }
    }

    //3.获取验证码
    public static async getSmsCode(args: any): Promise<any> {
        const { phone } = args
        validateCgi({ phone }, UsersValidator.getCode)

        let users = await Users.getInstance().findByPhone(phone)
        let isExist = false
        if (!users) {
            return super.NotFound("该用户不存在")
        } else {
            users.forEach(r => {
                if (r.role === "admin") isExist = true
            })
        }
        if (!isExist)
            return super.NotFound("该用户不存在")

        //********************************************************** */
        if (await MySmsCode.getSmsCode(phone)) {
            return super.BadRequest("请求太频繁，请稍后再尝试！")
        }

        let body = await sendSms(phone)

        let m = JSON.parse(body)
        let cache = { body: body, code: m.obj }

        MySmsCode.saveSmsCode(phone, JSON.stringify(cache))
        return { msg: "验证码请求成功" }

        //********************************************************* */
        // let body = "body"
        // let code = Math.round(Math.random() * 9000 + 1000) + ""
        // let cache = { body: body, code: code }

        // MySmsCode.saveSmsCode(phone, JSON.stringify(cache))

        // return { msg: "验证码请求成功，验证码为：" + cache.code + "，验证码10分钟内有效！", code: cache.code }
        //************************************************************************************************* */
    }

    //4.找回密码
    public static async findBackPassword(args: any, ctx: any): Promise<any> {
        const { phone, password, code } = args
        validateCgi({ phone, password, code }, UsersValidator.findBackPassword)

        let users = await Users.getInstance().findByPhone(phone)
        let isExist = false
        let user: any
        if (!users) {
            return super.NotFound("该用户不存在")
        } else {
            users.forEach(r => {
                if (r.role === "admin") {
                    isExist = true
                    user = r
                }
            })
        }
        if (!isExist)
            return super.NotFound("该用户不存在")

        let s = await MySmsCode.getSmsCode(user.phone)
        if (!s)
            return super.BadRequest("请输入正确的验证码！")

        s = JSON.parse(s)
        if (s.code !== code)
            return super.BadRequest("验证码有误！")

        let newcount = await Users.getInstance().updatePasswordByUuid(user.uuid, md5sum(password + user.salt))
        MySmsCode.removeSmsCode(user.phone)
        if (!newcount)
            return super.InternalServerError("修改密码失败！")

        let ip = ctx.req.headers["x-forwarded-for"] || ctx.ip.substring(7, 20) || ctx.req.headers["x-real-ip"]
        await CrmLog.getInstance().insertLog(user.uuid, "通过忘记密码，修改了密码", user.phone, ip)

        return { msg: "找回密码成功" }
    }

    //5.修改密码
    public static async updatePassword(args: any, ctx: any): Promise<any> {
        const { oldPassword, newPassword } = args
        validateCgi({ oldPassword, newPassword }, UsersValidator.updatePassword)

        const info: LoginInfo = BaseHandler.getLoginInfo(ctx)
        let uuid = info.getUuid()

        let user = await Users.getInstance().findByPrimary(uuid)
        checkPassword(user.password, md5sum(oldPassword + user.salt))

        let salt = getSalt()

        let obj = {} as any
        obj.salt = salt
        obj.password = md5sum(newPassword + salt)

        let updateOk = await Users.getInstance().updateByUuid(uuid, obj)
        if (!updateOk)
            return super.InternalServerError("修改密码失败！")

        let { crmuserUuid, crmuser, ip } = await CrmlogInfo.getCrmlogInfo(ctx)
        await CrmLog.getInstance().insertLog(crmuserUuid, "修改了密码！", crmuser.phone, ip)

        return { msg: "修改密码成功！" }
    }

    //6.root增加admin管理员(phone/password)
    public static async addAdmin(body: any, ctx: any): Promise<any> {
        const { phone, password } = body

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isRoot())
            return super.NotAcceptable("没有权限")

        let validatorObj = { phone, password }
        validateCgi(validatorObj, UsersValidator.addAdmin)

        let salt = getSalt()
        let obj = {
            phone,
            password: md5sum(password + salt),
            salt: salt,
            role: "admin"
        } as any

        let users = await Users.getInstance().findByPhone(phone)
        let isExist = false
        if (users) {
            users.forEach(r => {
                if (r.role === "admin")
                    isExist = true
            })
        }

        if (isExist) {
            return super.NotAcceptable("用户已存在！")
        } else {
            let newAdmin = await Users.getInstance().insertUser(obj)
            if (newAdmin) {
                delete newAdmin.password     // 不返回密码
                delete newAdmin.salt
            } else {
                return super.InternalServerError("添加管理员失败！")
            }
        }

        let { crmuserUuid, crmuser, ip } = await CrmlogInfo.getCrmlogInfo(ctx)
        await CrmLog.getInstance().insertLog(crmuserUuid, "添加了" + phone + "管理员用户", crmuser.phone, ip)

        return { msg: "添加管理员成功！" }
    }

    //7.root修改admin管理员(phone/password)
    public static async updateAdmin(params: any, body: any, ctx: any): Promise<any> {
        const { uuid } = params
        let { phone, password } = body

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isRoot())
            return super.NotAcceptable("没有权限")

        let salt = getSalt()
        let obj = { phone } as any
        if (password) {
            obj.password = md5sum(password + salt)
            obj.salt = salt
        }

        validateCgi(obj, UsersValidator.updateAdmin)

        let userArr = await Users.getInstance().findByPhone(phone)
        let isExist = false
        if (userArr) {
            userArr.forEach(r => {
                if (r.uuid !== uuid && r.role == "admin")
                    isExist = true
            })
        }
        if (isExist)
            return super.NotAcceptable("手机号已存在！")

        let users = await Users.getInstance().updateByUuid(uuid, obj)
        if (!users)
            return super.InternalServerError("修改失败！")

        let { crmuserUuid, crmuser, ip } = await CrmlogInfo.getCrmlogInfo(ctx)
        await CrmLog.getInstance().insertLog(crmuserUuid, "修改了" + phone + "用户信息", crmuser.phone, ip)

        return { msg: "修改成功！" }

    }

    //8.root查询admin管理员列表（phone/uuid/role/created/modified(前端过滤分页)）
    public static async CrmUserList(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isRoot())
            return super.NotAcceptable("没有权限")

        let users = await Users.getInstance().findAllUsers({ role: "admin" })
        if (users.count === 0)
            return new Array()

        let userList = users.rows.map(r => r.get())
        userList.forEach(r => {
            delete r.password
            delete r.salt
            r.created = gettime.getTimeStr(r.created)
            r.modified = gettime.getTimeStr(r.modified)
        })

        return userList
    }

    //9.admin查询app用户列表（下拉切换过滤：审核状态，模糊查询：phone,openid,nickname,排序：年龄，人气值，创建时间）
    public static async UserList(query: any, ctx: any): Promise<any> {
        const { start, length, draw, status, orderby, ascordesc } = query

        let search: String = query["search[value]"]
        if (!search) search = ""
        let searchdata = search.toUpperCase()

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isAdmin())
            return super.NotAcceptable("没有权限")

        validateCgi({ start, length, status, search: searchdata, orderby, ascordesc }, UsersValidator.UserList)

        let check = checkCursorLimit(parseInt(start), parseInt(length))
        if (check)
            return super.BadRequest("参数不合要求")

        let obj = { role: null } as any
        if (status !== "all")
            obj = { status: status }
        if (search)
            obj.$or = [{ nickname: { $like: "%" + search + "%" } }, { openid: { $like: "%" + search + "%" } }, { phone: { $like: "%" + search + "%" } }]

        let res = await Users.getInstance().findAll(obj, start, length, orderby, ascordesc)
        let userList = res.rows.map(r => r.get())

        for (let index = 0; index < userList.length; index++) {
            const r = userList[index]
            r.created = gettime.getTimeStr(r.created)
            r.modified = gettime.getTimeStr(r.modified)
            if (r.birthday)
                r.birthday = gettime.formatToYMD(r.birthday)
        }

        return { userList, recordsFiltered: res.count, draw: parseInt(draw) }
    }

    //10.admin增加app用户数据（nickname/phone/personality/avatar/longitude/latitude/attestvideo/gender/birthday/height/balance）
    public static async addAppUser(body: any, ctx: any): Promise<any> {
        let { nickname, phone, longitude, latitude, gender, birthday, height, balance, popularity } = body

        let validatorObj = { nickname, phone, longitude, latitude, gender, birthday, height, balance, popularity } as any
        validateCgi(validatorObj, UsersValidator.addAppUser)

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isAdmin())
            return super.NotAcceptable("没有权限")

        if (phone) {
            let users = await Users.getInstance().findByPhone(phone)
            let isExist = false
            if (users) {
                users.forEach(r => {
                    if (!r.role) isExist = true
                })
            }
            if (isExist) {
                return super.BadRequest("该手机号已存在")
            }
        }

        let point = 'Point(' + latitude + ' ' + longitude + ')'
        validatorObj.status = "unupload"
        validatorObj.notice = "off"
        validatorObj.point = point
        let adduserOk = await Users.getInstance().add(validatorObj)
        if (!adduserOk) {
            return super.InternalServerError("增加用户失败")
        }

        let { crmuserUuid, crmuser, ip } = await CrmlogInfo.getCrmlogInfo(ctx)
        await CrmLog.getInstance().insertLog(crmuserUuid, "添加了昵称为" + nickname + "的普通用户", crmuser.phone, ip)

        return { msg: "添加用户成功" }
    }

    //11.删除用户数据（注意删除媒体文件）
    public static async deleteUser(params: any, ctx: any): Promise<any> {
        const { uuid } = params
        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isRoot() && !info.isAdmin())
            return super.NotAcceptable("没有权限")

        validateCgi({ uuid }, UsersValidator.deleteUser)

        let deleteaccount = await Users.getInstance().findByPrimary(uuid)
        if (!deleteaccount) {
            return super.NotFound("没有该用户")
        }
        let phone = deleteaccount.phone

        await CrmUser.deleteUserMedia(deleteaccount)    //删除用户媒体文件

        await RedisLogin.delLoginApp(uuid)

        let count = await Users.getInstance().delete(uuid)
        if (count === 0)
            return super.InternalServerError("刪除用户失败！")

        let { crmuserUuid, crmuser, ip } = await CrmlogInfo.getCrmlogInfo(ctx)
        await CrmLog.getInstance().insertLog(crmuserUuid, "删除了" + phone + "用户", crmuser.phone, ip)

        return { msg: "删除用户成功！" }
    }

    //12.admin修改app资料（nickname/phone/personality/avatar/longitude/latitude/attestvideo/sex/age/height/balance）
    public static async updateAppUser(params: any, body: any, ctx: any): Promise<any> {
        const { uuid } = params
        let { nickname, phone, longitude, latitude, gender, birthday, height, balance, popularity } = body
        let validatorObj = { nickname, phone, longitude, latitude, gender, birthday, height, balance, popularity }
        validateCgi(validatorObj, UsersValidator.addAppUser)

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isAdmin())
            return super.NotAcceptable("没有权限")

        if (phone) {
            let users = await Users.getInstance().findByPhone(phone)
            let isExist = false
            if (users) {
                users.forEach(r => {
                    if (!r.role && uuid !== r.uuid) isExist = true
                })
            }
            if (isExist) {
                return super.BadRequest("该手机号已存在")
            }
        }

        let updateOk = await Users.getInstance().updateByUuid(uuid, validatorObj)
        if (!updateOk) super.InternalServerError("修改用户信息失败")

        let point = 'Point(' + latitude + ' ' + longitude + ')'
        let syncLocationOk = await Users.getInstance().syncLocation(uuid, point)
        if (!syncLocationOk) return super.InternalServerError("同步定位信息有误")

        let { crmuserUuid, crmuser, ip } = await CrmlogInfo.getCrmlogInfo(ctx)
        await CrmLog.getInstance().insertLog(crmuserUuid, "修改了昵称为" + nickname + "的普通用户", crmuser.phone, ip)

        return { msg: "修改用户成功" }
    }

    //13.修改/添加媒体文件
    public static async updateOrAddMeida(ctx: any): Promise<any> {
        // uploadfield --avatar头像 attestvideo认证视频 personality形象展示 album相册
        const { uploadfield, url, uuid } = (ctx.req as any).body
        let files = (ctx.req as any).files
        validateCgi({ uploadfield }, UsersValidator.updateOrAddMeida)

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isAdmin()) {
            return super.NotAcceptable("权限不足")
        }
        let user = await Users.getInstance().findByPrimary(uuid)

        if (url) {
            //修改媒体内容
            if (uploadfield === "avatar") {
                //头像
                let avatarUrl = user.avatar
                if (files.length > 1) {
                    //同时传来多张照片
                    await CrmUser.deleteTmpFile(files)
                    return super.BadRequest("不能设置两个头像")
                } else {
                    let file = files[0]

                    let url = await CrmUser.upload(file, uploadfield)

                    let updateOk = await Users.getInstance().updateByUuid(uuid, { avatar: url })
                    if (!updateOk) {
                        return super.InternalServerError("修改头像失败")
                    }
                    await Utils.removeAsync(file.path)

                    if (avatarUrl.indexOf("wx.qlogo.cn") < 0) {
                        //删除自己上传的头像
                        //  url=/avatar/00/A8/20431517903700697.jpg
                        let oldAvatar = await CrmUser.getBucketAndFileName(avatarUrl)
                        await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)
                    }

                    return { data: { path: url } }
                }

            } else if (uploadfield === "attestvideo") {
                //认证视频
                if (files.length > 1) {
                    //修改时上传多个认证视频
                    await CrmUser.deleteTmpFile(files)
                    return super.BadRequest("不能设置两个认证视频")
                } else {
                    let file = files[0]

                    let url = await CrmUser.upload(file, uploadfield)

                    let updateOk = await Users.getInstance().updateByUuid(uuid, { attestvideo: url })
                    if (!updateOk) {
                        return super.InternalServerError("修改认真视频失败")
                    }
                    await Utils.removeAsync(file.path)

                    let needDelete = user.attestvideo
                    let oldAvatar = await CrmUser.getBucketAndFileName(needDelete)
                    await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)

                    return { data: { path: url } }
                }

            } else if (uploadfield === "personality") {
                //个性展示
                try {
                    let mediaArr = await CrmUser.uploadArr(files, uploadfield, user, uuid, "update", url)
                    return { data: { path: mediaArr } }
                } catch (error) {
                    return error
                }

            } else {
                //相册
                try {
                    let mediaArr = await CrmUser.uploadArr(files, uploadfield, user, uuid, "update", url)
                    return { data: { path: mediaArr } }
                } catch (error) {
                    return error
                }
            }
        } else {
            //上传媒体内容
            if (uploadfield === "avatar") {
                //头像
                if (files.length > 1) {
                    await CrmUser.deleteTmpFile(files)
                    return super.BadRequest("不能上传多个头像")
                } else {
                    let file = files[0]

                    let url = await CrmUser.upload(file, uploadfield)
                    console.log(url)

                    let updateOk = await Users.getInstance().updateByUuid(uuid, { avatar: url })
                    if (!updateOk) {
                        return super.InternalServerError("上传头像失败")
                    }
                    await Utils.removeAsync(file.path)

                    let avatarUrl = user.avatar
                    if (avatarUrl && avatarUrl.indexOf("wx.qlogo.cn") < 0) {
                        //删除自己上传的头像
                        //  url=/avatar/00/A8/20431517903700697.jpg
                        let oldAvatar = await CrmUser.getBucketAndFileName(avatarUrl)
                        await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)
                    }

                    return { data: { path: url } }
                }

            } else if (uploadfield === "attestvideo") {
                //认证视频
                if (!user.attestvideo) {
                    //如果认证视频不存在
                    if (files.length > 1) {
                        //同时上传多个视频
                        await CrmUser.deleteTmpFile(files)
                        return super.BadRequest("不能上传多个认证视频")
                    } else {
                        let file = files[0]

                        let url = await CrmUser.upload(file, uploadfield)

                        let updateOk = await Users.getInstance().updateByUuid(uuid, { attestvideo: url, status: "uncheck" })
                        if (!updateOk) {
                            return super.InternalServerError("插入认证视频url失败")
                        }

                        await Utils.removeAsync(file.path)
                        return { data: { path: url } }
                    }

                } else {
                    //如果认证视频存在
                    await CrmUser.deleteTmpFile(files)
                    return super.BadRequest("不能上传多个认证视频")
                }
            } else if (uploadfield === "personality") {
                //形象展示
                try {
                    let mediaArr = await CrmUser.uploadArr(files, uploadfield, user, uuid, "add")
                    return { data: { path: mediaArr } }
                } catch (error) {
                    return error
                }

            } else {
                //相册
                try {
                    let mediaArr = await CrmUser.uploadArr(files, uploadfield, user, uuid, "add")
                    return { data: { path: mediaArr } }
                } catch (error) {
                    return error
                }
            }
        }

    }

    //14.删除媒体文件
    public static async DelMedia(ctx: any): Promise<any> {
        const { url, delfield, uuid } = (ctx.request as any).body
        validateCgi({ delfield }, UsersValidator.DelMedia)
        //"attestvideo", "personality", "album","avatar"

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isAdmin()) {
            return super.NotAcceptable("权限不足")
        }
        let user = await Users.getInstance().findByPrimary(uuid)

        let currentField
        if (delfield === "attestvideo") {
            currentField = user.attestvideo
        } else if (delfield === "personality") {
            currentField = user.personality
        } else if (delfield === "album") {
            currentField = user.album
        } else {
            currentField = user.avatar
        }

        let oldAvatar = await CrmUser.getBucketAndFileName(url)
        await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)

        if (delfield === "personality" || delfield === "album") {
            let index = currentField.indexOf(url)
            currentField.splice(index, 1)
        } else {
            currentField = null
        }

        let updateOk
        if (delfield === "attestvideo") {
            updateOk = await Users.getInstance().updateByUuid(uuid, { attestvideo: currentField })
        } else if (delfield === "personality") {
            updateOk = await Users.getInstance().updateByUuid(uuid, { personality: currentField })
        } else if (delfield === "album") {
            updateOk = await Users.getInstance().updateByUuid(uuid, { album: currentField })
        } else {
            updateOk = await Users.getInstance().updateByUuid(uuid, { avatar: currentField })
        }
        if (!updateOk) {
            return super.InternalServerError("删除媒体文件失败")
        }

        return { msg: "deleted ok!" }

    }

    //修改审核视频状态
    public static async checkVideo(params: any, body: any, ctx: any): Promise<any> {
        const { uuid } = params
        let { status, reason } = body
        if (reason === "") reason = undefined
        validateCgi({ uuid, status, reason }, UsersValidator.checkVideo)

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isAdmin())
            return super.NotAcceptable("没有权限")

        let user = await Users.getInstance().findByPrimary(uuid)
        if (!user) return super.NotFound("没有找到该用户")

        let updateUserOk = await Users.getInstance().updateByUuid(user.uuid, { status: status })
        if (!updateUserOk) return super.InternalServerError("更新审核状态失败")

        let obj = { useruuid: uuid, reason, type: "audit", result: status, state: "true" }
        let addNoticeOk = await Notice.getInstance().add(obj)
        if (!addNoticeOk) return super.InternalServerError("插入系统消息失败")

        return { "msg": "修改状态成功" }

    }

    //获取评价列表
    public static async getComments(params: any, query: any, ctx: any): Promise<any> {
        let { uuid } = params
        const { start, length, draw } = query
        validateCgi({ uuid, start, length }, UsersValidator.getComments)

        let result = await Users.getInstance().getComments(uuid, parseInt(start), parseInt(length))
        let commentlist = result.row

        commentlist.forEach(r => {
            let starttime = r.starttime
            r.starttime = [gettime.formatToYMDSFM(starttime[0]), gettime.formatToYMDSFM(starttime[1])]
        })

        return { commentlist, recordsFiltered: result.count, draw: parseInt(draw) }
    }

    //通过url获取bucket和文件路径
    private static async getBucketAndFileName(url: string): Promise<any> {
        return new Promise((resolve) => {
            let Arr = url.split('/')
            Arr.shift()
            let bucketName = Arr[0]
            Arr.shift()
            let fileName = Arr.join('/')
            return resolve({ bucketName, fileName })
        })
    }

    //删除用户的媒体文件
    private static async deleteUserMedia(user: any): Promise<any> {
        return new Promise(async (resolve) => {
            let [avatar, attestvideo, personality, album] =
                [user.avatar, user.attestvideo, user.personality, user.album]

            if (avatar && avatar.indexOf("wx.qlogo.cn") < 0) {
                let oldAvatar = await CrmUser.getBucketAndFileName(avatar)
                await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)
            }
            if (attestvideo) {
                let oldAvatar = await CrmUser.getBucketAndFileName(attestvideo)
                await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)
            }
            if (personality) {
                for (let i = 0; i < personality.length; i++) {
                    let oldAvatar = await CrmUser.getBucketAndFileName(personality[i])
                    await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)
                }
            }
            if (album) {
                for (let i = 0; i < album.length; i++) {
                    let oldAvatar = await CrmUser.getBucketAndFileName(album[i])
                    await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)
                }
            }
            return resolve()
        })
    }

    //删除临时tmp区文件
    private static async deleteTmpFile(files: any): Promise<any> {
        return new Promise(async (resolve) => {
            for (let i = 0; i < files.length; i++) {
                await Utils.removeAsync(files[i].path)
            }
            return resolve()
        })
    }

    //上传file到minio服务器
    private static async upload(file: any, uploadfield: string): Promise<any> {
        return new Promise(async (resolve) => {
            let path = await Utils.getRandomPath()
            let newName = await Utils.getRandomName()
            let ext = file.originalname.split('.').pop()
            let filename = path + '/' + newName + '.' + ext

            await MinioHelper.getInstance().uploadfile(uploadfield, filename, file.path)
            let attestvideoUrl = `/${uploadfield}/${filename}`
            return resolve(attestvideoUrl)
        })
    }

    //上传文件到个性展示/相册，返回数组
    private static async uploadArr(files: any, uploadfield: string, user: any, uuid: string, type: string, url?: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            let currentField = new Array()
            let maxCount
            if (uploadfield === "personality") {
                if (user.personality)
                    currentField = user.personality
                maxCount = 5
            } else {
                if (user.album)
                    currentField = user.album
                maxCount = 9
            }
            if (files.length + currentField.length > maxCount) {
                await CrmUser.deleteTmpFile(files)
                return reject(super.BadRequest("上传超过上限"))
            } else {
                let mediaArr = currentField
                if (!mediaArr) {
                    mediaArr = new Array()
                }
                if (type === "update") {
                    let index = mediaArr.indexOf(url)
                    let tmpArr = new Array()
                    for (let file of files) {
                        let url = await CrmUser.upload(file, uploadfield)
                        tmpArr.push(url)
                    }
                    mediaArr.splice(index, 1, tmpArr)

                    let oldAvatar = await CrmUser.getBucketAndFileName(url)
                    await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)

                } else {
                    for (let file of files) {
                        let url = await CrmUser.upload(file, uploadfield)
                        mediaArr.push(url)
                    }
                }

                let updateOk
                if (uploadfield === "personality") {
                    updateOk = await Users.getInstance().updateByUuid(uuid, { personality: mediaArr })
                } else {
                    updateOk = await Users.getInstance().updateByUuid(uuid, { album: mediaArr })
                }

                if (!updateOk) {
                    return reject(super.InternalServerError("插入失败"))
                }

                await CrmUser.deleteTmpFile(files)
                return resolve(mediaArr)
            }
        })
    }


}


//1.登录
router.handle("post", "/login", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.login((ctx.request as any).body)))

//2.登出
router.loginHandle('post', "/logout", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.logout(ctx)))

//3、获取验证码
router.handle('post', "/getcode", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.getSmsCode((ctx.request as any).body)))

//4.找回密码
router.handle('post', "/findpassword", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.findBackPassword((ctx.request as any).body, ctx)))

//5.修改密码
router.loginHandle('post', "/updatepassword", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.updatePassword((ctx.request as any).body, ctx)))

//6.root增加admin管理员(phone/password)
router.loginHandle("post", "/addadmin", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.addAdmin((ctx.request as any).body, ctx)))

//7.root修改admin管理员(phone/password)
router.loginHandle("put", "/admin/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.updateAdmin(ctx.params, (ctx.request as any).body, ctx)))

//8.root查询admin管理员列表（phone/uuid/role/created/modified(前端过滤分页)）
router.loginHandle("get", "/findcrmusers", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.CrmUserList(ctx)))

//9.admin查询app用户列表（下拉切换过滤：审核状态，模糊查询：phone,openid,nickname,排序：年龄，人气值，创建时间）
router.loginHandle("get", "/findusers", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.UserList((ctx.request as any).query, ctx)))

//10.admin增加app用户数据（nickname/phone/personality/avatar/longitude/latitude/attestvideo/sex/age/height/balance）
router.loginHandle("post", "/addappuser", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.addAppUser((ctx.request as any).body, ctx)))

//14.删除媒体文件
router.loginHandle("delete", "/media", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.DelMedia(ctx)))

//11.删除用户数据（注意删除媒体文件）
router.loginHandle("delete", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.deleteUser(ctx.params, ctx)))

//12.admin修改app资料（nickname/phone/personality/avatar/longitude/latitude/attestvideo/sex/age/height/balance）
router.loginHandle("put", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.updateAppUser(ctx.params, (ctx.request as any).body, ctx)))

//13.修改/上传媒体文件
router.loginHandle("post", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.updateOrAddMeida(ctx)))

//15.admin修改审核状态
router.loginHandle("put", "/checkvideo/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.checkVideo(ctx.params, (ctx.request as any).body, ctx)))

//16.获取用户的评论列表
router.loginHandle("get", "/comments/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmUser.getComments(ctx.params, (ctx.request as any).query, ctx)))