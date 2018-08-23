import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"
const [MessagesDbOpt] = [{ db: 1 }]
const [SendMessagesDbOpt] = [{ db: 3 }]

export class SmsCode {
    public static async getSmsCode(username: string) {
        return await getRedisClientAsync(async rds => await rds.getAsync(username), MessagesDbOpt)
    }

    public static async saveSmsCode(username: string, content: string) {
        try {
            await getRedisClientAsync(async rds => await rds.setAsync(username, content, "ex", 600), MessagesDbOpt)
        } catch (e) {
            logger.error("saveSmsCode error", e.message)
        }
    }

    public static async removeSmsCode(username: string) {
        try {
            await getRedisClientAsync(async rds => await rds.delAsync(username), MessagesDbOpt)
        } catch (e) {
            logger.error("removeSmsCode error", e.message)
        }
    }
}


export class SendSms {
    public static async getSendSms(uuid: string) {
        return await getRedisClientAsync(async rds => await rds.getAsync(uuid), SendMessagesDbOpt)
    }

    public static async saveSendSms(uuid: string, content: number) {
        try {
            await getRedisClientAsync(async rds => await rds.setAsync(uuid, content, "ex", 60 * 60 * 24 * 100), SendMessagesDbOpt)
        } catch (e) {
            logger.error("saveSmsCode error", e.message)
        }
    }

    public static async removeSendSms(uuid: string) {
        try {
            await getRedisClientAsync(async rds => await rds.delAsync(uuid), SendMessagesDbOpt)
        } catch (e) {
            logger.error("removeSmsCode error", e.message)
        }
    }
}

