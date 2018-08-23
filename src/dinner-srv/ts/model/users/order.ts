import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "orders"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    Order.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        deeduuid1: DataTypes.UUID,
        deeduuid2: DataTypes.UUID,
        useruuid1: DataTypes.UUID,
        useruuid2: DataTypes.UUID,
        state: DataTypes.CHAR(8),
        type: DataTypes.CHAR(16),
        coin: DataTypes.INTEGER,
        player: DataTypes.UUID,
        location: DataTypes.TEXT,
        address: DataTypes.TEXT,
        starttime: DataTypes.RANGE(),
        imgarr: DataTypes.ARRAY(DataTypes.TEXT),
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

export class Order extends ModelBase {
    private static instance: Order
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!Order.instance)
            Order.instance = new Order(seqz, modelName)
        return Order.instance
    }

    /**
     * 添加订单
     * @param obj
     */
    public async  add(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }


    /**
     *修改订单信息
     * @param obj
     * @param uuid
     */
    public async update(obj: any, uuid: string) {
        let [number, res] = await this.model().update(obj, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    /**
     * 主键查询订单详情
     * @param uuid
     */
    public async findByPrimary(uuid: string) {
        let res = await this.model().findByPrimary(uuid)
        return res ? res.get() : undefined
    }

    /**
     * 查询订单
     * @param obj
     */
    public async findBy(obj: any) {
        let res = await this.model().findAll(obj)
        return res.forEach(r => r.get())
    }


    /**
     * 根据用户查询订单
     * @param useruuid
     */
    public async findByUser(useruuid: string, type: string) {
        let row
        if (type === "from") {
            row = await this.seqz.query(
                `SELECT o.*,u1.avatar as avatar1,u2.avatar as avatar2,u1.nickname as nickname1,
                u2.nickname as nickname2,c.level as level,c.content AS commentcontent,a.content AS appealcontent
                FROM users.orders as o LEFT JOIN users.users as u1 ON o.useruuid1=u1.uuid LEFT JOIN users.users as u2
                ON o.useruuid2=u2.uuid LEFT JOIN users.comments AS c ON o.uuid=c.orderuuid and C.evaluator='${useruuid}'
                LEFT JOIN users.appeal AS a ON o.uuid = a.orderuuid AND a.useruuid = '${useruuid}'
                WHERE o.useruuid2 = '${useruuid}'  order by created desc
                `, { type: "SELECT" }) as any[]
        } else if (type === "to") {
            row = await this.seqz.query(
                `SELECT o.*,u1.avatar as avatar1,u2.avatar as avatar2,u1.nickname as nickname1,
                u2.nickname as nickname2,c.level as level,c.content AS commentcontent,a.content AS appealcontent
                FROM users.orders as o LEFT JOIN users.users as u1 ON o.useruuid1=u1.uuid LEFT JOIN users.users as u2
                ON o.useruuid2=u2.uuid LEFT JOIN users.comments AS c ON o.uuid=c.orderuuid and C.evaluator='${useruuid}'
                LEFT JOIN users.appeal AS a ON o.uuid = a.orderuuid AND a.useruuid = '${useruuid}'
                WHERE  o.useruuid1 = '${useruuid}' order by created desc
                `, { type: "SELECT" }) as any[]
        } else {
            row = await this.seqz.query(
                `SELECT o.*,u1.avatar as avatar1,u2.avatar as avatar2,u1.nickname as nickname1,
                u2.nickname as nickname2,c.level as level,c.content AS commentcontent,a.content AS appealcontent
                FROM users.orders as o LEFT JOIN users.users as u1 ON o.useruuid1=u1.uuid LEFT JOIN users.users as u2
                ON o.useruuid2=u2.uuid LEFT JOIN users.comments AS c ON o.uuid=c.orderuuid and C.evaluator='${useruuid}'
                LEFT JOIN users.appeal AS a ON o.uuid = a.orderuuid AND a.useruuid = '${useruuid}'
                WHERE (o.useruuid1 = '${useruuid}' OR o.useruuid2 = '${useruuid}') order by created desc
                `, { type: "SELECT" }) as any[]
        }
        return row
    }

    public async getByUuid(uuid: string, useruuid: string) {
        let row = await this.seqz.query(
            `SELECT o.*,u1.avatar as avatar1,u2.avatar as avatar2,u1.nickname as nickname1,u2.nickname as nickname2,
            c.level as level,c.content AS commentcontent,a.content AS appealcontent,n.uuid as noticeuuid
            FROM users.orders as o LEFT JOIN users.users as u1 ON o.useruuid1=u1.uuid LEFT JOIN users.users as u2
            ON o.useruuid2=u2.uuid LEFT JOIN users.comments AS c ON o.uuid=c.orderuuid and C.evaluator='${useruuid}'
            LEFT JOIN users.appeal AS a ON o.uuid = a.orderuuid AND a.useruuid = '${useruuid}'
            LEFT JOIN users.notice AS n ON o.uuid = n.orderuuid WHERE o.uuid='${uuid}'
            and n.useruuid ='${useruuid}'`, { type: "SELECT" }) as any[]
        return row
    }

    /**
    * 删除订单
    * @param uuid
    */
    public async destoryNotice(uuid: string) {
        let res = await this.model().destroy({ where: { uuid: uuid } })
        return res
    }

    //按照过滤条件查询订单列表
    public async  findAll(obj: any, start: number, length: number) {
        let res = await this.model().findAndCountAll({
            where: obj,
            limit: length,
            offset: start,
            order: [["created", "desc"]]
        })
        return res
    }

    //更新，通过orderuuid
    public async updateBySingleField(obj: any, orderuuid: string) {
        let [number, res] = await this.model().update(obj, { where: { uuid: orderuuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    public async findByObj(obj: any) {
        let res = await this.model().findAll({ where: obj })
        return res.map(r => r.get())
    }

}
