import { System } from "../../model/crm/system"
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { systemValidate } from "./validator"
import { BaseHandler } from "../lib/basehandler"
export const router = new RouterWrap({ prefix: "/systeam" })

export class SystemOnCrm extends BaseHandler {
    //1.增加或者更新一个设置
    public static async addupdate(args: any): Promise<any> {
        let { key, value } = args
        if (value)
            value = JSON.parse(value)
        validateCgi({ key, value }, systemValidate.addupdate)

        return await System.getInstance().updateOne(key, value)
    }

    //2.查看全部系统设置
    public static async getall(): Promise<any> {
        return await System.getInstance().findAll()
    }
}

//增加或者更新一个设置
router.loginHandle("post", "/new", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await SystemOnCrm.addupdate((ctx.request as any).body)))

//查看全部系统设置
router.loginHandle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await SystemOnCrm.getall()))
