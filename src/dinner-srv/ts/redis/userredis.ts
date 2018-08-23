import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"
const [MessagesDbOpt] = [{ db: 6 }]


export class UsersRedis {
    public static async getUsers(search: string) {
        let res = await getRedisClientAsync(async rds => await rds.getAsync(search), MessagesDbOpt)
        return res ? JSON.parse(res) : undefined
    }

    public static async saveUsers(search: string, content: string) {
        try {
            await getRedisClientAsync(async rds => await rds.setAsync(search, content, "ex", 24 * 60 * 60 * 3), MessagesDbOpt)
        } catch (e) {
            logger.error("saveUsers error", e.message)
        }
    }

    public static async removeUsers(search: string) {
        try {
            await getRedisClientAsync(async rds => await rds.delAsync(search), MessagesDbOpt)
        } catch (e) {
            logger.error("removeUsers error", e.message)
        }
    }
}

