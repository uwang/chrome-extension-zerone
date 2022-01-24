// Saves options to chrome.storage
function save_options() {
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value.trim();
    chrome.storage.sync.set({
        username: username,
        password: password
    }, function() {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.style.color = 'green';
      status.textContent = '保存成功';
      setTimeout(function() {
        status.textContent = '';
      }, 10000);
    });
  }
  
  // Restores select box and checkbox state using the preferences
  // stored in chrome.storage.
  function restore_options() {
    // Use default value username = 'xxx' and password = 'yyy'.
    chrome.storage.sync.get({
        username: 'xxx',
        password: 'yyy'
    }, function(items) {
      document.getElementById('username').value = items.username;
      document.getElementById('password').value = items.password;
    });
  }
  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click',
      save_options);