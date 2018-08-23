import { Deed } from "../../model/users/deed"
import { Users } from "../../model/users/users"
import { System } from "../../model/crm/system"
import { PayLog } from "../../model/users/paylog"
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { Notice } from "../../model/users/notice"
import { DeedValidator } from "./validator"
import { BaseHandler } from "../lib/basehandler"
import { refuseDeed } from "../../lib/wxnews"
//import { DeedRedis } from "../../redis/redisdeed"
import { RefuseUsersRedis } from "../../redis/refuseuser"
//import * as CreateDeed from "../../redis/createdeed"
import { LoginInfoAtApp } from "../../redis/logindao"
import { Order } from "../../model/users/order";
import * as gettime from "../../lib/gettime"
export const router = new RouterWrap({ prefix: "/app/deed" })

export class DeedOnApp extends BaseHandler {
    //1.获取列表
    public static async list(query: any, ctx: any): Promise<any> {
        let { type, deeduuid, start, length } = query
        validateCgi({ type, deeduuid, start, length }, DeedValidator.listDeedValidator)
        let deed = await Deed.getInstance().findByPrimary(deeduuid)
        let gender = undefined
        if (deed.gender === 1 || deed.gender === 0) {
            gender = deed.gender
        }
        // let age = deed.agerange
        let age = JSON.parse(deed.agerange)
        let mealtime = JSON.stringify(deed.mealtime)
        let latitude = deed.latitude
        let longitude = deed.longitude
        let point = 'Point(' + latitude + ' ' + longitude + ')'

        if (type === "nearby")
            await Deed.getInstance().update({ hide: "false" }, deeduuid)

        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let user = await Users.getInstance().findByPrimary(info.getUuid())
        let deedList = new Array()
        let newdeedList = new Array()
        if (type == "make" && gender === undefined) {
            for (let i = 0; i < age.length; i++) {
                newdeedList = await Deed.getInstance().findMakeAll(
                    user.city, mealtime, type, parseInt(length), parseInt(start),
                    age[i][0], age[i][1], info.getUuid())
                newdeedList.forEach(r => {
                    if (r && r !== null && r !== "null")
                        deedList.push(r)
                })

            }
        } else if (type == "make" && gender != undefined) {
            for (let i = 0; i < age.length; i++) {
                newdeedList = await Deed.getInstance().findByMake(
                    user.city, mealtime, type, parseInt(length), parseInt(start),
                    age[i][0], age[i][1], gender, info.getUuid())
                newdeedList.forEach(r => {
                    if (r && r !== null && r !== "null")
                        deedList.push(r)
                })
            }
        } else if (type == "spend" && gender === undefined) {
            for (let i = 0; i < age.length; i++) {
                newdeedList = await Deed.getInstance().findSpendAll(
                    point, user.city, mealtime, type, parseInt(length), parseInt(start),
                    age[i][0], age[i][1], info.getUuid())
                newdeedList.forEach(r => {
                    if (r && r !== null && r !== "null")
                        deedList.push(r)
                })
            }
        } else if (type == "spend" && gender != undefined) {
            for (let i = 0; i < age.length; i++) {
                newdeedList = await Deed.getInstance().findBySpend(
                    point, user.city, mealtime, type, parseInt(length), parseInt(start),
                    age[i][0], age[i][1], gender, info.getUuid())
                newdeedList.forEach(r => {
                    if (r && r !== null && r !== "null")
                        deedList.push(r)
                })
            }
        } else if (type == "nearby" && gender === undefined) {
            for (let i = 0; i < age.length; i++) {
                newdeedList = await Deed.getInstance().findNearbyAll(
                    user.city, mealtime, type, parseInt(length), parseInt(start),
                    age[i][0], age[i][1], point, info.getUuid())
                newdeedList.forEach(r => {
                    if (r && r !== null && r !== "null")
                        deedList.push(r)
                })
            }
        } else {
            for (let i = 0; i < age.length; i++) {
                newdeedList = await Deed.getInstance().findByNearby(
                    user.city, mealtime, type, parseInt(length),
                    parseInt(start), age[i][0], age[i][1], gender, point, info.getUuid())
                newdeedList.forEach(r => {
                    if (r && r !== null && r !== "null")
                        deedList.push(r)
                })
            }
        }

        return { deedlist: deedList }
    }

