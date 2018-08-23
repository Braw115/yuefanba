import { Notice } from "../../model/users/notice"
import { Deed } from "../../model/users/deed"
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { NoticeValidator } from "./validator"
import { System } from "../../model/crm/system"
import { BaseHandler } from "../lib/basehandler"
import { LoginInfoAtApp } from "../../redis/logindao"
import * as gettime from "../../lib/gettime"
import * as CreateDeed from "../../redis/createdeed"
import { Users } from "../../model/users/users";
import { Order } from "../../model/users/order";
import { PayLog } from "../../model/users/paylog";
import { RefuseUsersRedis } from "../../redis/refuseuser"
import { refuseDeed } from "../../lib/wxnews"
export const router = new RouterWrap({ prefix: "/app/notice" })

export class NoticeOnApp extends BaseHandler {
    //1.创建消息
    public static async createdNotice(body: any, ctx: any): Promise<any> {
        const { reason, type, result } = body
        let obj = { reason, type, result } as any
        validateCgi(obj, NoticeValidator.noticeValidator)
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        obj.useruuid = info.getUuid()
        await Notice.getInstance().add(obj)
        return { msg: "ok" }
    }

    //约热门主播
    public static async inviteByNotice(body: any, ctx: any): Promise<any> {
        const { useruuid, mydeeduuid } = body
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)

        let star = await Users.getInstance().findByPrimary(useruuid)
        let myDeed = await Deed.getInstance().findByPrimary(mydeeduuid)
        // let refuse = await RefuseUsersRedis.getRefuseUsers(info.getUuid())
        // let refusestate = false
        // if (refuse) {
        //     let refuses = new Array()
        //     refuses = refuse
        //     refuses.forEach(r => {
        //         if (r === useruuid)
        //             refusestate = true
        //     })
        // }

        // if (refusestate)
        //     return super.Forbidden("不可重复邀请同一张契约单！")
        if (useruuid === myDeed.useruuid)
            return super.BadRequest("自己无法邀请自己")

        let myOtherDeed = await Deed.getInstance().findBy({ where: { useruuid: useruuid, del: false } })
        if (myOtherDeed.length > 0) {
            let res1 = await Notice.getInstance().findBy({ fromdeeduuid: myOtherDeed[0].uuid, useruuid: info.getUuid(), state: true })
            if (res1.length > 0) {
                return { msg: "TA已被邀请" }
            }
            let res2 = await Notice.getInstance().findBy({ useruuid, todeeduuid: myOtherDeed[0].uuid, state: true })
            if (res2.length > 0) {
                return { msg: "TA已被邀请" }
            }
        }

        let mealtime = JSON.stringify(myDeed.mealtime)
        let obj = {
            useruuid: useruuid,
            latitude: star.latitude,
            longitude: star.longitude,
            payway: "aa",
            mealtime: mealtime,
            state: false,
            deposit: myDeed.deposit,
            address: myDeed.address,
            restaurant: myDeed.restaurant,
            onetoone: "true",
            result: "waitfeedback",
            tpye: "make",
            getdeposit: myDeed.getdeposit,
            agerange: myDeed.agerange,
            age: myDeed.age,
            gender: myDeed.gender
        } as any

        let starDeed = await Deed.getInstance().created(obj)

        let obj1
        let obj2
        obj1 = { useruuid: useruuid, fromdeeduuid: starDeed.uuid, todeeduuid: mydeeduuid, type: "receive", state: true } //接收者
        obj2 = { useruuid: info.getUuid(), fromdeeduuid: mydeeduuid, todeeduuid: starDeed.uuid, type: "send", state: true } //发送者

