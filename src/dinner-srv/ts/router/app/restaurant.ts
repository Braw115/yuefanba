import { RouterWrap } from "../../lib/routerwrap"
// import { validateCgi } from "../../lib/validator"
import { getRestaurantsByKey, getRestaurantsByLocation } from "../../lib/restaurant"
import { } from "./validator"
import { BaseHandler } from "../lib/basehandler"
import { RestaurantRedis } from "../../redis/restaurant"
import { LoginInfoAtApp } from "../../redis/logindao"
import { Users } from "../../model/users/users"
export const router = new RouterWrap({ prefix: "/app/restaurant" })

export class RestaurantOnApp extends BaseHandler {
    //1.查询餐厅
    public static async findRestaurant(query: any, ctx: any): Promise<any> {
        const { key, start, length } = query
        const info: LoginInfoAtApp = super.getLoginInfo(ctx)
        let users = await Users.getInstance().findByPrimary(info.getUuid())
        let restaurants
        if (!key) {
            let search = users.latitude + users.longitude + start + length
            restaurants = await RestaurantRedis.getRestaurant(search)
            if (!restaurants) {
                restaurants = await getRestaurantsByLocation(users.latitude, users.longitude, parseInt(start), parseInt(length))
                await RestaurantRedis.saveRestaurant(search, restaurants)
            }
        } else {
            let search = users.area + key + start + length
            restaurants = await RestaurantRedis.getRestaurant(search)
            if (!restaurants) {
                restaurants = await getRestaurantsByKey(key, users.city, parseInt(start), parseInt(length))
                await RestaurantRedis.saveRestaurant(search, restaurants)
            }
        }

        return { restaurant: JSON.parse(restaurants) }
    }

}

//查询餐厅
router.loginHandleAtApp("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await RestaurantOnApp.findRestaurant((ctx.request as any).query, ctx)))

