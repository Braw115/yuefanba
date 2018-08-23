import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"
const [MessagesDbOpt] = [{ db: 7 }]


export class ChatRedis {
    public static async getChat(search: string) {
        let res = await getRedisClientAsync(async rds => await rds.getAsync(search), MessagesDbOpt)
        return res ? JSON.parse(res) : undefined
    }

    public static async saveChat(search: string, content: string) {
        try {
            await getRedisClientAsync(async rds => await rds.setAsync(search, content, "ex", 24 * 60 * 60 * 3), MessagesDbOpt)
        } catch (e) {
            logger.error("saveChaterror", e.message)
        }
    }

    public static async removeChat(search: string) {
        try {
            await getRedisClientAsync(async rds => await rds.delAsync(search), MessagesDbOpt)
        } catch (e) {
            logger.error("removeChat error", e.message)
        }
    }
}