    //契约单详情
    public static async findByUuid(params: any): Promise<any> {
        const { uuid } = params
        validateCgi({ uuid }, DeedValidator.uuidValidator)

        let deed = await Deed.getInstance().findByPrimary(uuid)
        let user = await Users.getInstance().findByPrimary(deed.useruuid)
        deed.nickname = user.nickname
        deed.avatar = user.avatar
        deed.created = gettime.getTimeStr(deed.created)

        return { deed }
    }

    //获取系统的押金
    public static async getDeposit(): Promise<any> {
        let deposit = await System.getInstance().findOne('deposit')
        deposit = parseInt(deposit.value.deposit)
        return { deposit: deposit }
    }

    //创建契约单
    public static async createDeed(body: any, ctx: any): Promise<any> {
        let { mealtime, gender, latitude, longitude, agerange, payway,
            type, address, restaurant, posit, getposit, deldeed } = body
        let obj = { mealtime, latitude, longitude, payway, type, address, restaurant } as any
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)

        validateCgi({
            mealtime, gender, latitude, longitude, agerange, payway, type,
            address, restaurant, posit, getposit
        }, DeedValidator.createdDeed)

        //消抖操作
        // let lasttime = await CreateDeed.getLastCreateTime(info.getOpenid())
        // if (!lasttime) {
        //     await CreateDeed.saveLastCreateTime(info.getOpenid(), new Date().getTime() + '')
        // } else {
        //     let nowTime = new Date().getTime()
        //     if ((parseInt(lasttime) + 2000) > nowTime) {
        //         return super.BadRequest("操作过于频繁")
        //     } else {
        //         await CreateDeed.saveLastCreateTime(info.getOpenid(), nowTime + '')
        //     }
        // }

        let MyDeeds = await Deed.getInstance().findByUser(info.getUuid())
        if (MyDeeds && MyDeeds.length > 0 && !deldeed)
            return super.BadRequest("您已存在契约单，请取消后再添加！")

        if (MyDeeds && MyDeeds.length > 0 && deldeed) {
            let order = await Order.getInstance().findByObj(
                {
                    $or: [{ deeduuid1: MyDeeds[0].uuid }, { deeduuid2: MyDeeds[0].uuid }],
                    $and: { $or: [{ state: "on" }, { state: "new" }] }
                }
            )
            if (order && order.length > 0)
                return super.BadRequest("契约单已经与饭单关联，无法替换！请前往饭单列表完成饭单")
        }

        let user = await Users.getInstance().findByPrimary(info.getUuid())
        let point = 'Point(' + latitude + ' ' + longitude + ')'
        obj.useruuid = info.getUuid()
        obj.state = false
        if (!gender) {
            obj.gender = null
        } else {
            obj.gender = parseInt(gender)
        }

        obj.getposit = null
        obj.result = "waitfeedback" //默认（待反馈）
        obj.agerange = agerange
        //obj.mealtime = JSON.parse(mealtime)
        obj.onetoone = false
        if (type === "make") {
            obj.payway = "aa"
            obj.latitude = user.latitude
            obj.longitude = user.longitude
            delete obj.address
            delete obj.restaurant
            getposit = JSON.parse(getposit)
            getposit = [getposit[0], getposit[1] - 1]
            obj.getposit = JSON.stringify(getposit)
            point = 'Point(' + user.latitude + ' ' + user.longitude + ')'
            let deposit = await System.getInstance().findOne('deposit')
            obj.deposit = parseInt(deposit.value.deposit)
        } else if (type === "spend") {
            obj.deposit = posit
            obj.getposit = '[0,0]'
        } else {
            //TODO获取诚意金（systeam）
            obj.payway = payway
            let deposit = await System.getInstance().findOne('deposit')
            obj.deposit = parseInt(deposit.value.deposit)
            obj.getposit = '[0,0]'
        }
        obj.point = point
        if (type === "make") {
            if (user.status === "unupload") {
                return { code: 400, err: "1" } //attestvideo unupload
            } else if (user.status === "uncheck") {
                return { code: 400, err: "2" }  //attestvideo uncheck
            } else if (user.status === "refuse") {
                return { code: 400, err: "3" } //attestvideo refuse
            }
        }
        if (!user.phone)
            return { code: 400, err: "4" } //phone is empty

