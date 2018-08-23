import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"
const [MessagesDbOpt] = [{ db: 6 }]

export async function getAccessToken(token: string) {
    return await getRedisClientAsync(async rds => await rds.getAsync(token), MessagesDbOpt)
}

export async function saveAccessToken(token: string, content: string) {
    try {
        await getRedisClientAsync(async rds => await rds.setAsync(token, content, "ex", 60 * 60 * 1.5), MessagesDbOpt)
    } catch (e) {
        logger.error("saveWeather error", e.message)
    }
}

export async function removeAccessToken(token: string) {
    try {
        await getRedisClientAsync(async rds => await rds.delAsync(token), MessagesDbOpt)
    } catch (e) {
        logger.error("removeWeather error", e.message)
    }
}