import { BannerValidator } from "./validator"
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import * as Utils from "../../lib/utils"
import { MinioHelper } from "../../lib/miniohelper"
import { checkCursorLimit } from "../../lib/utils"
import { LoginInfo } from "../../redis/logindao"
import { Banner } from "../../model/users/banner"
import { CrmLog } from "../../model/crm/crmlog"
import { BaseHandler } from "../lib/basehandler"
import { CrmlogInfo } from "../lib/crmloginfo"
import * as gettime from "../../lib/gettime"
export const router = new RouterWrap({ prefix: "/crmbanner" })


export class CrmBanner extends BaseHandler {
    //1.添加一条轮播图记录(url/description/priority/state)
    public static async insert(body: any, ctx: any): Promise<any> {
        let { url, description, priority, state } = body
        validateCgi({ url, description, priority, state }, BannerValidator.insert)

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isAdmin())
            return super.NotAcceptable("没有权限")

        let obj = { url, description, priority, state } as any
        let insertOk = await Banner.getInstance().insert(obj)
        if (!insertOk) return super.InternalServerError("插入轮播图失败")

        let { crmuserUuid, crmuser, ip } = await CrmlogInfo.getCrmlogInfo(ctx)
        await CrmLog.getInstance().insertLog(crmuserUuid, "添加了uuid为" + insertOk.uuid + "的轮播图", crmuser.phone, ip)

