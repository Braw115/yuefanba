import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"
const [MessagesDbOpt] = [{ db: 9 }]

export async function getFormids(openid: string) {
    return await getRedisClientAsync(async rds => await rds.getAsync(openid), MessagesDbOpt)
}

export async function saveFormids(openid: string, content: string) {
    try {
        await getRedisClientAsync(async rds => await rds.setAsync(openid, content, "ex", 86400), MessagesDbOpt)
    } catch (e) {
        logger.error("saveWeather error", e.message)
    }
}

export async function removeFormids(openid: string) {
    try {
        await getRedisClientAsync(async rds => await rds.delAsync(openid), MessagesDbOpt)
    } catch (e) {
        logger.error("removeWeather error", e.message)
    }
}