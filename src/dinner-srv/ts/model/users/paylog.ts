import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "paylog"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    PayLog.getInstance(sequelize)
    return sequelize.define(modelName, {
        id: {
            primaryKey: true,
            type: DataTypes.INTEGER,
            autoIncrement: true
        },
        useruuid: DataTypes.UUID,
        type: DataTypes.ENUM('recharge', 'withdraw', 'pay', 'back'), //recharge-充值 withdraw-提现	pay-契约花费 back-订单回退
        orderuuid: DataTypes.UUID,
        deeduuid: DataTypes.UUID,
        coin: DataTypes.INTEGER,
        description: DataTypes.TEXT,
        ext: DataTypes.JSONB,
        created: DataTypes.TIME
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class PayLog extends ModelBase {
    private static instance: PayLog
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!PayLog.instance)
            PayLog.instance = new PayLog(seqz, modelName)
        return PayLog.instance
    }

    /**
     * 添加支付日志
     * @param obj
     */
    public async  add(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }

    /**
     * 查询支付日志
     * @param obj
     */
    public async findBy(obj: any) {
        let res = await this.model().findAll(obj)
        return res.map(r => r.get())
    }

    //按照过滤条件查询支付列表（带分页）
    public async  findAll(obj: any, start: number, length: number) {
        let res = await this.model().findAndCountAll({
            where: obj,
            limit: length,
            offset: start,
            order: [["created", "desc"]]
        })
        return res
    }

    public async  findByuuid(uuid: String) {
        let res = await this.seqz.query(
            `SELECT
                n.*, o.address,
                o. LOCATION,
                o.deeduuid1,
                o.deeduuid2,
                o.useruuid1,
                o.useruuid2
            FROM
                users.paylog AS n
            LEFT JOIN users.orders AS o ON o.uuid = n.orderuuid
            WHERE
                n.id = '${uuid}'`, { plain: false }) as any[]
        return res[0]
    }
}