        return { msg: "添加轮播图成功！" }
    }

    //2.查看所有的轮播图列表
    public static async BannerList(ctx: any): Promise<any> {
        const { start, length, draw, state } = (ctx.request as any).query

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isAdmin())
            return super.NotAcceptable("没有权限")

        validateCgi({ start, length, state }, BannerValidator.BannerList)

        let check = checkCursorLimit(parseInt(start), parseInt(length))
        if (check)
            return super.BadRequest("参数不合要求")

        let obj = {} as any
        if (state !== "all")
            obj = { state: state }

        let res = await Banner.getInstance().findAll(obj, start, length)
        let bannerList = res.rows.map(r => r.get())

        bannerList.forEach(r => {
            r.created = gettime.getTimeStr(r.created)
            r.modified = gettime.getTimeStr(r.modified)
        })

        return { bannerList, recordsFiltered: res.count, draw: parseInt(draw) }
    }

    //3.修改轮播图基本信息
    public static async uadateBase(params: any, body: any, ctx: any): Promise<any> {
        let { uuid } = params
        let { url, description, priority, state } = body
        validateCgi({ uuid, url, description, priority, state }, BannerValidator.uadateBase)

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isAdmin())
            return super.NotAcceptable("没有权限")

        let obj = { url, description, priority, state }

        let updateOk = await Banner.getInstance().updateByUuid(uuid, obj)
        if (!updateOk) return super.InternalServerError("修改失败")

        let { crmuserUuid, crmuser, ip } = await CrmlogInfo.getCrmlogInfo(ctx)
        await CrmLog.getInstance().insertLog(crmuserUuid, "修改了uuid为" + updateOk.uuid + "的轮播图基本信息", crmuser.phone, ip)

        return { msg: "添加轮播图基本信息成功！" }

    }

    //4.删除轮播图记录（包括轮播图中的图片）
    public static async deleteBanner(params: any, ctx: any): Promise<any> {
        let { uuid } = params
        validateCgi({ uuid }, BannerValidator.deleteBanner)

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isAdmin())
            return super.NotAcceptable("没有权限")

        let banner = await Banner.getInstance().findByPrimary(uuid)
        if (!banner) return super.InternalServerError("没有该轮播图")

        if (banner.img) {
            let oldAvatar = await CrmBanner.getBucketAndFileName(banner.img)
            await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)
        }

        let isDeleteOk = await Banner.getInstance().delete(uuid)
        if (isDeleteOk === 0) return super.InternalServerError("删除失败")

        let { crmuserUuid, crmuser, ip } = await CrmlogInfo.getCrmlogInfo(ctx)
        await CrmLog.getInstance().insertLog(crmuserUuid, "删除了uuid为" + banner.uuid + "的轮播图记录", crmuser.phone, ip)

        return { msg: "删除轮播图信息成功！" }

    }

    //5.添加/修改媒体文件
    public static async updateOrAddMeida(ctx: any): Promise<any> {
        let { url, uuid } = (ctx.req as any).body
        let files = (ctx.req as any).files
        if (url === "") url = undefined
        validateCgi({ url, uuid }, BannerValidator.updateOrAddMeida)

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isAdmin()) {
            return super.NotAcceptable("权限不足")
        }
        let banner = await Banner.getInstance().findByPrimary(uuid)

        if (url) {
            //修改
            if (files.length > 1) {
                //上传的图片大于1
                await CrmBanner.deleteTmpFile(files)
                return super.BadRequest("一条不能设置两个轮播图片")
            } else {
                let file = files[0]

                let newUrl = await CrmBanner.upload(file)

                let updateOk = await Banner.getInstance().updateByUuid(uuid, { img: newUrl })
                if (!updateOk) {
                    return super.InternalServerError("修改轮播图图片失败")
                }
                await Utils.removeAsync(file.path)

                let oldAvatar = await CrmBanner.getBucketAndFileName(url)
                await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)

                return { data: { path: url } }
            }
        } else {
            //添加
            if (!banner.img) {
                //如果轮播图片不存在
                if (files.length > 1) {
                    //同时上传多个轮播图片
                    await CrmBanner.deleteTmpFile(files)
                    return super.BadRequest("一条不能设置两个轮播图片")
                } else {
                    let file = files[0]

                    let url = await CrmBanner.upload(file)

                    let updateOk = await Banner.getInstance().updateByUuid(uuid, { img: url })
                    if (!updateOk) {
                        return super.InternalServerError("插入轮播图url失败")
                    }

                    await Utils.removeAsync(file.path)
                    return { data: { path: url } }
                }

            } else {
                //如果轮播图片存在
                await CrmBanner.deleteTmpFile(files)
                return super.BadRequest("一条不能设置两个轮播图片")
            }

        }

    }

    //6.删除媒体文件
    public static async DelMedia(ctx: any): Promise<any> {
        const { url, uuid } = (ctx.request as any).body
        validateCgi({ url, uuid }, BannerValidator.DelMedia)

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isAdmin()) {
            return super.NotAcceptable("权限不足")
        }

        let oldAvatar = await CrmBanner.getBucketAndFileName(url)
        await MinioHelper.getInstance().deleteFile(oldAvatar.bucketName, oldAvatar.fileName)

        let updateOk = await Banner.getInstance().updateByUuid(uuid, { img: null })
        if (!updateOk) {
            return super.InternalServerError("删除媒体文件失败")
        }

        return { msg: "deleted ok!" }
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

    //删除临时区文件
    private static async deleteTmpFile(files: any): Promise<any> {
        return new Promise(async (resolve) => {
            for (let i = 0; i < files.length; i++) {
                await Utils.removeAsync(files[i].path)
            }
            return resolve()
        })
    }

    //上传临时区媒体文件到minio
    private static async upload(file: any): Promise<any> {
        return new Promise(async (resolve) => {
            let path = await Utils.getRandomPath()
            let newName = await Utils.getRandomName()
            let ext = file.originalname.split('.').pop()
            let filename = path + '/' + newName + '.' + ext

            await MinioHelper.getInstance().uploadfile("banner", filename, file.path)
            let attestvideoUrl = `/banner/${filename}`
            return resolve(attestvideoUrl)
        })
    }
}

//1.添加一条轮播图记录
router.loginHandle("post", "/insert", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmBanner.insert((ctx.request as any).body, ctx)))

//2.查看所有的轮播图列表
router.loginHandle("get", "/bannerlist", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmBanner.BannerList(ctx)))

//3.修改轮播图基本信息
router.loginHandle("put", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmBanner.uadateBase(ctx.params, (ctx.request as any).body, ctx)))

//6.删除媒体文件
router.loginHandle("delete", "/media", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmBanner.DelMedia(ctx)))

//4.删除轮播图记录（包括轮播图中的图片）
router.loginHandle("delete", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmBanner.deleteBanner(ctx.params, ctx)))

//5.添加/修改媒体文件
router.loginHandle("post", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmBanner.updateOrAddMeida(ctx)))

