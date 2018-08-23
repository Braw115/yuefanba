import { Comments } from "../../model/users/comments"
import { Order } from "../../model/users/order"
import { RouterWrap } from "../../lib/routerwrap"
import { BaseHandler } from "../lib/basehandler"
export const router = new RouterWrap({ prefix: "/crmcomments" })

export class CommentsOnCrm extends BaseHandler {
    //添加评论
    public static async add(body: any, ctx: any): Promise<any> {
        let { orderuuid, useruuid,evaluator,content, level } = body
        let order = await Order.getInstance().findByPrimary(orderuuid)
        if (!order) return super.NotFound("没有找到该订单！")
        let obj = { useruuid, content, level, evaluator, orderuuid }
        let comment = await Comments.getInstance().insert(obj)
        if (!comment) return super.InternalServerError("评论失败！")
        return { "msg": "评论成功" }
    }
    
    //查询评论列表
    public static async getComments(query: any): Promise<any> {
        const { start, length} = query
        let result = await Comments.getInstance().findAll(parseInt(start), parseInt(length))
        return result

    }
    
    //删除评论
    public static async delete(args: any, ctx: any): Promise<any> {
        let { uuid } = args
        let res = Comments.getInstance().delete(uuid)
        if(res)
            return {msg:"删除成功!"} 
        return {msg:"删除失败!"}
        
    }
   
}


//获取用户的评论列表
router.loginHandle("get", "/getcomments", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CommentsOnCrm.getComments((ctx.request as any).query)))

//添加评论
router.loginHandle("post", "/add", async (ctx, next) =>
BaseHandler.handlerResult(ctx, await CommentsOnCrm.add((ctx.request as any).body, ctx)))

//删除评论
router.loginHandle("post", "/del", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await CommentsOnCrm.delete((ctx.request as any).body, ctx)))