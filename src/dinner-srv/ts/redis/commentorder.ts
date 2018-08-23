import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"
const [MessagesDbOpt] = [{ db: 11 }]

export async function getPurview(key: string) {
    return await getRedisClientAsync(async rds => await rds.getAsync(key), MessagesDbOpt)
}

export async function savePurview(key: string, content: string) {
    try {
        await getRedisClientAsync(async rds => await rds.setAsync(key, content, "ex", 691200), MessagesDbOpt)
    } catch (e) {
        logger.error("save Purview error", e.message)
    }
}

export async function removePurview(key: string) {
    try {
        await getRedisClientAsync(async rds => await rds.delAsync(key), MessagesDbOpt)
    } catch (e) {
        logger.error("remove Purview error", e.message)
    }
}