import { Order } from "../../model/users/order"
import { Deed } from "../../model/users/deed"
import { ChatRecord } from "../../model/users/chatrecode"
import { Notice } from "../../model/users/notice"
import { PayLog } from "../../model/users/paylog"
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { sendWxNews } from "../../lib/wxnews"
import winston = require("winston")
import * as Formids from "../../redis/formids"
import { OrderValidator } from "./validator"
import * as CommentOrder from "../../redis/commentorder"
import { RefuseUsersRedis } from "../../redis/refuseuser"
import { BaseHandler } from "../lib/basehandler"
import { LoginInfoAtApp } from "../../redis/logindao"
import { System } from "../../model/crm/system"
import * as gettime from "../../lib/gettime"
import { Users } from "../../model/users/users";
export const router = new RouterWrap({ prefix: "/app/order" })

export class OrderOnApp extends BaseHandler {
    //1.创建订单
    public static async createdOrder_pro(body: any, ctx: any): Promise<any> {
        const { result, noticeuuid, noticetype } = body
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let notice = await Notice.getInstance().findByPrimary(noticeuuid)
        if (!notice) return super.NotFound("没有发现改通知消息")
        let othersDeed = await Deed.getInstance().findByPrimary(notice.todeeduuid)
        let formyDeed = await Deed.getInstance().findByPrimary(notice.fromdeeduuid)
        if (!othersDeed || !formyDeed) return super.NotFound("没有找到该契约单")

        if (!("spend" === othersDeed.type)) {
            let cur = othersDeed
            othersDeed = formyDeed
            formyDeed = cur
        }


        let othersNotice = await Notice.getInstance().findBy(
            { useruuid: othersDeed.useruuid, fromdeeduuid: notice.fromdeeduuid, todeeduuid: notice.todeeduuid })
        if (notice.uuid === othersNotice[0].uuid) {
            othersNotice = await Notice.getInstance().findBy(
                { useruuid: formyDeed.useruuid, fromdeeduuid: notice.fromdeeduuid, todeeduuid: notice.todeeduuid })
        }

        if (result == "refuse" && noticetype == "spend") {
            let myNotice = { result: "refuse", state: true }
            await Notice.getInstance().update(myNotice, noticeuuid)
            let othersNoticeNeedUpdate = { result: "refuse", state: true }
            await Notice.getInstance().update(othersNoticeNeedUpdate, othersNotice[0].uuid)
            if (othersDeed.useruuid === info.getUuid()) {
                await this.refuseDeed(formyDeed.useruuid, othersDeed.uuid)
            } else {
                await this.refuseDeed(othersDeed.useruuid, formyDeed.uuid)
            }
            //await this.updateStateDeed(notice.fromdeeduuid, notice.todeeduuid)
            return { msg: "ok" }
        } else if (result == "refuse" && noticetype == "make") {
            let myNotice = { result: "refuse", state: true }
            await Notice.getInstance().update(myNotice, noticeuuid)
            let othersNoticeNeedUpdate = { result: "refuse", state: true }
            await Notice.getInstance().update(othersNoticeNeedUpdate, othersNotice[0].uuid)
            if (othersDeed.useruuid === info.getUuid()) {
                await this.refuseDeed(formyDeed.useruuid, othersDeed.uuid)
            } else {
                await this.refuseDeed(othersDeed.useruuid, formyDeed.uuid)
            }
            //await this.updateStateDeed(notice.fromdeeduuid, notice.todeeduuid)
            return { msg: "ok" }
        } else if (result == "refuse" && noticetype == "nearby") {
            let myNotice = { result: "refuse", state: true }
            await Notice.getInstance().update(myNotice, noticeuuid)
            let othersNoticeNeedUpdate = { result: "refuse", state: true }
            await Notice.getInstance().update(othersNoticeNeedUpdate, othersNotice[0].uuid)
            if (othersDeed.useruuid === info.getUuid()) {
                await this.refuseDeed(formyDeed.useruuid, othersDeed.uuid)
            } else {
                await this.refuseDeed(othersDeed.useruuid, formyDeed.uuid)
            }
            //await this.updateStateDeed(notice.fromdeeduuid, notice.todeeduuid)
            return { msg: "ok" }
        }

        if (othersDeed.istimeout || formyDeed.istimeout || othersDeed.invalid || formyDeed.invalid) {
            return super.BadRequest("契约单已失效或过期")
        }

        if (othersDeed.del && !othersDeed.del || formyDeed.del && !formyDeed.del) {
            return super.BadRequest("契约单已失效或过期")
        }

        if (othersDeed.state || formyDeed.state) {
            if ((othersDeed.state && othersDeed.useruuid === info.getUuid()) || (formyDeed.state && formyDeed.useruuid === info.getUuid())) {
                return super.BadRequest(`您存在正在进行中的饭单`)
            } else {
                return super.BadRequest(`不好意思，你来晚了一步，TA已经被约走了～`)
            }
        }

        let my = await Users.getInstance().findByPrimary(info.getUuid())
        let other = await Users.getInstance().findByPrimary(othersDeed.useruuid)
        if (othersDeed.useruuid === info.getUuid())
            other = await Users.getInstance().findByPrimary(formyDeed.useruuid)

        //1.查找自己的未关闭的订单
        let obj = {} as any
        obj.$or = [{ useruuid1: info.getUuid() }, { useruuid2: info.getUuid() }]
        obj.$and = { state: "on" }
        let onOrders = await Order.getInstance().findByObj(obj)
        for (let index = 0; onOrders.length && index < onOrders.length; index++) {
            if (onOrders.length > 1) return super.BadRequest("您存在正在进行中的饭单")
            let order = onOrders[0]
            let isComment
            let [deeduuid1, deeduuid2] = [order.deeduuid1, order.deeduuid2]
            let deed1 = await Deed.getInstance().findByPrimary(deeduuid1)
            let deed2 = await Deed.getInstance().findByPrimary(deeduuid2)
            if ((deed1 && deed1.useruuid == other.uuid && deed1.state) || (deed2 && deed2.useruuid == other.uuid && deed2.state)) {
                return super.BadRequest(`您存在正在进行中的饭单`)
            }
            if (deed1 && deed2) {
                if (deed1.useruuid === info.getUuid()) {
                    isComment = deed2.result
                } else {
                    isComment = deed1.result
                }
            }
            if (isComment === "waitfeedback")
                return super.BadRequest("您存在正在进行中的饭单")
        }
        //2.查找对方的未关闭的订单
        let obj2 = {} as any
        obj2.$or = [{ useruuid1: other.uuid }, { useruuid2: other.uuid }]
        obj2.$and = { state: "on" }
        let onOrders2 = await Order.getInstance().findByObj(obj2)
        for (let index = 0; index < onOrders2.length; index++) {
            if (onOrders2.length > 1) return super.BadRequest(`TA存在正在进行中的饭单`)
            let order = onOrders2[0]
            let isComment
            let [deeduuid1, deeduuid2] = [order.deeduuid1, order.deeduuid2]
            let deed1 = await Deed.getInstance().findByPrimary(deeduuid1)
            let deed2 = await Deed.getInstance().findByPrimary(deeduuid2)
            if ((deed1 && deed1.useruuid == other.uuid && deed1.state) || (deed2 && deed2.useruuid == other.uuid && deed2.state)) {
                return super.BadRequest(`该消息已过期`)
            }

            if (deed1 && deed2) {
                if (deed1.useruuid === other.uuid) {
                    isComment = deed2.result
                } else {
                    isComment = deed1.result
                }
            }
            if (isComment === "waitfeedback")
                return super.BadRequest(`不好意思，你来晚了一步，TA已经被约走了～`)
        }

        let deposit = await System.getInstance().findOne('deposit')
        deposit = parseInt(deposit.value.deposit)

        let paylogObj1 = {} as any

        let player
        let coin
        let starttime
        let location
        if (noticetype === "make") {
            //打招呼消息，则对我来说，是要花钱
            player = info.getUuid()
            coin = othersDeed.deposit
            starttime = othersDeed.mealtime
            location = othersDeed.restaurant
        } else if (noticetype === "spend") {
            //花钱邀约消息,我可以赚钱
            player = othersDeed.useruuid
            coin = othersDeed.deposit
            starttime = othersDeed.mealtime
            location = othersDeed.restaurant
            if (formyDeed.onetoone) {
                //系统为自己创建的契约单。我点击应邀，则需要交吃货币押金
                if (my.balance < deposit) super.BadRequest("吃货币不足")
                await Users.getInstance().updateByUuid(info.getUuid(), { balance: (my.balance - deposit) })
                paylogObj1 = { useruuid: info.getUuid(), type: "deposit", deeduuid: formyDeed.uuid, coin: deposit, description: "您同意对方在主页邀约你去吃饭邀请，扣除押金吃货币" }
            }

        } else {
            //附近约饭
            player = othersDeed.useruuid
            coin = 0
            starttime = othersDeed.mealtime
            location = othersDeed.restaurant

        }

        //TODO读取诚意金
        let orderobj = {
            deeduuid1: othersDeed.uuid,
            useruuid1: othersDeed.useruuid,
            deeduuid2: formyDeed.uuid,
            useruuid2: formyDeed.useruuid,
            state: "on",
            type: "waitfeedback",
            coin: coin,
            player: player,
            starttime: starttime,
            address: othersDeed.address,
            location: location
        }

        if (notice.type === "fromnearby" || notice.type === "fromhello" || notice.type === "send") {
            if (notice.useruuid === othersDeed.useruuid) {
                orderobj.deeduuid1 = formyDeed.uuid
                orderobj.useruuid1 = formyDeed.useruuid
                orderobj.deeduuid2 = othersDeed.uuid
                orderobj.useruuid2 = othersDeed.useruuid
            }
        }

        if (notice.type === "tonearby" || notice.type === "tohello" || notice.type === "receive") {
            if (notice.useruuid !== othersDeed.useruuid) {
                orderobj.deeduuid1 = formyDeed.uuid
                orderobj.useruuid1 = formyDeed.useruuid
                orderobj.deeduuid2 = othersDeed.uuid
                orderobj.useruuid2 = othersDeed.useruuid
            }
        }

        let order = await Order.getInstance().add(orderobj)
        await Deed.getInstance().update({ state: "true", istimeout: "false" }, notice.fromdeeduuid)
        await Deed.getInstance().update({ state: "true", istimeout: "false" }, notice.todeeduuid)

        //发送模板消息
        // { openid, formid, type, starttime, restaurant, address }
        let formids = JSON.parse(await Formids.getFormids(other.openid))
        let formids2 = JSON.parse(await Formids.getFormids(my.openid))
        let noticetime = gettime.formatToYMDSF(starttime[0]) + '~' + gettime.formatToSF(starttime[1])

        let formid
        let wxnewtype
        let address
        if (formids && formids.length > 0) {
            formid = formids[0]
            formids.splice(0, 1)
            await Formids.saveFormids(other.openid, JSON.stringify(formids))
        }

        let formid2
        let wxnewtype2

        if (formids2 && formids2.length > 0) {
            formid2 = formids2[0]
            formids2.splice(0, 1)
            await Formids.saveFormids(my.openid, JSON.stringify(formids2))
        }

        //保存评论订单机会（双方各一次）
        await CommentOrder.savePurview(info.getUuid() + order.uuid, "1")
        await CommentOrder.savePurview(other.uuid + order.uuid, "1")

        //3.关闭未过期且未匹配契约单
        let obj3 = { istimeout: "false", state: "false", onetoone: "false", useruuid: info.getUuid(), del: "false" } as any
        await Deed.getInstance().findAndUpdateByObj({ invalid: "true" }, obj3)

        paylogObj1.orderuuid = order.uuid
        if (paylogObj1.useruuid)
            await PayLog.getInstance().add(paylogObj1)


        let chatObj = {
            orderuuid: order.uuid,
            useruuid1: othersDeed.useruuid,
            useruuid2: info.getUuid()
        }
        await ChatRecord.getInstance().insert(chatObj)

        if (noticetype == "spend") {
            let myNotice = { result: "accept", orderuuid: order.uuid, state: true }
            await Notice.getInstance().update(myNotice, noticeuuid)
            let othersNoticeNeedUpdate = { result: "accept", orderuuid: order.uuid, state: true }
            await Notice.getInstance().update(othersNoticeNeedUpdate, othersNotice[0].uuid)
        } else if (noticetype == "make") {
            let myNotice = { result: "accept", orderuuid: order.uuid, state: true }
            await Notice.getInstance().update(myNotice, noticeuuid)
            let othersNoticeNeedUpdate = { result: "accept", orderuuid: order.uuid, state: true }
            await Notice.getInstance().update(othersNoticeNeedUpdate, othersNotice[0].uuid)
        } else {
            let myNotice = { result: "accept", orderuuid: order.uuid, state: true }
            await Notice.getInstance().update(myNotice, noticeuuid)
            let othersNoticeNeedUpdate = { result: "accept", orderuuid: order.uuid, state: true }
            await Notice.getInstance().update(othersNoticeNeedUpdate, othersNotice[0].uuid)
        }

        if (noticetype === "make") {
            wxnewtype = "赚钱契约单"
            wxnewtype2 = "花钱契约单"
            address = formyDeed.address
            if (!address)
                address = othersDeed.address
        } else if (noticetype === "spend") {
            wxnewtype = "花钱契约单"
            wxnewtype2 = "赚钱契约单"
            address = othersDeed.address
            if (!address)
                address = formyDeed.address
        } else {
            wxnewtype = "附近契约单"
            address = othersDeed.address
            if (!address)
                address = formyDeed.address
        }
        if (location)
            location = location.replace('(', "（").replace(")", "）")
        if (address)
            address = address.replace('(', "（").replace(")", "）")
        let wxNewObj = {} as any
        let wxNewObj2 = {} as any
        wxNewObj.openid = other.openid
        wxNewObj.formid = formid
        wxNewObj.type = wxnewtype
        wxNewObj.starttime = noticetime
        wxNewObj.restaurant = location
        wxNewObj.address = address
        wxNewObj.orderuuid = order.uuid

        wxNewObj2.openid = my.openid
        wxNewObj2.formid = formid2
        wxNewObj2.type = wxnewtype2
        wxNewObj2.starttime = noticetime
        wxNewObj2.restaurant = location
        wxNewObj2.address = address
        wxNewObj2.orderuuid = order.uuid

        if (formid) {
            let res = JSON.parse(await sendWxNews(wxNewObj))
            if (res.errcode !== 0) winston.error(`发送模板消息失败,错误码：${res.errcode},错误消息：${res.errmsg},${formid}`)
        }
        if (formid2) {
            let res2 = JSON.parse(await sendWxNews(wxNewObj2))
            if (res2.errcode !== 0) winston.error(`发送模板消息失败,错误码：${res2.errcode},错误消息：${res2.errmsg},${formid2}`)
        }

        return { msg: "ok" }
    }

