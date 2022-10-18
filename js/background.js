// Initialize the extension
// Listeners must be registered synchronously from the start of the page.
// Listen to the runtime.onInstalled event to initialize an extension on installation.
// Use this event to set a state or for one-time initialization, such as a context menu.

/**
 * 使用 background 管理事件
 * background是插件的事件处理程序，它包含对插件很重要的浏览器事件的监听器。
 * background处于休眠状态，直到触发事件，然后执行指示的逻辑；一个好的background仅在需要时加载，并在空闲时卸载。
 */

chrome.runtime.onInstalled.addListener(function (){
  console.log("插件已被安装");
  chrome.contextMenus.create({
    id: "sampleContextMenu",
    title: "Sample Context Menu",
    contexts: ["selection"], // 只有当选中文字时才会出现此右键菜单
  });

  chrome.cookies.getAll({ domain: '.qcc.com' }, function (cookies) {
    const cookieList = [];
    cookies.forEach(cookie => {
      cookieList.push(cookie.name + ':' + cookie.value)
    });
    console.log('cookies', cookieList.join('; '))
  });
});

let tag = '';

/**
 * 发送消息到 content script
 * @param {Object} message { cmd: '', payload: {}}
 * @param {*} callback 
 */
function sendMessageToContentScript(message, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
      if (callback) callback(response);
    });
  });
}

/**
 * 发送消息到 popup script
 * @param {Object} message 
 */
function sendMessageToPopup (message) {
  chrome.runtime.sendMessage(message);
}

/**
 * 监听消息
 * 不管是在后台，还是在内容脚本中，我们都使用runtime.onMessage监听消息的接收事件，不同的是回调函数中的sender，标识不同的发送方
 */
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
  const text = 'recevie message ' + (sender.tab ? "from a content script:" + sender.tab.url : "from the background script")
  console.log(text, request);
  // if (request.greeting.indexOf("hello") !== -1){}
  sendResponse({ farewell: "goodbye" });
});
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
  console.log('handleStore', payload);
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
  console.log('local.set', data);
  return chrome.storage.local.set(data, function() {
    console.log(key + ' is set to ', value);
  });
}

async function handleQuery () {
  const tab = await getCurrentTab();
  const key = 'zdeal.' + tab.id;
  console.log('get.key:', key);
  chrome.storage.local.get(key, function (data) {
    console.log('storage.local.get', data);
    chrome.runtime.sendMessage({ cmd: 'query', payload: data[key] });
  });
}

/**
 * 监听 tab 切换
 */
chrome.tabs.onActivated.addListener(async function (activeInfo) {
  const tab = await getCurrentTab();
  console.log('监听 tab 切换', tab.url);
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
  console.log('key', key);
  chrome.storage.local.get(key, function(data) {
    console.log('onActivated get storage', data);
    if (data.hasOwnProperty('list')) {
      console.log('onActivated get storage data.list', data.list);
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
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
});
