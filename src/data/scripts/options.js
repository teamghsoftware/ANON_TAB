var proxyInpt = document.getElementById('proxyInpt');
var proxyUri = 'https://feedback.googleusercontent.com/gadgets/proxy?container=fbk&url=';

/**
 * Change the boxShadow's color value of `proxyInpt.style`.
 * @param color {string}, a color name.
 * @return void.
 */
function setBoxShadowColor (color) {
    proxyInpt.style.boxShadow = '0 0 10px ' + color + ' inset';
}

/**
 * Save options to `chrome.storage`.
 * @return void.
 */
function saveOptions() {
    var proxy = proxyInpt.value;
    chrome.storage.local.set({
        proxy: proxyUri
    });
}

/**
 * Restore options from `chrome.storage`.
 * @param reset {boolean} optional, restores default options.
 * @return void.
 */
function restoreOptions(reset) {
    if (reset === true) {
        proxyInpt.value = proxyUri;
    } else {
        chrome.storage.local.get({
            proxy: proxyUri
        }, function(items) {
            proxyInpt.value = items.proxy;
        });
    }
}

/**
 * Display options status.
 * @param message {string}, a message to display.
 * @param isPersistent {boolean}, displays a message persistently.
 * @return void.
 */
function updateStatus(message, isPersistent) {
    var interval;
    var status = document.getElementById('status');
    status.textContent = message;
    if (isPersistent) {
        interval = setInterval(function() {
            if (/\.{3}$/.test(status.textContent)) {
                status.textContent = status.textContent.slice(0, -2);
            } else if (message.indexOf(status.textContent) === 0) {
                status.textContent += '.';
            } else {
                clearInterval(interval);
            }
        }, 300);
    } else {
        setTimeout(function() {
            status.textContent = '';
        }, 2000);
    }
}


/**
 * Change the current proxy server to a new one.
 * @return void.
 */
function updateProxy() {
    var isValid = false;
    var proxy = proxyInpt.value;
    var xhrReq = new XMLHttpRequest();
    setBoxShadowColor('yellow');
    updateStatus('Validating proxy...', true);
    xhrReq.onload = function() {
        if (this.status === 200) {
            saveOptions();
            updateStatus('Changes saved.');
            setBoxShadowColor('green');
        }
    };
    xhrReq.onerror = function() {
        updateStatus("Couldn't validate proxy server.");
        setBoxShadowColor('red');
    }
    xhrReq.open('GET', proxy + 'http://example.com');
    xhrReq.send();
}

document.getElementById('form').addEventListener('submit', function(ev) {
        updateProxy();
        ev.preventDefault();
});
document.getElementById('reset').addEventListener('click', function(ev) {
        restoreOptions(true);
        saveOptions();
        updateStatus('Options reset.');
        setBoxShadowColor('white');
        ev.preventDefault();
});
document.addEventListener('DOMContentLoaded', restoreOptions);
