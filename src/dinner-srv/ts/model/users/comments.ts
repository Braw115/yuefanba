import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "comments"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    Comments.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        useruuid: DataTypes.UUID,
        content: DataTypes.TEXT,
        level: DataTypes.INTEGER,
        evaluator: DataTypes.UUID,
        orderuuid: DataTypes.UUID,
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

export class Comments extends ModelBase {
    private static instance: Comments
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!Comments.instance)
            Comments.instance = new Comments(seqz, modelName)
        return Comments.instance
    }

    //插入一条评论
    public async  insert(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }
    //根据uuid查询评论
    public async  findByPrimary(uuid: string) {
        let res = await this.model().findOne({ where: { uuid : uuid } })
        return res 
    }
    //查询所有评论
    public async  findAll(start: number, length: number) {
        //let commentslist = await this.seqz.query(`SELECT *FROM users.comments LIMIT ${length} OFFSET ${start}`,{ type: "SELECT" }) as any[]
        let commentslist = await this.seqz.query(`
        SELECT u.nickname AS "username", c."content", u2.nickname AS "evaluatorname", c.level, c.created 
        FROM users.comments AS c
        LEFT JOIN users.users AS u ON c.useruuid = u.uuid
        LEFT JOIN users.users AS u2 ON c.evaluator = u2.uuid
        order by c.created desc LIMIT ${length} OFFSET ${start} `,{ type: "SELECT" }) as any[]
        
        let count = await this.seqz.query(`select count(*) from users.comments`, { type: "select" }) as any[]
        let recordsFiltered = count[0].count 
        return {commentslist, recordsFiltered }
    }
    //根据uuid删除评论
    public async  delete(uuid: string) {
        let res = await this.model().destroy({ where: { uuid : uuid} })
        return res 
    }

}