    //2.创建新订单
    public static async createdNewOrder(body: any, ctx: any): Promise<any> {
        const { deeduuid } = body
        validateCgi({ deeduuid }, OrderValidator.orderCreatedNewValidator)
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let deed = await Deed.getInstance().findByPrimary(deeduuid)
        let other = await Users.getInstance().findByPrimary(deed.useruuid)
        if (deed.state) {
            return super.BadRequest(`该消息已过期`)
        }
        //1.查找自己的未关闭的订单
        let myobj = {} as any
        myobj.$or = [{ useruuid1: info.getUuid() }, { useruuid2: info.getUuid() }]
        myobj.$and = { state: "on" }
        let onOrders = await Order.getInstance().findByObj(myobj)
        for (let index = 0; onOrders.length && index < onOrders.length; index++) {
            if (onOrders.length > 1) return super.BadRequest("您存在正在进行中的饭单")
            let order = onOrders[0]
            let isComment
            let [deeduuid1, deeduuid2] = [order.deeduuid1, order.deeduuid2]
            let deed1 = await Deed.getInstance().findByPrimary(deeduuid1)
            let deed2 = await Deed.getInstance().findByPrimary(deeduuid2)
            if (deed1 && deed2) {
                if (deed1.useruuid === info.getUuid()) {
                    isComment = deed2.result
                } else {
                    isComment = deed1.result
                }
            }
            if (isComment === "waitfeedback")
                return super.BadRequest("您存在正在进行中的饭单")
        }
        //2.查找对方的未关闭的订单
        let otherobj = {} as any
        otherobj.$or = [{ useruuid1: other.useruuid }, { useruuid2: other.uuid }]
        otherobj.$and = { state: "on" }
        let onOrders2 = await Order.getInstance().findByObj(otherobj)
        for (let index = 0; index < onOrders2.length; index++) {
            if (onOrders2.length > 1) return super.BadRequest(`TA存在正在进行中的饭单`)
            let order = onOrders2[0]
            let isComment
            let [deeduuid1, deeduuid2] = [order.deeduuid1, order.deeduuid2]
            let deed1 = await Deed.getInstance().findByPrimary(deeduuid1)
            let deed2 = await Deed.getInstance().findByPrimary(deeduuid2)
            if (deed1 && deed2) {
                if (deed1.useruuid === other.uuid) {
                    isComment = deed2.result
                } else {
                    isComment = deed1.result
                }
            }
            if (isComment === "waitfeedback")
                return super.BadRequest(`不好意思，你来晚了一步，TA已经被约走了～`)
        }

        let obj = {
            useruuid: info.getUuid(),
            location: deed.location,
            mealtime: deed.mealtime,
            state: true,
            address: deed.address,
            restaurant: deed.restaurant,
            onetoone: deed.onetoone
        } as any
        if (deed.type === "make") {
            obj.type = "spend"
        } else {
            obj.type = "make"
        }
        let MyDeeds = await Deed.getInstance().findByUser(info.getUuid())
        if (MyDeeds && MyDeeds.length > 0)
            return super.BadRequest("您已存在契约单，请取消后再同意！！")
        let myDeed = await Deed.getInstance().created(obj)
        await Deed.getInstance().updatedeed({ state: true }, deeduuid)

        let orderobj = {
            deeduuid1: deed.uuid,
            useruuid1: deed.useruuid,
            deeduuid2: myDeed.uuid,
            useruuid2: myDeed.useruuid,
            state: "new",
            type: "neither",
            starttime: deed.mealtime,
            location: deed.address
        }
        let order = await Order.getInstance().add(orderobj)
        let chatObj = {
            orderuuid: order.uuid,
            useruuid1: deed.useruuid,
            useruuid2: myDeed.useruuid
        }
        await ChatRecord.getInstance().insert(chatObj)
        let objnotice = { todeeduuid: deed.uuid, fromdeeduuid: myDeed.uuid, useruuid: deed.useruuid, type: "recive" }
        let myobjnotice = { todeeduuid: myDeed.uuid, fromdeeduuid: deed.uuid, useruuid: myDeed.useruuid, type: "send" }
        await Notice.getInstance().add(objnotice)
        await Notice.getInstance().add(myobjnotice)
        return { msg: "ok" }
    }

