import { RouterWrap } from "../../lib/routerwrap"
// import { validateCgi } from "../../lib/validator"
import { getRestaurantsByKey } from "../../lib/restaurant"
import { } from "./validator"
import { BaseHandler } from "../lib/basehandler"
import { RestaurantRedis } from "../../redis/restaurant"
export const router = new RouterWrap({ prefix: "/crm/restaurant" })

export class RestaurantOnCrm extends BaseHandler {
    //1.查询餐厅
    public static async findRestaurant(query: any, ctx: any): Promise<any> {
        const { key, start, length, city } = query
        let restaurants
        let search = city + key + start + length
        restaurants = await RestaurantRedis.getRestaurant(search)
        if (!restaurants) {
            restaurants = await getRestaurantsByKey(key, city, parseInt(start), parseInt(length))
            await RestaurantRedis.saveRestaurant(search, restaurants)
        }
        return { restaurants: JSON.parse(restaurants) }
    }

}

//查询餐厅
router.loginHandle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await RestaurantOnCrm.findRestaurant((ctx.request as any).query, ctx)))

