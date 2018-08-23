import { stat } from "fs"
import { join } from "path"
import * as assert from "assert"
import * as logger from "winston"
import { promisify } from "bluebird"
import { Sequelize } from "sequelize"

const statAsync = promisify(stat)

export async function init(seqz: Sequelize) {
    let paths: string[] = [
        "./users/users",
        "./crm/crmlog",
        "./crm/system",
        "./users/order",
        "./users/banner",
        "./users/paylog",
        "./users/deed",
        "./users/wxtrade",
        "./users/notice",
        "./users/paylog",
        "./users/paylog",
        "./users/comments",
        "./users/chatrecode",
        "./users/favorite",
        "./users/appeal"
    ]


    await Promise.all(paths.map(path => statAsync(join(__dirname, path) + ".js")))
    paths.forEach(path => {
        let m = require(path)
        assert(m.defineFunction, `miss defineFunction in file ${path}`)
        seqz.import(path, m.defineFunction)
    })

    logger.info("initModel ok")
}