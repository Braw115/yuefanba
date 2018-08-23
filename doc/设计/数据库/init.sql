CREATE EXTENSION postgis;

UPDATE pg_database
SET datistemplate = TRUE
WHERE
	datname = 'postgres';

GRANT ALL ON geometry_columns TO PUBLIC;

GRANT ALL ON spatial_ref_sys TO PUBLIC;

--create database inviteddinner with owner='postgres';
CREATE SCHEMA extensions;

CREATE extension
IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

alter database postgres set search_path to "$user",public,extensions;
--VACUUM FREEZE;

CREATE
OR REPLACE FUNCTION update_modified () RETURNS TRIGGER AS $$
BEGIN
	NEW .modified = now() ; RETURN NEW ;
END ; $$ LANGUAGE 'plpgsql';


create schema users;

-- 表：用户
-- drop table if exists users.users;
create table if not exists users.users (
	uuid		uuid  primary key,
	openid      varchar(36),		
	nickname	varchar(32),		--昵称
	longitude	varchar(32),				--经度
	latitude	varchar(32),				--纬度
	city		varchar(32),		--位置
	phone		varchar(16), 		--绑定的手机号/后台管理 用户名
	location	geometry(POINT,4326),
	personality	text[],				--形象展示
	album		text[],				--相册
	avatar		text,				--头像
	attestvideo	text,				--认证视频
	gender		integer,			--性别	（1男、0女）
	birthday	bigint,		--出生年月，
	height		FLOAT,				--身高
	balance		integer,			--剩余吃货币
	popularity	integer,			--人气值
	role		varchar(16),		--权限 root、admin
	status		varchar(16),		--视频审核状态
	password	varchar(36),        --密码
	notice		varchar(8),			--服务通知的开关 on\off
	salt        varchar(256),		--密码加密
	ext         jsonb,
	created 	timestamp DEFAULT current_timestamp,
	modified 	timestamp DEFAULT current_timestamp
);
CREATE TRIGGER update_users_users_modified BEFORE UPDATE ON users.users FOR EACH ROW EXECUTE PROCEDURE update_modified();
ALTER TABLE users.users OWNER to postgres;




INSERT INTO "users"."users" (
	uuid,
	phone,
	PASSWORD,
	salt,
	ROLE
)
VALUES
	(
		'ad23f190-eb1f-45ad-bd6f-81411ed7114a',
		'root',
		'05115fc0db575df30e06af8cad8072be',
		'8RWfyMQdzjo1fM9PgxNf1A==',
		'root'
	);
     --密码：123456
	 
-- 表：契约表
create table if not exists users.deed (
	uuid		uuid  primary key,
	useruuid	uuid,				--用户uuid
	latitude 	VARCHAR(128),		--纬度
	longitude	VARCHAR(128),		--经度
	location	geometry(POINT,4326),--位置
	payway		varchar(16),		--付款方	AA-AA制/ME-我支付
	mealtime	int8range,		--契约开始时间
	getdeposit	int4range,		--赏金范围
	agerange	text,		--年龄段
	deposit		integer,			--诚意/打赏金
	type		varchar(16),		--契约单类型 spend-我要约饭 make-我要赚钱 nearby-附近约饭
	istimeout	boolean default false,--是否过期，true-过期，false-未过期
	state		boolean default false,	--匹配状态	true-已匹配 false-未匹配
	address		varchar(64),		--餐厅地址
	restaurant	varchar(32),		--约饭餐厅
	result		varchar(16),		--约饭结果 neither-都没去 both-已完成 either-他没去 me-我没去
	onetoone	boolean default false,	--是否是指定人契约单，true-指定人 false-非指定人	
	ext         jsonb,
	age			bigint,
	hide		boolean default false,	--是否隐藏（默认不隐藏） --用于清除地理位置
	invalid		boolean default false,	--是否已关闭（默认不隐藏） --用于隐藏消息已经有进行订单时其他的邀请信息
	gender		integer,
	del			boolean default false, --false 未删除 --true 已删除
	created 	timestamp DEFAULT current_timestamp,
	modified 	timestamp DEFAULT current_timestamp
);
CREATE TRIGGER update_users_deed_modified BEFORE UPDATE ON users.deed FOR EACH ROW EXECUTE PROCEDURE update_modified();
ALTER TABLE users.deed OWNER to postgres;

