// Initialize the extension
// Listeners must be registered synchronously from the start of the page.
// Listen to the runtime.onInstalled event to initialize an extension on installation.
// Use this event to set a state or for one-time initialization, such as a context menu.

/**
 * 使用 background 管理事件
 * background是插件的事件处理程序，它包含对插件很重要的浏览器事件的监听器。
 * background处于休眠状态，直到触发事件，然后执行指示的逻辑；一个好的background仅在需要时加载，并在空闲时卸载。
 */

const debug = false

chrome.runtime.onInstalled.addListener(function (){
  debug && console.log("插件已被安装");
  // chrome.contextMenus.create({
  //   id: "sampleContextMenu",
  //   title: "Sample Context Menu",
  //   contexts: ["selection"], // 只有当选中文字时才会出现此右键菜单
  // });
});

/**
 * 等待时间
 * @param {Number} ms 毫秒
 * @returns 
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * 请求页面
 * @param {String} url 爬取的 url
 * @param {Object} header 请求 headers
 * @returns 
 */
async function crawlPage (url, headers) {
  // 随机等待 7-15 秒
  if (url.includes('/touzilist')) {
    const second = getRandomArbitrary(7, 15);
    console.log('对外投资需要随机等待 ' + second + ' 秒');
    await sleep(second * 1000);
  }

  // 发起请求
  const response = await fetch(url, { method: 'GET', headers });
  const statusText = response.statusText;
  const status = response.status;
  const text = await response.text();

  const result = {
    'reason': statusText,
    'status_code': status,
    'url': url,
    'text': text
  };
  return result;
}

/**
 * 获取对比报告链接
 * @param {Object} data1 接口返回值
 * @param {String} api_url 
 * @param {FormData} formData 
 * @returns String
 */
async function fetchReport (data1, api_url, formData) {
  const temp = await crawlPage(data1.request_info.url, data1.request_info.headers);
  console.log('Step3-2.response', temp);
  formData.append('response', JSON.stringify(temp));

  let report_url;

  // 轮询查询 10 次，间隔 1秒
  let i = 10;
  do {
    // 请求爬虫处理 qcc 文件
    const response3 = await fetch(api_url, { method: 'POST', body: formData });
    const statusText = response3.statusText;
    const status = response3.status;
    const result = await response3.json();
    console.log('Step3-3', { statusText, status, result });
    // 200 出结果；
    // 300 任务执行中；
    // 400 任务执行失败；
    if (result.code === 200) {
      i = 0;
      run = false;
      report_url = result.data[8];
      console.log('End', result);
    }
    if (result.code === 300) {
      i -= 1;
      await sleep(1800);
    }
    if (result.code === 400) {
      run = false;
      i = 0;
    }
    if (result.code === 500) {
      report_url = await fetchReport(result, api_url, formData);
      i = 0;
    }
  } while (i > 1);

  return report_url;
}

/**
 * 监听消息
 * 不管是在后台，还是在内容脚本中，我们都使用 runtime.onMessage 监听消息的接收事件，不同的是回调函数中的 sender，标识不同的发送方
 */
 chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
  const text = 'recevie message ' + (sender.tab ? "from a content script:" + sender.tab.url : "from the background script")
  console.log(text, request);
  if (request.cmd === 'ask.qcc') {
    // console.log('sender.tab.id', sender.tab.id);
    // 查找企查查的 tab
    chrome.tabs.query({ url: 'https://www.qcc.com/*' }, function (tabs) {
      if (!tabs.length) {
        chrome.tabs.create({ url: 'https://www.qcc.com/' });
        sendResponse();
      } else {
        // 获取 report-url 后，返回给 sender
        const tab = tabs[0];

        chrome.cookies.getAll({ domain: '.qcc.com' }, function (cookies) {
          const cookieList = [];
          cookies.forEach(cookie => {
            cookieList.push(cookie.name + ':' + cookie.value);
          });
          const cookieStr = cookieList.join('; ');
          console.log('cookies', cookieStr);

          // 向 qcc.com 请求数据
          sendMessageToContentScript(tab.id, { cmd: request.cmd }, async function (response) {
            console.log('answer.qcc', response);
            if (response) {
              const api_url = 'http://fusion.zdeal.com.cn/server_v2/select';
              const formData = new FormData();
              formData.append('company_name', request.payload.entityName);
              formData.append('cookie', cookieStr);
              formData.append('init_window_tid', response.payload.tid);
  
              // 获取 qcc 链接地址
              const response1 = await fetch(api_url, { method: 'POST', body: formData });
              const data1 = await response1.json();
  
              // 启动爬取流程
              if (data1.code === 500) {
                console.log('Step3-1', data1);
                // 请求 qcc 链接
                const report_url = await fetchReport(data1, api_url, formData);
                sendResponse({ url: report_url });
              }
              // 已经生成好报告了，直接输出
              if (data1.code === 200) {
                sendResponse({ url: data1.data[8] });
                console.log('End', data1);
              }
            }
          });
        });
        return true;
      }
    });
  } else {
    console.warn('request.cmd', request.cmd);
  }

  // 异步支持
  return true;
});

