import { RouterWrap } from "../../lib/routerwrap"
import { BaseHandler } from "../lib/basehandler"
import { Users } from "../../model/users/users"
export const router = new RouterWrap({ prefix: "/crm/gao" })

export class crmGao extends BaseHandler {
    public static async gao(query: any): Promise<any> {
        //查询人员
        let obj = null
        let UserList = await Users.getInstance().findeGaoPractice(obj);
        return UserList
    }
    //新增一条数据
    public static async add(obj: any) {
        let users = await Users.getInstance().addUser(obj.query);
        return users;
    }
    //修改数据
    public static async update(obj: any) {
        let users = await Users.getInstance().updateUser(obj.query.uuid, obj.query);
        return users;
    }
    //删除数据
    public static async delete(obj: any) {
        await Users.getInstance().deleteUser(obj.query.uuid)
    }
}
router.handle("get", "/crmGao", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await crmGao.gao(ctx)))

router.handle("post", "/crmAdd", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await crmGao.add(ctx)))

router.handle("post", "/crmUpdate", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await crmGao.update(ctx)))

router.handle("post", "/crmDelete", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await crmGao.delete(ctx)))