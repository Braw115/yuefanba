import { RouterWrap } from "../../lib/routerwrap"
import { ChatRecord } from "../../model/users/chatrecode"
import { Users } from "../../model/users/users"
import { MinioHelper } from "../../lib/miniohelper"
import * as Utils from "../../lib/utils"
import { BaseHandler } from "../lib/basehandler"
import { validateCgi } from "../../lib/validator"
import { ChatValidator } from "./validator"
import { LoginInfoAtApp } from "../../redis/logindao"
import { Deed } from "../../model/users/deed"
import { ChatRedis } from "../../redis/chatrecode"
import * as gettime from "../../lib/gettime"
import { Notice } from "../../model/users/notice";
import { Order } from "../../model/users/order";
export const router = new RouterWrap({ prefix: "/app/chat" })


export class Chatrecord extends BaseHandler {
    //查看我的聊天记录表
    public static async ChatList(query: any, ctx: any): Promise<any> {
        const { useruuid, orderuuid, start, length } = query
        validateCgi({ orderuuid }, ChatValidator.listChat)
        const info: LoginInfoAtApp = BaseHandler.getLoginInfo(ctx)
        let chats = await ChatRecord.getInstance().findMyChat(info.getUuid(), orderuuid, parseInt(start), parseInt(length))
        let chatting = new Array()
        chats.forEach(r => {
            if (r.content)
                chatting.push(r.content)
        })
        await ChatRedis.removeChat(orderuuid + useruuid)
        return { chatting }
    }

    //聊天
    public static async Chatting(body: any, ctx: any): Promise<any> {
        const { chat, useruuid, orderuuid } = body
        validateCgi({ chat, useruuid, orderuuid }, ChatValidator.updateChat)
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let user = await Users.getInstance().findByPrimary(info.getUuid())
        let order = await Order.getInstance().findByPrimary(orderuuid)
        if (order.state === "off" || order.starttime[1] < new Date())
            return super.Forbidden("订单已过期！！")
        //let chatRecord1 = await ChatRecord.getInstance().findByPrimary(uuid)
        let obj = {
            uuid: user.uuid,
            user: user.nickname,
            url: user.avatar,
            time: new Date().getTime(),
            chat: JSON.parse(chat)
        }
        let chatObj = {
            orderuuid: orderuuid,
            useruuid1: info.getUuid(),
            useruuid2: useruuid,
            content: obj
        }
        let chatRecord = await ChatRecord.getInstance().insert(chatObj)
        let number = await ChatRedis.getChat(orderuuid + info.getUuid())
        if (number) {
            await ChatRedis.saveChat(orderuuid + info.getUuid(), parseInt(number) + 1 + "")
        } else {
            await ChatRedis.saveChat(orderuuid + info.getUuid(), "1")
        }


        //1.需要修改对方的消息设置为未读
        //2.把对方的ext设置为（chat）
        let ext
        if (JSON.parse(chat).text) {
            ext = { content: JSON.parse(chat).text }
        } else {
            ext = { pic: JSON.parse(chat).url }
        }
        await Notice.getInstance().updateStateByOrder(useruuid, orderuuid, true, ext)

        //3.把自己的对应的消息的ext放上最后一句话（chat）
        await Notice.getInstance().updateExt(info.getUuid(), orderuuid, ext)

        return { content: chatRecord.content }
    }

    //聊天记录详情
    public static async ChattingInfo(ctx: any): Promise<any> {
        const { uuid } = ctx.params
        validateCgi({ uuid }, ChatValidator.chatInfo)

        let chatRecord = await ChatRecord.getInstance().findByPrimary(uuid)
        chatRecord.created = gettime.getTimeStr(chatRecord.created)
        chatRecord.modified = gettime.getTimeStr(chatRecord.modified)
        return { chatRecord }
    }

    //删除聊天记录
    public static async DestoryChatting(ctx: any): Promise<any> {
        const { uuid } = ctx.params
        validateCgi({ uuid }, ChatValidator.chatInfo)

        await ChatRecord.getInstance().destory(uuid)

        return { msg: "ok" }
    }

    //查看我的新聊天记录
    public static async ChatNewList(query: any, ctx: any): Promise<any> {
        const { orderuuid, useruuid } = query
        validateCgi({ orderuuid }, ChatValidator.listChat)
        //const info: LoginInfoAtApp = BaseHandler.getLoginInfo(ctx)
        let length = await ChatRedis.getChat(orderuuid + useruuid)
        if (!length)
            length = "0"
        //TODO 1.需要更改为对方发给我的消息（useruuid1=useruuid,orderuuid=orderuuid）
        let chats = await ChatRecord.getInstance().findMyNewChat(useruuid, orderuuid, 0, parseInt(length))
        //添加需要返回的deed信息
        let order = await Order.getInstance().findByPrimary(orderuuid)
        let deeduuid = order.deeduuid1
        let deed = await Deed.getInstance().findByPrimary(deeduuid)
        if (deed && !deed.restaurant)
            deed = await Deed.getInstance().findByPrimary(order.deeduuid2)
        let user = await Users.getInstance().findByPrimary(deed.useruuid)
        let obj = {
            restaurant: deed.restaurant,
            mealtime: deed.mealtime,
            coin: order.coin,
            payway: deed.payway,
            nickname: user.nickname
        }
        await ChatRedis.removeChat(orderuuid + useruuid)
        let chatting = new Array()
        chats.forEach(r => {
            if (r.content)
                chatting.push(r.content)
        })
        return { array: chatting, info: obj }
    }
    //上传聊天图片
    public static async updateMedia(ctx: any): Promise<any> {
        let { orderuuid } = (ctx.req as any).body
        let files = (ctx.req as any).files

        validateCgi({ orderuuid }, ChatValidator.updateMedia)

        let order = await Order.getInstance().findByPrimary(orderuuid)
        if (order.state === "off" || order.starttime[1] < new Date())
            return super.Forbidden("订单已过期！！")

        let tmpArr = new Array()
        for (let file of files) {
            let url = await Chatrecord.upload(file, "chatimg")
            tmpArr.push(url)
        }

        if (!order) return super.NotFound("没有该订单")
        let imgarr = order.imgarr
        if (!imgarr) imgarr = new Array()

        //更改数据库

        imgarr = imgarr.concat(tmpArr)
        let isUpdateOk = await Order.getInstance().updateBySingleField({ imgarr }, orderuuid)
        if (!isUpdateOk) return super.InternalServerError("更新聊天图片失败")

        //删除临时文件
        await Chatrecord.deleteTmpFile(files)

        //返回图片地址
        return { data: { path: tmpArr } }
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

    //删除临时tmp区文件
    private static async deleteTmpFile(files: any): Promise<any> {
        return new Promise(async (resolve) => {
            for (let i = 0; i < files.length; i++) {
                await Utils.removeAsync(files[i].path)
            }
            return resolve()
        })
    }
}

//我的聊天记录
router.loginHandleAtApp("get", "/list", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Chatrecord.ChatList((ctx.request as any).query, ctx)))

//我的新聊天记录
router.loginHandleAtApp("get", "/newlist", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Chatrecord.ChatNewList((ctx.request as any).query, ctx)))

//聊天
router.loginHandleAtApp("put", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Chatrecord.Chatting((ctx.request as any).body, ctx)))

//详情
router.loginHandleAtApp("get", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Chatrecord.ChattingInfo(ctx)))

//删除
router.loginHandleAtApp("delete", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Chatrecord.DestoryChatting(ctx)))

//上传聊天图片
router.loginHandleAtApp("post", "/media", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Chatrecord.updateMedia(ctx)))
