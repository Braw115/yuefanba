import * as winston from "winston"
const path = require('path')
const schedule = require("node-schedule")
import * as Utils from "../../lib/utils"
const fs = require("fs")


export async function init(map: { deamonNotifyMap: Map<string, Function>, deamonGetMap: Map<string, Function> }) {
    CleanDir.getInstance().run()
}

class CleanDir {
    private static instance = new CleanDir()
    private constructor() { }
    public static getInstance() {
        return CleanDir.instance
    }

    private async deleteFolder(path: string) {
        var files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path)
            files.forEach(function (file: any, index: any) {
                var curPath = path + "/" + file
                if (fs.statSync(curPath).isDirectory()) {
                    CleanDir.getInstance().deleteFolder(curPath)
                } else { // delete file
                    fs.unlinkSync(curPath)
                }
            })
            fs.rmdirSync(path)
        }
    }

    private async cleanDir(): Promise<any> {

        schedule.scheduleJob('5 * * * * *', function () {
            CleanDir.getInstance().deleteFolder(path.join(__dirname, '../../../public/temp'))
            Utils.mkdirAsync(path.join(__dirname, '../../../public/temp'))
        })

    }

    public async run() {
        try {
            await this.cleanDir()
        } catch (e) {
            winston.error(`cleanDir fail. ${e.message}`)
        }
    }
}

