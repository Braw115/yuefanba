import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "deed"]
const modelName = `${schema}.${table}`
const onedate = 24 * 3600 * 1000

export const defineFunction = function (sequelize: Sequelize) {
    Deed.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        useruuid: DataTypes.UUID,
        location: DataTypes.GEOGRAPHY,
        gender: DataTypes.INTEGER,
        latitude: DataTypes.CHAR(128),
        longitude: DataTypes.CHAR(128),
        payway: DataTypes.CHAR(16),
        mealtime: DataTypes.RANGE(),
        deposit: DataTypes.INTEGER,
        getdeposit: DataTypes.RANGE(),
        agerange: DataTypes.TEXT,
        type: DataTypes.CHAR(16),
        istimeout: DataTypes.BOOLEAN,
        state: DataTypes.BOOLEAN,
        address: DataTypes.CHAR(64),
        restaurant: DataTypes.CHAR(32),
        result: DataTypes.CHAR(16),
        onetoone: DataTypes.BOOLEAN,
        age: DataTypes.RANGE(),
        hide: DataTypes.BOOLEAN,
        ext: DataTypes.JSONB,
        invalid: DataTypes.BOOLEAN,
        del: DataTypes.BOOLEAN,
        delstate: DataTypes.BOOLEAN,
        created: DataTypes.TIME,
        modified: DataTypes.TIME
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class Deed extends ModelBase {
    private static instance: Deed
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!Deed.instance)
            Deed.instance = new Deed(seqz, modelName)
        return Deed.instance
    }

    /**
     * 添加契约
     * @param obj
     */
    public async  add(obj: any) {
        await this.seqz.query(
            `INSERT INTO users.Deed (uuid,gender,useruuid,latitude,
                longitude,location,payway,mealtime,type,result,
                state,address,restaurant,onetoone,deposit,getdeposit,agerange)
            VALUES
                (
                    uuid_generate_v4(),${obj.gender},'${obj.useruuid}','${obj.latitude}','${obj.longitude}',ST_GeomFromText (
                        '${obj.point}',
                        4326
                    ),'${obj.payway}','${obj.mealtime}','${obj.type}','${obj.result}',
                    ${obj.state},'${obj.address}','${obj.restaurant}',${obj.onetoone},
                    ${obj.deposit},'${obj.getposit}', '${obj.agerange}'
            ) `, { type: "insert", model: this.model(), raw: true })
        let res = await this.model().findOne({ order: [["created", "desc"]] })
        return res.get()
    }

    public async  addNoAddress(obj: any) {
        await this.seqz.query(
            `INSERT INTO users.Deed (uuid,gender,useruuid,latitude,
                longitude,location,payway,mealtime,type,result,
                state,onetoone,deposit,getdeposit,agerange)
            VALUES
                (
                    uuid_generate_v4(),${obj.gender},'${obj.useruuid}','${obj.latitude}','${obj.longitude}',ST_GeomFromText (
                        '${obj.point}',
                        4326
                    ),'${obj.payway}','${obj.mealtime}','${obj.type}','${obj.result}',
                    ${obj.state},${obj.onetoone},
                    ${obj.deposit},'${obj.getposit}','${obj.agerange}'
                ) `, { type: "insert", model: this.model(), raw: true })
        let res = await this.model().findOne({ order: [["created", "desc"]] })
        return res.get()
    }

    public async  updateLocation(obj: any) {
        await this.seqz.query(
            `update users.Deed set location = ST_GeomFromText (
                '${obj.point}',
                4326
            ) where uuid='${obj.uuid}'`, { type: "update", model: this.model(), raw: true })
    }

    public async created(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }

    /**
     *修改地址
     * @param obj
     */
    public async updatedeed(obj: any, uuid: string) {
        return await this.seqz.query(
            `update users.Deed set location=${obj} where uuid='${uuid}'`) as any[]
    }

    /**
     *修改契约单信息
     * @param obj
     * @param uuid
     */
    public async update(obj: any, uuid: string) {
        let [number, res] = await this.model().update(obj, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    public async findAndUpdateByObj(obj1: any, obj2: any) {
        let [number, res] = await this.model().update(obj1, { where: obj2, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    /**
     * 主键查询契约单详情
     * @param uuid
     */
    public async findByPrimary(uuid: string) {
        let res = await this.model().findByPrimary(uuid)
        return res ? res.get() : undefined
    }

    /**
     * 根据用户查询契约单
     * @param useruuid
     */
    public async findByUser(useruuid: string) {
        let obj = {
            useruuid: useruuid,
            del: "false"
        }
        let res = await this.model().findAll({ where: obj })
        return res.map(r => r.get())
    }

    /**
     * 查询契约单
     * @param obj
     */
    public async findBy(obj: any) {
        let res = await this.model().findAll(obj)
        return res.map(r => r.get())
    }

    public async findByMealtime(useruuid: string, mealtime: any) {
        let res = await this.seqz.query(
            ` SELECT * from users.deed where useruuid='${useruuid}' and del is false
            and mealtime && '${mealtime}'LIMIT 10 OFFSET 0 `,
            { plain: false }) as any[]
        return res[0]
    }

    /**
     * 查询契约单
     * @param obj
     */
    public async findByCount(obj: any) {
        let res = await this.model().count(obj)
        return res
    }

    /**
     *查找所有订单
     * @param point
     */
    public async findMakeAll(city: string, mealtime: any, type: string, limit: number, cursor: number, start: number, end: number, uuid: string) {
        start = start - onedate
        let res = await this.seqz.query(
            ` SELECT
            u.*,C.uuid as deeduuid
        FROM
            (
                SELECT
                    *
                FROM
                    users.deed
                WHERE
                STATE IS FALSE
                AND del IS FALSE
                AND hide IS FALSE
                AND istimeout IS FALSE
                AND (deed.mealtime<> '${mealtime}'OR deed.mealtime='${mealtime}')
                AND TYPE = '${type}'
            ) AS C, users.users as u
        WHERE
          u.uuid = c.useruuid
          and u.city='${city}'
          and u.birthday >='${start}'
          and u.birthday <='${end}'
        ORDER BY
            c.created ASC
        LIMIT ${limit} OFFSET ${cursor}  `, { plain: false }) as any[]
        return res[0]
    }

    /**
     *根据类型查找契约单
     * @param point
     * @param type
     */
    public async findByMake(city: string, mealtime: any, type: string, limit: number, cursor: number, start: number, end: number, gender: number, uuid: string) {
        start = start - onedate
        let res = await this.seqz.query(
            ` SELECT
            u.*,C.uuid as deeduuid
        FROM
            (
                SELECT
                    *
                FROM
                    users.deed
                WHERE
                STATE IS FALSE
                AND del IS FALSE
                AND istimeout IS FALSE
                AND (deed.mealtime<> '${mealtime}'OR deed.mealtime='${mealtime}')
                AND TYPE = '${type}'
            ) AS C, users.users as u
        WHERE
          u.uuid = c.useruuid
          and u.city='${city}'
          and u.gender = ${gender}
          and u.birthday >='${start}'
         and u.birthday <='${end}'
        ORDER BY
            c.created ASC
        LIMIT ${limit} OFFSET ${cursor}  `, { plain: false }) as any[]
        return res[0]
    }

    public async findSpendAll(point: any, city: string, mealtime: any, type: string, limit: number, cursor: number, start: number, end: number, uuid: string) {
        start = start - onedate
        let res = await this.seqz.query(
            ` SELECT
            u.*,C.uuid as deeduuid
        FROM
            (
                SELECT
                    *, ST_Distance_Sphere (
                        deed."location",
                        ST_GeomFromText ('${point}', 4326)
                    ) AS distance
                FROM
                    users.deed
                WHERE
                STATE IS FALSE
                AND del IS FALSE
                AND istimeout IS FALSE
                AND (deed.mealtime<> '${mealtime}'OR deed.mealtime='${mealtime}')
                AND TYPE = '${type}'
            ) AS C, users.users as u
        WHERE
          u.uuid = c.useruuid
          and u.city='${city}'
          and u.birthday >='${start}'
          and u.birthday <='${end}'
        ORDER BY
            c.created ASC
        LIMIT ${limit} OFFSET ${cursor}  `, { plain: false }) as any[]
        return res[0]
    }

    /**
     *根据类型查找契约单
     * @param point
     * @param type
     */
    public async findBySpend(point: any, city: string, mealtime: any, type: string, limit: number, cursor: number, start: number, end: number, gender: number, uuid: string) {
        start = start - onedate
        let res = await this.seqz.query(
            ` SELECT
            u.*,C.uuid as deeduuid
        FROM
            (
                SELECT
                    *, ST_Distance_Sphere (
                        deed."location",
                        ST_GeomFromText ('${point}', 4326)
                    ) AS distance
                FROM
                    users.deed
                WHERE
                STATE IS FALSE
                AND del IS FALSE
                AND istimeout IS FALSE
                AND (deed.mealtime<> '${mealtime}'OR deed.mealtime='${mealtime}')
                AND TYPE = '${type}'
            ) AS C, users.users as u
        WHERE
          u.uuid = c.useruuid
          and u.city='${city}'
          and u.gender = ${gender}
          and u.birthday >='${start}'
         and u.birthday <='${end}'
        ORDER BY
            c.created ASC
        LIMIT ${limit} OFFSET ${cursor}  `, { plain: false }) as any[]
        return res[0]
    }

    public async findNearbyAll(city: string, mealtime: any, type: string, limit: number, cursor: number, start: number, end: number, point: any, uuid: string) {
        start = start - onedate
        let res = await this.seqz.query(
            ` SELECT
            u.*,C.uuid as deeduuid
        FROM
            (
                SELECT *
                , ST_Distance_Sphere (
                    deed."location",
                    ST_GeomFromText ('${point}', 4326)
                ) AS distance
                FROM
                    users.deed
                WHERE
                STATE IS FALSE
                AND hide IS FALSE
                AND del IS FALSE
                AND istimeout IS FALSE
                AND useruuid !='${uuid}'
                AND (deed.mealtime<> '${mealtime}'OR deed.mealtime='${mealtime}')
                AND TYPE = '${type}'
            ) AS C, users.users as u
        WHERE
          u.uuid = c.useruuid
          and u.city='${city}'
          and u.birthday >='${start}'
          and u.birthday <='${end}'
          and C .distance < 50000
        ORDER BY
            c.created ASC
        LIMIT ${limit} OFFSET ${cursor}  `, { plain: false }) as any[]
        return res[0]
    }

    public async findByNearby(city: string, mealtime: any, type: string, limit: number, cursor: number, start: number, end: number, gender: number, point: any, uuid: string) {
        start = start - onedate
        let res = await this.seqz.query(
            ` SELECT
            u.*,C.uuid as deeduuid
        FROM
            (
                SELECT
                    * , ST_Distance_Sphere (
                    deed."location",
                    ST_GeomFromText ('${point}', 4326)
                ) AS distance
                FROM
                    users.deed
                WHERE
                STATE IS FALSE
                AND hide IS FALSE
                AND del IS FALSE
                AND istimeout IS FALSE
                AND useruuid !='${uuid}'
                AND (deed.mealtime<> '${mealtime}'OR deed.mealtime='${mealtime}')
                AND TYPE = '${type}'
            ) AS C, users.users as u
        WHERE
          u.uuid = c.useruuid
          and u.city='${city}'
          and u.gender = ${gender}
          and u.birthday >='${start}'
         and u.birthday <='${end}'
         and C .distance < 50000
        ORDER BY
            c.created ASC
        LIMIT ${limit} OFFSET ${cursor}  `, { plain: false }) as any[]
        return res[0]
    }

    /**
     *查找所有订单
     * @param point
     */
    public async findAllNear(point: any, type: string, limit: number, cursor: number, start: number, end: number, uuid: string) {
        start = start - onedate
        let res = await this.seqz.query(
            ` SELECT
            C.*,u.avatar,u.nickname,u.gender,u.birthday
        FROM
            (
                SELECT
                    *, ST_Distance_Sphere (
                        deed."location",
                        ST_GeomFromText ('${point}', 4326)
                    ) AS distance
                FROM
                    users.deed
                WHERE
                STATE IS FALSE
                AND hide IS FALSE
                AND del IS FALSE
                AND istimeout IS FALSE
                AND TYPE = '${type}'
            ) AS C, users.users as u
        WHERE
          u.uuid = c.useruuid
          and u.birthday >='${start}'
         and u.birthday <='${end}'
         and C .distance < 300000
        ORDER BY
            c.created ASC
        LIMIT ${limit} OFFSET ${cursor}  `, { plain: false }) as any[]
        return res[0]
    }

    /**
     *查找所有订单
     * @param point
     */
    public async findAllNearByType(point: any, type: string, limit: number, cursor: number, start: number, end: number, uuid: string, orderby: string) {
        start = start - onedate
        let res = await this.seqz.query(
            ` SELECT
            C.*,u.avatar,u.nickname,u.gender,u.birthday
        FROM
            (
                SELECT
                    *, ST_Distance_Sphere (
                        deed."location",
                        ST_GeomFromText ('${point}', 4326)
                    ) AS distance
                FROM
                    users.deed
                WHERE
                STATE IS FALSE
                AND hide IS FALSE
                AND del IS FALSE
                AND istimeout IS FALSE
                AND TYPE = '${type}'
            ) AS C, users.users as u
        WHERE
          u.uuid = c.useruuid
          and u.birthday >='${start}'
         and u.birthday <='${end}'
         and C .distance < 300000
        ORDER BY
            c.${orderby} ASC
        LIMIT ${limit} OFFSET ${cursor}  `, { plain: false }) as any[]
        return res[0]
    }

    /**
     *根据类型查找契约单
     * @param point
     * @param type
     */
    public async findByTypeNearByType(point: any, type: string, limit: number, cursor: number, start: number, end: number, gender: number, uuid: string, ordrtby: string) {
        start = start - onedate
        let res = await this.seqz.query(
            ` SELECT
            C.*,u.avatar,u.nickname,u.gender,u.birthday
        FROM
            (
                SELECT
                    *, ST_Distance_Sphere (
                        deed."location",
                        ST_GeomFromText ('${point}', 4326)
                    ) AS distance
                FROM
                    users.deed
                WHERE
                STATE IS FALSE
                AND hide IS FALSE
                AND del IS FALSE
                AND istimeout IS FALSE
                AND TYPE = '${type}'
            ) AS C, users.users as u
        WHERE
          u.uuid = c.useruuid
          and u.gender = ${gender}
          and u.birthday >='${start}'
          and u.birthday <='${end}'
            and C .distance < 300000
        ORDER BY
            C.${ordrtby} ASC
        LIMIT ${limit} OFFSET ${cursor}  `, { plain: false }) as any[]


        return res[0]
    }

    /**
     *根据类型查找契约单
     * @param point
     * @param type
     */
    public async findByTypeNear(point: any, type: string, limit: number, cursor: number, start: number, end: number, gender: number, uuid: string) {
        start = start - onedate
        let res = await this.seqz.query(
            ` SELECT
            C.*,u.avatar,u.nickname,u.gender,u.birthday
        FROM
            (
                SELECT
                    *, ST_Distance_Sphere (
                        deed."location",
                        ST_GeomFromText ('${point}', 4326)
                    ) AS distance
                FROM
                    users.deed
                WHERE
                STATE IS FALSE
                AND hide IS FALSE
                AND del IS FALSE
                AND istimeout IS FALSE
                AND TYPE = '${type}'
            ) AS C, users.users as u
        WHERE
          u.uuid = c.useruuid
          and u.gender = ${gender}
          and u.birthday >='${start}'
         and u.birthday <='${end}'
            and C .distance < 300000
        ORDER BY
            c.created ASC
        LIMIT ${limit} OFFSET ${cursor}  `, { plain: false }) as any[]


        return res[0]
    }

    /**
    * 删除申请单
    * @param uuid
    */
    public async destoryDeed(uuid: string) {
        let res = await this.model().destroy({ where: { uuid: uuid } })
        return res
    }

    /**
     * crm查找所有契约单
     * @param obj
     * @param cursor
     * @param limit
     */
    public async findAllDeed(obj: any, cursor: number, limit: number) {
        let res = await this.model().findAll(
            {
                where: obj,
                limit: limit,
                offset: cursor,
                order: [["created", "desc"]]
            }
        )
        return res.map(r => r.get())
    }

    /**
     * crm查找契约单总条数
     * @param obj
     */
    public async findCountDeed(obj: any) {
        let res = await this.model().count(
            {
                where: obj
            }
        )
        return res
    }

    //按照条件查找契约单
    public async findByObj(obj: any) {
        let res = await this.model().findAll({ where: obj })
        return res.map(r => r.get())
    }

    public async  insert(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }

    //删除契约单
    public async delDeed(uuid: string) {
        await this.model().update({ del: true }, { where: { uuid } })
    }

    //删除契约单
    public async delStateDeed(uuid: string) {
        await this.model().update({ delstate: false }, { where: { uuid } })
    }
}