        if (user.balance < obj.deposit)
            return { code: 400, err: "5" } //balance is not enough

        let deed
        let payType
        let description
        if (type === "spend") {
            payType = "paydeed"
            description = "赏金"
        } else {
            payType = "deposit"
            description = "押金"
        }
        let paylogObj1 = {} as any
        if (MyDeeds && MyDeeds.length > 0 && deldeed) {
            let realdeposit = obj.deposit - MyDeeds[0].deposit
            if (user.balance < realdeposit) {
                return super.BadRequest("吃货币不足")
            } else {
                await Users.getInstance().updateByUuid(info.getUuid(), { balance: (user.balance - realdeposit) })
                paylogObj1 = { useruuid: info.getUuid(), type: "paydeed", coin: realdeposit, description: `创建契约单，扣除相应的${description}` }
            }
            if (type === "make") {
                deed = await Deed.getInstance().addNoAddress(obj)
            } else {
                deed = await Deed.getInstance().add(obj)
            }
            if (MyDeeds && MyDeeds.length > 0 && deldeed) {
                await Deed.getInstance().delDeed(MyDeeds[0].uuid)
                await Deed.getInstance().delStateDeed(MyDeeds[0].uuid)
            }
            paylogObj1.deeduuid = deed.uuid
            if (paylogObj1.useruuid)
                await PayLog.getInstance().add(paylogObj1)
        } else {
            if (type === "make") {
                deed = await Deed.getInstance().addNoAddress(obj)
            } else {
                deed = await Deed.getInstance().add(obj)
            }
            await Users.getInstance().updateByUuid(info.getUuid(), { balance: (user.balance - obj.deposit) })
            let paylogObj = { useruuid: info.getUuid(), type: payType, deeduuid: deed.uuid, coin: obj.deposit, description: `创建契约单，扣除相应的${description}` }
            await PayLog.getInstance().add(paylogObj)
        }
        if (type !== "make") {
            let users = await Users.getInstance().findNoDeedUser(deed.uuid)
            for (let i = 0; i < users.length; i++) {
                let obj = {
                    type: "audit",
                    state: true,
                    useruuid: users[i].uuid,
                    infodeeduuid: deed.uuid
                } as any
                await Notice.getInstance().add(obj)
            }
        }

