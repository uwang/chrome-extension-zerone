window.console.log("content js loaded");

$(function() {
  setTimeout(handleQuery, 1500);
})

// chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
//   const source =
//     "get message" +
//     (sender.tab
//       ? "from a content script:" + sender.tab.url
//       : "from the extension");
//   console.log(source);

//   switch (message.cmd) {
//     case "test":
//       break;
//   }
// });

/**
 * 处理基金详情页
 */
async function handleQuery() {
  let entityName
  try {
    entityName = document.getElementsByClassName("company")[0].innerText;
  } catch (err) {
    console.error(err)
  }
  if (!entityName) {
    console.warn('浏览器插件初始化失败');
    return;
  }

  // http://test.zdeal.com.cn/info/fund/100010324940
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
        ...payload,
        username: items.username,
        password: items.password,
        Authorization: token
      },
      success: function( result ) {
        console.log('success', result)
        chrome.runtime.sendMessage({ cmd: 'store', payload: result });
      }
    });
  });
}
