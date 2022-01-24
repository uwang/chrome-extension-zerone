$(async function() {
    // alert('popup init ' + jQuery.fn.jquery);
    $('tbody').append('<tr><td>合伙人信息</td><td><span class="iconfont icon-chenggong"></span>一致</td></tr>');
    $('tbody').append('<tr><td>投资历史</td><td><span class="iconfont icon-jinggao"></span>不同</td></tr>');
    $('#footer').append('<a href="https://www.qcc.com/web/search?key=%E6%B7%B1%E5%9C%B3%E7%BA%A2%E6%9D%89%E5%AE%89%E6%B3%B0%E8%82%A1%E6%9D%83%E6%8A%95%E8%B5%84%E5%90%88%E4%BC%99%E4%BC%81%E4%B8%9A%EF%BC%88%E6%9C%89%E9%99%90%E5%90%88%E4%BC%99%EF%BC%89" target="_blank">查看企查查对应页面</a>');
    $('#tip').append('暂无数据');

    chrome.runtime.sendMessage({ cmd: 'query' }, function (response) {
        console.log('response', response);
    });
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    const source =
      "get message " +
      (sender.tab
        ? "from a content script:" + sender.tab.url
        : "from the background");
    console.log(source);
    console.log({ message, sender });
  
    switch (message.cmd) {
      case "query":
        console.log(message.payload);
        renderTable(JSON.parse(message.payload));
        break;
    }
});

function renderTable (data) {
    console.log('renderTable', data);
}

