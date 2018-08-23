import { validateCgi } from "../../lib/validator"
import { AppealValidator } from "./validator"
import { Appeal } from "../../model/users/appeal"
import { Order } from "../../model/users/order"
import { RouterWrap } from "../../lib/routerwrap"
import { BaseHandler } from "../lib/basehandler"
import { LoginInfoAtApp } from "../../redis/logindao"
export const router = new RouterWrap({ prefix: "/app/appeal" })

export class AppealOnApp extends BaseHandler {
    //添加申诉
    public static async add(body: any, ctx: any): Promise<any> {
        const { orderuuid, content } = body
        validateCgi({ orderuuid, content }, AppealValidator.add)

        const info: LoginInfoAtApp = super.getLoginInfo(ctx)

        let appealeduuid
        let order = await Order.getInstance().findByPrimary(orderuuid)
        let [useruuid1, useruuid2] = [order.useruuid1, order.useruuid2]
        if (useruuid1 === info.getUuid()) {
            appealeduuid = useruuid2
        } else {
            appealeduuid = useruuid1
        }

        let obj = { useruuid: info.getUuid(), orderuuid, content, appealeduuid } as any

        let isInsertOk = await Appeal.getInstance().insert(obj)
        if (!isInsertOk) return super.InternalServerError("插入申诉内容失败")

        return { "msg": "ok" }
    }

}

//添加申诉
router.loginHandleAtApp("post", "/add", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppealOnApp.add((ctx.request as any).body, ctx)))