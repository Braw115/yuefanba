import { PublicPath } from "../config"
import utils = require("./utils")
const Path = require("path")
const fs = require('fs')



export function getFormInfo(ctx: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
        let body = (ctx.req as any).body
        let req = ctx.req as any
        let data = {} as any

        let file = req.file
        let filename = file.originalname

        data.uuid = body.uuid
        if (body.url) {
            data.url = body.url
        } else {
            data.url = null
        }

        let type = filename.substring(filename.lastIndexOf("."))        //扩展名

        let old_path = file.path

        let code = Math.round(Math.random() * 9000 + 1000) + ""
        let time = new Date().getTime().toString()
        let newname = time + code

        let tempDir = Path.join(__dirname, '../../public/temp/')
        let new_path = tempDir + newname + type

        await utils.renameAsync(old_path, new_path)

        data.media_tmp_path = new_path
        data.now_name = newname
        data.now_ext = type

        return resolve(data)

    })
}

export async function makePathOfPic(data: any): Promise<any> {

    //文件上传文件夹
    let media_now_dir = ""
    let media_now_path = ""
    let media_access_path = ""
    //判断修改媒体的广告是否在线上

    /**2.0 */
    let publicPath = PublicPath.public
    if (!fs.existsSync(publicPath)) {
        console.log(publicPath + ' not exists.');
        return { "err": "public文件夹不存在" }
    }
    let adspackagePath = publicPath + '/adspackage'
    if (! await utils.accessAsync(adspackagePath))
        await utils.mkdirAsync(adspackagePath)
    media_now_dir = adspackagePath + '/' + data.uuid

    if (! await utils.accessAsync(media_now_dir))
        await utils.mkdirAsync(media_now_dir)
    //文件上传路径
    media_now_path = media_now_dir + "/" + data.now_name + data.now_ext
    media_access_path = "/adspackage/" + data.uuid + "/" + data.now_name + data.now_ext

    await utils.moveAsync(data.media_tmp_path, media_now_path)
    fs.exists(data.media_tmp_path, async function (exists: boolean) {
        if (!exists) {
            console.log(data.media_tmp_path + ' not exists.');
        } else {
            await utils.removeAsync(data.media_tmp_path)
        }
    })

    /**2.0 */
    if (data.url) {
        let old_media_url = PublicPath.public + data.url
        fs.exists(old_media_url, async function (exists: boolean) {
            if (!exists) {
                console.log(old_media_url + ' not exists.');
            } else {
                await utils.removeAsync(old_media_url)
            }
        })
    }

    return media_access_path
}


export async function makePathOfFirmware(data: any): Promise<any> {

    //文件上传文件夹
    let media_now_dir = ""
    let media_now_path = ""
    let media_access_path = ""
    //判断修改媒体的广告是否在线上

    /**2.0 */
    let publicPath = PublicPath.public
    if (!fs.existsSync(publicPath)) {
        console.log(publicPath + ' not exists.');
        return { "err": "public文件夹不存在" }
    }
    let firmwarePath = publicPath + '/firmware'
    if (! await utils.accessAsync(firmwarePath))
        await utils.mkdirAsync(firmwarePath)
    media_now_dir = firmwarePath + '/' + data.uuid

    if (! await utils.accessAsync(media_now_dir))
        await utils.mkdirAsync(media_now_dir)
    //文件上传路径
    media_now_path = media_now_dir + "/" + data.now_name + data.now_ext
    media_access_path = "/firmware/" + data.uuid + "/" + data.now_name + data.now_ext

    await utils.moveAsync(data.media_tmp_path, media_now_path)
    fs.exists(data.media_tmp_path, async function (exists: boolean) {
        if (!exists) {
            console.log(data.media_tmp_path + ' not exists.');
        } else {
            await utils.removeAsync(data.media_tmp_path)
        }
    })

    /**2.0 */
    if (data.url) {
        let old_media_url = PublicPath.public + data.url
        fs.exists(old_media_url, async function (exists: boolean) {
            if (!exists) {
                console.log(old_media_url + ' not exists.');
            } else {
                await utils.removeAsync(old_media_url)
            }
        })
    }

    return media_access_path
}

export function getFormInfoForFirmware(ctx: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
        let body = (ctx.req as any).body
        let req = ctx.req as any
        let data = {} as any

        let file = req.file
        let filename = file.originalname

        data.uuid = body.uuid
        if (body.url) {
            data.url = body.url
        } else {
            data.url = null
        }

        let type = filename.substring(filename.lastIndexOf("."))

        let old_path = file.path

        let newname = filename.substring(filename.indexOf("_") + 2, (filename.indexOf("_", (filename.indexOf("_") + 1))))

        let tempDir = Path.join(__dirname, '../../public/temp/')
        let new_path = tempDir + newname + type

        await utils.renameAsync(old_path, new_path)

        data.media_tmp_path = new_path
        data.now_name = newname
        data.now_ext = type

        return resolve(data)

    })
}
