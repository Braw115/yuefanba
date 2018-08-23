import * as winston from "winston"
import { Order } from "../../model/users/order"
import { Deed } from "../../model/users/deed"
import { System } from "../../model/crm/system"
import { PayLog } from "../../model/users/paylog"
import { Users } from "../../model/users/users"
const ORDER_TIME_INTERVAL = 60
const ORDER_FETCH_INTERVAL = ORDER_TIME_INTERVAL * 1000 * 60

export async function init(map: { deamonNotifyMap: Map<string, Function>, deamonGetMap: Map<string, Function> }) {
    CheckOrderIsTimeout.getInstance().run()
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

class CheckOrderIsTimeout {
    private static instance = new CheckOrderIsTimeout()
    private constructor() { }
    public static getInstance() {
        return CheckOrderIsTimeout.instance
    }

    private async orderIsTimeout(): Promise<any> {
        let onStateList = await Order.getInstance().findByObj({ state: "on" })
        if (onStateList.length === 0) return { "msg": "无进行中订单" }

        let orderstimeout = await System.getInstance().findOne('orderstimeout')
        let timeout = parseInt(orderstimeout.value.timeout)
        timeout = timeout * 3600000

        let deposit = await System.getInstance().findOne('deposit')
        deposit = parseInt(deposit.value.deposit)

        let OrderisTimeout = new Array()
        for (let index = 0; index < onStateList.length; index++) {
            let r = onStateList[index]

            let starttime = r.starttime
            let endtime = parseInt(starttime[1]) + timeout
            let nowtime = new Date().getTime()

            if (nowtime > endtime) {
                OrderisTimeout.push(r)
            }
        }

        for (let index = 0; index < OrderisTimeout.length; index++) {
            let p = OrderisTimeout[index]
            //查找出来的on状态的过期的订单，要么是单方未评，要么是双方未评的
            //1.把状态改为完成

            await Order.getInstance().update({ state: "off" }, p.uuid)
            let myDeed = await Deed.getInstance().findByPrimary(p.deeduuid1)
            let otherDeed = await Deed.getInstance().findByPrimary(p.deeduuid2)
            let myuuid = myDeed.useruuid
            let otheruuid = otherDeed.useruuid
            let my = await Users.getInstance().findByPrimary(myuuid)
            let other = await Users.getInstance().findByPrimary(otheruuid)
            let orderuuid = p.uuid
            //2.如果为双方未评
            if (p.type === "waitfeedback") {
                //1.双方未评，则把type改为双方未评
                await Order.getInstance().update({ type: "neither" }, p.uuid)
                //2.把双方的契约单的result字段改为：go(双方未评，则默认双方去，双方押金退回)
                await Deed.getInstance().update({ result: "go" }, myDeed.uuid)
                await Deed.getInstance().update({ result: "go" }, otherDeed.uuid)

                if (myDeed.type === "spend") {
                    await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + deposit + myDeed.deposit })
                    let obj1 = { useruuid: otheruuid, type: "makedeed", deeduuid: otherDeed.uuid, coin: myDeed.deposit, description: "订单到期双方未评，赚取赏金吃货币", orderuuid }
                    let obj2 = { useruuid: otheruuid, type: "depositback", deeduuid: otherDeed.uuid, coin: deposit, description: "订单到期双方未评，回退您押金吃货币", orderuuid }
                    await PayLog.getInstance().add(obj1)
                    await PayLog.getInstance().add(obj2)

                } else if (myDeed.type === "make") {
                    await Users.getInstance().updateByUuid(myuuid, { balance: my.balance + deposit + otherDeed.deposit })
                    let obj1 = { useruuid: myuuid, type: "depositback", deeduuid: myDeed.uuid, coin: deposit, description: "订单到期双方未评，回退您押金吃货币", orderuuid }
                    let obj2 = { useruuid: myuuid, type: "makedeed", deeduuid: myDeed.uuid, coin: otherDeed.deposit, description: "订单到期双方未评，赚取赏金吃货币", orderuuid }
                    await PayLog.getInstance().add(obj1)
                    await PayLog.getInstance().add(obj2)
                } else {
                    await Users.getInstance().updateByUuid(myuuid, { balance: my.balance + deposit })
                    await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + deposit })
                    let obj1 = { useruuid: myuuid, type: "depositback", deeduuid: myDeed.uuid, coin: deposit, description: "订单到期双方未评，回退您押金吃货币", orderuuid }
                    let obj2 = { useruuid: otheruuid, type: "depositback", deeduuid: otherDeed.uuid, coin: deposit, description: "订单到期双方未评，回退您押金吃货币", orderuuid }
                    await PayLog.getInstance().add(obj1)
                    await PayLog.getInstance().add(obj2)
                }

            } else if (p.type === "either") {
                //3.如果为单方评论
                if (myDeed.result === "waitfeedback") {
                    await Deed.getInstance().update({ result: "go" }, myDeed.uuid) //默认我应约
                    //对方未评
                    if (otherDeed.result === "go") {
                        //我评对方应约

                        if (myDeed.type === "spend") {

                            await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + deposit + myDeed.deposit })
                            let obj1 = { useruuid: otheruuid, type: "makedeed", deeduuid: otherDeed.uuid, coin: myDeed.deposit, description: "订单到期您未评，对方评您应约，赚取赏金吃货币", orderuuid }
                            let obj2 = { useruuid: otheruuid, type: "depositback", deeduuid: otherDeed.uuid, coin: deposit, description: "订单到期您未评，对方评您应约，回退押金吃货币", orderuuid }
                            await PayLog.getInstance().add(obj1)
                            await PayLog.getInstance().add(obj2)

                        } else if (myDeed.type === "make") {
                            await Users.getInstance().updateByUuid(myuuid, { balance: my.balance + otherDeed.deposit + deposit })
                            let obj1 = { useruuid: myuuid, type: "depositback", deeduuid: myDeed.uuid, coin: deposit, description: "订单到期您评对方应约，对方未评，回退您押金吃货币", orderuuid }
                            let obj2 = { useruuid: myuuid, type: "makedeed", deeduuid: myDeed.uuid, coin: otherDeed.deposit, description: "订单到期您评对方应约，对方未评，赚取赏金吃货币", orderuuid }
                            await PayLog.getInstance().add(obj1)
                            await PayLog.getInstance().add(obj2)
                        } else {
                            await Users.getInstance().updateByUuid(myuuid, { balance: my.balance + deposit })
                            await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + deposit })
                            let obj1 = { useruuid: myuuid, type: "depositback", deeduuid: myDeed.uuid, coin: deposit, description: "订单到期您评对方应约，对方未评，回退您押金吃货币", orderuuid }
                            let obj2 = { useruuid: otheruuid, type: "depositback", deeduuid: otherDeed.uuid, coin: deposit, description: "订单到期您未评对方，对方评您应约，回退您押金吃货币", orderuuid }
                            await PayLog.getInstance().add(obj1)
                            await PayLog.getInstance().add(obj2)
                        }
                    } else {
                        //我评对方未应约
                        if (myDeed.type === "spend") {
                            await Users.getInstance().updateByUuid(myuuid, { balance: my.balance + myDeed.deposit })
                            let obj1 = { useruuid: myuuid, type: "backdeed", deeduuid: myDeed.uuid, coin: myDeed.deposit, description: "订单到期您评对方未应约，对方未评，回退您赏金吃货币", orderuuid }
                            await PayLog.getInstance().add(obj1)

                        } else if (myDeed.type === "make") {
                            await Users.getInstance().updateByUuid(myuuid, { balance: my.balance + deposit + otherDeed.deposit })
                            let obj1 = { useruuid: myuuid, type: "depositback", deeduuid: myDeed.uuid, coin: deposit, description: "订单到期您评对方未应约，对方未评，回退您押金吃货币", orderuuid }
                            let obj2 = { useruuid: myuuid, type: "makedeed", deeduuid: myDeed.uuid, coin: otherDeed.deposit, description: "订单到期您评对方未应约，对方未评，赚取赏金吃货币", orderuuid }
                            await PayLog.getInstance().add(obj1)
                            await PayLog.getInstance().add(obj2)
                        } else {
                            await Users.getInstance().updateByUuid(myuuid, { balance: my.balance + deposit })
                            let obj1 = { useruuid: myuuid, type: "depositback", deeduuid: myDeed.uuid, coin: deposit, description: "订单到期您评对方未应约，对方未评，回退您押金吃货币", orderuuid }
                            await PayLog.getInstance().add(obj1)

                        }
                    }
                } else {
                    //我未评
                    await Deed.getInstance().update({ result: "go" }, otherDeed.uuid) //默认我应约
                    if (myDeed.result === "go") {
                        //对方评我应约
                        if (myDeed.type === "spend") {
                            await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + deposit + myDeed.deposit })
                            let obj1 = { useruuid: otheruuid, type: "depositback", deeduuid: otherDeed.uuid, coin: deposit, description: "订单到期您评对方应约，对方未评，回退您押金吃货币", orderuuid }
                            let obj2 = { useruuid: otheruuid, type: "makedeed", deeduuid: otherDeed.uuid, coin: myDeed.deposit, description: "订单到期您评对方应约，对方未评，赚取吃货币", orderuuid }
                            await PayLog.getInstance().add(obj1)
                            await PayLog.getInstance().add(obj2)

                        } else if (myDeed.type === "make") {
                            await Users.getInstance().updateByUuid(myuuid, { balance: my.balance + deposit + otherDeed.deposit })
                            let obj1 = { useruuid: myuuid, type: "depositback", deeduuid: myDeed.uuid, coin: deposit, description: "订单到期您评未评，对方您已应约，回退您押金吃货币", orderuuid }
                            let obj2 = { useruuid: myuuid, type: "makedeed", deeduuid: otherDeed.uuid, coin: otherDeed.deposit, description: "订单到期您评未评，对方您已应约，赚取赏金吃货币", orderuuid }
                            await PayLog.getInstance().add(obj1)
                            await PayLog.getInstance().add(obj2)
                        } else {
                            await Users.getInstance().updateByUuid(myuuid, { balance: my.balance + deposit })
                            await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + deposit })
                            let obj1 = { useruuid: myuuid, type: "depositback", deeduuid: myDeed.uuid, coin: deposit, description: "订单到期您评未评，对方您已应约，回退您押金吃货币", orderuuid }
                            let obj2 = { useruuid: otheruuid, type: "depositback", deeduuid: otherDeed.uuid, coin: deposit, description: "订单到期您评对方应约，对方未评，回退您押金吃货币", orderuuid }
                            await PayLog.getInstance().add(obj1)
                            await PayLog.getInstance().add(obj2)
                        }

                    } else {
                        //对方评我未应约
                        if (myDeed.type === "spend") {
                            await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + myDeed.deposit + deposit })
                            let obj1 = { useruuid: otheruuid, type: "depositback", deeduuid: otherDeed.uuid, coin: deposit, description: "订单到期您评对方未应约，对方未评，回退您押金吃货币", orderuuid }
                            let obj2 = { useruuid: otheruuid, type: "makedeed", deeduuid: otherDeed.uuid, coin: myDeed.deposit, description: "订单到期您评对方未应约，对方未评，赚取赏金吃货币", orderuuid }
                            await PayLog.getInstance().add(obj1)
                            await PayLog.getInstance().add(obj2)

                        } else if (myDeed.type === "make") {
                            await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + otherDeed.deposit })
                            let obj1 = { useruuid: otheruuid, type: "backdeed", deeduuid: otherDeed.uuid, coin: otherDeed.deposit, description: "订单到期您评对方未应约，对方未评，回退您赏金吃货币", orderuuid }
                            await PayLog.getInstance().add(obj1)

                        } else {
                            await Users.getInstance().updateByUuid(otheruuid, { balance: other.balance + deposit })
                            let obj2 = { useruuid: otheruuid, type: "depositback", deeduuid: otherDeed.uuid, coin: deposit, description: "订单到期您评对方未应约，对方未评，回退您押金吃货币", orderuuid }
                            await PayLog.getInstance().add(obj2)

                        }
                    }
                }
            }
        }

        return { "msg": "检测订单是否过期完毕" }

    }

    public async run() {
        while (true) {
            await sleep(ORDER_FETCH_INTERVAL)
            try {

                await this.orderIsTimeout()

            } catch (e) {
                winston.error(`check order is timeout manager fail. ${e.message}`)
            }
        }
    }
}

