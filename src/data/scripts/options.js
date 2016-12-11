/**
 * Save options to `chrome.storage`.
 * @param ev {object}, a submit event.
 * return void.
 */
function saveOptions(ev) {
    var proxy = document.getElementById('proxyInpt').value;
    chrome.storage.local.set({
        proxy: proxy
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Updates saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
    ev.preventDefault();
}

/**
 * Restore options from `chrome.storage`.
 * return void.
 */
function restoreOptions() {
    chrome.storage.local.get({
        proxy: 'https://feedback.googleusercontent.com/gadgets/proxy?container=fbk&url='
    }, function(items) {
        document.getElementById('proxyInpt').value = items.proxy;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('form').addEventListener('submit',
    saveOptions);