import { UsersValidator } from "./validator"
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { md5sum } from "../../lib/utils"
import * as Utils from "../../lib/utils"
import { getAsync } from "../../lib/request"
import { MinioHelper } from "../../lib/miniohelper"
import { RedisLogin, LoginInfoAtApp } from "../../redis/logindao"
import { SmsCode as MySmsCode } from "../../redis/smscode"
import * as Formids from "../../redis/formids"
import { Users } from "../../model/users/users"
import { Favorite } from "../../model/users/favorite"
import { wxSmall } from "../../config/wxpay"
import { sendSms } from "../../lib/sms"
import { BaseHandler } from "../lib/basehandler"
// import * as gettime from "../../lib/gettime"
export const router = new RouterWrap({ prefix: "/appusers" })


export class AppUser extends BaseHandler {
    //1.获取用户openid和会话密钥
    private static async getOpenid(args: any): Promise<any> {
        const { code } = args

        let form = {
            url: `https://api.weixin.qq.com/sns/jscode2session?appid=${wxSmall.appid}&secret=${wxSmall.secret}&js_code=${code}&grant_type=authorization_code`
        }
        let obj = await getAsync(form)
        obj = JSON.parse(obj)
        if (obj.errcode)
            return super.Forbidden(obj.errmsg)

        return { openid: obj.openid, session_key: obj.session_key }
    }

    //2.微信登录接口
    public static async login(args: any): Promise<any> {
        const { code, nickname, avatar } = args
        validateCgi({ code, nickname }, UsersValidator.login)

        const { openid, session_key } = await AppUser.getOpenid(args)
        //通过openid查找用户是否存在
        let user = await Users.getInstance().getBySingleField({ openid: openid })
        if (user) {
            //如果存在，则1、更新nickname
            await Users.getInstance().updateByOpenid(openid, { nickname })
            //则2、保存登录状态
            let [now, uuid] = [new Date(), user.uuid]
            let [token] = [md5sum(`${now.getTime()}_${Math.random()}`)]

            let secret = openid + session_key
            let cache = new LoginInfoAtApp(uuid, secret, openid)
            await RedisLogin.setLoginAsynAtApp(token, cache)

            if (!user.height && !user.birthday)
                return { token, "msg": "height and birthday is empty" }

            //3、发送{  token }
            return { token }

        } else {
            //如果不存在，则 1、插入一条登录用户数据（相当于注册）
            let obj = { nickname, openid, notice: "on", avatar, status: "unupload", balance: 0, popularity: 0 }
            let adduser = await Users.getInstance().insertUser(obj)
            //2、保存登录消息
            let [now, uuid] = [new Date(), adduser.uuid]
            let [token] = [md5sum(`${now.getTime()}_${Math.random()}`)]

            let secret = openid + session_key
            let cache = new LoginInfoAtApp(uuid, secret, openid)
            await RedisLogin.setLoginAsynAtApp(token, cache)

            //3、发送{ "msg":"user not exist!", token}
            return { token, "msg": "user not exist!" }
        }
    }

    //3.首次授权添加身高、性别、年龄
    public static async addBaseInfo(ctx: any, args: any): Promise<any> {
        const { gender, birthday, height } = args
        validateCgi({ gender, birthday, height }, UsersValidator.addBaseInfo)

        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let openid = info.getOpenid()
        let updateOk = await Users.getInstance().updateByOpenid(openid, { gender, birthday, height })
        if (!updateOk)
            return super.InternalServerError("添加基本资料有误")

        return { "msg": "添加基本资料成功" }

    }

