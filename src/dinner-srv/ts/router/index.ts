import * as koa from "koa"
import { stat } from "fs"
import { join } from "path"
import winston = require("winston")
import { promisify } from "bluebird"

export async function initRouter(app: koa) {
    const statAsync = promisify(stat)

    let paths: string[] = [
        "./app/users",
        "./app/banner",
        "./app/deed",
        "./app/notice",
        "./app/order",
        "./app/restaurant",
        "./app/wxpay",
        "./crm/users",
        "./crm/order",
        "./crm/banner",
        "./crm/system",
        "./crm/paylog",
        "./crm/crmlog",
        "./crm/deed",
        "./crm/restaurant",
        "./app/banner",
        "./app/comments",
        "./app/chatrecode",
        "./app/appeal",
        "./crm/appeal",
        "./app/paylog",
        "./crm/gao",
        "./crm/comments"
    ]

    await Promise.all(paths.map(path => statAsync(join(__dirname, path) + ".js")))
    paths.forEach(path => app.use(require(path).router.routes()))
    winston.info("initRouter ok")
}