        await Notice.getInstance().add(obj1)
        await Notice.getInstance().add(obj2)
        return { msg: "ok" }
    }

    //我要花钱，约吃饭
    public static async invitedByNotice(body: any, ctx: any): Promise<any> {
        const { fromdeeduuid, todeeduuid, useruuid } = body
        validateCgi({ fromdeeduuid, todeeduuid, useruuid }, NoticeValidator.invitedByNotice)

        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let obj
        let obj2
        obj = { useruuid, fromdeeduuid: fromdeeduuid, todeeduuid: todeeduuid, type: "receive", state: true } //接收者
        obj2 = { useruuid: info.getUuid(), fromdeeduuid: fromdeeduuid, todeeduuid: todeeduuid, type: "send", state: true } //发送者

        let fromdeed = await Deed.getInstance().findByPrimary(fromdeeduuid)
        let todeed = await Deed.getInstance().findByPrimary(todeeduuid)

        if (!fromdeed && !todeed)
            return super.Forbidden("契约单不存在")

        let refuse = await RefuseUsersRedis.getRefuseUsers(info.getUuid())
        let refusestate = false
        if (refuse) {
            let refuses = new Array()
            refuses = refuse
            refuses.forEach(r => {
                if (r === fromdeeduuid && info.getUuid() === todeed.useruuid)
                    refusestate = true
                if (r === todeeduuid && info.getUuid() === fromdeed.useruuid)
                    refusestate = true
            })
        }

        if (refusestate)
            return super.Forbidden("不可重复邀请同一张契约单！")

        if (info.getUuid() === fromdeed.useruuid) {
            await refuseDeed(info.getUuid(), todeeduuid)
        } else {
            await refuseDeed(info.getUuid(), fromdeeduuid)
        }
        await Notice.getInstance().add(obj)
        await Notice.getInstance().add(obj2)
        return { msg: "ok" }
    }

    //我要赚钱打招呼
    public static async invitedByNotices(body: any, ctx: any): Promise<any> {
        let { fromdeeduuid, todeeduuidarr, useruuidarr } = body
        validateCgi({ fromdeeduuid }, NoticeValidator.invitedByNotices)
        if (todeeduuidarr.length !== useruuidarr.length)
            return super.NotFound("打招呼数组长度不对应")

        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let obj
        let obj2
        let fromdeed = await Deed.getInstance().findByPrimary(fromdeeduuid)
        if (!fromdeed)
            return super.Forbidden("契约单不存在")
        for (let i = 0; i < todeeduuidarr.length; i++) {
            if (useruuidarr[i] === info.getUuid())
                continue
            obj = { useruuid: useruuidarr[i], fromdeeduuid: fromdeeduuid, todeeduuid: todeeduuidarr[i], type: "tohello", state: true } //接收者
            obj2 = { useruuid: info.getUuid(), fromdeeduuid: fromdeeduuid, todeeduuid: todeeduuidarr[i], type: "fromhello", state: true }    //发送者
            let todeed = await Deed.getInstance().findByPrimary(todeeduuidarr[i])
            if (!todeed)
                continue
            let refuse = await RefuseUsersRedis.getRefuseUsers(info.getUuid())
            let refusestate = false
            if (refuse) {
                let refuses = new Array()
                refuses = refuse
                refuses.forEach(r => {
                    if (r === fromdeeduuid || r === todeeduuidarr[i])
                        refusestate = true
                })
            }
            if (refusestate)
                continue

            await refuseDeed(info.getUuid(), todeeduuidarr[i])
            await Notice.getInstance().add(obj)
            await Notice.getInstance().add(obj2)
        }
        return { msg: "ok" }
    }

    //首页附近的契约单，点击“应邀”
    public static async nearbyOnHome(body: any, ctx: any): Promise<any> {
        const { deeduuid } = body
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)

        //消抖操作
        let lasttime = await CreateDeed.getLastCreateTime(info.getOpenid())
        if (!lasttime) {
            await CreateDeed.saveLastCreateTime(info.getOpenid(), new Date().getTime() + '')
        } else {
            let nowTime = new Date().getTime()
            if ((parseInt(lasttime) + 2000) > nowTime) {
                return super.BadRequest("操作过于频繁")
            } else {
                await CreateDeed.saveLastCreateTime(info.getOpenid(), nowTime + '')
            }
        }

        let user = await Users.getInstance().findByPrimary(info.getUuid())
        let othersDeed = await Deed.getInstance().findByPrimary(deeduuid)
        if (info.getUuid() === othersDeed.useruuid)
            return super.BadRequest("自己无法邀请自己")
        let deposit = await System.getInstance().findOne('deposit')
        deposit = parseInt(deposit.value.deposit)
        let paylogObj1 = {} as any
        if (user.balance < deposit) {
            return super.BadRequest("吃货币不足")
        } else {
            await Users.getInstance().updateByUuid(info.getUuid(), { balance: (user.balance - deposit) })
            paylogObj1 = { useruuid: info.getUuid(), type: "deposit", coin: deposit, description: "您在首页附近列表点击应邀邀请别人吃饭，扣除押金吃货币" }
        }

        let refuse = await RefuseUsersRedis.getRefuseUsers(info.getUuid())
        let refusestate = false
        if (refuse) {
            let refuses = new Array()
            refuses = refuse
            refuses.forEach(r => {
                if (r === deeduuid)
                    refusestate = true
            })
        }

        if (refusestate)
            return super.Forbidden("不可重复邀请同一张契约单！")

        let other = await Users.getInstance().findByPrimary(othersDeed.useruuid)

        let obj3 = {} as any
        obj3.$or = [{ useruuid1: info.getUuid() }, { useruuid2: info.getUuid() }]
        obj3.$and = { state: "on" }
        let onOrders = await Order.getInstance().findByObj(obj3)
        for (let index = 0; onOrders.length && index < onOrders.length; index++) {
            if (onOrders.length > 1) return super.BadRequest("您存在正在进行中的饭单")
            let order = onOrders[0]
            let [deeduuid1, deeduuid2] = [order.deeduuid1, order.deeduuid2]
            let deed1 = await Deed.getInstance().findByPrimary(deeduuid1)
            let deed2 = await Deed.getInstance().findByPrimary(deeduuid2)
            if ((deed1 && deed1.useruuid == other.uuid && deed1.state) || (deed2 && deed2.useruuid == other.uuid && deed2.state)) {
                return super.BadRequest(`您存在正在进行中的饭单`)
            }
            if (deed1 && deed2) {
                if (deed2.result === "waitfeedback" || deed1.result === "waitfeedback")
                    return super.BadRequest("您存在正在进行中的饭单")
            }

        }
        let mealtime = JSON.stringify(othersDeed.mealtime)
        let obj = {
            useruuid: info.getUuid(),
            latitude: user.latitude,
            longitude: user.longitude,
            payway: "aa",
            mealtime: JSON.parse(mealtime),
            state: false,
            deposit: othersDeed.deposit,
            address: othersDeed.address,
            restaurant: othersDeed.restaurant,
            onetoone: "true",
            result: "waitfeedback",
            type: "nearby",
            getdeposit: othersDeed.getdeposit,
            agerange: othersDeed.agerange,
            age: othersDeed.age,
            gender: othersDeed.gender,
            hide: true
        } as any
        let myOtherDeed = await Deed.getInstance().findBy({ where: { useruuid: info.getUuid(), del: false } })
        let myDeed
        if (myOtherDeed.length > 0) {
            let res1 = await Notice.getInstance().findBy({ fromdeeduuid: deeduuid, useruuid: info.getUuid(), state: true })
            if (res1.length > 0) {
                return super.BadRequest("本条契约单您已邀请过")
            }
            let res2 = await Notice.getInstance().findBy({ useruuid: info.getUuid(), todeeduuid: deeduuid, state: true })
            if (res2.length > 0) {
                return super.BadRequest("本条契约单您已邀请过")
            }
            // myDeed = await Deed.getInstance().destoryDeed(myOtherDeed[0].uuid)
            myDeed = myOtherDeed[0]
        }
        if (!myDeed) {
            myDeed = await Deed.getInstance().created(obj)
            await Users.getInstance().updateByUuid(info.getUuid(), { balance: (user.balance - obj.deposit) })
            let paylogObj = { useruuid: info.getUuid(), type: deposit, deeduuid: myDeed.uuid, coin: obj.deposit, description: `创建契约单，扣除相应的押金` }
            await PayLog.getInstance().add(paylogObj)
        }
        if (myDeed) {
            await Deed.getInstance().destoryDeed(myDeed.uuid)

            let realdeposit = obj.deposit - myDeed.deposit
            if (user.balance < realdeposit) {
                return super.BadRequest("吃货币不足")
            } else {
                await Users.getInstance().updateByUuid(info.getUuid(), { balance: (user.balance - realdeposit) })
                paylogObj1 = { useruuid: info.getUuid(), type: "paydeed", coin: realdeposit, description: `创建契约单，扣除相应的押金` }
            }
            myDeed = await Deed.getInstance().created(obj)
            let point = 'Point(' + user.latitude + ' ' + user.longitude + ')'
            await Deed.getInstance().updateLocation({ point: point, uuid: myDeed.uuid })
            paylogObj1.deeduuid = myDeed.uuid
            if (paylogObj1.useruuid)
                await PayLog.getInstance().add(paylogObj1)
        }

        // await Deed.getInstance().update({ state: true }, deeduuid)
        // await Deed.getInstance().update({ state: true }, myDeed.uuid)

        paylogObj1.deeduuid = myDeed.uuid
        if (paylogObj1.useruuid)
            await PayLog.getInstance().add(paylogObj1)

        let obj1
        let obj2
        obj1 = { useruuid: othersDeed.useruuid, fromdeeduuid: deeduuid, todeeduuid: myDeed.uuid, type: "tonearby", state: true } //接收者
        obj2 = { useruuid: info.getUuid(), fromdeeduuid: deeduuid, todeeduuid: myDeed.uuid, type: "fromnearby", state: true } //发送者
        let fromdeed = await Deed.getInstance().findByPrimary(deeduuid)
        if (!fromdeed)
            return super.Forbidden("契约单不存在")
        await refuseDeed(info.getUuid(), deeduuid)
        await Notice.getInstance().add(obj1)
        await Notice.getInstance().add(obj2)
        return { msg: "ok" }
    }

    //雷达图点击“约”
    public static async nearbySearch(body: any, ctx: any): Promise<any> {
        const { otherdeeduuid, mydeeduuid } = body
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        if (mydeeduuid === undefined || mydeeduuid === "undefied") {
            let res = await this.nearbyOnHome({ deeduuid: otherdeeduuid }, ctx)
            return res
        }
        let othersDeed = await Deed.getInstance().findByPrimary(otherdeeduuid)
        if (mydeeduuid !== undefined) {
            let mydeed = await Deed.getInstance().findByPrimary(mydeeduuid)
            if (mydeed && mydeed.type !== "nearby") {
                let res = await this.nearbyOnHome({ deeduuid: otherdeeduuid }, ctx)
                return res
            }
        }

        let obj1
        let obj2
        obj1 = { useruuid: othersDeed.useruuid, fromdeeduuid: otherdeeduuid, todeeduuid: mydeeduuid, type: "tonearby", state: true } //接收者
        obj2 = { useruuid: info.getUuid(), fromdeeduuid: otherdeeduuid, todeeduuid: mydeeduuid, type: "fromnearby", state: true } //发送者
        let res = await Notice.getInstance().findBy({ fromdeeduuid: otherdeeduuid, todeeduuid: mydeeduuid, state: true })
        if (res.length > 0) {
            return { msg: "本条契约单您已邀请过" }
        }

        let fromdeed = await Deed.getInstance().findByPrimary(otherdeeduuid)
        let todeed = await Deed.getInstance().findByPrimary(mydeeduuid)
        if (!fromdeed && !todeed)
            return super.Forbidden("契约单不存在")

        let refuse = await RefuseUsersRedis.getRefuseUsers(info.getUuid())
        let refusestate = false
        if (refuse) {
            let refuses = new Array()
            refuses = refuse
            refuses.forEach(r => {
                if (r === otherdeeduuid && info.getUuid() === todeed.useruuid)
                    refusestate = true

                if (r === mydeeduuid && info.getUuid() === fromdeed.useruuid)
                    refusestate = true
            })
        }
        if (refusestate)
            return super.Forbidden("不可重复邀请同一张契约单！")

        if (info.getUuid() === fromdeed.useruuid) {
            await refuseDeed(info.getUuid(), mydeeduuid)
        } else {
            await refuseDeed(info.getUuid(), otherdeeduuid)
        }
        await Notice.getInstance().add(obj1)
        await Notice.getInstance().add(obj2)
        return { msg: "ok" }
    }

    //查询我的邀请（我要花钱）
    public static async getMyInvited(ctx: any, query: any): Promise<any> {
        const { deeduuid } = query
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let deeds = await Notice.getInstance().findMyInvited_pro({ fromdeeduuid: deeduuid, useruuid: info.getUuid() })
        return { deeds }
    }

    //查询我收到的邀请（附近约饭）
    public static async nearbyInvite(ctx: any, query: any): Promise<any> {
        const { deeduuid } = query
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let deeds = await Notice.getInstance().findNearbyInvite({ fromdeeduuid: deeduuid, useruuid: info.getUuid() })
        return { deeds }
    }

    //消息详情
    public static async findByUuid(params: any, ctx: any): Promise<any> {
        const { uuid } = params
        validateCgi({ uuid }, NoticeValidator.uuidValidator)
        //const info: LoginInfoAtApp = super.getLoginInfo(ctx)

        let notice = await Notice.getInstance().findByPrimary(uuid)

        //let anotherDeed = await Deed.getInstance().findByPrimary(notice.todeeduuid)
        let myDeed = await Deed.getInstance().findByPrimary(notice.fromdeeduuid)
        if (myDeed && (notice.type === "fromhello" || notice.type === "tohello"))
            myDeed = await Deed.getInstance().findByPrimary(notice.todeeduuid)
        // if (anotherDeed.useruuid === info.getUuid()) return super.BadRequest("该消息记录对方契约单错误设置为自己您的契约单")
        // if (myDeed.useruuid !== info.getUuid()) return super.BadRequest("该消息记录自己的契约单错误设置不为自己的")

        let another = await Users.getInstance().findByPrimary(myDeed.useruuid)
        myDeed.avatar = another.avatar
        myDeed.nickname = another.nickname
        myDeed.noticetype = notice.type
        myDeed.noticedeeduuid = notice.deeduuid

        return myDeed
    }

    //我的消息(改进)
    public static async findMyNotice_pro(ctx: any, query: any): Promise<any> {
        let { start, length, type } = query
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        validateCgi({ uuid: info.getUuid(), start, length, type }, NoticeValidator.findMyNotice)
        let notices1: any[] = await Notice.getInstance().findByUserPro(info.getUuid(), parseInt(start), parseInt(length), type)
        // let notices2: any[] = await Notice.getInstance().findByUserPro2(info.getUuid(), parseInt(start), parseInt(length), type)
        // let notices = new Array()
        // notices1.forEach(r => {
        //     if (r.useruuid === r.anotheruseruuid) {
        //         notices2.forEach(k => {
        //             if (r.uuid === k.uuid) {
        //                 k.created = gettime.getTimeStr(k.created)
        //                 notices.push(k)
        //             }
        //         })
        //     } else {
        //         r.created = gettime.getTimeStr(r.created)
        //         notices.push(r)
        //     }
        // })
        if (notices1.length > 0) {
            for (let index = 0; index < notices1.length; index++) {
                let r = notices1[index]
                if (r.type === "audit" && r.infodeeduuid) {
                    let deed = await Deed.getInstance().findByPrimary(r.infodeeduuid)
                    if (!deed)
                        continue
                    let user = await Users.getInstance().findByPrimary(deed.useruuid)
                    if (user && user.nickname)
                        r.nickname = user.nickname
                }
                if (r.type === "audit" && !r.infodeeduuid && r.useruuid) {
                    let user = await Users.getInstance().findByPrimary(r.useruuid)
                    if (user && user.nickname)
                        r.nickname = user.nickname
                }
                r.created = gettime.getTimeStr(r.created)
            }
        }

        return { notices: notices1 }
    }

    //删除消息
    public static async destory(params: any): Promise<any> {
        const { uuid } = params
        validateCgi({ uuid }, NoticeValidator.uuidValidator)
        //let notice = await Notice.getInstance().findByPrimary(uuid)

        // if (notice.type !== "audit" && !notice.result) {
        //     return super.Forbidden("饭单尚未完成，无法删除")
        // }

        await Notice.getInstance().destoryNotice(uuid)
        return { msg: "ok" }
    }

    //修改消息状态
    public static async updateState(ctx: any, body: any): Promise<any> {
        const { uuid } = ctx.params
        const { state } = body
        let notice = await Notice.getInstance().updateState(uuid, state)
        return { notice }
    }

    //把未读消息改为已读
    public static async readNotice(body: any): Promise<any> {
        const { uuid } = body
        validateCgi({ uuid }, NoticeValidator.readNotice)

        let isReadOk = await Notice.getInstance().update({ state: "false" }, uuid)
        if (!isReadOk) return super.InternalServerError("读取新信息失败")

        return { "msg": "读取消息成功" }
    }

    //我的未读消息
    public static async findMyNoticeByState(ctx: any): Promise<any> {
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let notice = await Notice.getInstance().findMyNoticeByState(info.getUuid())
        let msg = false
        if (notice && notice.length > 0) {
            msg = true
        }

        return { msg }
    }

}

