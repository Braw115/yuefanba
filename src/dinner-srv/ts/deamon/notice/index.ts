import * as winston from "winston"
import { Order } from "../../model/users/order"
import { Deed } from "../../model/users/deed"
import { System } from "../../model/crm/system"
import { Notice } from "../../model/users/notice";
const NOTICE_INTERVAL = 10
const NOTICE_FETCH_INTERVAL = NOTICE_INTERVAL * 1000 * 60

export async function init(map: { deamonNotifyMap: Map<string, Function>, deamonGetMap: Map<string, Function> }) {
    CheckNotice.getInstance().run()
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

class CheckNotice {
    private static instance = new CheckNotice()
    private constructor() { }
    public static getInstance() {
        return CheckNotice.instance
    }

    private async noticeRemind(): Promise<any> {
        let onStateList = await Order.getInstance().findByObj({ state: "on" })
        if (onStateList.length === 0) return { "msg": "无进行中订单" }

        let orderstimeout = await System.getInstance().findOne('orderstimeout')
        let timeout = parseInt(orderstimeout.value.timeout)
        timeout = timeout * 86400000

        let deposit = await System.getInstance().findOne('deposit')
        deposit = parseInt(deposit.value.deposit)

        let orderIsWaitBack = new Array()
        for (let index = 0; index < onStateList.length; index++) {
            let r = onStateList[index]

            let starttime = r.starttime
            let nowtime = new Date().getTime()
            let end = parseInt(starttime[0]) + NOTICE_FETCH_INTERVAL
            let start = parseInt(starttime[0])

            if (nowtime < end && nowtime > start)
                orderIsWaitBack.push(r)
        }

        for (let i = 0; i < orderIsWaitBack.length; i++) {
            let oredrOne = orderIsWaitBack[i]
            //查找出来的on状态的过期的订单，要么是单方未评，要么是双方未评的
            //1.把状态改为完成
            let myDeed = await Deed.getInstance().findByPrimary(oredrOne.deeduuid1)
            let otherDeed = await Deed.getInstance().findByPrimary(oredrOne.deeduuid2)
            let notice = await Notice.getInstance().findBy({ $or: [{ fromdeeduuid: oredrOne.deeduuid2 }, { todeeduuid: oredrOne.deeduuid2 }] })
            if (notice.length > 0) {
                let obj = { reason: "您的约饭时间已到，请及时到【我的饭单】中进行确认", type: "audit", state: true } as any
                if (myDeed.result === "waitfeedback") {
                    obj.useruuid = otherDeed.useruuid
                    obj.fromdeeduuid = notice[0].fromdeeduuid
                    obj.todeeduuid = notice[0].todeeduuid
                    obj.orderuuid = notice[0].orderuuid
                    await Notice.getInstance().add(obj)
                }
                if (otherDeed.result === "waitfeedback") {
                    obj.useruuid = myDeed.useruuid
                    obj.fromdeeduuid = notice[0].fromdeeduuid
                    obj.todeeduuid = notice[0].todeeduuid
                    obj.orderuuid = notice[0].orderuuid
                    await Notice.getInstance().add(obj)
                }
            }
        }
    }

    public async run() {
        while (true) {
            await sleep(NOTICE_FETCH_INTERVAL)
            try {

                await this.noticeRemind()

            } catch (e) {
                winston.error(`notice remind manager fail. ${e.message}`)
            }
        }
    }
}

