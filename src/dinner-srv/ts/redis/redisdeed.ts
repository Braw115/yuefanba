import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"
const [MessagesDbOpt] = [{ db: 4 }]


export class DeedRedis {
    public static async getDeed(search: string) {
        let res = await getRedisClientAsync(async rds => await rds.getAsync(search), MessagesDbOpt)
        return res ? JSON.parse(res) : undefined
    }

    public static async saveDeed(search: string, content: string) {
        try {
            await getRedisClientAsync(async rds => await rds.setAsync(search, content, "ex", 24 * 60 * 60 * 3), MessagesDbOpt)
        } catch (e) {
            logger.error("saveDeed error", e.message)
        }
    }

    public static async removeDeed(search: string) {
        try {
            await getRedisClientAsync(async rds => await rds.delAsync(search), MessagesDbOpt)
        } catch (e) {
            logger.error("removeDeed error", e.message)
        }
    }
}

