import * as winston from "winston"
import { getAsync, postAsync } from "../lib/request"
import { wxnews } from "../config/wxnews"
import { getAccessToken, saveAccessToken } from "../redis/wxnews"
import { RefuseUsersRedis } from "../redis/refuseuser"

export async function getToken() {
    let opt = {
        url: `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${wxnews.appid}&secret=${wxnews.secret}`
    }
    let res = await getAsync(opt)
    res = JSON.parse(res)
    if (res.access_token)
        return res.access_token
    throw winston.error(`smssend fail. ${res.errmsg}`)
}

export async function sendWxNews(args: any) {
    let { openid, formid, type, starttime, restaurant, address, orderuuid } = args
    let access_token = await getAccessToken("access_token")
    if (!access_token) {
        access_token = await getToken()
        await saveAccessToken("access_token", access_token)
    }
    if (!starttime || starttime === "null")
        starttime = ''
    if (!restaurant)
        restaurant = ''
    if (!address)
        address = ''

    let obj = {
        touser: openid,
        template_id: wxnews.template_id,
        form_id: formid,
        page: `pages/order-detail/order-detail?uuid=${orderuuid}`,
        data: {
            keyword1: {
                value: type,
                color: "#173177"
            },
            keyword2: {
                value: starttime,
                color: "#173177"
            },
            keyword3: {
                value: restaurant,
                color: "#173177"
            },
            keyword4: {
                value: address,
                color: "#173177"
            }
        }
    }
    let opt1 = {
        url: `https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=${access_token}`,
        form: JSON.stringify(obj)
    }
    let res1
    if (openid)
        res1 = await postAsync(opt1)

    return res1
}

export async function  refuseDeed(uuid: string, deeduuid: string) {
    let refuse = await RefuseUsersRedis.getRefuseUsers(uuid)
    let refu = new Array()
    if (refuse) {
        refu = refuse
        refu.push(deeduuid)
        await RefuseUsersRedis.saveRefuseUsers(uuid, JSON.stringify(refu))
    } else {
        refu.push(deeduuid)
        await RefuseUsersRedis.saveRefuseUsers(uuid, JSON.stringify(refu))
    }
}