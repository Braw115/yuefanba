
小程序契约单
1、查询契约单
方法：get
get: http://192.168.0.71/app/deed
param:{
	city:城市
	type:类型（nearby：附近, spend：我要花钱, make：我要赚钱）
	latitude:经度
	longitude:纬度
	start:页数
	length:长度
}
示例：http://192.168.0.71/app/deed
返回值：{
	deedList：[
	{},
	{}
	]
}

2、契约单详情
方法：get
get: http://192.168.0.71/app/deed:uuid
param:{
	uuid:deed的uuid
}
示例：http://192.168.0.71/app/deed:21121312132
返回值：{
	deed:{
		
	}
}

3、查找我要赚钱的契约单
方法：get
get: http://192.168.0.71/app/deed/make
param:{
	city:城市
	deeduuid:uuid
	start:
	length:
}
示例：http://192.168.0.71/app/deed/make
返回值：{
	deeds:[
	{},
	{}
	]
}

4、创建契约单
方法：post
post: http://192.168.0.71/app/deed
param:{
	latitude:经度
	longitude:纬度
	agerange:年龄区间
	payaway：支付方式
	type：类型（make,spend,nearby）
	state:状态(true:已匹配，false:未匹配)
	address：地址
	restaurant：餐厅
	result：结果
	onetoone：一对一(默认为false)
	posit：赏金（type为spend传）
	getposit：诚意金（type为make传）
}
示例：http://192.168.0.71/app/deed
返回值：{
	deed:{
		
	}
}

5、修改契约单
方法 put
put: http://192.168.0.71/app/deed:uuid
param：{
	uuid：uuid
	result：结果
}
示例：http://192.168.0.71/app/deed:1123132132
返回值：{
	deed:{
		
	}
}

消息
6、创建消息
方法：post
post: http://192.168.0.71/app/notice
param:{
	reason:原因
	type:类型(send/receive/tohello/fromhello/audit
)
	result:结果(accept/refuse)
}
示例：http://192.168.0.71/app/notice
返回值：{
	msg:"ok"
}

7、约她
方法：post
post: http://192.168.0.71/app/notice/invite
param:{
	deeduuid
	useruuid
}
示例：http://192.168.0.71/app/notice/invite
返回值：{
	msg:"ok"
}

8、邀请他看我
方法：post
post: http://192.168.0.71/app/notice/receive
param:{
	fromdeeduuid
	todeeduuid
	useruuid
}
示例：http://192.168.0.71/app/notice/receive
返回值：{
	msg:"ok"
}

9、消息详情
方法：get
get: http://192.168.0.71/app/notice:uuid
param:{
	uuid
}
示例：http://192.168.0.71/app/notice/1231131123
返回值：{
	notice：{
		
	}
}

10、我的消息
方法：get
get: http://192.168.0.71/app/notice/byuser
param:{
}
示例：http://192.168.0.71/app/notice/byuser
返回值：{
	notice：[
	{},
	{}
	]
}

11、删除消息
方法：delete
delete: http://192.168.0.71/app/notice:uuid
param：{
	uuid
}
示例：http://192.168.0.71/app/notice/1515645123135
返回值：{
	msg:"ok"
}

订单
12、创建订单
方法：post
post: http://192.168.0.71/app/order
param:{
	deeduuid
	result:结果（refused/receive）
	noticeuuid
}
示例：http://192.168.0.71/app/order
返回值：{
	msg:"ok"
}

13、创建订单（帮助创建契约单）
方法：post
post: http://192.168.0.71/app/order/new
param:{
	deeduuid
}
示例：http://192.168.0.71/app/order/new
返回值：{
	msg:"ok"
}

14、修改订单
方法：put
put: http://192.168.0.71/app/order:uuid
param:{
	uuid
	orderuuid
	result:结果（refused/receive）
}
示例：http://192.168.0.71/app/order/23135465351513
返回值：{
	msg:"ok"
}

15、订单详情
方法: get
get: http://192.168.0.71/app/order:uuid
param:{
	uuid
}
示例：http://192.168.0.71/app/order/23135465351513
返回值：{
	order:{
		
	}
}

16、我的订单
方法: get
get: http://192.168.0.71/app/order/byuser
param:{
}
示例：http://192.168.0.71/app/order/byuser
返回值：{
	order:[
	{},
	{}
	]
}

