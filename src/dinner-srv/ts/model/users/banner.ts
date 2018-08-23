import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "banner"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    Banner.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        img: DataTypes.CHAR(64),
        url: DataTypes.CHAR(64),
        description: DataTypes.TEXT,
        priority: DataTypes.INTEGER,
        state: DataTypes.BOOLEAN,
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

export class Banner extends ModelBase {
    private static instance: Banner
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!Banner.instance)
            Banner.instance = new Banner(seqz, modelName)
        return Banner.instance
    }

    //1.插入一条轮播图
    public async  insert(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }

    //2.按照过滤条件查询轮播图列表
    public async  findAll(obj: any, start: number, length: number) {
        let res = await this.model().findAndCountAll({
            where: obj,
            limit: length,
            offset: start,
            order: [["created", "desc"]]
        })
        return res
    }

    //3.通过uuid修改信息
    public async  updateByUuid(uuid: string, obj: any) {
        let [number, res] = await this.model().update(obj, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    //4.通过uuid删除轮播图
    public async delete(uuid: string) {
        return await this.model().destroy({ where: { uuid: uuid } })
    }

    //5.通过uuid查找记录
    public async  findByPrimary(uuid: string) {
        let user = await this.model().findByPrimary(uuid)
        return user ? user.get() : undefined
    }

    //6.根据obj显示所有的轮播图
    public async  findByObj(obj: any) {
        let res = await this.model().findAll({ where: obj, order: [["priority", "asc"]] })
        return res
    }
}