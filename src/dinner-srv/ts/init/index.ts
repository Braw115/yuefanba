import { MinioHelper } from "../lib/miniohelper"
import { minioObj } from "../config/minio"
import winston = require("winston")


export async function initMinioBucket() {
    let bucketArr = minioObj.bucket
    for (let i = 0; i < bucketArr.length; i++) {
        let currentBucket = bucketArr[i]
        let isExists = await MinioHelper.getInstance().bucketExists(currentBucket)
        if (!isExists) {
            let isMake = await MinioHelper.getInstance().makeBucket(currentBucket)
            if (isMake === "true") {
                await MinioHelper.getInstance().setBucketPolicy(currentBucket, "*", "readwrite")
            }
        }
    }

    winston.info("initMinioBucket ok")
}