17、删除订单
方法: delete
delete: http://192.168.0.71/app/order:uuid
param:{
	uuid
}
示例：http://192.168.0.71/app/order/23135465351513
返回值：{
	msg:"ok"
}

餐厅列表
18、查询餐厅列表
方法：get
get: http://192.168.0.71/app/restaurant
param：{
	type:类型（location/key）
	city:城市(type 为key必传)
	key:关键字(type 为key必传)
	latitude:经度（type 为location必传)
	longitude:纬度（type 为location必传)
	start
	length
}
示例：http://192.168.0.71/app/restaurant
返回值：{
	restaurants:[
	{},
	{}
	]
}

充值与回调
19、充值
方法：post
post: http://192.168.0.71/app/wxpay/paydeposit
param：{
	pay:充值金额（单位元）
}
示例：http://192.168.0.71/app/wxpay/paydeposit
返回值：{
	param：{
		appId: appid,
        timeStamp: timestamp,
        nonceStr: md5sum(`${randomInt(0, 9999999)}`),
        package: "prepay_id=" + prepay_id,
        signType: "MD5"
		paySign: "asdasdasdasdasqe14dsada"
	}
}

20、提现
方法：post
post: http://192.168.0.71/app/wxpay/businesspay
param:{
	useruuid
	pay: 提款金额
}
示例：http://192.168.0.71/app/wxpay/businesspay
返回值：{
	msg: "吃货币提现成功!"
}

用户查询
21、查找用户列表
方法：get
get: http://192.168.0.71/appusers/list
param:{
	city:
	agerang:年龄区间
	sex
	start
	length
}
示例：http://192.168.0.71/appusers/list
返回值：{
	users:[
	{},
	{}
	]
}

22、查找热门主播
方法：get
get: http://192.168.0.71/appusers/hot
param:{
	city
	start
	length
}
示例：http://192.168.0.71/appusers/hot
返回值：{
	users:[
	{},
	{}
	]
}

crm契约单
23、契约单列表
方法: get
get: http://192.168.0.71/crm/deed
param{
	state:状态（true/false）
	type：类型（make/send/nearby）
	result:结果（neither：都没去，both：已完成，either：ta没去，me：我没去）
	address：地址
	restaurant：餐厅
	start
	length
}
示例：http://192.168.0.71/crm/deed
返回值：{
	deedList: [
	{},
	{}
	]
}

24、契约单详情
方法：get
get: http://192.168.0.71/crm/deed/:uuid
param:{
	uuid:deed的uuid
}
示例：http://192.168.0.71/crm/deed:21121312132
返回值：{
	deed:{
		
	}
}

25、创建契约单
方法：post
post: http://192.168.0.71/crm/deed
param:{
	latitude:经度
	longitude:纬度
	agerange:年龄区间
	payaway：支付方式
	type：类型（make,spend,nearby）
	state:状态(true:已匹配，false:未匹配)
	address：地址
	restaurant：餐厅
	result：结果
	onetoone：一对一(默认为false)
	posit：赏金（type为spend传）
	getposit：诚意金（type为make传）
}
示例：http://192.168.0.71/crm/deed
返回值：{
	deed:{
		
	}
}

聊天
26、我的聊天记录
方法：get
get: http://192.168.0.71:5000/app/chat/list
param:{
	useruuid
}
示例：http://192.168.0.71:5000/app/chat/list?useruuid=32132312312312
返回值：{
	bannerList:[
	{},
	{}
	]
}

27、聊天详情
方法：get
get: http://192.168.0.71:5000/app/chat/:uuid
param:{
	uuid
}
示例：http://192.168.0.71:5000/app/chat/1213216545646
返回值：{
	chatRecord:{}
}

28、聊天
方法：put
put: http://192.168.0.71:5000/app/chat/:uuid
param：{
	chat:聊天内容
	uuid:
}
示例：http://192.168.0.7:5000/app/chat/:uuid
返回值：{
	chatRecord:{}
}

29、删除聊天
方法：delete
delete: http://192.168.0.7:5000/app/chat/:uuid
param:{
	uuid
}
示例：http://192.168.0.71:5000/app/chat/1213216545646
返回值：{
	msg:"ok"
}