let tag = '';

/**
 * 发送消息到 content script
 * @param {Object} message { cmd: '', payload: {}}
 * @param {*} callback 
 */
function sendMessageToContentScript(tabId, message, callback) {
  chrome.tabs.sendMessage(tabId, message, function (response) {
    if (callback) callback(response);
  });
}
// function sendMessageToContentScript(message, callback) {
//   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//     chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
//       if (callback) callback(response);
//     });
//   });
// }

/**
 * 发送消息到 popup script
 * @param {Object} message 
 */
function sendMessageToPopup (message) {
  chrome.runtime.sendMessage(message);
}

// chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
//   console.log('sender', sender);
//   console.log('sender.tab', sender.tab);
//   const source =
//     "get message " +
//     (sender.tab
//       ? "from a content script:" + sender.tab.url
//       : "from popup script");

//   console.log(source);

//   switch (message.cmd) {
//     case "query":
//       handleQuery(sendResponse);
//       break;
//     case "store":
//       handleStore(sender.tab.id, message.payload);
//       break;
//   }

//   return true;
// });

async function handleStore(tabId, payload) {
  debug && console.log('handleStore', payload);
  // const tab = await getCurrentTab();
  // console.log('tab', tab);
  const failList = payload.list.filter(function (item) {
    return item.result !== '一致'
  });
  if (failList && failList.length) {
    chrome.action.setBadgeBackgroundColor({ color: "red" });
    chrome.action.setBadgeText({ text: failList.length + "", tabId });
  } else {
    chrome.action.setBadgeBackgroundColor({ color: "green" });
    chrome.action.setBadgeText({ text: payload.list.length + "", tabId });
  }
  const data = {}
  const key = 'zdeal.' + tabId
  const value = JSON.stringify(payload)
  data[key] = JSON.stringify(payload)
  debug && console.log('local.set', data);
  return chrome.storage.local.set(data, function() {
    console.log(key + ' is set to ', value);
  });
}

async function handleQuery () {
  const tab = await getCurrentTab();
  const key = 'zdeal.' + tab.id;
  debug && console.log('get.key:', key);
  chrome.storage.local.get(key, function (data) {
    debug && console.log('storage.local.get', data);
    chrome.runtime.sendMessage({ cmd: 'query', payload: data[key] });
  });
}

/**
 * 监听 tab 切换
 */
chrome.tabs.onActivated.addListener(async function (activeInfo) {
  const tab = await getCurrentTab();
  debug && console.log('监听 tab 切换', tab.url);
  // 从 tab.url 中解析 host
  const uri = tab.url ? new URL(tab.url) : { host: '' }
  const suffix = uri && uri.host.endsWith('zdeal.com.cn') ? '' : '-gray'
  chrome.action.setIcon({ path: {
    "16": `../img/16${suffix}.png`,
    "48": `../img/48${suffix}.png`,
    "128": `../img/128${suffix}.png`
  } });
  // console.log('activeInfo', activeInfo);
  // console.log('change tab', activeInfo.tabId);
  const key = 'zdeal.' + activeInfo.tabId;
  debug && console.log('key', key);
  chrome.storage.local.get(key, function(data) {
    debug && console.log('onActivated get storage', data);
    if (data.hasOwnProperty('list')) {
      debug && console.log('onActivated get storage data.list', data.list);
    }
  });
});

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    debug && console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
});
