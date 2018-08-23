import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"
const [MessagesDbOpt] = [{ db: 5 }]


export class RestaurantRedis {
    public static async getRestaurant(search: string) {
        let res = await getRedisClientAsync(async rds => await rds.getAsync(search), MessagesDbOpt)
        return res ? res : undefined
    }

    public static async saveRestaurant(search: string, content: string) {
        try {
            await getRedisClientAsync(async rds => await rds.setAsync(search, content, "ex", 24 * 60 * 60 * 3), MessagesDbOpt)
        } catch (e) {
            logger.error("saveRestaurant error", e.message)
        }
    }

    public static async removeRestaurant(search: string) {
        try {
            await getRedisClientAsync(async rds => await rds.delAsync(search), MessagesDbOpt)
        } catch (e) {
            logger.error("removeRestaurant error", e.message)
        }
    }
}

