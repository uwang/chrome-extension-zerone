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
    if (location.href.includes('info/fund')) {
      const collections = document.getElementsByClassName("company");
      return collections[0] ? collections[0].innerText : '';
    } else if (location.href.includes('info/project')) {
      const collections = document.getElementsByClassName("companyName");
      return collections[0] ? collections[0].innerText.replace('公司名称：', '') : '';
    }
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
 * background 发送消息给 qcc.com 的 content script，让其返回 tid
 * background 拿着 entityName cookie 和 tid，调用后台接口，拿到 url
 * background 请求 url 将响应发送给后台爬虫接口，返回结果给 zdeal.com.cn
 */
function initForZdeal () {
  const anchor_id = 'realtime-diff-anchor';
  const span = document.createElement('span');
  span.id = anchor_id;
  span.style = 'margin-left: 10px;padding: 0 10px;';
  span.appendChild(document.createTextNode('实时对比中……'));
  document.querySelector('.entity-list').appendChild(span);

  // 获取基金名称
  const entityName = zdeal.getEntityName();
  if (entityName) {
    const message = { cmd: 'ask.qcc', payload: { entityName } };
    sendMessageToBackground(message, function (response) {
      console.log('请求 qcc.com 数据 response', response);
      if (response && response.url) {
        const anchor = document.querySelector('#' + anchor_id);
        anchor.parentNode.removeChild(anchor);

        const a = document.createElement('a');
        a.href = response.url;
        a.target = '_blank';
        a.style = 'margin-left: 10px;padding: 0 10px;';
        a.className = 'entity';
        a.appendChild(document.createTextNode('实时对比报告'));
        document.querySelector('.entity-list').appendChild(a);
      } else {
        document.querySelector('#' + anchor_id).textContent = '实时对比失败';
      }
    });
  } else {
    document.querySelector('#' + anchor_id).textContent = '请刷新页面';
  }
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
    // const cookie = qcc.getCookie();
    const tid = qcc.getTid();
    const message = { cmd: request.cmd, payload: { tid }};
    console.log('发送', message);
    sendResponse(message);
  } else {
    sendResponse({ cmd: 'copy' });
  }

  // 异步支持
  return true;
});

window.addEventListener ("load", function (evt) {
  function checkForJS_Finish () {
    if (window.location.href.includes('zdeal.com.cn')) {

      const entityName = zdeal.getEntityName();
      if (entityName !== undefined && entityName.length) {
        console.log('entityName', entityName);

        clearInterval (jsInitChecktimer);
    
        // DO YOUR STUFF HERE.
        initForZdeal();
      } else {
        console.log('wait for entityName');
      }
    }
  }

  var jsInitChecktimer = setInterval(checkForJS_Finish, 200);
}, false);