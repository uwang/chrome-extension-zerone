window.console.log("content js loaded");

function lazyQuery () {
  setTimeout(handleQuery, 5000);
}

ready(lazyQuery);

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  const source =
    "get message" +
    (sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension");
  console.log(source);

  switch (message.cmd) {
    case "test":
      handleTest(message.payload);
      break;
  }

  sendResponse({ cmd: "copy" });
});

function handleTest(payload) {
  console.log("handleTest", JSON.stringify(payload));
}

/**
 * 处理基金详情页
 */
function handleQuery() {
  const entityName = document.getElementsByClassName("company")[0].innerText;
  // "/info/fund/100010324940"
  const list = /\/(\w+)\/(\d+)/.exec(location.pathname);
  const entityType = list[1];
  const entityId = list[2];

  const payload = {
    entityId,
    entityType,
    entityName,
  };

  sendMessageToBackground({ cmd: "query", payload }, function (response) {
    console.log('response', response);
  });
}

/**
 * 向 background 发送消息
 * @param {*} message
 * @param {*} callback
 */
function sendMessageToBackground(message, callback) {
  console.log("send message from content:", JSON.stringify(message));
  chrome.runtime.sendMessage(message, function (response) {
    console.log("get message from background:", JSON.stringify(response));
    if (callback) callback(response);
  });
}

function ready(fn) {
  if (document.readyState != "loading") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}
