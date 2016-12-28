var proxy;
var isLoading = false;
var viewer = document.getElementById('viewer');
var navBar = document.getElementById('navbar');
var hstsList = ['*.wikipedia.org', '*.twitter.com', '*.github.com',
                '*.facebook.com', '*.torproject.org'];
chrome.storage.local.get({
    proxy: 'https://feedback.googleusercontent.com/gadgets/proxy?container=fbk&url='
}, function(items) {
    proxy = items.proxy;
});

/**
 * Normalize a given URL.
 * @param url {string}, a URI string.
 * @param isSilent {boolean}, prevents function alerts.
 * @return {string}, either a normalized URL or an empty string.
 */
function normalizeURL(url, isSilent) {
    'use strict';
    /**
     * Enforce HSTS for all predefined compatible domains.
     * @param url {object}, a URL object.
     * @return {string}, a URL string.
     */
    var mkHstsCompat = function(url) {
        /**
         * Assert it's a known HSTS compatible domain.
         * @param domainPtrn {string}, a domain name pattern.
         * @return {boolean}.
         */
        var isHstsCompat = function(domainPtrn) {
            domainPtrn = domainPtrn.replace('*.', '^(?:[\\w.-]+\\.)?');
            domainPtrn = new RegExp(domainPtrn);
            if (domainPtrn.test(url.hostname)) {
                return true;
            }
            return false;
        };
        if (url.protocol === 'http:' && hstsList.some(isHstsCompat)) {
            url.protocol = 'https:';
        }
        return url.href;
    };
    url = (/^\w+:\/\//.test(url)) ? url : 'http://' + url;
    try {
        url = new URL(url);
    } catch (e) {
        if (!isSilent) {
            setTimeout(function() {
                alert('Error: "' + url + '" is not a valid URL.');
            }, 100);
        }
        return '';
    }
    return mkHstsCompat(url);
}

/**
 * Pass all given data to the viewer.
 * @param type {string}, the type of the data.
 * @param data {string}, the data to pass.
 * @return void.
 */
function passData(type, data) {
    'use strict';
    viewer.contentWindow.communicate(
        {proxyUrl: proxy, dataType: type, dataVal: data}
    );
}

/**
 * Terminate any ongoing connections.
 * @return void.
 */
function stopLoading() {
    isLoading = false;
    window.stop();
}

/**
 * Navigate to a given URL.
 * @param linkUrl {string}, a URL to navigate to.
 * @return void.
 */
function navigate(linkUrl) {
    'use strict';
    if (!linkUrl.startsWith('#')) {
        linkUrl = normalizeURL(linkUrl);
    }
    if (linkUrl) {
        stopLoading();
        passData('href', linkUrl);
    }
}

/**
 * Change the viewer's border color.
 * @param color {string}, a color name.
 * @param loadingFlag {boolean}, determines loading status.
 * @return void.
 */
function changeBorderColor(color, loadingFlag) {
    var interval;
    if (loadingFlag) {
        interval = setInterval(function() {
            if (isLoading) {
                changeBorderColor('red');
                setTimeout(function () {
                    if (isLoading) {
                        changeBorderColor('green');
                    }
                }, 400);
            } else {
                clearInterval(interval);
                changeBorderColor('silver');
            }
        }, 800);
    }
    viewer.style.borderColor = color;
};

/**
 * Load an external Web resource.
 * @param resourceUrl {string}, the URL of the resource.
 * @param type {string} optional, the type of the resource.
 * @param isTldResource {boolean} optional, determines if it is a top-level resource.
 * @return void.
 */
function loadResource(resourceUrl, type, isTldResource) {
    'use strict';
    var url = proxy + encodeURIComponent(resourceUrl);
    var exts = /(?:\.(?:s?html?|php|(?:j|a)spx?|p(?:y|l)|c(?:gi|ss)|js(?:on)?|txt|cfml?)|:\/\/.+?\/(?:[^.?#]*|[^a-z?#]*))(?:[?#].*)?$/;
    /**
     * Fetch an external resource.
     * @param type {string}, the type of the resource.
     * @return void.
     */
    var fetch = function(type) {
        var xhrReq = new XMLHttpRequest();
        xhrReq.responseType = (type === 'resource') ? 'blob' : 'text';
        xhrReq.onerror = function() {
            if (isLoading && isTldResource) {
                alert('NetworkError: A network error occurred.');
            }
            setTimeout(function() {
                isLoading = false;
            });
        };
        xhrReq.onload = function() {
            var assert, file, reader, responseType;
            /**
             * Parse the `responseText` property of `xhrReq`.
             * @param type {string} optional, the type of the response.
             * @return void.
             */
            var parseResponse = function(type) {
                var markup;
                var responseText = xhrReq.responseText;
                try {
                    if (type === 'styles') {
                        responseText = '<style>' + responseText + '</style>';
                    }
                    // Proxify all markup.
                    markup = proxify(responseText, proxy, resourceUrl);
                    /* Pass the markup to the viewer. */
                    if (type === 'styles') {
                        passData('styles', markup, navbar.value);
                    } else {
                        passData('document', markup);
                        if (/#.+/.test(resourceUrl)) {
                            // Scroll to a given page anchor.
                            navigate('#' + resourceUrl.match(/#.+/));
                        }
                    }
                } catch (e) {}
            };
            try {
                responseType = this.getResponseHeader('Content-Type');
                if (responseType.indexOf(type) !== 0) {
                    responseType = responseType.match(/^\w*/).toString();
                    if (responseType === 'text') {
                        fetch('text');
                        return;
                    } else if (responseType === 'image') {
                        passData('img', url);
                        return;
                    } else if (responseType === 'audio') {
                        passData('audio', url);
                        return;
                    } else if (responseType === 'video') {
                        passData('video', url);
                        return;
                    } else if (type !== 'resource') {
                        fetch('resource');
                        return;
                    }
                }
            } catch (e) {}
            if (this.status === 200) {
                if (type === 'text') {
                    parseResponse();
                } else if (type === 'text/css') {
                    parseResponse('styles');
                } else {
                    file = this.response;
                    if (file.size >= 9000000) {
                        assert = confirm('Too large resource! Proceed anyway?');
                        if (!assert) {
                            return;
                        }
                    }
                    reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onloadend = function() {
                        passData('resource', reader.result);
                    };

                }
            } else {
                if (isTldResource) {
                    alert('HTTPError: ' + this.status + ' ' + this.statusText);
                }
                parseResponse();
            }
            setTimeout(function() {
                isLoading = false;
            });
        };
        xhrReq.open('GET', url);
        if (!isLoading) {
            setTimeout(function() {
                isLoading = true;
                changeBorderColor('green', true);
            });
        }
        xhrReq.send();
    };
    if (typeof type === 'string') {
        fetch(type);
    // Is it a document?
    } else if (exts.test(resourceUrl)) {
        fetch('text');
    // Perhaps an image?
    } else if (/\.(?:jpe?g|png|gif|svg|bmp|ico)(?:[?#].*)?$/i.test(resourceUrl)) {
        passData('img', url);
    // Maybe some audio file?
    } else if (/\.(?:mp3|wav|ogg)(?:[?#].*)?$/i.test(resourceUrl)) {
        passData('audio', url);
    // Probably a video?
    } else if (/\.(?:mp4|webm|3gp)(?:[?#].*)?$/i.test(resourceUrl)) {
        passData('video', url);
    } else {
        fetch('resource');
    }
}

/**
 * Handle sent and received data from other scripts.
 * @param data {object}, a data container object.
 * @return void.
 */
function communicate(data) {
    'use strict';
    var type = data.type;
    var linkUrl = normalizeURL(data.linkUrl);
    if (linkUrl) {
        // Reset the view.
        passData('', '');
        // Terminate any ongoing connections.
        stopLoading();
        // Load the new resource.
        loadResource(linkUrl, type, true);
    } else {
        linkUrl = data.linkUrl;
    }
    navBar.value = linkUrl;
}

/**
 * A proxy function for `navigate()`.
 * @param ev {object} optional, an event object.
 * @return void.
 */
function initNav(ev) {
    'use strict';
    var keyCode = ev.keyCode;
    var linkUrl = ev.linkUrl || navBar.value;
    if (linkUrl && (!keyCode || keyCode === 13)) {
        navigate(linkUrl);
    }
    if (ev.type === 'submit') {
        ev.preventDefault();
    }
}

/* Register event listeners to handle user-initiated navigations. */
document.getElementById('navform').onsubmit = initNav;
chrome.runtime.onMessage.addListener(initNav);
