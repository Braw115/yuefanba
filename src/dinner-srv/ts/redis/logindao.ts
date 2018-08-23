import assert = require("assert")
import { ReqError } from "../lib/reqerror"
export class LoginInfo {
    private uuid: string
    private key: string
    private token: string
    private login: string
    private role: string
    private permMap?: any

    constructor(uuid: string, key: string, token: string, login: string, role?: string) {
        [this.uuid, this.key, this.token, this.login] = [uuid, key, token, login]
        if (role) {
            assert(typeof role === "string")
            this.role = role
            this.permMap = { role: role }
        }
    }

    public static valueOf(s: string): LoginInfo {
        assert(typeof s === "string")

        let obj = JSON.parse(s)
        if (!obj)
            throw new ReqError("invalid LoginInfo format")

        let { uuid, key, token, login, role } = obj

        if (role)
            assert(typeof role === "string")

        return new LoginInfo(uuid, key, token, login, role)
    }

    public getUuid() { return this.uuid }
    public getKey() { return this.key }
    public getToken() { return this.token }
    public getLogin() { return this.login }
    public getRole() { return this.role }

    private isCommon(field: string) {
        if (!this.permMap)
            return false
        return !!(this.permMap['role'] === field)
    }

    public isRoot() {
        return this.isCommon("root")
    }

    public isAdmin() {
        return this.isCommon("admin")
    }

    public isController() {
        return this.isCommon("controller")
    }

}

export class LoginInfoAtApp {
    private uuid: string
    private secret: string
    private openid: string


    constructor(uuid: string, secret: string, openid: string) {
        [this.uuid, this.secret, this.openid] = [uuid, secret, openid]
    }

    public static valueOf(s: string): LoginInfoAtApp {
        assert(typeof s === "string")

        let obj = JSON.parse(s)
        if (!obj)
            throw new ReqError("invalid LoginInfoAtApp format")

        let { uuid, secret, openid } = obj

        return new LoginInfoAtApp(uuid, secret, openid)
    }

    public getUuid() { return this.uuid }
    public getSecret() { return this.secret }
    public getOpenid() { return this.openid }
}

import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"


// import { sendError } from "../lib/response"

const [sessionDbOpt, Sessiontimeout] = [{ db: 0 }, 86400]
const [sessionDbOptAtApp] = [{ db: 1 }]

export class RedisLogin {
    public static async setLoginAsync(uuid: string, loginInfo: LoginInfo) {
        const content = JSON.stringify(loginInfo)
        await getRedisClientAsync(async rds => await rds.setAsync(uuid, content, "ex", Sessiontimeout), sessionDbOpt)
    }

    public static async setLoginAsynAtApp(token: string, LoginInfoAtApp: LoginInfoAtApp) {
        const content = JSON.stringify(LoginInfoAtApp)
        await getRedisClientAsync(async rds => await rds.setAsync(token, content, "ex", Sessiontimeout), sessionDbOptAtApp)
    }

    public static async getLoginAsync(uuid: string, token: string): Promise<any> {
        if (!uuid || !token)
            return { error: "没有登录！" }

        let s = await getRedisClientAsync(async rds => await rds.getAsync(uuid), sessionDbOpt)
        if (!s)
            return { error: "没有登录！" }

        let info = LoginInfo.valueOf(s)
        if (token !== info.getToken())
            return { error: "您的账号在其他地方登陆，请重新登陆！" }

        return { info }
    }

    public static async getLoginAsyncAtApp(token: string): Promise<any> {
        if (!token)
            return { error: "没有登录！" }

        let s = await getRedisClientAsync(async rds => await rds.getAsync(token), sessionDbOptAtApp)
        if (!s)
            return { error: "没有登录！" }

        let info = LoginInfoAtApp.valueOf(s)

        return { info }
    }

    public static async delLogin(uuid: string) {
        try {
            await getRedisClientAsync(async rds => rds.delAsync(uuid), sessionDbOpt)
        } catch (e) {
            logger.error("delLogin error", e.message)
        }
    }

    public static async delLoginApp(uuid: string) {
        try {
            await getRedisClientAsync(async rds => rds.delAsync(uuid), sessionDbOptAtApp)
        } catch (e) {
            logger.error("delLogin error", e.message)
        }
    }
}
