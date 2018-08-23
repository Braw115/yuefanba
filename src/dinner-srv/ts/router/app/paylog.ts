import { validateCgi } from "../../lib/validator"
import { PayLogValidator } from "./validator"
import { RouterWrap } from "../../lib/routerwrap"
import { PayLog } from "../../model/users/paylog"
import { Users } from "../../model/users/users"
import { Deed } from "../../model/users/deed"
import { System } from "../../model/crm/system"
import { LoginInfoAtApp } from "../../redis/logindao"
import { BaseHandler } from "../lib/basehandler"
import * as gettime from "../../lib/gettime"
export const router = new RouterWrap({ prefix: "/apppaylog" })


export class AppPayLog extends BaseHandler {
    //查看所有支付日志
    public static async payLogList(query: any, ctx: any): Promise<any> {
        const { start, length } = query
        validateCgi({ start, length }, PayLogValidator.payLogList)

        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let uuid = info.getUuid()

        let obj = { useruuid: uuid } as any

        let res = await PayLog.getInstance().findAll(obj, parseInt(start), parseInt(length))

        let payLogList = res.rows.map(r => r.get())
        payLogList.forEach(r => {
            r.created = gettime.getTimeStr(r.created)
        })

        return payLogList
    }

    //获取系统的充值比例
    public static async getProportion(): Promise<any> {
        let pay = await System.getInstance().findOne('pay')
        let proportion = parseInt(pay.value.proportion)
        return { proportion: proportion }
    }

    public static async payLogInfo(query: any): Promise<any> {
        const { uuid } = query
        validateCgi({ uuid }, PayLogValidator.payLogInfo)

        let res = await PayLog.getInstance().findByuuid(uuid)
        res[0].user1 = null
        res[0].user2 = null
        res[0].nickname = null
        res[0].restaurant = null
        res[0].created = gettime.getTimeStr(res[0].created)
        if (res[0].orderuuid) {

            let deed1 = await Deed.getInstance().findByPrimary(res[0].deeduuid1)
            let deed2 = await Deed.getInstance().findByPrimary(res[0].deeduuid2)
            if (deed1.restaurant) {
                let user1 = await Users.getInstance().findByPrimary(deed1.useruuid)
                let user2 = await Users.getInstance().findByPrimary(deed2.useruuid)
                if (user2 && user1) {
                    res[0].user1 = user1.nickname
                    res[0].user2 = user2.nickname
                    res[0].nickname = user1.nickname
                    res[0].restaurant = deed1.restaurant
                    res[0].payway = deed1.payway
                }
            } else {
                let user1 = await Users.getInstance().findByPrimary(deed2.useruuid)
                let user2 = await Users.getInstance().findByPrimary(deed1.useruuid)
                if (user2 && user1) {
                    res[0].user1 = user1.nickname
                    res[0].user2 = user2.nickname
                    res[0].nickname = user1.nickname
                    res[0].restaurant = deed2.restaurant
                    res[0].payway = deed2.payway
                }
            }
        }
        return res
    }

}

//查看所有的所有支付日志
router.loginHandleAtApp("get", "/payloglist", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppPayLog.payLogList((ctx.request as any).query, ctx)))

//获取系统的充值比例
router.loginHandleAtApp("get", "/getproportion", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppPayLog.getProportion()))

//获取日志详情
router.loginHandleAtApp("get", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppPayLog.payLogInfo(ctx.params)))
