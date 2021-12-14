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

  const message = {
    cmd: "test",
    payload: {
      value: "你好",
    },
  };
  sendMessageToContentScript(message, function (response) {
    console.log("来自 content 的回复：", response);
  });
});

function sendMessageToContentScript(message, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
      if (callback) callback(response);
    });
  });
}

async function handleQuery(payload) {
  const tab = await getCurrentTab();
  console.log("tab", tab);
  chrome.action.setBadgeBackgroundColor({ color: "red" });
  chrome.action.setBadgeText({ text: tab.id + "", tabId: tab.id });
  const page = {}
  const key = 'zdeal.' + tab.id
  const value = tab.id + ''
  page[key] = value
  chrome.storage.local.set({ page }, function() {
    console.log('page is set to ', page);
  });
  console.log("handleQuery", payload);
}

function randomText() {
  return Math.ceil(Math.random() * 10) + "";
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  const source =
    "get message " +
    (sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension");

  console.log(source, JSON.stringify(message));

  switch (message.cmd) {
    case "query":
      handleQuery(message.payload);
      break;
  }

  sendResponse({ cmd: "copy" });
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  console.log('change tab', activeInfo.tabId)
  chrome.storage.local.get('page', function(data) {
    const key = 'zdeal.' + activeInfo.tabId;
    if (data && data.page && data.page.hasOwnProperty(key)) {
      // chrome.action.setBadgeBackgroundColor({ color: "red" });
      // chrome.action.setBadgeText({ text: tabId + "", tabId: tabId });
    }
    console.log('get storage', data.page);
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
