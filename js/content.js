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
    // "window.pid='bfb9eff9a02efeff6053cbb16a7fe922'; window.tid='495ff49955f918b679cedac9ab064908'"
    const content = window.document.scripts[3].text;
    const tid = /window.tid='(\w+)'/g.exec(content)[1];
    return tid;
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
 */
$(function() {
  if (window.location.href.includes('zdeal.com.cn')) {
    const message = { cmd: 'ask.qcc' };
    sendMessageToBackground(message, function (response) {
      console.log('请求 qcc.com 数据', response);
    });
  }
});

/**
 * 处理基金详情页
 */
async function handleQuery() {
  console.log('请求接口');
  // let entityName
  // try {
  //   entityName = document.getElementsByClassName("company")[0].innerText;
  // } catch (err) {
  //   console.error(err)
  // }
  // if (!entityName) {
  //   console.warn('浏览器插件初始化失败');
  //   return;
  // }

  // // http://test.zdeal.com.cn/info/fund/100010324940
  // // "/info/fund/100010324940"
  // const list = /\/(\w+)\/(\d+)/.exec(location.pathname);
  // const entityType = list[1];
  // const entityId = list[2];

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
  } else if (request.cmd === 'answer.qcc') {
    console.log('收取', request);
    handleQuery();
  } else {
    sendResponse({ cmd: 'copy' }); 
  }
  return true;
});