    //5.修改/添加媒体文件
    public static async updateOrAddMeida(ctx: any): Promise<any> {
        // uploadfield --avatar头像 attestvideo认证视频 personality形象展示 album相册
        const { uploadfield, url } = (ctx.req as any).body
        let files = (ctx.req as any).files
        validateCgi({ uploadfield }, UsersValidator.updateOrAddMeida)

        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let openid = info.getOpenid()
        let user = await Users.getInstance().getBySingleField({ openid: openid })

        if (url) {
            //修改媒体内容
            if (uploadfield === "avatar") {
                //头像
                let avatarUrl = user.avatar
                if (files.length > 1) {
                    //同时传来多张照片
                    await AppUser.deleteTmpFile(files)
                    return super.BadRequest("不能设置两个头像")
                } else {
                    let file = files[0]

                    let url = await AppUser.upload(file, uploadfield)

                    let updateOk = await Users.getInstance().updateByOpenid(openid, { avatar: url })
                    if (!updateOk) {
                        return super.InternalServerError("修改头像失败")
                    }
                    await Utils.removeAsync(file.path)

                    if (avatarUrl.indexOf("wx.qlogo.cn") < 0) {
                        //删除自己上传的头像
                        //  url=/avatar/00/A8/20431517903700697.jpg
                        let oldAvatar = await AppUser.getBucketAndFileName(url)
                        await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)
                    }

                    return { data: { path: url } }
                }

            } else if (uploadfield === "attestvideo") {
                //认证视频
                if (files.length > 1) {
                    //修改时上传多个认证视频
                    await AppUser.deleteTmpFile(files)
                    return super.BadRequest("不能设置两个认证视频")
                } else {
                    let file = files[0]

                    let url = await AppUser.upload(file, uploadfield)

                    let updateOk = await Users.getInstance().updateByOpenid(openid, { attestvideo: url })
                    if (!updateOk) {
                        return super.InternalServerError("修改认真视频失败")
                    }
                    await Utils.removeAsync(file.path)

                    let oldAvatar = await AppUser.getBucketAndFileName(url)
                    await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)

                    return { data: { path: url } }
                }

            } else if (uploadfield === "personality") {
                //个性展示
                let mediaArr = await AppUser.uploadArr(files, uploadfield, user, openid, "update", url)

                return { data: { path: mediaArr } }

            } else {
                //相册
                let mediaArr = await AppUser.uploadArr(files, uploadfield, user, openid, "update", url)
                return { data: { path: mediaArr } }
            }
        } else {
            //上传媒体内容
            if (uploadfield === "avatar") {
                //头像
                if (files.length > 1) {
                    await AppUser.deleteTmpFile(files)
                    return super.BadRequest("不能上传多个头像")
                } else {
                    let file = files[0]

                    let url = await AppUser.upload(file, uploadfield)
                    console.log(url)

                    let updateOk = await Users.getInstance().updateByOpenid(openid, { avatar: url })
                    if (!updateOk) {
                        return super.InternalServerError("上传头像失败")
                    }
                    await Utils.removeAsync(file.path)

                    let avatarUrl = user.avatar
                    if (avatarUrl.indexOf("wx.qlogo.cn") < 0) {
                        //删除自己上传的头像
                        //  url=/avatar/00/A8/20431517903700697.jpg
                        let oldAvatar = await AppUser.getBucketAndFileName(avatarUrl)
                        await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)
                    }

                    return { data: { path: url } }
                }
            } else if (uploadfield === "attestvideo") {
                //认证视频

                //如果认证视频不存在
                let oldAttestvideo = user.attestvideo
                if (files.length > 1) {
                    //同时上传多个视频
                    await AppUser.deleteTmpFile(files)
                    return super.BadRequest("不能上传多个认证视频")
                } else {
                    let file = files[0]

                    let url = await AppUser.upload(file, uploadfield)

                    let updateOk = await Users.getInstance().updateByOpenid(openid, { attestvideo: url, status: "uncheck" })
                    if (!updateOk) {
                        return super.InternalServerError("插入认证视频url失败")
                    }
                    if (user.attestvideo) {
                        let oldAvatar = await AppUser.getBucketAndFileName(oldAttestvideo)
                        await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)
                    }


                    await Utils.removeAsync(file.path)
                    return { data: { path: url } }
                }

            } else if (uploadfield === "personality") {
                //形象展示
                try {
                    let mediaArr = await AppUser.uploadArr(files, uploadfield, user, openid, "add")
                    console.log(mediaArr)
                    return { data: { path: mediaArr } }

                } catch (error) {
                    return error
                }

            } else {
                //相册
                try {
                    let mediaArr = await AppUser.uploadArr(files, uploadfield, user, openid, "add")
                    return { data: { path: mediaArr } }
                } catch (error) {
                    return error
                }

            }
        }

    }

    //6.删除媒体文件
    public static async DelMedia(ctx: any): Promise<any> {
        const { url, delfield } = (ctx.request as any).body
        validateCgi({ delfield }, UsersValidator.DelMedia)
        //"attestvideo", "personality", "album"

        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let openid = info.getOpenid()
        let user = await Users.getInstance().getBySingleField({ openid: openid })

        let currentField
        if (delfield === "attestvideo") {
            currentField = user.attestvideo
        } else if (delfield === "personality") {
            currentField = user.personality
        } else {
            currentField = user.album
        }

        let oldAvatar = await AppUser.getBucketAndFileName(url)
        await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)

        let index = currentField.indexOf(url)
        currentField.splice(index, 1)

        let updateOk
        if (delfield === "attestvideo") {
            updateOk = await Users.getInstance().updateByOpenid(openid, { attestvideo: currentField })
        } else if (delfield === "personality") {
            updateOk = await Users.getInstance().updateByOpenid(openid, { personality: currentField })
        } else {
            updateOk = await Users.getInstance().updateByOpenid(openid, { album: currentField })
        }

        if (!updateOk) {
            return super.InternalServerError("删除媒体文件失败")
        }

        return { msg: "deleted ok!" }

    }

    //7、获取验证码
    public static async getSmsCode(args: any): Promise<any> {
        const { phone } = args
        validateCgi({ phone }, UsersValidator.getCode)

        let users = await Users.getInstance().findByPhone(phone)
        let isExist = true
        if (users.length > 0) {
            users.forEach(r => {
                if (!r.role) isExist = false
            })
        }
        if (!isExist)
            return super.NotFound("该手机号已存在")

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

    //8.绑定手机号
    public static async updatePhone(args: any, ctx: any): Promise<any> {
        const { phone, code } = args
        validateCgi({ phone, code }, UsersValidator.regPhone)

        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let openid = info.getOpenid()

        let users = await Users.getInstance().findByPhone(phone)
        let isExist = true
        if (users) {
            users.forEach(r => {
                if (!r.role) isExist = false
            })
        }
        if (!isExist)
            return super.NotFound("该手机号已存在")

        let s = await MySmsCode.getSmsCode(phone)
        if (!s)
            return super.BadRequest("请输入正确的验证码！")

        s = JSON.parse(s)
        if (s.code !== code)
            return super.BadRequest("验证码有误！")

        let regPhoneOk = await Users.getInstance().updateByOpenid(openid, { phone })
        MySmsCode.removeSmsCode(phone)
        if (!regPhoneOk)
            return super.InternalServerError("绑定手机号失败！")

        return { msg: "绑定手机号成功！" }
    }

    //9.获取个人信息
    public static async getInfo(ctx: any): Promise<any> {
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let openid = info.getOpenid()

        let userInfo = await Users.getInstance().getBySingleField({ openid })
        if (!userInfo)
            return super.NotFound("没有找到该用户！")

        delete userInfo.password
        delete userInfo.salt

        return userInfo
    }

    //10.根据uuid获取用户的个人信息
    public static async getInfoByUuid(param: any, ctx: any): Promise<any> {
        let { uuid } = param
        let userInfo = await Users.getInstance().findByPrimary(uuid)
        if (!userInfo)
            return super.NotFound("没有找到该用户！")

        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let myuuid = info.getUuid()

        let isfavorite = false
        let favoriteList = await Favorite.getInstance().findByObj({ useruuid: myuuid, favoriteuuid: uuid })
        if (favoriteList.length > 0) isfavorite = true

        delete userInfo.password
        delete userInfo.salt
        userInfo.isfavorite = isfavorite

        return userInfo
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
    private static async uploadArr(files: any, uploadfield: string, user: any, openid: string, type: string, url?: string): Promise<any> {
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
                await AppUser.deleteTmpFile(files)
                return reject(super.BadRequest("上传超过上限"))
            } else {
                let mediaArr = currentField
                if (type === "update") {
                    let index = mediaArr.indexOf(url)
                    let tmpArr = new Array()
                    for (let file of files) {
                        let url = await AppUser.upload(file, uploadfield)
                        tmpArr.push(url)
                    }
                    mediaArr.splice(index, 1, tmpArr)

                    let oldAvatar = await AppUser.getBucketAndFileName(url)
                    await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)

                } else {
                    for (let file of files) {
                        let url = await AppUser.upload(file, uploadfield)
                        mediaArr.push(url)
                    }
                }

                let updateOk
                if (uploadfield === "personality") {
                    updateOk = await Users.getInstance().updateByOpenid(openid, { personality: mediaArr })
                } else {
                    updateOk = await Users.getInstance().updateByOpenid(openid, { album: mediaArr })
                }

                if (!updateOk) {
                    return reject(super.InternalServerError("插入失败"))
                }

                await AppUser.deleteTmpFile(files)
                let invertedmediaArr = new Array()
                for (let i = mediaArr.length - 1; i >= 0; i--) {
                    invertedmediaArr.push(mediaArr[i])
                }
                return resolve(invertedmediaArr)
            }
        })
    }

    //根据url获取minio中的位置
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

    //7.查询用户信息
    public static async findUsers(query: any): Promise<any> {
        const { city, agerang, sex, start, length } = query
        validateCgi({ city, agerang, sex }, UsersValidator.DelMedia)
        let obj = {
            sex: sex,
            city: city,
            age: { $contained: agerang }
        }
        let users = await Users.getInstance().getAll(obj, parseInt(start), parseInt(length))


        return { users }

    }

    //8.查询热门主播
    public static async findHotUser(query: any, ctx: any): Promise<any> {
        const { start, length } = query
        validateCgi({ start, length }, UsersValidator.findHotUser)
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let user = await Users.getInstance().findByPrimary(info.getUuid())

        let users
        users = await Users.getInstance().findByHot2(info.getUuid(), user.city, parseInt(start), parseInt(length))

        return { users }
    }

    //11.查找发布过赚钱单的热门用户
    public static async findHotForMake(query: any, ctx: any): Promise<any> {
        const { start, length } = query
        let row = await Users.getInstance().findMakeFeed(start, length)
        return { row }
    }

    //11.同步位置，昵称等实时信息
    public static async syncInfo(body: any, ctx: any): Promise<any> {
        let { nickname, avatar, longitude, latitude, city, area } = body
        validateCgi({ nickname, avatar, longitude, latitude, city, area }, UsersValidator.syncInfo)
        if (!area)
            area = null
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let uuid = info.getUuid()
        let user = await Users.getInstance().findByPrimary(uuid)
        if (!user) return super.NotFound("没有该用户")

        let obj = { nickname, city, longitude, latitude, area } as any
        let point = 'Point(' + latitude + ' ' + longitude + ')'
        obj.point = point
        if (user.avatar) {
            if (user.avatar.indexOf("wx.qlogo.cn") > 0) {
                obj.avatar = avatar
            } else {
                obj.avatar = user.avatar
            }
        } else {
            obj.avatar = avatar
        }

        let updateOk = await Users.getInstance().syncInfo(uuid, obj)
        if (!updateOk) return super.InternalServerError("更新个人实时数据失败")

        return { "msg": "更新个人实时数据成功" }
    }

    //12.修改身高/出生日期
    public static async updateBaseInfo(body: any, ctx: any): Promise<any> {
        let { key, value } = body
        if (key === "birthday") {
            validateCgi({ key, value }, UsersValidator.updateBaseInfo2Birth)
        } else {
            validateCgi({ key, value }, UsersValidator.updateBaseInfo2Height)
        }

        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let uuid = info.getUuid()

        let updateOk
        if (key === "birthday") {
            updateOk = await Users.getInstance().updateByUuid(uuid, { birthday: value })
        } else {
            updateOk = await Users.getInstance().updateByUuid(uuid, { height: value })
        }
        if (!updateOk) return super.InternalServerError("更新失败")

        return { "msg": "更新成功" }
    }

    //添加/删除收藏
    public static async addLikely(body: any, ctx: any): Promise<any> {
        let { action, uuidarr } = body
        if (action) {
            action = "true"
        } else {
            action = "false"
        }
        validateCgi({ action }, UsersValidator.addLikely)

        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let uuid = info.getUuid()

        let obj = { useruuid: uuid } as any
        if (action === "false") {
            //取消收藏
            for (let index = 0; index < uuidarr.length; index++) {
                obj.favoriteuuid = uuidarr[index]
                await Favorite.getInstance().delete(obj)
            }
        } else {
            //添加收藏
            for (let index = 0; index < uuidarr.length; index++) {
                obj.favoriteuuid = uuidarr[index]
                await Favorite.getInstance().insert(obj)
            }
        }

        return action === "false" ? { "msg": false } : { "msg": true }
    }

    //提交个人的formids数据
    public static async saveFormids(body: any, ctx: any): Promise<any> {
        let { formids } = body
        formids = JSON.parse(formids)
        if (formids.length === 0) return super.BadRequest("无收集到表单id")

        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let openid = info.getOpenid()

        let formids4redis = JSON.parse(await Formids.getFormids(openid))
        if (!formids4redis) {
            if (formids.length < 31) {
                await Formids.saveFormids(openid, JSON.stringify(formids))
            } else {
                formids = formids.slice(0, 30)
                await Formids.saveFormids(openid, JSON.stringify(formids))
            }
        } else {
            if (formids.length > 29) {
                formids = formids.slice(0, 30)
                await Formids.saveFormids(openid, JSON.stringify(formids))
            } else {
                if ((formids.length + formids4redis.length) < 31) {
                    let newFormids = formids4redis.concat(formids)
                    await Formids.saveFormids(openid, JSON.stringify(newFormids))
                } else {
                    let addlength = 30 - formids.length
                    let newRedis = formids4redis.slice(0, addlength)
                    let newFormids = newRedis.concat(formids)
                    await Formids.saveFormids(openid, JSON.stringify(newFormids))
                }
            }
        }

        return { "msg": "ok" }
    }


    //获取用户的收藏列表
    public static async likelyList(ctx: any): Promise<any> {
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let uuid = info.getUuid()

        let favoriteList = await Favorite.getInstance().getFavoriteList(uuid)
        if (favoriteList.length === 0)
            return { favoriteList: [] }

        return { favoriteList: favoriteList }
    }

}

