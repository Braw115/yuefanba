export const pgOpt = {
    database: "postgres",
    username: "postgres",
    password: "123456",
    options: {
        dialect: "postgres",
        host: "pg.dinner.cn",
        port: 5432,
        timezone: "+8:00",
        pool: {
            maxConnections: 5,
            minConnections: 0,
            maxIdleTime: 100000
        }
    }
}