//创建消息
router.loginHandleAtApp("post", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await NoticeOnApp.createdNotice((ctx.request as any).body, ctx)))

//约主播
router.loginHandleAtApp("post", "/invite", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await NoticeOnApp.inviteByNotice((ctx.request as any).body, ctx)))

//我要花钱
router.loginHandleAtApp("post", "/spend", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await NoticeOnApp.invitedByNotice((ctx.request as any).body, ctx)))

//我要赚钱打招呼
router.loginHandleAtApp("post", "/make", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await NoticeOnApp.invitedByNotices((ctx.request as any).body, ctx)))

//首页附近的契约单，点击“应邀”
router.loginHandleAtApp("post", "/nearbyonhome", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await NoticeOnApp.nearbyOnHome((ctx.request as any).body, ctx)))

//雷达图点击“约”
router.loginHandleAtApp("post", "/nearbysearch", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await NoticeOnApp.nearbySearch((ctx.request as any).body, ctx)))

//我的消息
router.loginHandleAtApp("get", "/byuser", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await NoticeOnApp.findMyNotice_pro(ctx, (ctx.request as any).query)))

//查询我的邀请（我要花钱）
router.loginHandleAtApp("get", "/myinvited", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await NoticeOnApp.getMyInvited(ctx, (ctx.request as any).query)))

//查询邀请我的（附近约单）
router.loginHandleAtApp("get", "/nearbyinvite", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await NoticeOnApp.nearbyInvite(ctx, (ctx.request as any).query)))

//我的新消息
router.loginHandleAtApp("get", "/new", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await NoticeOnApp.findMyNoticeByState(ctx)))

//消息详情
router.loginHandleAtApp("get", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await NoticeOnApp.findByUuid(ctx.params, ctx)))

//删除消息
router.loginHandleAtApp("delete", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await NoticeOnApp.destory(ctx.params)))

//把未读消息变成已读
router.loginHandleAtApp("put", "/state/read", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await NoticeOnApp.readNotice((ctx.request as any).body)))

//修改消息状态
router.loginHandleAtApp("put", "/state/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await NoticeOnApp.updateState(ctx, (ctx.request as any).body)))




