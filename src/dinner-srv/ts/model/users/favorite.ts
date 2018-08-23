import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "favorite"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    Favorite.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        useruuid: DataTypes.UUID,
        favoriteuuid: DataTypes.UUID,
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

export class Favorite extends ModelBase {
    private static instance: Favorite
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!Favorite.instance)
            Favorite.instance = new Favorite(seqz, modelName)
        return Favorite.instance
    }

    //添加一条收藏数据
    public async  insert(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }

    //删除一条收藏数据
    public async delete(obj: any) {
        return await this.model().destroy({ where: obj })
    }

    //查找我的收藏列表
    public async getFavoriteList(useruuid: string) {
        let res = await this.seqz.query(`SELECT u.* FROM users.favorite as f LEFT JOIN
        users.users as u ON f.favoriteuuid=u.uuid WHERE f.useruuid='${useruuid}' `, { type: "select" })
        return res
    }

    //根据条件查找
    public async  findByObj(obj: any) {
        let res = await this.model().findAll({ where: obj })
        return res.map(r => r.get())
    }
}