-- 表：订单表
create table if not exists users.orders (
	uuid		uuid  primary key,
	deeduuid1	uuid,				--契约单1
	deeduuid2	uuid,				--契约单2
	useruuid1	uuid,				--用户1
	useruuid2	uuid,				--用户2
	state		varchar(8),			--订单状态 on-未完成 off-已完成
	type		varchar(16),		--订单类型，either-单方评论 neither-双方未评 unusual-争议评 normal-正常关闭
	coin		integer,			--吃货币总额
	player		uuid,				--支付人uuid
	starttime	int8range,			--订单吃饭时间
	location	text,				--吃饭地点
	imgarr		text[], 			--聊天记录图片
	ext         jsonb,
	created 	timestamp DEFAULT current_timestamp,
	modified 	timestamp DEFAULT current_timestamp
);
CREATE TRIGGER update_users_orders_modified BEFORE UPDATE ON users.orders FOR EACH ROW EXECUTE PROCEDURE update_modified();
ALTER TABLE users.orders OWNER to postgres;

-- 表：轮播图表
create table if not exists users.banner (
	uuid		uuid  primary key,
	img			varchar(64),	--图片地址
	url			varchar(64),	--连接地址
	description	text,			--描述
	priority	integer,		--优先级 1、2、3....
	state		boolean,		--上下架状态	true-上线，false-下线
	ext         jsonb,
	created 	timestamp DEFAULT current_timestamp,
	modified 	timestamp DEFAULT current_timestamp
);
CREATE TRIGGER update_users_banner_modified BEFORE UPDATE ON users.banner FOR EACH ROW EXECUTE PROCEDURE update_modified();
ALTER TABLE users.banner OWNER to postgres;


-- 表：评论表
create table if not exists users.comments (
	uuid		uuid  primary key,
	useruuid 	uuid,	--评论对象
	content		text,	--评论内容
	level		integer,	--星级
	evaluator	uuid,	--评论者
	orderuuid	uuid,	--订单uuid
	ext         jsonb,
	created 	timestamp DEFAULT current_timestamp,
	modified 	timestamp DEFAULT current_timestamp
);
CREATE TRIGGER update_users_comment_modified BEFORE UPDATE ON users.comments FOR EACH ROW EXECUTE PROCEDURE update_modified();
ALTER TABLE users.comments OWNER to postgres;

-- 表：申诉表
create table if not exists users.appeal (
	uuid		uuid  primary key,
	useruuid 	uuid,	--申诉人
	orderuuid	uuid,	--订单uuid
	content		text,	--申诉内容
	appealeduuid	uuid,--被申诉人
	ext         jsonb,
	created 	timestamp DEFAULT current_timestamp,
	modified 	timestamp DEFAULT current_timestamp
);
CREATE TRIGGER update_users_appeal_modified BEFORE UPDATE ON users.appeal FOR EACH ROW EXECUTE PROCEDURE update_modified();
ALTER TABLE users.appeal OWNER to postgres;


-- 表：收藏表
create table if not exists users.favorite (
	uuid		uuid  primary key,
	useruuid 	uuid,	--收藏者
	favoriteuuid	uuid,	--收藏对象
	ext         jsonb,
	created 	timestamp DEFAULT current_timestamp,
	modified 	timestamp DEFAULT current_timestamp
);
CREATE TRIGGER update_users_favorite_modified BEFORE UPDATE ON users.favorite FOR EACH ROW EXECUTE PROCEDURE update_modified();
ALTER TABLE users.favorite OWNER to postgres;


