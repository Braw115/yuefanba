import { validateCgi } from "../../lib/validator"
import { AppealValidator } from "./validator"
import { Appeal } from "../../model/users/appeal"
import { RouterWrap } from "../../lib/routerwrap"
import { BaseHandler } from "../lib/basehandler"
import { LoginInfo } from "../../redis/logindao"
import * as gettime from "../../lib/gettime"
export const router = new RouterWrap({ prefix: "/crm/appeal" })

export class AppealOnCrm extends BaseHandler {
    //添加申诉
    public static async list(query: any, ctx: any): Promise<any> {
        const { start, length, draw } = query
        validateCgi({ start, length }, AppealValidator.list)

        const info: LoginInfo = super.getLoginInfo(ctx)
        if (!info.isAdmin()) return super.NotAcceptable("没有权限")

        let res = await Appeal.getInstance().getList(parseInt(start), parseInt(length))
        let appealList = res.rows.map(r => r)

        for (let index = 0; index < appealList.length; index++) {
            let r = appealList[index]
            r.created = gettime.getTimeStr(r.created)
            r.modified = gettime.getTimeStr(r.modified)
        }

        return { appealList, recordsFiltered: parseInt(res.count[0].count), draw: parseInt(draw) }
    }

}

//添加申诉
router.loginHandle("get", "/list", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppealOnCrm.list((ctx.request as any).query, ctx)))