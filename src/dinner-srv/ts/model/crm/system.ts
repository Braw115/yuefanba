import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "system"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    System.getInstance(sequelize)
    return sequelize.define(modelName, {
        key: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        value: DataTypes.JSONB, //设置内容
        ext: DataTypes.JSONB,
        modified: DataTypes.TIME,
        created: DataTypes.TIME
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class System extends ModelBase {
    private static instance: System
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!System.instance)
            System.instance = new System(seqz, modelName)
        return System.instance
    }

    public async insertOne(obj: any) {
        let res = await this.model().create(obj)
        return res ? res.get() : undefined
    }

    public async updateOne(key: string, value: any) {
        let [number, res] = await this.model().update({ value: value }, { where: { key: key }, returning: true })
        return number > 0 ? res : undefined
    }

    public async findOne(key: string) {
        let res = await this.model().findOne({ where: { key: key } })
        return res ? res.get() : undefined
    }

    public async findAll() {
        let res = await this.model().findAll()
        return res.map(r => r.get())
    }
}