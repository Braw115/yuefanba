import { OrderValidator } from "./validator"
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { } from "../../lib/miniohelper"
import { checkCursorLimit } from "../../lib/utils"
import { LoginInfo } from "../../redis/logindao"
import { Order } from "../../model/users/order"
import { BaseHandler } from "../lib/basehandler"
import * as gettime from "../../lib/gettime"
export const router = new RouterWrap({ prefix: "/crmorder" })


export class CrmOrder extends BaseHandler {
    //1.查看订单列表
    public static async OrderList(query: any, ctx: any): Promise<any> {
        const { start, length, draw, type, state } = query

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isAdmin())
            return super.NotAcceptable("没有权限")

        validateCgi({ start, length, type, state }, OrderValidator.OrderList)

        let check = checkCursorLimit(parseInt(start), parseInt(length))
        if (check)
            return super.BadRequest("参数不合要求")

        let obj = {} as any
        if (type !== "all")
            obj.type = type
        if (state !== "all")
            obj.state = state

        let res = await Order.getInstance().findAll(obj, parseInt(start), parseInt(length))
        let orderList = res.rows.map(r => r.get())

        orderList.forEach(r => {
            r.created = gettime.getTimeStr(r.created)
            r.modified = gettime.getTimeStr(r.modified)
            let starttime = r.starttime
            r.starttime = [gettime.formatToYMDSFM(starttime[0]), gettime.formatToYMDSFM(starttime[1])]
        })

        return { orderList, recordsFiltered: res.count, draw: parseInt(draw) }
    }

}

//1.查看订单列表
router.loginHandle("get", "/orderlist", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmOrder.OrderList((ctx.request as any).query, ctx)))