    //3.修改订单
    public static async updateNewOrder(body: any, ctx: any): Promise<any> {
        const { orderuuid, result } = body
        validateCgi({ orderuuid, result }, OrderValidator.orderupdateValidator)
        let order = await Order.getInstance().findByPrimary(orderuuid)
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        if (result === "result") {
            await Deed.getInstance().delDeed(order.deeduuid2)
            await Deed.getInstance().delStateDeed(order.deeduuid2)

        }
        //TODO获取诚意金
        let myDeed = await Deed.getInstance().update({ deposit: 20, state: true }, order.deeduuid2)
        let deed = await Deed.getInstance().update({ state: true }, order.deeduuid1)

        //TODO修改用户的吃货币
        await Order.getInstance().update({ deposit: 40 }, orderuuid)
        let objnotice = { todeeduuid: deed.uuid, fromdeeduuid: order.deeduuid2, useruuid: info.getUuid(), type: "recive", result: result }
        let myobjnotice = { todeeduuid: order.deeduuid2, fromdeeduuid: order.deeduuid1, useruuid: myDeed.useruuid, type: "send", result: result }
        await Notice.getInstance().add(objnotice)
        await Notice.getInstance().add(myobjnotice)
        return { msg: "ok" }
    }

    //饭单详情
    public static async findByUuid(params: any, ctx: any): Promise<any> {
        const { uuid } = params
        validateCgi({ uuid }, OrderValidator.uuidValidator)
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)

