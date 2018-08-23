import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"
const [MessagesDbOpt] = [{ db: 10 }]

export async function getLastCreateTime(openid: string) {
    return await getRedisClientAsync(async rds => await rds.getAsync(openid), MessagesDbOpt)
}

export async function saveLastCreateTime(openid: string, content: string) {
    try {
        await getRedisClientAsync(async rds => await rds.setAsync(openid, content, "ex", 86400), MessagesDbOpt)
    } catch (e) {
        logger.error("save CreateTime error", e.message)
    }
}

export async function removeLastCreateTime(openid: string) {
    try {
        await getRedisClientAsync(async rds => await rds.delAsync(openid), MessagesDbOpt)
    } catch (e) {
        logger.error("removeWeather error", e.message)
    }
}