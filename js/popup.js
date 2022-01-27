$(async function() {
    // alert('popup init ' + jQuery.fn.jquery);
    chrome.runtime.sendMessage({ cmd: 'query' });

    $('#search').on('keypress', handleEnter);
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
        if (message.payload) {
            $('#data-comparison').show('fast', function() {
                renderTable(JSON.parse(message.payload));
            });
        }
        break;
    }
});

function resetTable () {
    $('tbody').empty();
    $('#footer').empty();
    $('#tip').empty();
}

function renderTable (data) {
    console.log('renderTable', data);
    resetTable();
    const elementTable = $('tbody')
    if (data.list.length) {
        data.list.forEach(function(item) {
            if (item.result === '一致') {
                elementTable.append(`<tr><td>${item.name}</td><td><span class="iconfont icon-chenggong"></span>一致</td></tr>`);
            } else {
                elementTable.append(`<tr><td>${item.name}</td><td><span class="iconfont icon-jinggao"></span>不同</td></tr>`);
            }
        });
        if (data.url) {
            $('#footer').append(`<a href="${data.url}" target="_blank">查看企查查对应页面</a>`);
        }
    } else {
        $('#tip').html('暂无数据');
    }
}

function handleEnter (event) {
    if (event.keyCode === 13) {
        const q = $('#search').val().trim();
        handleSearch (q);
        $('#search').val('');
    }
}

/**
 * 搜索
 * @param {*} word 
 */
function handleSearch (word) {
    chrome.storage.sync.get({
        webHost: 'https://zdeal.com.cn'
      }, function(items) {
        window.open(`${items.webHost}/search/?wd=` + word, '_blank');
      });
}

