$(async function() {
    // alert('popup init ' + jQuery.fn.jquery);
    chrome.runtime.sendMessage({ cmd: 'query' });
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
    const elementTable = $('tbody')
    const elementFooter = $('#footer')
    elementTable.empty();
    elementFooter.empty();
    $('#tip').empty();
    if (data.list.length) {
        data.list.forEach(function(item) {
            if (item.result === '一致') {
                elementTable.append(`<tr><td>${item.name}</td><td><span class="iconfont icon-chenggong"></span>一致</td></tr>`);
            } else {
                elementTable.append(`<tr><td>${item.name}</td><td><span class="iconfont icon-jinggao"></span>不同</td></tr>`);
            }
        });
        if (data.url) {
            elementFooter.append(`<a href="${data.url}" target="_blank">查看企查查对应页面</a>`);
        }
    } else {
        $('#tip').html('暂无数据');
    }
}

