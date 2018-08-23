import { getAsync } from "../lib/request"
import { GodOpt } from "../config/gad"

export async function getUserByLocation(latitude: any, longitude: any, start: number, length: number) {
    //location //http://restapi.amap.com/v3/place/around?key=您的key&location=116.481488,39.990464&keywords=餐饮&types=&offset=20&page=1&extensions=all
    //地址 //http://restapi.amap.com/v3/place/text?key=您的key&keywords=壹方城&types=餐厅&city=深圳&children=2&offset=20&page=1&extensions=base

    //let url = `http://restapi.amap.com/v3/place/around?key=${GodOpt.key}&location=${latitude},${longitude}&keywords=餐饮&types=餐饮&offset=${length}&page=${start}&extensions=all`
    let url = `http://restapi.amap.com/v3/geocode/regeo?output=json&location=${latitude},${longitude}&key=${GodOpt.key}&radius=1000&extensions=all`
    url = encodeURI(url)
    return await getAsync(url)
}