        let order = await Order.getInstance().getByUuid(uuid, info.getUuid())
        if (order.length === 0) return super.BadRequest("没有该饭单")

        let r = order[0]
        let commenttype
        let [deeduuid1, deeduuid2] = [r.deeduuid1, r.deeduuid2]
        let deed1 = await Deed.getInstance().findByPrimary(deeduuid1)
        if (r.state === "off") {
            r.created = gettime.getTimeStr(r.created)
            r.modified = gettime.getTimeStr(r.modified)
            return r
        }
        if (deed1.useruuid === info.getUuid()) {
            let deed2 = await Deed.getInstance().findByPrimary(deeduuid2)
            commenttype = deed2.result
        } else {
            commenttype = deed1.result
        }
        r.commenttype = commenttype
        r.created = gettime.getTimeStr(r.created)
        r.modified = gettime.getTimeStr(r.modified)

        return r
    }

    //我的订单
    public static async findMyOrder(ctx: any): Promise<any> {
        let { type } = (ctx.request as any).query
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        validateCgi({ type }, OrderValidator.myOrder)
        let order = await Order.getInstance().findByUser(info.getUuid(), type)
        for (let index = 0; index < order.length; index++) {
            let r = order[index]
            let commenttype
            let [deeduuid1, deeduuid2] = [r.deeduuid1, r.deeduuid2]
            let deed1 = await Deed.getInstance().findByPrimary(deeduuid1)
            if (deed1 && deed1.useruuid === info.getUuid()) {
                let deed2 = await Deed.getInstance().findByPrimary(deeduuid2)
                if (deed2)
                    commenttype = deed2.result
                else
                    commenttype = "both"
            } else if (deed1) {
                commenttype = deed1.result
            } else {
                commenttype = "both"
            }
            r.commenttype = commenttype
            r.created = gettime.getTimeStr(r.created)
            r.modified = gettime.getTimeStr(r.modified)
        }
        return { order }
    }

    //删除订单
    public static async destory(params: any): Promise<any> {
        const { uuid } = params
        validateCgi({ uuid }, OrderValidator.uuidValidator)
        let order = await Order.getInstance().findByPrimary(uuid)
        if (order.state !== "off") {
            return super.Forbidden("饭单尚未完成，删除失败")
        }
        await Order.getInstance().destoryNotice(uuid)
        return { msg: "ok" }
    }

    //"放鸽子"、"应邀"
    public static async deelOrder(body: any, ctx: any): Promise<any> {
        //获取到订单的id,和状态
        const { orderuuid, deel } = body
        //验证id和状态
        validateCgi({ orderuuid, deel }, OrderValidator.deelOrder)
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        //消抖设计
        /* let isHavePurview = await CommentOrder.getPurview(info.getUuid() + orderuuid)
        if (isHavePurview) {
            await CommentOrder.removePurview(info.getUuid() + orderuuid)
        } else {
            return super.BadRequest("操作过于频繁！")
        } */
        //1.修改对方契约单result为deel
        let order = await Order.getInstance().findByPrimary(orderuuid)
        if (!order) return super.NotFound("没有发现该饭单")

        let myDeelResult
        let myDeed
        let otherDeed
        let otheruuid
        let [deeduuid1, deeduuid2] = [order.deeduuid1, order.deeduuid2]
        let deed1 = await Deed.getInstance().findByPrimary(deeduuid1)
        let deed2 = await Deed.getInstance().findByPrimary(deeduuid2)

        if (deed1.useruuid === info.getUuid()) {
            await Deed.getInstance().update({ result: deel }, deeduuid2)
            myDeelResult = deed1.result
            myDeed = deed1
            otherDeed = deed2
            otheruuid = deed2.useruuid
        } else {
            await Deed.getInstance().update({ result: deel }, deeduuid1)
            myDeelResult = deed2.result
            myDeed = deed2
            otherDeed = deed1
            otheruuid = deed1.useruuid
        }

        let other = await Users.getInstance().findByPrimary(otheruuid)
        let my = await Users.getInstance().findByPrimary(info.getUuid())
        let deposit = await System.getInstance().findOne('deposit')
        deposit = parseInt(deposit.value.deposit)

        //2.取到对方契约单是否评论，进行订单的双方评或者单方评等设置，如果双方评，则修改订单为已完成，并进行吃货币的转账
        if (myDeelResult == "waitfeedback") {
            //对方未对我进行评定
            //"waitfeedback"-"go"、"waitfeedback"-"notgo"
            await Order.getInstance().updateBySingleField({ type: "either" }, orderuuid)
        } else if (deel === "go" && myDeelResult === "go") {
            //双方均应约
            await Order.getInstance().updateBySingleField({ type: "normal", state: "off" }, orderuuid)
            //TODO 付赏金，退押金，添加 paylog记录
            if (myDeed.type === "spend") {
                await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + deposit + myDeed.deposit, popularity: other.popularity + 1 }) //给对方加退押金，并且加赏金
                let obj1 = { useruuid: otheruuid, type: "depositback", deeduuid: otherDeed.uuid, coin: deposit, description: "饭单正常完成，回退押金吃货币", orderuuid }
                let obj2 = { useruuid: otheruuid, type: "makedeed", deeduuid: otherDeed.uuid, coin: myDeed.deposit, description: "饭单正常完成，赚取赏金吃货币", orderuuid }
                await PayLog.getInstance().add(obj1)
                await PayLog.getInstance().add(obj2)

            } else if (myDeed.type === "make") {
                await Users.getInstance().updateByUuid(info.getUuid(), { balance: my.balance + deposit + otherDeed.deposit, popularity: my.popularity + 1 }) //给自己加退押金，并且加赏金
                let obj1 = { useruuid: info.getUuid(), type: "depositback", deeduuid: myDeed.uuid, coin: deposit, description: "饭单正常完成，回退押金吃货币", orderuuid }
                let obj2 = { useruuid: info.getUuid(), type: "makedeed", deeduuid: myDeed.uuid, coin: otherDeed.deposit, description: "饭单正常完成，赚取赏金吃货币", orderuuid }
                await PayLog.getInstance().add(obj1)
                await PayLog.getInstance().add(obj2)
            } else {
                await Users.getInstance().updateByUuid(info.getUuid(), { balance: my.balance + deposit, popularity: my.popularity + 1 }) //给自己加退押金
                await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + deposit, popularity: other.popularity + 1 })//给对方加退押金
                let obj1 = { useruuid: info.getUuid(), type: "depositback", deeduuid: myDeed.uuid, coin: deposit, description: "饭单正常完成，回退押金吃货币", orderuuid }
                let obj2 = { useruuid: otheruuid, type: "depositback", deeduuid: otherDeed.uuid, coin: deposit, description: "饭单正常完成，回退押金吃货币", orderuuid }
                await PayLog.getInstance().add(obj1)
                await PayLog.getInstance().add(obj2)
            }

        } else if (deel === "go" && myDeelResult === "notgo") {
            //①号点击应约，②号点击放鸽子；①号押金扣留，②号押金回退
            await Order.getInstance().updateBySingleField({ type: "unusual", state: "off" }, orderuuid)
            //TODO 付赏金，退①号押金扣留，②号押金回退，添加 paylog记录
            if (myDeed.type === "spend") {
                await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + deposit + myDeed.deposit, popularity: other.popularity + 1 }) //给对方加退押金，并且加赏金
                let obj1 = { useruuid: otheruuid, type: "depositback", deeduuid: otherDeed.uuid, coin: deposit, description: "饭单中对方判断您应约，您判断对方未应约，回退押金吃货币", orderuuid }
                let obj2 = { useruuid: otheruuid, type: "makedeed", deeduuid: otherDeed.uuid, coin: myDeed.deposit, description: "饭单中对方判断您应约，您判断对方未应约，赚取赏金吃货币", orderuuid }
                await PayLog.getInstance().add(obj1)
                await PayLog.getInstance().add(obj2)
            } else if (myDeed.type === "make") {
                await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + otherDeed.deposit, popularity: other.popularity + 1 }) //给对方退回赏金
                let obj1 = { useruuid: otheruuid, type: "backdeed", deeduuid: otherDeed.uuid, coin: otherDeed.deposit, description: "饭单中对方判断您应约，您判断对方未应约，回退赏金吃货币", orderuuid }
                await PayLog.getInstance().add(obj1)

            } else {
                await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + deposit, popularity: other.popularity + 1 })//给对方加退押金
                let obj2 = { useruuid: otheruuid, type: "depositback", deeduuid: otherDeed.uuid, coin: deposit, description: "饭单中对方判断您应约，您判断对方未应约，回退押金吃货币", orderuuid }
                await PayLog.getInstance().add(obj2)
            }

        } else if (deel === "notgo" && myDeelResult === "go") {
            //①号点击放鸽子，②号点击应约；①号押金退回，②号押金扣留
            await Order.getInstance().updateBySingleField({ type: "unusual", state: "off" }, orderuuid)
            //TODO 付赏金，①号押金退回，②号押金扣留，添加 paylog记录
            if (myDeed.type === "spend") {
                await Users.getInstance().updateByUuid(info.getUuid(), { balance: my.balance + myDeed.deposit, popularity: my.popularity + 1 }) //给加赏金
                let obj1 = { useruuid: info.getUuid(), type: "backdeed", deeduuid: myDeed.uuid, coin: myDeed.deposit, description: "饭单中您判断对方未应约，对方判断您应约，回退赏金吃货币", orderuuid }
                await PayLog.getInstance().add(obj1)

            } else if (myDeed.type === "make") {
                await Users.getInstance().updateByUuid(info.getUuid(), { balance: my.balance + otherDeed.deposit + deposit, popularity: my.popularity + 1 }) //给自己加上押金，对方的赏金
                let obj1 = { useruuid: info.getUuid(), type: "depositback", deeduuid: myDeed.uuid, coin: deposit, description: "饭单中您判断对方未应约，对方判断您应约，回退赏金吃货币", orderuuid }
                let obj2 = { useruuid: info.getUuid(), type: "makedeed", deeduuid: myDeed.uuid, coin: otherDeed.deposit, description: "饭单中您判断对方未应约，对方判断您应约，赚取赏金吃货币", orderuuid }
                await PayLog.getInstance().add(obj1)
                await PayLog.getInstance().add(obj2)
            } else {
                await Users.getInstance().updateByUuid(info.getUuid(), { balance: my.balance + deposit, popularity: my.popularity + 1 })//给自己加退押金
                let obj2 = { useruuid: info.getUuid(), type: "depositback", deeduuid: myDeed.uuid, coin: deposit, description: "饭单中您判断对方未应约，对方判断您应约，回退押金吃货币", orderuuid }
                await PayLog.getInstance().add(obj2)
            }

        } else if (deel === "notgo" && myDeelResult === "notgo") {
            //双方放鸽子，双方退回押金
            await Order.getInstance().updateBySingleField({ type: "unusual", state: "off" }, orderuuid)
            //TODO 付赏金，双方退回押金，添加 paylog记录
            if (myDeed.type === "spend") {
                await Users.getInstance().updateByUuid(info.getUuid(), { balance: my.balance + myDeed.deposit }) //给加赏金
                await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + deposit })//给对方加回押金
                let obj1 = { useruuid: info.getUuid(), type: "backdeed", deeduuid: myDeed.uuid, coin: myDeed.deposit, description: "饭单中您与对方均评未应约，回退赏金吃货币", orderuuid }
                let obj2 = { useruuid: otheruuid, type: "depositback", deeduuid: otherDeed.uuid, coin: deposit, description: "饭单中您与对方均评未应约，回退押金吃货币", orderuuid }
                await PayLog.getInstance().add(obj1)
                await PayLog.getInstance().add(obj2)

            } else if (myDeed.type === "make") {
                await Users.getInstance().updateByUuid(info.getUuid(), { balance: my.balance + deposit }) //给加退押金
                await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + otherDeed.deposit })//给对方加回赏金
                let obj1 = { useruuid: info.getUuid(), type: "depositback", deeduuid: myDeed.uuid, coin: deposit, description: "饭单中您与对方均评未应约，回退押金吃货币", orderuuid }
                let obj2 = { useruuid: otheruuid, type: "backdeed", deeduuid: otherDeed.uuid, coin: otherDeed.deposit, description: "饭单中您与对方均评未应约，回退赏金吃货币", orderuuid }
                await PayLog.getInstance().add(obj1)
                await PayLog.getInstance().add(obj2)
            } else {
                await Users.getInstance().updateByUuid(info.getUuid(), { balance: my.balance + deposit }) //给加退押金
                await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + deposit })//给对方退押金
                let obj1 = { useruuid: info.getUuid(), type: "depositback", deeduuid: myDeed.uuid, coin: deposit, description: "饭单中您与对方均评未应约，回退押金吃货币", orderuuid }
                let obj2 = { useruuid: otheruuid, type: "depositback", deeduuid: otherDeed.uuid, coin: deposit, description: "饭单中您与对方均评未应约，回退押金吃货币", orderuuid }
                await PayLog.getInstance().add(obj1)
                await PayLog.getInstance().add(obj2)
            }
        } else {
            await Order.getInstance().updateBySingleField({ type: "", state: "off" }, orderuuid)
        }

        //设置之前关闭的契约单重新置为有效
        let obj = { istimeout: "false", state: "false", onetoone: "false", useruuid: info.getUuid(), invalid: "true" } as any
        await Deed.getInstance().findAndUpdateByObj({ invalid: "false" }, obj)
        //删除契约单
        order = await Order.getInstance().findByPrimary(orderuuid)
        if (order.state === "off") {
            await Deed.getInstance().delDeed(deed1.uuid)
            await Deed.getInstance().delStateDeed(deed1.uuid)
            await Deed.getInstance().delDeed(deed2.uuid)
            await Deed.getInstance().delStateDeed(deed2.uuid)
        }
        return { msg: "ok" }
    }

    public static async test(body: any, ctx: any): Promise<any> {
        //{ openid, formid, type, starttime, restaurant, address }
        const { openid } = body

        let formids = JSON.parse(await Formids.getFormids(openid))
        let formid
        let wxnewtype = "赚钱单"
        let restaurant = "揭西牛杂汤粉店(西丽店)"
        let address = "桃源街道办10号"
        let orderuuid = "725f4a4c-b594-4920-9614-93e0926699f7"
        restaurant = restaurant.replace('(', "（").replace(")", "）")
        if (formids.length > 0) {
            formid = formids[0]
            formids.splice(0, 1)
            await Formids.saveFormids(openid, JSON.stringify(formids))
        } else {
            return super.BadRequest("无formids,无法发送模板消息")
        }

        let obj = { openid, formid, type: wxnewtype, starttime: "2017/4/12 19:00", restaurant, address, orderuuid } as any

        let res = JSON.parse(await sendWxNews(obj))
        if (res.errcode !== 0) return super.BadRequest(`发送模板消息失败,错误码：${res.errcode},错误消息：${res.errmsg}`)
        return { "msg": "发送成功" }
    }

    public static async refuseDeed(uuid: string, deeduuid: string) {
        let refuse = await RefuseUsersRedis.getRefuseUsers(uuid)
        let refu = new Array()
        if (refuse) {
            refu = refuse
            refu.push(deeduuid)
            await RefuseUsersRedis.saveRefuseUsers(uuid, JSON.stringify(refu))
        } else {
            refu.push(deeduuid)
            await RefuseUsersRedis.saveRefuseUsers(uuid, JSON.stringify(refu))
        }
    }

    public static async updateStateDeed(deeduuid1: string, deeduuid2: string) {
        await Deed.getInstance().update({ state: false }, deeduuid1)
        await Deed.getInstance().update({ state: false }, deeduuid2)
    }
}

//创建订单
router.loginHandleAtApp("post", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await OrderOnApp.createdOrder_pro((ctx.request as any).body, ctx)))

//创建订单
router.loginHandleAtApp("post", "/new", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await OrderOnApp.createdNewOrder((ctx.request as any).body, ctx)))

//修改订单
router.loginHandleAtApp("put", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await OrderOnApp.updateNewOrder((ctx.request as any).body, ctx)))

//我的订单
router.loginHandleAtApp("get", "/byuser", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await OrderOnApp.findMyOrder(ctx)))

//订单详情
router.loginHandleAtApp("get", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await OrderOnApp.findByUuid(ctx.params, ctx)))

//删除订单
router.loginHandleAtApp("delete", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await OrderOnApp.destory(ctx.params)))

//"放鸽子"、"应邀"
router.loginHandleAtApp("post", "/deelorder", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await OrderOnApp.deelOrder((ctx.request as any).body, ctx)))

//测试发送模板消息
router.loginHandleAtApp("post", "/test", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await OrderOnApp.test((ctx.request as any).body, ctx)))