import * as winston from "winston"
import { Deed } from "../../model/users/deed"
import { Users } from "../../model/users/users"
import { System } from "../../model/crm/system"
import { PayLog } from "../../model/users/paylog"
const DEED_TIME_INTERVAL = 300
const DEED_FETCH_INTERVAL = DEED_TIME_INTERVAL * 1000 * 60

export async function init(map: { deamonNotifyMap: Map<string, Function>, deamonGetMap: Map<string, Function> }) {
    CheckDeedIsTimeout.getInstance().run()
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

class CheckDeedIsTimeout {
    private static instance = new CheckDeedIsTimeout()
    private constructor() { }
    public static getInstance() {
        return CheckDeedIsTimeout.instance
    }

    private async deedIsTimeout(): Promise<any> {
        let deposit = await System.getInstance().findOne('deposit')
        deposit = parseInt(deposit.value.deposit)

        let notTimeoutList = await Deed.getInstance().findByObj({ istimeout: "false", state: "false", del: "false" })
        if (notTimeoutList.length === 0) return { "msg": "无未过期且未匹配契约单" }

        for (let index = 0; index < notTimeoutList.length; index++) {
            let r = notTimeoutList[index];

            let user = await Users.getInstance().findByPrimary(r.useruuid)
            let payType
            let description
            if (r.type === "spend") {
                deposit = r.deposit
                payType = "backdeed"
                description = "赏金"
            } else if (r.type === "make") {
                payType = "depositback"
                description = "押金"
            } else {
                payType = "depositback"
                description = "押金"
            }

            let mealtime = r.mealtime
            let deedtime = parseInt(mealtime[1])
            let nowtime = new Date().getTime()
            if (nowtime > deedtime) {
                await Deed.getInstance().update({ istimeout: "true" }, r.uuid)
                //退还吃货币
                await Users.getInstance().updateByUuid(r.useruuid, { balance: user.balance + deposit })
                let paylogObj = { useruuid: r.useruuid, type: payType, deeduuid: r.uuid, coin: deposit, description: `契约单过期未匹配，回退相应的${description}` }
                await PayLog.getInstance().add(paylogObj)

            }
        }

        return { "msg": "检测契约单是否过期完毕" }
    }

    public async run() {
        while (true) {
            await sleep(DEED_FETCH_INTERVAL)
            try {

                await this.deedIsTimeout()

            } catch (e) {
                winston.error(`check deed is timeout manager fail. ${e.message}`)
            }
        }
    }
}

