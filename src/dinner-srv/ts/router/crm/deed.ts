import { Deed } from "../../model/users/deed"
import { Users } from "../../model/users/users"
import { System } from "../../model/crm/system"
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { DeedValidator } from "./validator"
import { BaseHandler } from "../lib/basehandler"
import { LoginInfo } from "../../redis/logindao"
import * as gettime from "../../lib/gettime"
export const router = new RouterWrap({ prefix: "/crm/deed" })

export class DeedOnApp extends BaseHandler {
    //1.获取列表
    public static async list(query: any): Promise<any> {
        let { start, length, draw, state, type, result, address, restaurant, } = query
        let search: string = query["search[value]"]
        if (!search)
            search = ""
        validateCgi({ start, length, state, type, result, address, restaurant }, DeedValidator.listDeedValidator)

        let obj = { del: "false" } as any
        if (type !== "all") {
            obj.type = type
        }
        if (result !== "all") {
            obj.result = result
        }

        if (search !== "") {
            obj.$or = [{ address: { $like: '%' + search + '%' } }, { restaurant: { $like: '%' + search + '%' } }]
        }

        let deedList
        if (state !== "all") {
            obj.state = state
            let deeds = await Deed.getInstance().findAllDeed(obj, parseInt(start), parseInt(length))
            let count = await Deed.getInstance().findCountDeed(obj)
            deedList = { deeds, recordsFiltered: count, draw: parseInt(draw) }
        } else {
            let deeds = await Deed.getInstance().findAllDeed(obj, parseInt(start), parseInt(length))
            let count = await Deed.getInstance().findCountDeed(obj)
            deedList = { deeds, recordsFiltered: count, draw: parseInt(draw) }
        }

        deedList.deeds.forEach(r => {
            let mealtime = r.mealtime
            r.mealtime = [gettime.formatToYMDSFM(mealtime[0]), gettime.formatToYMDSFM(mealtime[1])]
            r.created = gettime.getTimeStr(r.created)
            r.modified = gettime.getTimeStr(r.modified)
        })

        return deedList
    }

    //契约单详情
    public static async findByUuid(params: any): Promise<any> {
        const { uuid } = params
        validateCgi({ uuid }, DeedValidator.uuidValidator)

        let deed = await Deed.getInstance().findByPrimary(uuid)
        deed.created = gettime.getTimeStr(deed.created)
        deed.modified = gettime.getTimeStr(deed.modified)
        let mealtime = deed.mealtime
        deed.mealtime = [gettime.formatToYMDSFM(mealtime[0]), gettime.formatToYMDSFM(mealtime[1])]
        return { deed }
    }

    //创建契约单
    public static async createDeed(body: any, ctx: any): Promise<any> {
        let { useruuid, mealtime, gender, latitude, longitude, agerange, payway, type, address, restaurant, posit, getposit } = body
        let obj = { mealtime, latitude, longitude, payway, type, address, restaurant } as any
        let user = await Users.getInstance().findByPrimary(useruuid)
        let point = 'Point(' + latitude + ' ' + longitude + ')'
        obj.useruuid = useruuid
        obj.state = false
        if (!gender) {
            obj.gender = null
        } else {
            obj.gender = parseInt(gender)
        }
        obj.result = "waitfeedback"
        obj.getposit = null
        obj.agerange = agerange
        //obj.mealtime = JSON.parse(mealtime)
        obj.onetoone = false
        if (type === "make") {
            obj.payway = "aa"
            obj.latitude = user.latitude
            obj.longitude = user.longitude
            obj.getposit = getposit + ""
            point = 'Point(' + user.latitude + ' ' + user.longitude + ')'
            obj.deposit = null
        } else if (type === "spend") {
            obj.payway = "me"
            obj.deposit = posit
            obj.getposit = '[0,0]'
        } else {
            //TODO获取诚意金（system）
            obj.mealtime = mealtime
            obj.payway = payway
            let deposit = await System.getInstance().findOne('deposit')
            obj.deposit = parseInt(deposit.value.deposit)
            obj.getposit = '[0,0]'
        }
        obj.point = point
        if (type != "make") {
            if (user.balance < obj.deposit)
                return super.InternalServerError("吃货币不足! ！！")
            await Users.getInstance().updateByUuid(user.uuid, { balance: user.balance - obj.deposit })
        }
        let MyDeeds = await Deed.getInstance().findByUser(useruuid)
        if (MyDeeds && MyDeeds.length > 0)
            return super.BadRequest("该用户已存在契约单，请取消后再添加！！")
        let deed = await Deed.getInstance().add(obj)
        return { deed }
    }

    //后台创建契约单
    public static async backstageCreateDeed(body: any, ctx: any): Promise<any> {
        let { useruuid, mealtime, latitude, longitude, agerange, payway, type, address, restaurant, posit, getposit, istimeout } = body
        let obj = { useruuid, mealtime, latitude, longitude, agerange, payway, type, address, restaurant, posit, getposit, istimeout } as any
        const info: LoginInfo = super.getLoginInfo(ctx)
        let MyDeeds = await Deed.getInstance().findByUser(useruuid)
        if (MyDeeds && MyDeeds.length > 0)
            return super.BadRequest("该用户已存在契约单，请取消后再添加！！")
        if (!info.isAdmin)
            return super.NotAcceptable("没有权限")
        obj.result = false
        obj.stat = "waitfeedback"
        obj.onetoone = true
        obj.point = 'Point(' + latitude + ' ' + longitude + ')'
        let deed = await Deed.getInstance().add(obj)
        return { deed }
    }

}

//查询契约单
router.loginHandle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await DeedOnApp.list((ctx.request as any).query)))

//契约单详情
router.loginHandle("get", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await DeedOnApp.findByUuid(ctx.params)))

//创建契约单
router.loginHandle("post", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await DeedOnApp.createDeed((ctx.request as any).body, ctx)))

//后台创建契约单
router.loginHandle("post", "/addDeed", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await DeedOnApp.backstageCreateDeed((ctx.request as any).body, ctx)))
