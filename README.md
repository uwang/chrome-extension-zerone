# chrome extension

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
1. content.js 中请求爬虫数据
2. 将数据缓存，key 为 tab.id
3. popup.js 获取数据展示

## Chrome 插件开发资料

https://segmentfault.com/a/1190000040837837