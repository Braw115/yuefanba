import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "crmlog"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    CrmLog.getInstance(sequelize)
    return sequelize.define(modelName, {
        id: {
            primaryKey: true,
            type: DataTypes.INTEGER,
            autoIncrement: true
        },
        useruuid: DataTypes.UUID,
        ip: DataTypes.CHAR(36),
        phone: DataTypes.CHAR(12),
        operation: DataTypes.TEXT,
        ext: DataTypes.JSONB,
        created: DataTypes.TIME
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class CrmLog extends ModelBase {
    private static instance: CrmLog
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!CrmLog.instance)
            CrmLog.instance = new CrmLog(seqz, modelName)
        return CrmLog.instance
    }

    /**
     * 1、添加管理员操作记录
     * @param key
     * @param value
     */
    public async  insertLog(crmuseruuid: string, operation: string, phone: string, ip: string) {
        let res = await this.model().create({ useruuid: crmuseruuid, ip: ip, phone: phone, operation: operation }, { returning: true })
        return res ? res.get() : undefined
    }

    //2.查询crm操作列表
    public async  findAll(obj: any, start: number, length: number) {
        let res = await this.model().findAndCountAll({
            where: obj,
            limit: length,
            offset: start,
            order: [["created", "desc"]]
        })
        return res
    }
}