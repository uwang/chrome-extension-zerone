/**
 * content-scripts（内容脚本）是在网页上下文中运行的文件。
 * 通过使用标准的文档对象模型(DOM)，它能够读取浏览器访问的网页的详细信息，对其进行更改，并将信息传递给其父级插件。
 */

window.console.log("content js loaded");

/**
 * qcc.com 的 content script 主要就是返回 cookie 和 tid
 */
const qcc = {
  /**
   * 返回当前页面的 cookie
   * @returns String
   */
  getCookie: function () {
    return document.cookie;
  },
  /**
   * 从脚本内容中提取 tid
   */
  getTid: function () {
    let tid;
    const scripts = window.document.scripts;
    for (var i = 0; i < scripts.length; i++ ){
      // "window.pid='bfb9eff9a02efeff6053cbb16a7fe922'; window.tid='495ff49955f918b679cedac9ab064908'"
      const mathed = /window.tid='(\w+)'/g.exec(scripts[i].text);
      // console.log('mathed', mathed);
      if (mathed) {
        tid = mathed[1];
      }
    }
    return tid;
  }
}

/**
 * zdeal 操作
 */
const zdeal = {
  getEntityName: function () {
    const collections = document.getElementsByClassName("company");
    return collections[0] ? collections[0].innerText : '';
  },
  getEntityInfo: function () {
    // http://test.zdeal.com.cn/info/fund/100010324940
    // "/info/fund/100010324940"
    const list = /\/(\w+)\/(\d+)/.exec(location.pathname);
    const entityType = list[1];
    const entityId = list[2];
    return { entityType, entityId };
  },
  handleQuery: async function (payload) {
    const entityName = this.getEntityName();
    const { entityId, entityType } = this.getEntityInfo();
    console.log('请求接口', { entityName, entityId, entityType, ...payload });
  }
}

/**
 * 发送消息到后台
 * @param {Object} message { cmd: '', payload: {}}
 * @param {Function} callback 
 */
function sendMessageToBackground (message, callback) {
  chrome.runtime.sendMessage(message, function (response) {
    if (callback) callback(response);
  });
}

/**
 * 页面初始化
 * zdeal.com.cn 的 content script 发送 entityName 消息给 background
 * background 发送消息给 qcc.com 的 content script，让其返回 cookie 和 tid
 * background 拿着 entityName cookie 和 tid，调用后台接口，拿到 url
 * background 请求 url 将响应发送给后台爬虫接口，返回结果给 zdeal.com.cn
 */
$(function() {
  if (window.location.href.includes('zdeal.com.cn')) {
    setTimeout(function () {
      const entityName = zdeal.getEntityName();
      if (entityName) {
        const message = { cmd: 'ask.qcc', payload: { entityName } };
        sendMessageToBackground(message, function (response) {
          console.log('请求 qcc.com 数据 response', response);
        });
      } else {
        console.warn('未取到 entityName');
      }
    }, 2000);
  }
});

/**
 * 处理基金详情页
 */
async function handleQuery(payload) {
  console.log('请求接口', payload);
  let entityName
  try {
    console.log(document.getElementsByClassName("company"));
    entityName = document.getElementsByClassName("company")[0].innerText;
  } catch (err) {
    console.error(err)
  }
  if (!entityName) {
    console.warn('浏览器插件初始化失败');
    return;
  }

  // const payload = {
  //   entityId,
  //   entityType,
  //   entityName,
  // };

  // const token = window.localStorage.getItem('token');
  // console.log('请求接口', { ...payload, token });

  // 读取配置
  // chrome.storage.sync.get({
  //   webHost: "https://zdeal.com.cn",
  //   apiHost: 'https://smart.zdeal.com.cn',
  //   username: 'xxx',
  //   password: 'yyy',
  // }, function(items) {
  //   // document.getElementById('username').value = items.username;
  //   // document.getElementById('password').value = items.password;
  //   $.ajax({
  //     url: `${items.apiHost}/api/staticdata`,
  //     method: 'post',
  //     data: {
  //       ...payload,
  //       username: items.username,
  //       password: items.password,
  //       webHost: items.webHost,
  //       Authorization: token
  //     },
  //     success: function( result ) {
  //       console.log('success', result)
  //       chrome.runtime.sendMessage({ cmd: 'store', payload: result });
  //     }
  //   });
  // });
}

/**
 * 监听消息
 * 不管是在后台，还是在内容脚本中，我们都使用 runtime.onMessage 监听消息的接收事件，不同的是回调函数中的sender，标识不同的发送方
 */
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
  console.log('recevie message ', sender.tab ? "from a content script:" + sender.tab.url : "from the background script");
  /**
   * 在 qcc.com 下返回 cookie 和 tid
   */
  if (request.cmd === 'ask.qcc') {
    const cookie = qcc.getCookie();
    const tid = qcc.getTid();
    const message = { cmd: request.cmd, payload: { cookie, tid }};
    console.log('发送', message);
    sendResponse(message);
  } else {
    sendResponse({ cmd: 'copy' });
  }

  // 异步支持
  return true;
});