-- 表：通知表
create table if not exists users.notice (
	uuid		uuid  primary key,
	useruuid	uuid,   --接收消息UUID
	fromdeeduuid uuid,	--发送通知者契约单uuid
	todeeduuid	uuid,	--接收通知者契约单uuid
	reason		text,	--原因
	orderuuid	uuid,	--订单uuid
	type		varchar(16),	--收藏类型	send-发送邀请 receive-接收邀请	tohello-打招呼 fromhello-收到打招呼 
	result		varchar(16),	--消息结果	accept-接受 refuse-拒绝
	state		boolean,		--是否已读
	ext         jsonb,
	messagetime	timestamp DEFAULT current_timestamp,
	created 	timestamp DEFAULT current_timestamp,
	modified 	timestamp DEFAULT current_timestamp
);
CREATE TRIGGER update_users_notice_modified BEFORE UPDATE ON users.notice FOR EACH ROW EXECUTE PROCEDURE update_modified();
ALTER TABLE users.notice OWNER to postgres;


-- 表：聊天记录表
create table if not exists users.chatrecord (
	uuid		uuid  primary key,
	orderuuid	uuid,	--订单uuid
	useruuid1 	uuid,	--聊天者A
	useruuid2	uuid,	--聊天者B
	content		jsonb,--聊天内容 
	ext         jsonb,
	created 	timestamp DEFAULT current_timestamp,
	modified 	timestamp DEFAULT current_timestamp
);
CREATE TRIGGER update_users_chatrecord_modified BEFORE UPDATE ON users.chatrecord FOR EACH ROW EXECUTE PROCEDURE update_modified();
ALTER TABLE users.chatrecord OWNER to postgres;


-- 表：支付记录表
create table if not exists users.paylog (
	id          serial primary key,
	useruuid	uuid,	--支付者uuid
	type 		varchar(16),	--支付类型，recharge-充值 withdraw-提现	pay-契约花费 back-订单回退
	deeduuid	uuid,	--契约单uuid
	orderuuid	uuid,	--订单uuid 
	coin		integer,	--交易数量
	description	text,		--描述
	ext         jsonb,
	created 	timestamp DEFAULT current_timestamp	
);
CREATE TRIGGER update_users_paylog_modified BEFORE UPDATE ON users.paylog FOR EACH ROW EXECUTE PROCEDURE update_modified();
ALTER TABLE users.paylog OWNER to postgres;


-- 表：操作记录表
create table if not exists users.crmlog (
	id          serial primary key,
	useruuid	uuid,
	ip          varchar(36),			--操作人IP
	phone       varchar(12),			--手机号
	operation   text,
	ext			jsonb,					--扩展字段
	created 	timestamp DEFAULT current_timestamp
);
CREATE TRIGGER update_users_crmlog_modified BEFORE UPDATE ON users.crmlog FOR EACH ROW EXECUTE PROCEDURE update_modified();
ALTER TABLE users.crmlog OWNER to postgres;


-- 表：系统设置
-- drop table if exists users.system;
create table if not exists users.system (
	key	    varchar(30),--设置类型 check(price,headsetprice,deposit,timeout,remind)
	value     jsonb,--设置内容
	ext			jsonb,					--扩展字段
	created 	timestamp DEFAULT current_timestamp,
	modified 	timestamp DEFAULT current_timestamp
);
CREATE TRIGGER update_users_system_modified BEFORE UPDATE ON users.system FOR EACH ROW EXECUTE PROCEDURE update_modified();
ALTER TABLE users.system OWNER to postgres;

INSERT INTO "users"."system" (key,value) VALUES ('remind', '{"secret": "4312dda3131", "appkey": "adasadasdasdas", "templateid": "fsdfasdfsdfds"}');	--信息验证码
INSERT INTO "users"."system" (key,value) VALUES ('pay', '{"proportion": "10","recharge":"[\"100\",\"200\",\"500\",\"1000\"]","least":"100"}');		--充值相关设置，proportion-兑换比例，recharge-充值选项，least-最低提现
INSERT INTO "users"."system" (key, value) VALUES ('orderstimeout', '{"timeout": "72"}');	--订单超时时间
INSERT INTO "users"."system" (key, value) VALUES ('deposit', '{"deposit": "50"}');--诚意金




	 
