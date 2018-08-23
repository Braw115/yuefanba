import { createHash, randomBytes } from "crypto"
import { ReqError } from "../lib/reqerror"
// import { PublicPath } from "../config"
import moment = require("moment")
import fs = require("fs")
import * as path from "path"
// const archiver = require('archiver')
const mv = require('mv')
// import * as child_process from "child_process"
import * as zlib from "zlib"

export function checkPassword(real: string, current: string): void {
    let [a, b] = [real.length === 32 ? real : md5sum(real), current.length === 32 ? current : md5sum(current)]
    if (a !== b)
        throw new ReqError("密码不正确！", 400)
}

export function randomInt(from: number, to: number) {
    return Math.floor(Math.random() * (to - from) + from)
}

export function md5sum(str: string): string {
    return createHash('md5').update(str).digest("hex")
}

export function md5File(filePath: string): Promise<string> {

    return new Promise(resolve => {
        let rs = fs.createReadStream(filePath)

        let hash = createHash('md5')

        rs.on('data', hash.update.bind(hash))
        rs.on('end', function () {
            resolve(hash.digest('hex'))
        })

    })
}

export function getSalt(): string {
    return randomBytes(16).toString('base64');
}

export function sleepAsync(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(() => resolve(), ms))
}

export function getPageCount(page: string, count?: string) {
    let limit = parseInt(count)
    let cursor = 0
    if (page) {
        cursor = parseInt(page) * parseInt(count)
    }
    return { cursor, limit }
}

export function checkCursorLimit(cursor: number, limit: number) {
    if (cursor > -1 && limit > 0)
        return false
    return true
}

export async function checkreq(param: Array<any>, sign: string, next: any) {
    param.sort()
    let s = param.join(",")
    if (sign === md5sum(s)) {
        return next()
    }
    return "参数错误!"
}



export function getSign(order: any, key: string) {
    delete order.sign
    let arr = new Array<any>()
    for (let k in order) {
        arr.push(`${k}=${order[k]}`)
    }
    arr.sort()
    arr.push(`key=${key}`)
    return md5sum(arr.join("&")).toUpperCase()
}
export function numcheckundefined(num: any) {
    if (num == undefined) num = 0
    return num
}
export function strcheckundefined(str: any) {
    if (str == undefined) str = ''
    return str
}
export function getRendomQuestions(num: number, arr: any[]) {
    let indexarr: number[], resarr: any[]
    if (num < arr.length) {
        while (indexarr.length < num) {     //取num个小于arr.length的不重复随机数字
            let i = Math.round(Math.random() * (arr.length - 1))
            for (let j = 0; j < indexarr.length; j++) {
                if (i == indexarr[j]) break
                else if (j == indexarr.length - 1) indexarr.push(i)
            }
        }
        for (let i = 0; i < num; i++) {    //根据获取的随机送取得arr中的数据
            if (i >= arr.length) break
            resarr.push(arr[indexarr[i]])
        }
    } else {
        resarr = arr
    }
    return resarr
}

export function getLog(): Promise<any> {
    return new Promise(resolve => {
        let logpath = path.join(__dirname, "..", "..", "logs", "warn.log")
        console.log(logpath)
        fs.readFile(logpath, function (err, data) {
            resolve({ log: data ? data.toString() : "" })
        })
    })
}

export function md5(str: string): string {
    return createHash('md5').update(str).digest("hex")
}

export function accessAsync(path: string, mode = fs.constants.F_OK) {
    return new Promise(resolve => fs.access(path, mode, err => {
        if (err)
            return resolve(false)
        return resolve(true)
    }))
}

export function mkdirAsync(path: string) {
    return new Promise((resolve, reject) => fs.mkdir(path, err => {
        if (err)
            return reject(err)
        return resolve()
    }))
}

export function moveAsync(oldPath: string, newPath: string) {
    return new Promise((resolve, reject) => mv(oldPath, newPath, function (err: any) {
        if (err) {
            return reject(err)
        }
        return resolve()
    }))
}

export function renameAsync(oldPath: string, newPath: string) {
    return new Promise((resolve, reject) => fs.rename(oldPath, newPath, err => {
        if (err) {
            return reject(err)
        }
        return resolve()
    }))
}

export function copyAsync(oldPath: string, newPath: string) {
    return new Promise((resolve, reject) => {
        try {
            let data = fs.readFileSync(oldPath)
            fs.writeFileSync(newPath, data)
            return resolve()
        } catch (error) {
            return reject(error)
        }

    })
}

export function removeAsync(path: string) {
    return new Promise(resolve => fs.unlink(path, err => resolve()))
}

export function removeDirAsync(path: string) {
    return new Promise(resolve => fs.rmdir(path, err => resolve()))
}

export function getOrderid() {
    let code = Math.floor(Math.random() * 9000 + 1000)
    let str = moment(new Date()).format("YYYYMMDDHHmmss")
    return str + code
}



export function inflate(s: string | Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        zlib.inflate(s, (err, res) => {
            if (err)
                return reject(err)
            return resolve(res)
        })
    })
}

//版本比较
export function compareVersion(a: string, b: string): Promise<number> {
    return new Promise((resolve, reject) => {

        function toNum(a: string) {
            let b = a.toString()
            //如果版本号如("v2.10.10"),则这样写 var c=a.split(/\D/)
            //如果版本号如("2.1.15"),则这样写 var c = a.split('.')
            let c = b.split(/\D/)
            let num_place = ["", "0", "00", "000", "0000"], r = num_place.reverse()
            for (let i = 0; i < c.length; i++) {
                let len = c[i].length
                c[i] = r[len] + c[i]
            }
            let res = c.join('')
            return res
        }
        function cpr_version(a: string, b: string): number {
            let _a = toNum(a), _b = toNum(b)
            if (_a == _b) return 0
            else if (_a > _b) return 1
            else return -1
        }

        return resolve(cpr_version(a, b))
    })
}

//获取存放的路径
export function getRandomPath(): Promise<string> {
    return new Promise((resolve) => {
        let Arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
        let randomPath = ''
        for (let i = 0; i < 4; i++) {
            let index = parseInt(Math.random() * 16 + '', 10)
            let currentStr = Arr[index]
            randomPath += currentStr
            if (i === 1) {
                randomPath += '/'
            }
        }
        return resolve(randomPath)
    })
}

//得到一个随机名称
export function getRandomName(): Promise<string> {
    return new Promise((resolve) => {
        let time = new Date().getTime().toString()
        let code = Math.round(Math.random() * 9000 + 1000) + ""
        return resolve(time + code)
    })
}