        return { deed }
    }

    //查找附近的契约单
    public static async findByMake(query: any, ctx: any): Promise<any> {
        let { gender, agerange, orderby, start, length, deeduuid } = query
        if (orderby === "undefined")
            orderby = undefined
        validateCgi({ gender, agerange, orderby, start, length }, DeedValidator.findMake)
        if (deeduuid) {
            let deed = await Deed.getInstance().findByPrimary(deeduuid)
            if (deed.type === "nearby") {
                let res = await this.lists(query, ctx)
                return res
            }
        }
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)

        let user = await Users.getInstance().findByPrimary(info.getUuid())
        let point = 'Point(' + user.latitude + ' ' + user.longitude + ')'

        let deedList
        agerange = JSON.parse(agerange)
        let deeds = new Array()
        let deedlist = new Array()
        for (let i = 0; i < agerange.length; i++) {
            if (gender === "undefined" || gender === undefined) {
                deedlist = await Deed.getInstance().findAllNear(point, "nearby", parseInt(length), parseInt(start), agerange[i][0], agerange[i][1], info.getUuid())
            } else {
                gender = parseInt(gender)
                deedlist = await Deed.getInstance().findByTypeNear(point, "nearby", parseInt(length), parseInt(start), agerange[i][0], agerange[i][1], gender, info.getUuid())
            }
            if (orderby) {
                if (gender === "undefined" || gender === undefined) {
                    deedlist = await Deed.getInstance().findAllNearByType(point, "nearby", parseInt(length), parseInt(start), agerange[i][0], agerange[i][1], info.getUuid(), orderby)
                } else {
                    gender = parseInt(gender)
                    deedlist = await Deed.getInstance().findByTypeNearByType(point, "nearby", parseInt(length), parseInt(start), agerange[i][0], agerange[i][1], gender, info.getUuid(), orderby)
                }
            }
            if (deedlist.length > 0) {
                deedlist.forEach(r => {
                    if (r && r !== "null" && r !== null)
                        deeds.push(r)
                })
            }
            deeds.push(deedList)
        }

        let returndeeds = new Array()
        deeds.forEach(r => {
            if (r && r !== undefined && r !== "undefined" && r !== null && r !== "null")
                returndeeds.push(r)
        })

        return { deedlist: returndeeds }
    }

    public static async lists(query: any, ctx: any): Promise<any> {
        let { deeduuid, start, length } = query
        //validateCgi({ deeduuid, start, length }, DeedValidator.listDeedValidator)
        let deed = await Deed.getInstance().findByPrimary(deeduuid)
        let gender = undefined
        if (deed.gender === 1 || deed.gender === 0) {
            gender = deed.gender
        }
        // let age = deed.agerange
        let age = JSON.parse(deed.agerange)
        let mealtime = JSON.stringify(deed.mealtime)
        let latitude = deed.latitude
        let longitude = deed.longitude
        let point = 'Point(' + latitude + ' ' + longitude + ')'

        await Deed.getInstance().update({ hide: "false" }, deeduuid)

        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let user = await Users.getInstance().findByPrimary(info.getUuid())
        let deedList = new Array()
        let newdeedList = new Array()
        if (gender === undefined) {
            for (let i = 0; i < age.length; i++) {
                newdeedList = await Deed.getInstance().findNearbyAll(
                    user.city, mealtime, "nearby", parseInt(length), parseInt(start),
                    age[i][0], age[i][1], point, info.getUuid())
                newdeedList.forEach(r => {
                    if (r && r !== null && r !== "null")
                        deedList.push(r)
                })
            }
        } else {
            for (let i = 0; i < age.length; i++) {
                newdeedList = await Deed.getInstance().findByNearby(
                    user.city, mealtime, "nearby", parseInt(length),
                    parseInt(start), age[i][0], age[i][1], gender, point, info.getUuid())
                newdeedList.forEach(r => {
                    if (r && r !== null && r !== "null")
                        deedList.push(r)
                })
            }
        }

        return { deedlist: deedList }
    }

    //修改契约单
    public static async updateResult(params: any): Promise<any> {
        const { uuid, result } = params
        validateCgi({ uuid, result }, DeedValidator.updateResultValidator)
        let deed = await Deed.getInstance().update({ result }, uuid)
        return { deed }
    }

    //我的契约单
    public static async findMyDeed(params: any, ctx: any): Promise<any> {
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)

        let obj = {
            where: {
                useruuid: info.getUuid(),
                del: false
            }
        }

        let deedslist = await Deed.getInstance().findBy(obj)
        return { deedslist }
    }

    //清楚地理位置
    public static async clearLocation(body: any, ctx: any): Promise<any> {
        const { deeduuid } = body
        validateCgi({ deeduuid }, DeedValidator.clearLocation)

        let deed = await Deed.getInstance().findByPrimary(deeduuid)
        if (deed && deed.type !== "nearby")
            return super.BadRequest("该契约单不是附近契约单，不能隐藏")

        let clearOk = await Deed.getInstance().update({ hide: "true" }, deeduuid)
        if (!clearOk) return super.InternalServerError("清楚位置失败")

        return { "msg": "ok" }

    }

    //约热门主播吃饭
    public static async inviteHot(body: any, ctx: any): Promise<any> {
        let { useruuid, deeduuid, restaurant, address, mealtime, payway, deposit, latitude, longitude } = body
        let type = "spend"
        let result = "waitfeedback"
        let onetoone = "true"
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let user = await Users.getInstance().findByPrimary(info.getUuid())
        let uuid = info.getUuid()
        if (useruuid === info.getUuid())
            return super.BadRequest("自己无法邀请自己")
        mealtime = JSON.parse(mealtime)
        let obj = { useruuid: uuid, restaurant, address, payway, mealtime, deposit, latitude, longitude, type, result, onetoone } as any

        //消抖操作
        // let lasttime = await CreateDeed.getLastCreateTime(info.getOpenid())
        // if (!lasttime) {
        //     await CreateDeed.saveLastCreateTime(info.getOpenid(), new Date().getTime() + '')
        // } else {
        //     let nowTime = new Date().getTime()
        //     if ((parseInt(lasttime) + 2000) > nowTime) {
        //         return super.BadRequest("操作过于频繁")
        //     } else {
        //         await CreateDeed.saveLastCreateTime(info.getOpenid(), nowTime + '')
        //     }
        // }

        let other = await Users.getInstance().findByPrimary(useruuid)

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

        let paylogObj1 = {} as any

        let MyDeeds = await Deed.getInstance().findByUser(info.getUuid())
        let insertDeedOk
        if (MyDeeds && MyDeeds.length > 0 && MyDeeds[0].state)
            return super.BadRequest("您有正在进行中的饭单，请完成后再邀请！")
        if (MyDeeds && MyDeeds.length > 0 && !MyDeeds[0].state) {
            insertDeedOk = MyDeeds[0]
            if (insertDeedOk) {
                let realdeposit = deposit - insertDeedOk.deposit
                if (user.balance < realdeposit) {
                    return super.BadRequest("吃货币不足")
                } else {
                    await Users.getInstance().updateByUuid(info.getUuid(), { balance: (user.balance - realdeposit) })
                    paylogObj1 = { useruuid: info.getUuid(), type: "paydeed", coin: realdeposit, description: "您在首页邀请热门人气用户吃饭，扣除赏金吃货币" }
                }
                //obj.uuid = insertDeedOk.uuid
                await Deed.getInstance().delDeed(insertDeedOk.uuid)
                insertDeedOk = await Deed.getInstance().created(obj)
                paylogObj1.deeduuid = insertDeedOk.uuid
                if (paylogObj1.useruuid)
                    await PayLog.getInstance().add(paylogObj1)
            }
        } else {
            if (user.balance < deposit) {
                return super.BadRequest("吃货币不足")
            } else {
                await Users.getInstance().updateByUuid(info.getUuid(), { balance: (user.balance - deposit) })
                paylogObj1 = { useruuid: info.getUuid(), type: "paydeed", coin: deposit, description: "您在首页邀请热门人气用户吃饭，扣除赏金吃货币" }
            }
            insertDeedOk = await Deed.getInstance().created(obj)
            paylogObj1.deeduuid = insertDeedOk.uuid
            if (paylogObj1.useruuid)
                await PayLog.getInstance().add(paylogObj1)
        }
        if (!insertDeedOk) return super.InternalServerError("生成契约单失败")

        let obj1
        let obj2

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

        obj1 = { useruuid: useruuid, fromdeeduuid: insertDeedOk.uuid, todeeduuid: deeduuid, type: "receive", state: true } //接收者
        obj2 = { useruuid: info.getUuid(), fromdeeduuid: insertDeedOk.uuid, todeeduuid: deeduuid, type: "send", state: true } //发送者
        let fromdeed = await Deed.getInstance().findByPrimary(deeduuid)
        if (!fromdeed)
            return super.BadRequest("生成消息单失败,请重新选择邀请对象")
        await refuseDeed(info.getUuid(), deeduuid)
        let notice1 = await Notice.getInstance().add(obj1)
        let notice2 = await Notice.getInstance().add(obj2)
        if (notice1 && notice2)
            return { msg: "ok" }
        else
            return super.InternalServerError("生成消息单失败")

    }

    //删除契约单
    public static async destory(ctx: any): Promise<any> {
        const { uuid } = ctx.params
        validateCgi({ uuid }, DeedValidator.uuidValidator)
        let order = await Order.getInstance().findByObj(
            {
                $or: [{ deeduuid1: uuid }, { deeduuid2: uuid }],
                $and: { $or: [{ state: "on" }, { state: "new" }] }
            }
        )
        if (order && order.length > 0)
            return super.BadRequest("契约单已经与饭单关联，无法删除！请前往饭单列表修改饭单状态")
        let deed = await Deed.getInstance().findByPrimary(uuid)
        let deposit = await System.getInstance().findOne('deposit')
        deposit = parseInt(deposit.value.deposit)
        let user = await Users.getInstance().findByPrimary(deed.useruuid)
        let payType
        let description
        if (deed.type === "spend") {
            deposit = deed.deposit
            payType = "backdeed"
            description = "赏金"
        } else if (deed.type === "make") {
            payType = "depositback"
            description = "押金"
        } else {
            payType = "depositback"
            description = "押金"
        }
        await Users.getInstance().updateByUuid(deed.useruuid, { balance: user.balance + deposit })
        let paylogObj = { useruuid: deed.useruuid, type: payType, deeduuid: deed.uuid, coin: deposit, description: `取消契约单，回退相应的${description}` }
        await PayLog.getInstance().add(paylogObj)
        await Deed.getInstance().delDeed(uuid)
        await Deed.getInstance().delStateDeed(uuid)
        return { msg: "ok" }

    }

    //删除契约单
    public static async cancelDeed(body: any, ctx: any): Promise<any> {
        const { uuid } = ctx.params
        validateCgi({ uuid }, DeedValidator.uuidValidator)
        let order = await Order.getInstance().findByObj(
            {
                $or: [{ deeduuid1: uuid }, { deeduuid2: uuid }],
                $and: { $or: [{ state: "on" }, { state: "new" }] }
            }
        )
        if (order && order.length > 0)
            return super.BadRequest("契约单已经与饭单关联，无法删除！请前往饭单列表修改饭单状态")
        let deed = await Deed.getInstance().findByPrimary(uuid)
        let deposit = await System.getInstance().findOne('deposit')
        deposit = parseInt(deposit.value.deposit)
        let user = await Users.getInstance().findByPrimary(deed.useruuid)
        let payType
        let description
        if (deed.type === "spend") {
            deposit = deed.deposit
            payType = "backdeed"
            description = "赏金"
        } else if (deed.type === "make") {
            payType = "depositback"
            description = "押金"
        } else {
            payType = "depositback"
            description = "押金"
        }
        await Users.getInstance().updateByUuid(deed.useruuid, { balance: user.balance + deposit })
        let paylogObj = { useruuid: deed.useruuid, type: payType, deeduuid: deed.uuid, coin: deposit, description: `取消契约单，回退相应的${description}` }
        await PayLog.getInstance().add(paylogObj)
        await Deed.getInstance().delDeed(uuid)
        await Deed.getInstance().delStateDeed(uuid)
        return { msg: "ok" }

    }


}

