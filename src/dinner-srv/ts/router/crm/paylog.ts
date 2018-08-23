import { PayLogValidator } from "./validator"
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { } from "../../lib/miniohelper"
import { checkCursorLimit } from "../../lib/utils"
import { LoginInfo } from "../../redis/logindao"
import { PayLog } from "../../model/users/paylog"
import { BaseHandler } from "../lib/basehandler"
import * as gettime from "../../lib/gettime"
export const router = new RouterWrap({ prefix: "/paylog" })


export class CrmPayLog extends BaseHandler {
    //1.查看支付列表
    public static async PayList(query: any, ctx: any): Promise<any> {
        const { start, length, draw, type } = query

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isAdmin())
            return super.NotAcceptable("没有权限")

        validateCgi({ start, length, type }, PayLogValidator.PayList)

        let check = checkCursorLimit(parseInt(start), parseInt(length))
        if (check)
            return super.BadRequest("参数不合要求")

        let obj = {} as any
        if (type !== "all")
            obj = { type: type }

        let res = await PayLog.getInstance().findAll(obj, start, length)
        let payList = res.rows.map(r => r.get())

        payList.forEach(r => {
            r.created = gettime.getTimeStr(r.created)
            r.modified = gettime.getTimeStr(r.modified)
        })

        return { payList, recordsFiltered: res.count, draw: parseInt(draw) }
    }

}

//1.查看支付列表
router.loginHandle("get", "/paylist", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmPayLog.PayList((ctx.request as any).query, ctx)))