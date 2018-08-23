import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"
//import { UUID } from "sequelize/lib/data-types";

const [schema, table] = ["users", "users"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    Users.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        openid: DataTypes.CHAR(36),
        nickname: DataTypes.CHAR(32),
        longitude: DataTypes.CHAR(32),
        latitude: DataTypes.CHAR(32),
        location: DataTypes.GEOMETRY,
        city: DataTypes.CHAR(32),
        phone: DataTypes.CHAR(16),  //绑定的手机号/后台管理 用户名
        personality: DataTypes.ARRAY(DataTypes.TEXT),
        album: DataTypes.ARRAY(DataTypes.TEXT),
        avatar: DataTypes.TEXT,
        attestvideo: DataTypes.TEXT,
        gender: DataTypes.INTEGER,     //性别（1男、0女）
        birthday: DataTypes.CHAR(16),
        height: DataTypes.FLOAT,
        balance: DataTypes.INTEGER,
        popularity: DataTypes.INTEGER,
        role: DataTypes.CHAR(16),   //权限 root、admin
        status: DataTypes.CHAR(16), //视频审核状态refuse:已打回 accept:已通过 uncheck:未审核 unupload:未上传
        password: DataTypes.CHAR(36),
        notice: DataTypes.CHAR(8),//on:打开  off:关闭
        salt: DataTypes.CHAR(256),
        ext: DataTypes.JSONB,
        area: DataTypes.CHAR(36),
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class Users extends ModelBase {
    private static instance: Users
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!Users.instance)
            Users.instance = new Users(seqz, modelName)
        return Users.instance
    }

    //1.查找通过单个字段
    public async  getBySingleField(obj: any) {
        let res = await this.model().findOne({ where: obj })
        return res ? res.get() : undefined
    }

    //2.根据openid修改信息
    public async  updateByOpenid(openid: string, obj: any) {
        let [number, res] = await this.model().update(obj, { where: { openid: openid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    //3.根据插入一条数据
    public async  insertUser(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }

    //4.通过uuid修改信息
    public async  updateByUuid(uuid: string, obj: any) {
        let [number, res] = await this.model().update(obj, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    //5.通过手机号查找用户
    public async  findByPhone(phone: string) {
        let res = await this.model().findAll({ where: { phone: phone } })
        return res ? res.map(r => r.get()) : undefined
    }

    //6.通过uuid修改密码
    public async  updatePasswordByUuid(uuid: string, password: string) {
        let [number, res] = await this.model().update({ password: password }, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    //7.通过uuid查找记录
    public async  findByPrimary(uuid: string) {
        let user = await this.model().findByPrimary(uuid)
        return user ? user.get() : undefined
    }

    //8.查找所有的用户列表
    public async  findAllUsers(obj?: any) {
        let res = await this.model().findAndCountAll({ where: obj })
        return res
    }

    //9.通过uuid删除用户
    public async delete(uuid: string) {
        return await this.model().destroy({ where: { uuid: uuid } })
    }

    //10.添加一个用户
    public async insertOne(obj: any) {
        let res = await this.model().create(obj)
        return res ? res.get() : undefined
    }

    //11.按条件/过滤查找
    public async  findAll(obj: any, start: number, length: number, orderby: string, ascordesc: string) {
        let res = await this.model().findAndCountAll({
            where: obj,
            limit: length,
            offset: start,
            order: [[orderby, ascordesc]]
        })
        return res
    }

    //12.通过uuid修改
    public async  updateInformation(uuid: string, obj: any) {
        let [number, res] = await this.model().update(obj, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    /**
  * 13获取热门主播
  * @param statrt
  * @param length
  */
    public async findByHot(uuid: string, city: string, statrt: number, length: number) {
        let res = await this.model().findAll({
            where: { city: city, uuid: { $not: uuid } },
            offset: statrt,
            limit: length,
            order: [["popularity", "desc"]]
        })
        return res.map(r => r.get())
    }

    public async findByHot2(uuid: string, city: string, statrt: number, length: number) {
        let row = await this.seqz.query(
            `SELECT u.* FROM users.users as u WHERE u.city = '${city}' AND u.uuid != '${uuid}'
            AND u.role  is NULL ORDER BY u.popularity DESC LIMIT ${length} OFFSET ${statrt}`,
            { type: "SELECT" }) as any[]
        return row
    }

    /**
     * 14.条件查询
     * @param obj
     * @param statrt
     * @param length
     */
    public async getAll(obj: any, statrt: number, length: number) {
        let res = await this.model().findAll({
            where: obj,
            offset: statrt,
            limit: length,
            order: [["modified", "desc"]]
        })
        return res.map(r => r.get())

    }

    //15.造假数据  nickname, phone, longitude, latitude, gender, birthday, height, balance,popularity
    public async  add(obj: any) {
        return await this.seqz.query(
            `INSERT INTO users.users (uuid,nickname,phone,location,gender,birthday,height,
                longitude,latitude,balance,popularity,status,notice)
            VALUES
                (   uuid_generate_v4(),
                    '${obj.nickname}','${obj.phone}',ST_GeomFromText (
                        '${obj.point}',
                        4326
                    ),${obj.gender},'${obj.birthday}',${obj.height},${obj.longitude},${obj.latitude},
                    ${obj.balance},${obj.popularity},'${obj.status}','${obj.notice}'
                )`) as any[]
    }

    //16.同步个人位置，昵称等信息
    public async  syncInfo(uuid: string, obj: any) {
        return await this.seqz.query(
            `UPDATE users.users SET nickname = '${obj.nickname}',city ='${obj.city}',avatar ='${obj.avatar}',
            longitude = '${obj.longitude}',latitude = '${obj.latitude}',
            location = ST_GeomFromText (
                '${obj.point}',
                4326
            ),area = '${obj.area}' WHERE uuid='${uuid}'`) as any[]
    }

    //17.同步locaction信息
    public async  syncLocation(uuid: string, point: string) {
        return await this.seqz.query(
            `UPDATE users.users SET
            location = ST_GeomFromText (
                '${point}',
                4326
            ) WHERE uuid='${uuid}'`) as any[]
    }

    //18.获取评论列表
    public async  getComments(uuid: string, start: number, length: number) {
        let totalrow = await this.seqz.query(
            `SELECT C .* FROM users.comments AS C WHERE c.useruuid='${uuid}'`,
            { type: "SELECT" }) as any[]

        let row = await this.seqz.query(
            `SELECT c.content,c.level,u.nickname as evaluatornick,u.phone as evaluatorphone,c.orderuuid,o.starttime,
                c.created,u.avatar as evaluatoravatar,o.location from users.comments as c LEFT JOIN users.users as u
                ON c.evaluator=u.uuid LEFT JOIN users.orders AS o ON c.orderuuid=o.uuid
                WHERE c.useruuid='${uuid}' order by c.created desc offset ${start} limit ${length}`, { type: "SELECT" }) as any[]

        let count = await this.seqz.query(
            `SELECT count(*)
                from users.comments as c LEFT JOIN users.users as u ON c.evaluator=u.uuid LEFT JOIN users.orders AS o ON c.orderuuid=o.uuid
                WHERE c.useruuid='${uuid}'`, { type: "SELECT" }) as any[]

        if (count.length > 0) {
            return { row, count: parseInt(count[0].count), totalrow }
        } else {
            return { row, count: 0, totalrow }
        }
    }

    //19
    public async  findMakeFeed(start: number, length: number) {
        let row = await this.seqz.query(
            `SELECT * FROM(SELECT d.*,u.nickname ,u.avatar ,u.gender,u.birthday,u.popularity,
            row_number() over(partition by d.useruuid) as row FROM users.deed as d
            LEFT JOIN users.users AS u ON d.useruuid = u.uuid
            WHERE d.istimeout is FALSE and d.state is FALSE AND d.type='make' AND d.onetoone is FALSE
            AND d.del is FALSE ORDER BY u.popularity DESC LIMIT ${length} OFFSET ${start}) as t WHERE row=1`,
            { type: "SELECT" }) as any[]

        return row
    }
    //20.查询
    public async findeGaoPractice(obj: any) {
        let res
        //用sql语句查询
        res = await this.seqz.query("select * from users.users ", { type: "SELECT" }) as any[]
        return res;
    }
    //21.插入数据
    public async addUser(obj: any) {
        let res = await this.model().create(obj, { returning: true });
        return res
    }
    //22.修改数据
    public async updateUser(uuid: string, obj: any) {
        let res = await this.model().update(obj, { where: { uuid: uuid } });
        return res
    }
    //23.删除数据
    public async deleteUser(uuid: string) {
        await this.model().destroy({ where: { uuid: uuid } });
    }

    //24.查询没有契约单的用户
    public async findNoDeedUser(uuid: any) {
        let res = await this.seqz.query(
            `SELECT
            *
        FROM
            users.users
        WHERE
            uuid NOT IN (
                SELECT
                    u.uuid
                FROM
                    users.users AS u,
              users.deed as d
                WHERE
              d.uuid='${uuid}'
              AND ST_Distance_Sphere (d.location, u."location") < 5000
            )
        ORDER BY
            random()
        LIMIT 5`, { type: "SELECT" }) as any[]
        return res
    }

}
