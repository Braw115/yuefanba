import { createHash } from "crypto"
import { smsOpt/* , smsRemandOpt */ } from "../config/sms"
import { System } from "../model/crm/system"
import { postAsync } from "../lib/request"
import { randomInt } from "./utils"

export async function sendSms(mobile: string) {
    let curTime = Math.round(new Date().getTime() / 1000).toString()
    let nonce = randomInt(100000, 999999)

    let sys = await System.getInstance().findOne("remind")
    if (!sys) {
        return { "msg": "没有该设置" }
    }
    let remind = sys.value
    let app_secret = remind.secret
    let appKey = remind.appkey
    let templateid = remind.templateid

    let str = `${app_secret}${nonce}${curTime}`
    let checkSum = createHash('sha1').update(str).digest("hex")

    let options = {
        url: smsOpt.url,
        headers: {
            'Content-Type': "application/x-www-form-urlencoded",
            'AppKey': appKey,
            'CurTime': curTime,
            'CheckSum': checkSum,
            "Nonce": nonce
        },
        form: {
            mobile: mobile,
            templateid: templateid,
        }
    }

    return await postAsync(options)
}

// export async function sendRemand(mobile: string) {
//     let curTime = Math.round(new Date().getTime() / 1000).toString()
//     let nonce = randomInt(100000, 999999)
//     let sys = await Systeam.getInstance().findOne("remind")
//     if (!sys) {
//         return { "msg": "没有该设置" }
//     }
//     let remind = sys.value
//     let app_secret = remind.secret
//     let appKey = remind.appkey
//     let templateid = remind.timeouttemplateid

//     let str = `${app_secret}${nonce}${curTime}`
//     let checkSum = createHash('sha1').update(str).digest("hex")
//     let options = {
//         url: smsRemandOpt.url,
//         headers: {
//             'Content-Type': "application/x-www-form-urlencoded",
//             'AppKey': appKey,
//             'CurTime': curTime,
//             'CheckSum': checkSum,
//             "Nonce": nonce,
//             "charset": "utf-8",
//         },
//         form: {
//             mobiles: '[' + mobile + ']',
//             templateid: templateid,
//             params: '[' + mobile + ']'
//         }
//     }

//     return await postAsync(options)
// }

// export async function sendError(mobile: string, cabinet: string, reason: string) {
//     let curTime = Math.round(new Date().getTime() / 1000).toString()
//     let nonce = randomInt(100000, 999999)
//     let sys = await Systeam.getInstance().findOne("remind")
//     if (!sys) {
//         return { "msg": "没有该设置" }
//     }
//     let remind = sys.value
//     let app_secret = remind.secret
//     let appKey = remind.appkey
//     let templateid = remind.errortemplateid

//     let str = `${app_secret}${nonce}${curTime}`
//     let checkSum = createHash('sha1').update(str).digest("hex")

//     let options = {
//         url: smsRemandOpt.url,
//         headers: {
//             'Content-Type': "application/x-www-form-urlencoded",
//             'AppKey': appKey,
//             'CurTime': curTime,
//             'CheckSum': checkSum,
//             "Nonce": nonce,
//             "charset": "utf-8",
//         },
//         form: {
//             mobiles: JSON.stringify([mobile]),
//             templateid: templateid,
//             params: JSON.stringify([mobile, cabinet, reason])
//         }
//     }

//     return await postAsync(options)
// }