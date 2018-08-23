import { BaseHandler } from "./basehandler"
import { LoginInfo } from "../../redis/logindao"
import { Users } from "../../model/users/users"

export class CrmlogInfo extends BaseHandler {
    public static async getCrmlogInfo(ctx: any): Promise<any> {
        const info: LoginInfo = BaseHandler.getLoginInfo(ctx)
        let crmuserUuid = info.getUuid()
        let crmuser = await Users.getInstance().findByPrimary(crmuserUuid)
        // let ip = ctx.ip
        // ip = ip.substring(7, 20)
        let ip = ctx.req.headers["x-forwarded-for"]
        // const ip = ctx.req.headers["x-real-ip"]      //局域网ip地址
        return { crmuserUuid, crmuser, ip }
    }
}