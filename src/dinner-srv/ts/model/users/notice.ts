import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "notice"]
const modelName = `${schema}.${table}`

export const defineFunction = function (sequelize: Sequelize) {
    Notice.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        useruuid: DataTypes.UUID,
        fromdeeduuid: DataTypes.UUID,
        todeeduuid: DataTypes.UUID,
        result: DataTypes.ENUM('accept', 'refused'),
        type: DataTypes.ENUM('send', 'receive', 'tohello', 'fromhello', 'audit', 'tonearby', 'fromnearby'),
        reason: DataTypes.TEXT,
        orderuuid: DataTypes.UUID,
        state: DataTypes.BOOLEAN,
        ext: DataTypes.JSONB,
        infodeeduuid: DataTypes.UUID,
        messagetime: DataTypes.TIME,
        created: DataTypes.TIME,
        modified: DataTypes.TIME
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class Notice extends ModelBase {
    private static instance: Notice
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!Notice.instance)
            Notice.instance = new Notice(seqz, modelName)
        return Notice.instance
    }

    /**
     * 添加消息
     * @param obj
     */
    public async  add(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }


    /**
     *修改消息信息
     * @param obj
     * @param uuid
     */
    public async update(obj: any, uuid: string) {
        let [number, res] = await this.model().update(obj, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    /**
     * 主键查询消息详情
     * @param uuid
     */
    public async findByPrimary(uuid: string) {
        let res = await this.model().findByPrimary(uuid)
        return res ? res.get() : undefined
    }

    /**
     * 查询消息
     * @param obj
     */
    public async  findBy(obj: any) {
        let res = await this.model().findAll({ where: obj })
        return res.map(r => r.get())
    }

    public async  findMyInvited(obj: any) {
        let res = await this.seqz.query(`
        SELECT
        *
    FROM
    users.notice AS n,
    users.users AS u
    WHERE
        (
            fromdeeduuid = '${obj.fromdeeduuid}'
            OR todeeduuid = '${obj.fromdeeduuid}'
        )
    AND n. TYPE = 'receive'
    AND n."result" IS NULL
    AND u.uuid = n.useruuid
    AND n.useruuid = '${obj.useruuid}'`, { type: "select" })
        return res
    }

    public async  findMyInvited_pro(obj: any) {
        let res = await this.seqz.query(`
                SELECT
                *
            FROM
            users.notice AS A,
            users.users AS u
            WHERE
                (
                    A .fromdeeduuid = '${obj.fromdeeduuid}'
                    OR A .todeeduuid = '${obj.fromdeeduuid}'
                )
            AND A .useruuid = '${obj.useruuid}'
            AND A ."result" IS NULL
            AND A . TYPE = 'send'
            AND A .useruuid = u.uuid`, { type: "select" })
        return res
    }

    public async  findNearbyInvite(obj: any) {
        let res = await this.seqz.query(`
                    SELECT
                        A .*, u.*
                    FROM
                        users.notice AS A,
                        users.deed AS d,
                        users.users AS u
                    WHERE
                        (
                            A .fromdeeduuid = '${obj.fromdeeduuid}'
                            OR A .todeeduuid = '${obj.fromdeeduuid}'
                        )
                    AND (
                        A .fromdeeduuid = d.uuid
                        OR A .todeeduuid = d.uuid
                    )
                    AND d.uuid != '${obj.fromdeeduuid}'
                    AND A .useruuid = '${obj.useruuid}'
                    AND A ."result" IS NULL
                    AND A . TYPE = 'fromnearby'
                    AND u.uuid = d.useruuid
                `, { type: "select" })
        return res
    }

    public async findByUserPro(useruuid: string, start: number, length: number, type: string) {
        let res
        if (type === "to") {
            res = await this.seqz.query(`
                SELECT
                    n.*, d.uuid AS deeduuid,
                    u.uuid AS anotheruseruuid,
                    u.avatar,
                    u.nickname,
                    o. STATE AS orderState
                FROM
                users.notice AS n
                LEFT JOIN users.deed AS d ON (
                    n.fromdeeduuid = d.uuid
                    OR n.todeeduuid = d.uuid
                )
                LEFT JOIN users.users AS u ON d.useruuid = u.uuid
                LEFT JOIN users.orders AS o ON o.uuid = n.orderuuid
                WHERE
                    n.useruuid = '${useruuid}'
                AND (
                    n. TYPE = 'receive'
                    OR n. TYPE = 'tohello'
                    OR n. TYPE = 'tonearby'
                )
                AND u.uuid != n.useruuid
                ORDER BY
                    n.messagetime DESC OFFSET ${start}
                LIMIT ${length}`, { type: "select" })
        } else if (type === "from") {
            res = await this.seqz.query(`
                SELECT
                    n.*, d.uuid AS deeduuid,
                    u.uuid AS anotheruseruuid,
                    u.avatar,
                    u.nickname,
                    o. STATE AS orderState
                FROM
                users.notice AS n
                LEFT JOIN users.deed AS d ON (
                    n.fromdeeduuid = d.uuid
                    OR n.todeeduuid = d.uuid
                )
                LEFT JOIN users.users AS u ON d.useruuid = u.uuid
                LEFT JOIN users.orders AS o ON o.uuid = n.orderuuid
                WHERE
                    n.useruuid = '${useruuid}'
                AND (
                    n. TYPE = 'send'
                    OR n. TYPE = 'fromhello'
                    OR n. TYPE = 'fromnearby'
                )
                AND u.uuid != n.useruuid
                ORDER BY
                    n.messagetime DESC OFFSET ${start}
                LIMIT ${length}`, { type: "select" })
        } else if (type === "systeam") {
            res = await this.seqz.query(`
            SELECT
                n.*, d.uuid AS deeduuid,
                u.uuid AS anotheruseruuid,
                u.avatar,
                u.nickname,
                o. STATE AS orderState
            FROM
            users.notice AS n
            LEFT JOIN users.deed AS d ON (
                n.fromdeeduuid = d.uuid
                OR n.todeeduuid = d.uuid
            )
            LEFT JOIN users.users AS u ON d.useruuid = u.uuid
            LEFT JOIN users.orders AS o ON o.uuid = n.orderuuid
            WHERE
                n.useruuid = '${useruuid}'
            AND  n.type='audit'
            AND  (u.uuid != n.useruuid or n.fromdeeduuid is NULL)
            ORDER BY
                n.messagetime DESC OFFSET ${start}
                LIMIT ${length}`, { type: "select" })
        } else {
            res = await this.seqz.query(`
            SELECT
                n.*, d.uuid AS deeduuid,
                u.uuid AS anotheruseruuid,
                u.avatar,
                u.nickname,
                o. STATE AS orderState
            FROM
                users.notice AS n
            LEFT JOIN users.deed AS d ON (
                n.fromdeeduuid = d.uuid
                OR n.todeeduuid = d.uuid
            )
            LEFT JOIN users.users AS u ON d.useruuid = u.uuid
            LEFT JOIN users.orders AS o ON o.uuid = n.orderuuid
            WHERE
                n.useruuid = '${useruuid}'
            AND (u.uuid != n.useruuid or n.fromdeeduuid is NULL )
            ORDER BY
                n.messagetime DESC OFFSET ${start}
                LIMIT ${length}`, { type: "select" })
        }
        return res

        // AND ((n. TYPE = 'audit') OR (d1.invalid IS FALSE AND d2.invalid IS FALSE
        //     AND ((d1. STATE IS TRUE AND d2. STATE IS TRUE)
        //     OR (d1.istimeout IS FALSE AND d2.istimeout IS FALSE AND d1. STATE IS FALSE
        //         AND d2. STATE IS FALSE))))
    }

    public async findByUserPro2(useruuid: string, start: number, length: number, type: string) {
        let res
        if (type === "to") {
            res = await this.seqz.query(`SELECT n.*, d2.uuid AS deeduuid,u.uuid AS
        anotheruseruuid,u.avatar,u.nickname,o.state as orderState
        FROM users.notice AS n LEFT JOIN users.deed AS d2 ON n.todeeduuid = d2.uuid
        LEFT JOIN users.deed AS d1 ON n.fromdeeduuid = d1.uuid
        LEFT JOIN users.users AS u ON d1.useruuid = u.uuid
        LEFT JOIN users.orders AS o ON o.uuid = n.orderuuid
        WHERE n.useruuid = '${useruuid}' and n.useruuid= d1.useruuid and u.uuid is not null
        AND (n. RESULT = 'refuse' OR n. RESULT != 'refuse' OR n. RESULT IS NULL OR n. TYPE = 'audit')
        ORDER BY n.messagetime DESC OFFSET ${start} LIMIT ${length}`, { type: "select" })
        } else if (type === "from") {
            res = await this.seqz.query(`SELECT n.*, d2.uuid AS deeduuid,u.uuid AS
            anotheruseruuid,u.avatar,u.nickname,o.state as orderState
            FROM users.notice AS n LEFT JOIN users.deed AS d2 ON n.todeeduuid = d2.uuid
            LEFT JOIN users.deed AS d1 ON n.fromdeeduuid = d1.uuid
            LEFT JOIN users.users AS u ON d1.useruuid = u.uuid
            LEFT JOIN users.orders AS o ON o.uuid = n.orderuuid
            WHERE n.useruuid = '${useruuid}' and n.useruuid= d2.useruuid and u.uuid is not null
            AND (n. RESULT = 'refuse' OR n. RESULT != 'refuse' OR n. RESULT IS NULL OR n. TYPE = 'audit')
            ORDER BY n.messagetime DESC OFFSET ${start} LIMIT ${length}`, { type: "select" })
        } else if (type === "systeam") {
            res = await this.seqz.query(`SELECT n.*, d2.uuid AS deeduuid,u.uuid AS
            anotheruseruuid,u.avatar,u.nickname
            FROM users.notice AS n LEFT JOIN users.deed AS d2 ON n.todeeduuid = d2.uuid
            LEFT JOIN users.deed AS d1 ON n.fromdeeduuid = d1.uuid
            LEFT JOIN users.users AS u ON d1.useruuid = u.uuid
            WHERE n.useruuid = '${useruuid}' and n.fromdeeduuid ISNULL and n.todeeduuid ISNULL
            and u.uuid is not null
            AND (n. RESULT = 'refuse' OR n. RESULT != 'refuse' OR n. RESULT IS NULL OR n. TYPE = 'audit')
            ORDER BY n.messagetime DESC OFFSET ${start} LIMIT ${length}`, { type: "select" })
        } else {
            res = await this.seqz.query(`SELECT n.*, d2.uuid AS deeduuid,u.uuid AS
            anotheruseruuid,u.avatar,u.nickname,o.state as orderState
            FROM users.notice AS n LEFT JOIN users.deed AS d2 ON n.todeeduuid = d2.uuid
            LEFT JOIN users.deed AS d1 ON n.fromdeeduuid = d1.uuid
            LEFT JOIN users.users AS u ON d1.useruuid = u.uuid
            LEFT JOIN users.orders AS o ON o.uuid = n.orderuuid
            WHERE n.useruuid = '${useruuid}' and u.uuid is not null
            AND (n. RESULT = 'refuse' OR n. RESULT != 'refuse' OR n. RESULT IS NULL OR n. TYPE = 'audit')
            ORDER BY n.messagetime DESC OFFSET ${start} LIMIT ${length}`, { type: "select" })
        }
        return res

        // AND ((n. TYPE = 'audit') OR (d1.invalid IS FALSE AND d2.invalid IS FALSE
        //     AND ((d1. STATE IS TRUE AND d2. STATE IS TRUE)
        //     OR (d1.istimeout IS FALSE AND d2.istimeout IS FALSE AND d1. STATE IS FALSE
        //         AND d2. STATE IS FALSE))))
    }

    /**
    * 删除消息
    * @param useruuid
    */
    public async destoryNotice(uuid: string) {
        let res = await this.model().destroy({ where: { uuid: uuid } })
        return res
    }

    /**
     * 修改消息状态
     * @param uuid
     * @param state
     */
    public async updateState(uuid: string, state: boolean) {
        let [number, res] = await this.model().update({ state: state }, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    public async findMyNoticeByState(useruuid: string) {
        let res = await this.seqz.query(`
                SELECT
                    n.*, d.uuid AS deeduuid,
                    u.uuid AS anotheruseruuid,
                    u.avatar,
                    u.nickname
                FROM
                users.notice AS n
                LEFT JOIN users.deed AS d ON (
                    n.fromdeeduuid = d.uuid
                    OR n.todeeduuid = d.uuid
                )
                LEFT JOIN users.users AS u ON d.useruuid = u.uuid
                WHERE
                    n.useruuid = '${useruuid}'
                AND u.uuid != n.useruuid
                AND n."state" IS TRUE
                ORDER BY
                    n.messagetime DESC OFFSET 0
                LIMIT 10`, { type: "select" })
        return res
    }

    public async updateStateByOrder(useruuid: string, orderuuid: string, state: boolean, ext: any) {
        let [number, res] = await this.model().update({ state: state, ext: ext, messagetime: new Date() }, { where: { useruuid: useruuid, orderuuid: orderuuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    public async updateExt(useruuid: string, orderuuid: string, ext: any) {
        let [number, res] = await this.model().update({ ext: ext, messagetime: new Date() }, { where: { useruuid: useruuid, orderuuid: orderuuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

}
