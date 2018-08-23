import { validateCgi } from "../../lib/validator"
import { RouterWrap } from "../../lib/routerwrap"
import { wxPaymentOpt } from "../../config/wxpay"
import { genPrePayUnifiedOrderh5, getWebParamh5, validateNotify, genPrePayUnifiedBusiness } from "../../lib/wxpay"
import { Users } from "../../model/users/users"
import { WxpayValidator } from "./validator"
import { PayLog } from "../../model/users/paylog"
import { BaseHandler } from "../lib/basehandler"
import { LoginInfoAtApp } from "../../redis/logindao"
import { Wxtrade } from "../../model/users/wxtrade"
import { System } from "../../model/crm/system"
export const router = new RouterWrap({ prefix: "/app/wxpay" })

export class WxpayOnCrm extends BaseHandler {

    // 1.读取POST的body
    public static readRawBody(req: any): Promise<string> {
        return new Promise((resove, reject) => {
            let arr = new Array<string>()
            req.on('data', function (chunk: any) {
                arr.push(chunk.toString())
            })

            req.on('end', function (chunk: any) {
                if (chunk) {
                    arr.push(chunk.toString())
                }
                resove(arr.join())
            })

            req.on("error", function (e: any) {
                reject(e)
            })
        })
    }


    //2.充值
    public static async paydeposit(args: any, ctx: any): Promise<any> {
        const { pay } = args
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let useruuid = info.getUuid()

        validateCgi({ pay }, WxpayValidator.payValidator)
        let user = await Users.getInstance().findByPrimary(useruuid)
        // await this.setDepositSucc(useruuid, pay * 100)
        // return { msg: "ok" }
        let wxorder = await genPrePayUnifiedOrderh5({
            body: "invite dinner 充值吃货币",
            total_fee: pay * 100,
            spbill_create_ip: "192.168.0.6",
            trade: "JSAPI",
            openid: user.openid
        }, wxPaymentOpt)

        //插入数据库
        let exist = await Wxtrade.getInstance().findByPrimary(useruuid)
        if (!!exist) {
            await Wxtrade.getInstance().deleteByPrimary(useruuid)
        }
        wxorder["uuid"] = useruuid
        await Wxtrade.getInstance().insertNewTrade(wxorder)

        let timestamp = "" + new Date().getTime()
        let webParam = await getWebParamh5(wxorder.prepay_id, wxPaymentOpt.appid, timestamp, wxPaymentOpt.key, wxPaymentOpt.mch_id)
        return { param: webParam }

    }

    //3.充值回调
    public static async depositnotify(args: any) {
        try {
            let body = await this.readRawBody(args.req)
            //校验
            let obj = await validateNotify(body, wxPaymentOpt)
            // 检查订单是否已经完成
            let out_trade_no = obj.out_trade_no
            let trade = await Wxtrade.getInstance().findByTradeNo(out_trade_no)
            if (trade.state != null) {
                return `<xml> <return_code><![CDATA[SUCCESS]]></return_code> <return_msg><![CDATA[OK]]></return_msg> </xml>`
            }
            //设置订单完成,不等待
            Wxtrade.getInstance().setWxTradeState(out_trade_no, "fin")
            await this.setDepositSucc(trade.uuid, obj.total_fee)
            return `<xml> <return_code><![CDATA[SUCCESS]]></return_code> <return_msg><![CDATA[OK]]></return_msg> </xml>`
        } catch (e) {
            return `<xml> <return_code><![CDATA[FAIL]]></return_code> <return_msg><![CDATA[BAD]]></return_msg> </xml>`
        }
    }

    //4.企业支付,提现
    public static async businessPay(args: any): Promise<any> {
        let { useruuid, pay } = args
        validateCgi({ useruuid, pay }, WxpayValidator.wxpay)
        pay = parseInt(pay)
        let user = await Users.getInstance().findByPrimary(useruuid)
        //TODO systeam 获取最低提取
        let res = await System.getInstance().findOne("pay")
        let proportion = parseInt(res.value.proportion)
        let baseCoin = parseInt(res.value.least)
        if (user.balance < baseCoin * proportion)
            return super.Forbidden("吃货币不够提现最低额度!")
        if (user.balance < pay * proportion)
            return super.Forbidden("吃货币不够!")


        let wxorder = await genPrePayUnifiedBusiness({
            body: "吃货币",
            total_fee: pay * 100,
            spbill_create_ip: "192.168.0.6",
            openid: user.openid
        }, wxPaymentOpt)
        // let wxorder = {
        //     result_code: "SUCCESS",
        //     return_code: "SUCCESS",
        //     return_msg: "error"
        // }

        if (wxorder.result_code == "SUCCESS" && wxorder.return_code == "SUCCESS") {//交易成功,
            user.balance = user.balance - pay * proportion
            await Users.getInstance().updateInformation(useruuid, { balance: user.balance })
            let obj = {
                type: "withdraw",
                useruuid: useruuid,
                openid: user.openid,
                coin: pay
            }
            await PayLog.getInstance().add(obj)
            return { msg: "吃货币提现成功!" }
        } else {
            return super.Forbidden(wxorder.return_msg)
        }
    }

    public static async setDepositSucc(useruuid: any, fee: any) {
        let user = await Users.getInstance().findByPrimary(useruuid)
        // 修改吃货币
        let res = await System.getInstance().findOne("pay")
        let proportion = parseInt(res.value.proportion)
        let adddeposit = fee * proportion / 100
        await Users.getInstance().updateInformation(useruuid, { balance: user.balance + adddeposit })
        let obj = {
            type: "recharge",
            useruuid: useruuid,
            openid: user.openid,
            coin: fee / 100,
        }
        await PayLog.getInstance().add(obj)
    }

    public static async getOption(): Promise<any> {
        let res = await System.getInstance().findOne("pay")
        let option = res.value.recharge
        let proportion = parseInt(res.value.proportion)
        return { option, proportion }
    }
}

//充值回调
router.handle("post", "/depositnotify", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await WxpayOnCrm.depositnotify(ctx)))

//充值
router.loginHandleAtApp("post", "/paydeposit", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await WxpayOnCrm.paydeposit((ctx.request as any).body, ctx)))

//企业支付,提现
router.loginHandleAtApp("post", "/businesspay", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await WxpayOnCrm.businessPay((ctx.request as any).body)))

//获取充值选项
router.handle("get", "/option", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await WxpayOnCrm.getOption()))