//查询契约单
router.loginHandleAtApp("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await DeedOnApp.list((ctx.request as any).query, ctx)))

//查找附近的契约单
router.loginHandleAtApp("get", "/make", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await DeedOnApp.findByMake((ctx.request as any).query, ctx)))

//我的契约单
router.loginHandleAtApp("get", "/my", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await DeedOnApp.findMyDeed((ctx.request as any).query, ctx)))

//获取系统的押金
router.loginHandleAtApp("get", "/deposit", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await DeedOnApp.getDeposit()))

//契约单详情
router.loginHandleAtApp("get", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await DeedOnApp.findByUuid(ctx.params)))

//创建契约单
router.loginHandleAtApp("post", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await DeedOnApp.createDeed((ctx.request as any).body, ctx)))

//取消邀请
router.loginHandleAtApp("put", "/cancel", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await DeedOnApp.cancelDeed((ctx.request as any).body, ctx)))

//修改契约单
router.loginHandleAtApp("put", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await DeedOnApp.updateResult((ctx.request as any).body)))

//清楚位置
router.loginHandleAtApp("post", "/clearlocation", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await DeedOnApp.clearLocation((ctx.request as any).body, ctx)))

//约热门主播吃饭
router.loginHandleAtApp("post", "/invitehot", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await DeedOnApp.inviteHot((ctx.request as any).body, ctx)))

//删除饭单
router.loginHandleAtApp("delete", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await DeedOnApp.destory(ctx)))