// 1.获取个人信息
router.loginHandleAtApp("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.getInfo(ctx)))

//2.微信登录接口
router.handle("post", "/login", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.login((ctx.request as any).body)))

//3.首次授权添加身高、性别信息
router.loginHandleAtApp("put", "/addbaseinfo", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.addBaseInfo(ctx, (ctx.request as any).body)))

//5.修改/上传媒体文件
router.loginHandleAtApp("post", "/media", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.updateOrAddMeida(ctx)))

//6.删除媒体文件
router.loginHandleAtApp("delete", "/media", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.DelMedia(ctx)))

//7、获取验证码
router.loginHandleAtApp('post', "/getcode", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.getSmsCode((ctx.request as any).body)))

//8.绑定手机号
router.loginHandleAtApp('post', "/updatephone", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.updatePhone((ctx.request as any).body, ctx)))

//9.超找用户
router.loginHandleAtApp("get", "/users", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.findUsers((ctx.request as any).query)))

//10.超找热门主播
router.loginHandleAtApp("get", "/hotout", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.findHotUser((ctx.request as any).query, ctx)))

//11.查找发布过赚钱单的热门用户
router.handle("get", "/hot", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.findHotForMake((ctx.request as any).query, ctx)))

//11.同步位置，昵称等实时信息
router.loginHandleAtApp('post', "/syncinfo", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.syncInfo((ctx.request as any).body, ctx)))

//12.修改身高/出生日期
router.loginHandleAtApp('post', "/updatebaseinfo", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.updateBaseInfo((ctx.request as any).body, ctx)))

//获取个人收藏列表
router.loginHandleAtApp("get", "/likelylist", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.likelyList(ctx)))

//根据用户uuid获取用户信息
router.loginHandleAtApp("get", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.getInfoByUuid(ctx.params, ctx)))

//添加/删除收藏
router.loginHandleAtApp('post', "/addordellikely", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.addLikely((ctx.request as any).body, ctx)))

//提交个人的formids数据
router.loginHandleAtApp('post', "/saveformids", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.saveFormids((ctx.request as any).body, ctx)))



