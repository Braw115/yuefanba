import moment = require("moment")

//获取时间戳
export function getTime(str: string): number {
    return new Date(str).getTime()
}

//把时间戳转成YYYY-MM-DD
export function formatToYMD(str: string): string {
    let str1 = parseInt(str)
    return moment(new Date(str1)).format("YYYY-MM-DD")
}

export function formatToYMDSFM(str: string): string {
    let str1 = parseInt(str)
    return moment(new Date(str1)).format("YYYY-MM-DD HH:mm:ss")
}

export function formatToSFM(str: string): string {
    let str1 = parseInt(str)
    return moment(new Date(str1)).format("HH:mm:ss")
}

export function formatToYMDSF(str: string): string {
    let str1 = parseInt(str)
    return moment(new Date(str1)).format("YYYY-MM-DD HH:mm")
}

export function formatToSF(str: string): string {
    let str1 = parseInt(str)
    return moment(new Date(str1)).format("HH:mm")
}


//获取时间字符串（秒）
export function getTimeStr(str: any): string {
    return moment(new Date(str)).format("YYYY-MM-DD HH:mm:ss")
}

//获取时间字符串（天）
export function getDateStr(str: string): string {
    return moment(new Date(str)).format("YYYY-MM-DD")
}

//获取时间字符串（天）
export function getDateStrAdd(str: string): string {
    return moment(new Date(str)).add(1, 'days').format("YYYY-MM-DD")
}

//获取时间字符串（天）
export function getDateStrAddHour(str: string): string {
    return moment(new Date(str)).add(2, 'hour').format("YYYY-MM-DD HH:mm:ss")
}

//获取时间字符串（月）
export function getMonthStr(str: string): string {
    return moment(new Date(str)).format("YYYY-MM")
}

//获取日
export function getDate(str: string): number {
    return moment(new Date(str)).date()
}

//获取月
export function getMonth(str: string): number {
    return moment(new Date(str)).month() + 1
}

//获取年
export function getYear(str: string): number {
    return moment(new Date(str)).year()
}

//获取时
export function getHour(str: string): number {
    return moment(new Date(str)).hour()
}

//获取分
export function getMinute(str: string): number {
    return moment(new Date(str)).minute()
}

//获取季度
export function getQuarter(str: string): number {
    return moment(new Date(str)).quarter()
}

//获取每月天数
export function getDaysInMonth(str: string): number {
    return moment(new Date(str)).daysInMonth()
}

//获取时间间隔
export function getHourAndMinute(start: string, end: string): any {
    let starttime = new Date(start).getTime() / 1000
    let endtime = new Date(end).getTime() / 1000
    let hour = (endtime - starttime) / 60 / 60
    let minute = ((endtime - starttime) % (60 * 60)) / 60
    return { hour: Math.floor(hour), minute: Math.floor(minute) }
}

//获取时间(天)
function getdate(datestr: any) {
    let temp = datestr.split("-");
    let date = new Date(temp[0], temp[1], temp[2]);
    return date;
}

//获取时间段内日期列表
export function getDateList(start: any, end: any): Array<any> {
    let startTime = getdate(start)
    let endTime = getdate(end)
    let datelist = new Array()
    while ((endTime.getTime() - startTime.getTime()) >= 0) {
        let year = startTime.getFullYear();
        let month = startTime.getMonth().toString().length == 1 ? "0" + startTime.getMonth().toString() : startTime.getMonth();
        let day = startTime.getDate().toString().length == 1 ? "0" + startTime.getDate() : startTime.getDate();
        let da = year + "-" + month + "-" + day
        datelist.push(da)
        startTime.setDate(startTime.getDate() + 1)
    }
    return datelist
}

export function getendtime(starttime: string, hour: number, minute: number): string {
    let res = moment(new Date(starttime)).add('hour', hour).format("YYYY-MM-DD HH:mm:ss")
    return moment(new Date(res)).add('minute', minute).format("YYYY-MM-DD HH:mm:ss")
}

//
export function getTrue(start: string, end: string, cur: string): any {
    let vstart = start.split(":")
    let vend = end.split(":")
    let vcur = cur.split(":")
    let startt = parseInt(vstart[0]) * 60 + parseInt(vstart[1])
    let endt = parseInt(vend[0]) * 60 + parseInt(vend[1])
    let curt = parseInt(vcur[0]) * 60 + parseInt(vcur[1])
    if (curt <= endt && curt >= startt)
        return true

    return false
}

export function getTsrangTime(starttime: any, endtime: any): any {
    let res = (new Date(endtime).getTime() - new Date(starttime).getTime()) / 1000
    let hour = Math.floor(res / 3600)
    let minute = Math.floor((res % 3600) / 60)
    let second = Math.floor(((res % 3600) % 60) / 60)
    return { hour, minute, second }
}

export function getHourAndMinutes(timestamp: any): any {
    let res = timestamp / 1000
    let hour = Math.floor(res / 3600)
    let minute = Math.floor((res % 3600) / 60)
    let second = Math.floor(((res % 3600) % 60))
    return { hour, minute, second }
}

