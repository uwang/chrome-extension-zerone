// Initialize the extension
// Listeners must be registered synchronously from the start of the page.
// Listen to the runtime.onInstalled event to initialize an extension on installation.
// Use this event to set a state or for one-time initialization, such as a context menu.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sampleContextMenu",
    title: "Sample Context Menu",
    contexts: ["selection"], // 只有当选中文字时才会出现此右键菜单
  });
});

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

function sendMessageToPopup (message) {
  chrome.runtime.sendMessage(message);
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log('sender', sender);
  console.log('sender.tab', sender.tab);
  const source =
    "get message " +
    (sender.tab
      ? "from a content script:" + sender.tab.url
      : "from popup script");

  console.log(source);

  switch (message.cmd) {
    case "query":
      handleQuery(sendResponse);
      break;
    case "store":
      handleStore(sender.tab.id, message.payload);
      break;
  }

  return true;
});

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

chrome.tabs.onActivated.addListener(function (activeInfo) {
  console.log('change tab', activeInfo.tabId)
  const key = 'zdeal.' + activeInfo.tabId
  console.log('key', key)
  chrome.storage.local.get(key, function(data) {
    console.log('onActivated get storage', data)
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
