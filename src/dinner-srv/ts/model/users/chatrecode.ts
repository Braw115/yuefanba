import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "chatrecord"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    ChatRecord.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        orderuuid: DataTypes.UUID,
        useruuid1: DataTypes.UUID,
        useruuid2: DataTypes.UUID,
        content: DataTypes.JSONB,
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

export class ChatRecord extends ModelBase {
    private static instance: ChatRecord
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!ChatRecord.instance)
            ChatRecord.instance = new ChatRecord(seqz, modelName)
        return ChatRecord.instance
    }

    //1.创建聊天
    public async  insert(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }

    //2.主键查找聊天记录
    public async findByPrimary(uuid: string) {
        let res = await this.model().findByPrimary(uuid)
        return res ? res.get() : undefined
    }

    //3.修改聊天记录
    public async updateContent(content: any, uuid: string) {
        let [number, res] = await this.model().update({ content: content }, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    //4.删除聊天记录
    public async destory(uuid: string) {
        await this.model().destroy({ where: { uuid: uuid } })
    }

    //5.查询我的聊天列表
    public async findMyChat(useruuid: string, orderuuid: string, offset: number, limt: number) {
        let res = await this.model().findAll({
            where: {
                orderuuid: orderuuid,
                $or: [{ useruuid1: useruuid }, { useruuid2: useruuid }]
            },
            limit: limt,
            offset: offset,
            order: [["created", "desc"]]
        })
        return res.map(r => r.get())
    }

    //5.查询我的聊天列表
    public async findMyNewChat(useruuid: string, orderuuid: string, offset: number, limt: number) {
        let res = await this.model().findAll({
            where: {
                orderuuid: orderuuid,
                useruuid1: useruuid
            },
            limit: limt,
            offset: offset,
            order: [["created", "desc"]]
        })
        return res.map(r => r.get())
    }
}