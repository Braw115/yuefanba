import { RouterWrap } from "../../lib/routerwrap"
import { Banner } from "../../model/users/banner"
import { BaseHandler } from "../lib/basehandler"
import * as gettime from "../../lib/gettime"
export const router = new RouterWrap({ prefix: "/appbanner" })


export class AppBanner extends BaseHandler {
    //查看所有的轮播图列表
    public static async BannerList(): Promise<any> {

        let res = await Banner.getInstance().findByObj({ state: "on" })

        let bannerList = res.map(r => r.get())
        bannerList.forEach(r => {
            r.created = gettime.getTimeStr(r.created)
            r.modified = gettime.getTimeStr(r.modified)
        })

        return bannerList
    }
}

//查看所有的轮播图列表
router.handle("get", "/bannerlist", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppBanner.BannerList()))