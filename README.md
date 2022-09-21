# chrome extension

## 功能介绍

1. 用户先登录 企查查
2. 用户访问执中基金页，执中浏览器扩展激活
3. 执中浏览器扩展请求企查查对应的基金页发送给后端接口
4. 后端接口解析内容提取出信息对比结果
5. 执中浏览器扩展接受对比结果展示

## 参数

请求参数：

```json
{
	"entityId": "100010547088",
	"entityType": "fund",
	"entityName": "深圳市红杉瀚辰股权投资合伙企业（有限合伙）",
	"username": "xxx",
	"password": "yyy"
}
```

返回结果：

```json
{
	"url": "企查查链接",
	"list": [
		{
			"name": "模块一",
			"result": "一致"
		},
		{
			"name": "模块二",
			"result": "不同"
		}
	]
}
```
1. content.js 中调用 api 服务
2. content.js 将 api 服务返回数据通过消息，通知 background.js 将数据缓存，key 为 tab.id
3. popup.js 通过消息，向 background.js 要缓存的数据，将页面展示在 popup.html

## Chrome 插件开发资料

https://segmentfault.com/a/1190000040837837