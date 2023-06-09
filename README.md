# chrome extension

## 基本原理

```json
{
  "content_scripts": [
    {
      "matches": [
        "http://*.zerone.com.cn/info/*/*",
        "https://*.zerone.com.cn/info/*/*",
        "https://www.qcc.com/*"
      ],
      "js": ["lib/jquery-3.6.0.min.js", "content-scripts/content.js"],
      "run_at": "document_end"
    }
  ]
}
```

content script 会在以下页面运行：
    - http://*.zerone.com.cn/info/*/*，向 background 发送 entityName
    - https://*.zerone.com.cn/info/*/*，向 background 发送 entityName
    - https://www.qcc.com/*，向 background 发送企查查的 tid 和 cookie

background script 拿到 entityName、企查查的 tid 和 cookie 后调用接口进行爬取，并将结果反馈给 content script

## 产品规划

接口需要增加版本号的概念。多个版本的插件和数据接口会并存，确保老版本插件也可以正常使用。例如：

插件 v0.1.1 使用接口 api.zdeal.com.cn/v1/xxx
插件 v1.0.1 使用接口 api.zdeal.com.cn/v2/xxx

## 扩展简介

[扩展概念和体系结构](https://learn.microsoft.com/zh-cn/microsoft-edge/extensions-chromium/getting-started/)

[发布 Microsoft Edge 扩展](https://learn.microsoft.com/zh-cn/microsoft-edge/extensions-chromium/publish/publish-extension)

[Firefox 开始支持 Chrome 的扩展了](https://zhuanlan.zhihu.com/p/21873343)

## 功能介绍

1. 用户先登录 企查查
2. 用户访问执中基金页，执中浏览器扩展激活
3. 执中浏览器扩展请求企查查对应的基金页发送给后端接口
4. 后端接口解析内容提取出信息对比结果
5. 执中浏览器扩展接受对比结果展示

测试页面：http://dev.zdeal.com.cn/info/fund/100010547088

## 页面数据获取

```js
document.cookie;
```

## 参数

请求参数：

```json
{
  "entityId": "100010547088",
  "entityType": "fund",
  "entityName": "深圳市红杉瀚辰股权投资合伙企业（有限合伙）"
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

## 接口定义

1.请求接口：
url='http://fusion.zdeal.com.cn/server_v2/select'
method='post'
data = {
"company_name": company_name #必须 ,str 类型
"init_window_tid": init_window_tid #必须,str 类型
"cookie": qcc_cookie #必须 ，str 类型
"response": response #非必须，字典类型
} 2.返回值：
{'code': code, 'msg': msg, 'data': {},'request_info':{'url':'',}}
--> request_info:{'url':'','headers':{}}
code:200 ，任务执行成功；
返回结果 data,任务结束
code:300 ，任务执行中；
后台解析中，请继续请求接口 fusion.zdeal
code:400 ，任务执行失败；
请检查企查查是否有验证码弹出！,任务结束
code:500 ，任务执行中； 1.返回企查查 url,headers 2.请求企查查 3.企查查结果转换。
response = {
'reason': response.reason,
'status_code': response.status_code,
'url': qcc_url,
'text': response.text
}
response = json.dumps(response) 4.带上 response 参数，请求 fusion.zdeal。

3.其他说明：
循环请求接口，200，400 循环 break，300 继续请求 fusion，500 请求企查查，并将企查查 response 作为参数继续请求 fusion
参数 init_window_tid 获取：
企查查首页全局搜 window.tid 即可找到。
参数 cookie:
全部 cookie，字符串形式

## content 和 background 通信

在 background 和内容脚本通信，我们可以使用简单直接的 runtime.sendMessage 或者 tabs.sendMessage 发送消息，消息内容可以是 JSON 数据

从内容脚本发送消息如下：

```js
// content-script.js
const message = { greeting: "hello，我是 content-script，主动发消息给后台！" };
chrome.runtime.sendMessage(message, function (response) {
  console.log("收到来自后台的回复：", response);
});
```

而从后台发送消息到内容脚本时，由于有多个标签页，我们需要指定发送到某个标签页：

```js
// background.js
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const tabId = tabs[0].id;
  const message = { greeting: "hello，我是后台，主动发消息给 content-script" };
  chrome.tabs.sendMessage(tabId, message, function (response) {
    console.log(response.farewell);
  });
});
```

不管是在后台，还是在内容脚本中，我们都使用 runtime.onMessage 监听消息的接收事件，不同的是回调函数中的 sender，标识不同的发送方：

```js
/**
 * 监听消息
 * 不管是在后台，还是在内容脚本中，我们都使用runtime.onMessage监听消息的接收事件，不同的是回调函数中的sender，标识不同的发送方
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(
    "recevie message ",
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the background script"
  );
  // if (request.greeting.indexOf("hello") !== -1){}
  sendResponse({ farewell: "goodbye" });
});
```
