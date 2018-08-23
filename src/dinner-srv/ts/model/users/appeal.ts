import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "appeal"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    Appeal.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        useruuid: DataTypes.UUID,
        orderuuid: DataTypes.UUID,
        content: DataTypes.TEXT,
        appealeduuid: DataTypes.UUID,
        ext: DataTypes.JSONB,
        created: DataTypes.TIME,
        modified: DataTypes.TIME
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class Appeal extends ModelBase {
    private static instance: Appeal
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!Appeal.instance)
            Appeal.instance = new Appeal(seqz, modelName)
        return Appeal.instance
    }
    //插入一条申诉记录
    public async  insert(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }

    //获取申诉列表
    public async  getList(start: number, length: number) {
        let rows = await this.seqz.query(
            `SELECT a.*,u1.nickname as appealernick,u1.phone as appealerphone,
            u2.nickname as appealednick,u2.phone as appealedphone
            from users.appeal as a
            LEFT JOIN users.users as u1 ON a.useruuid = u1.uuid
            LEFT JOIN users.users as u2 ON a.appealeduuid=u2.uuid
            LEFT JOIN users.orders as o ON a.orderuuid=o.uuid offset ${start} limit ${length}`, { type: "SELECT" }) as any[]

        let count = await this.seqz.query(
            `SELECT count(*) from users.appeal as a LEFT JOIN users.users as u1 ON a.useruuid = u1.uuid
            LEFT JOIN users.users as u2 ON a.appealeduuid=u2.uuid
            LEFT JOIN users.orders as o ON a.orderuuid=o.uuid  offset ${start} limit ${length}`, { type: "SELECT" }) as any[]
        return { rows, count }
    }

}