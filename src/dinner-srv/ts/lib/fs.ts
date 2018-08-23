import * as fs from "fs"

export function readFileAsync(path: string) {
    return new Promise<Buffer>((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err)
                return reject(err)
            return resolve(data)
        })
    })
}