import { validateCgi } from "../../lib/validator"
import { CommentsValidator } from "./validator"
import { Comments } from "../../model/users/comments"
import { Users } from "../../model/users/users"
import { Order } from "../../model/users/order"
import { RouterWrap } from "../../lib/routerwrap"
import { BaseHandler } from "../lib/basehandler"
import * as gettime from "../../lib/gettime"
import { LoginInfoAtApp } from "../../redis/logindao"
export const router = new RouterWrap({ prefix: "/appcomments" })

export class CommentsOnApp extends BaseHandler {
    //添加评论
    public static async add(body: any, ctx: any): Promise<any> {
        let { orderuuid, content, level } = body
        validateCgi({ orderuuid, content, level }, CommentsValidator.add)

        const info: LoginInfoAtApp = BaseHandler.getLoginInfo(ctx)
        let evaluator = info.getUuid()
        let useruuid: string

        let order = await Order.getInstance().findByPrimary(orderuuid)
        if (!order) return super.NotFound("没有找到该订单！")

        let [useruuid1, useruuid2] = [order.useruuid1, order.useruuid2]
        if (evaluator === useruuid1) {
            useruuid = useruuid2
        } else {
            useruuid = useruuid1
        }

        let obj = { useruuid, content, level, evaluator, orderuuid }
        let comment = await Comments.getInstance().insert(obj)
        if (!comment) return super.InternalServerError("评论失败！")

        return { "msg": "评论成功" }

    }

    public static async getComments(query: any): Promise<any> {
        const { start, length, useruuid } = query
        validateCgi({ start, length, useruuid }, CommentsValidator.getComments)

        let result = await Users.getInstance().getComments(useruuid, parseInt(start), parseInt(length))
        let commentlist = result.row
        let count = commentlist.length
        let totalrow = result.totalrow
        let total = 0
        let level
        if (totalrow.length > 0) {
            totalrow.forEach(r => {
                total += r.level
            })
            level = (total / (totalrow.length)).toFixed(0)
        } else {
            level = 0
        }
        if (count > 0) {
            commentlist.forEach(r => {
                r.created = gettime.getTimeStr(r.created)
            })
            return { commentlist: commentlist, level: level }
        } else {
            return { commentlist: [], level: level }
        }

    }
}

//添加评论
router.loginHandleAtApp("post", "/add", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CommentsOnApp.add((ctx.request as any).body, ctx)))

//16.获取用户的评论列表
router.loginHandleAtApp("get", "/getcomments", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CommentsOnApp.getComments((ctx.request as any).query)))