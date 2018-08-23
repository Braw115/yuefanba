import { RouterWrap } from "../../lib/routerwrap"
import { CrmLogValidator } from "./validator"
import { CrmLog } from "../../model/crm/crmlog"
import { validateCgi } from "../../lib/validator"
import { BaseHandler } from "../lib/basehandler"
import { checkCursorLimit, getLog } from "../../lib/utils"
import * as gettime from "../../lib/gettime"
export const router = new RouterWrap({ prefix: "/crmlog" })

export class CrmLOG extends BaseHandler {
    //1.获取管理员操作日志
    public static async  getCrmLOg(args: any): Promise<any> {
        let { start, length, draw, starttime, endtime } = args
        validateCgi({ start, length }, CrmLogValidator.getCrmLOg)

        let check = checkCursorLimit(parseInt(start), parseInt(length))
        if (check)
            return super.BadRequest("参数不合要求")

        let crmlog
        let obj
        if (endtime)
            endtime = gettime.getDateStrAdd(endtime)
        if (!starttime && !endtime) {
            obj = {}
        } else if (!starttime && endtime) {
            obj = { created: { $lt: endtime } }
        } else if (starttime && !endtime) {
            obj = { created: { $gt: starttime } }
        } else {
            obj = { created: { $lt: endtime }, $and: { created: { $gt: starttime } } }
        }

        let res = await CrmLog.getInstance().findAll(obj, parseInt(start), parseInt(length))
        crmlog = res.rows.map(r => r.get())

        crmlog.forEach(r => {
            r.created = gettime.getTimeStr(r.created)
        })

        return { crmlog, recordsFiltered: res.count, draw: parseInt(draw) }
    }

    //2.获取错误日志
    public static async getLog(args: any): Promise<any> {
        let res = await getLog()
        return res.log
    }

}

//1.获取管理员操作日志
router.handle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmLOG.getCrmLOg((ctx.request as any).query)))

//2.获取错误日志
router.handle("get", "/error", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CrmLOG.getLog((ctx.request as any).query)))