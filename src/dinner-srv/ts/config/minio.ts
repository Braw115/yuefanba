import * as IM from "immutable"

export const $minioOpt = IM.fromJS({
    endPoint: 'minio.dinner.cn',
    port: 9000,
    secure: false,
    accessKey: 'minio',
    secretKey: 'abcde12345',
})

export const minioObj = {
    bucket: ['avatar', 'personality', 'album', 'attestvideo', 'banner', 'chatimg']
}

