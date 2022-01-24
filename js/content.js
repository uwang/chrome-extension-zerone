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

  const token = window.localStorage.getItem('token');
  console.log('请求接口', { ...payload, token });

  chrome.storage.sync.get({
    username: 'xxx',
    password: 'yyy'
  }, function(items) {
    // document.getElementById('username').value = items.username;
    // document.getElementById('password').value = items.password;
    $.ajax({
      url: "http://106.14.21.212:8080/api/staticdata",
      method: 'post',
      data: {
        entityId: 100010547088,
        entityType: 'fund',
        entityName: '深圳市红杉瀚辰股权投资合伙企业（有限合伙）',
        username: items.username,
        password: items.password,
        Authorization: token
      },
      success: function( result ) {
        console.log('success', result)
      }
    });
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
