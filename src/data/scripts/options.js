var proxy = 'https://feedback.googleusercontent.com/gadgets/proxy?container=fbk&url=';
var proxyInpt = document.getElementById('proxyInpt');

/**
 * Display options status.
 * @param message {string}, a message to display.
 * return void.
 */
function updateStatus(message) {
    // Update status to let the user know options were saved.
    var status = document.getElementById('status');
    status.textContent = message;
    setTimeout(function() {
        status.textContent = '';
    }, 750);
}

/**
 * Save options to `chrome.storage`.
 * return void.
 */
function saveOptions() {
    var proxy = proxyInpt.value;
    chrome.storage.local.set({
        proxy: proxy
    });
}

/**
 * Restore options from `chrome.storage`.
 * @param reset {boolean} optional, restores default options.
 * return void.
 */
function restoreOptions(reset) {
    if (reset === true) {
        proxyInpt.value = proxy;
    } else {
        chrome.storage.local.get({
            proxy: proxy
        }, function(items) {
            proxyInpt.value = items.proxy;
        });
    }
}

document.getElementById('form').addEventListener('submit', function(ev) {
        saveOptions();
        updateStatus('Options saved.');
        ev.preventDefault();
});
document.getElementById('reset').addEventListener('click', function(ev) {
        restoreOptions(true);
        saveOptions();
        updateStatus('Options reset.');
        ev.preventDefault();
});
document.addEventListener('DOMContentLoaded', restoreOptions);