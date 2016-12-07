var proxy = 'https://feedback.googleusercontent.com/gadgets/proxy?container=fbk&url=';
var viewer = document.getElementById('viewer');
var navbar = document.getElementById('navbar');
var hsts_list = ['*.wikipedia.org', '*.twitter.com', '*.github.com',
                     '*.facebook.com', '*.torproject.org'];

/**
 * Enforce HSTS for all predefined compatible domains.
 * @param url {object}, a URL object.
 * @return {string}, a URL string.
 */
function mkHstsCompat(url) {
    'use strict';
    /**
     * assert it's a known HSTS compatible domain.
     * @param domainPtrn {string}, a domain name pattern.
     * @return {boolean}.
     */
    var isHstsCompat = function(domainPtrn) {
        domainPtrn = domainPtrn.replace('*.', '[\w.-]*');
        domainPtrn = new RegExp(domainPtrn);
        if (domainPtrn.test(url.hostname)) {
            return true;
        }
        return false;
    };
    if (url.protocol === 'http:' && hsts_list.some(isHstsCompat)) {
        url.protocol = 'https:';
    }
    return url.href;
}

/**
 * Pass all given data to the viewer.
 * @param type {string}, the type of the data.
 * @param data {string}, the data to pass.
 * @param target {string} optional, an owner page URL.
 * @return void.
 */
function passData(type, data, target) {
    'use strict';
    viewer.contentWindow.receive(
        {proxyUrl: proxy, dataType: type, dataVal: data, targetPage: target}
    );
}

/**
 * Navigate to a given URL.
 * @param linkUrl {string}, a URL to navigate to.
 * @return void.
 */
function navigate(linkUrl) {
    'use strict';
    if (!linkUrl.startsWith('#')) {
        linkUrl = (/^\w+:\/\//.test(linkUrl)) ? linkUrl : 'http://'+linkUrl;
        try {
            linkUrl = new URL(linkUrl);
        } catch(e) {
            alert(e.message);
            return;
        }
        linkUrl = mkHstsCompat(linkUrl);
    }
    passData('href', linkUrl);
}

/**
 * Load an external Web resource.
 * @param resourceUrl {string}, the URL of the resource.
 * @param type {string} optional, the type of the resource.
 * @return void.
 */
function loadResource(resourceUrl, type) {
    'use strict';
    var exts = /(?:\.(?:s?html?|php|cgi|txt|(?:j|a)spx?|json|py|pl|cfml?)|\/(?:[^.]*|[^a-z?#]+))(?:[?#].*)?$/i;
    var url = proxy + encodeURIComponent(resourceUrl);
    /**
     * fetch an external resource.
     * @param type {string}, the type of the resource.
     * @return void.
     */
    var fetch = function(type) {
        var xhrReq = new XMLHttpRequest();
        xhrReq.responseType = (type === 'resource') ? 'blob' : 'text';
        xhrReq.onerror = function() {
            alert('NetworkError: A network error occurred.');
        };
        xhrReq.onload = function() {
            var file, assert, reader;
            var responseType = this.getResponseHeader('content-type');
            if (responseType && responseType.indexOf(type) !== 0) {
                responseType = responseType.match(/^\w*/).toString();
                if (responseType === 'text') {
                    fetch('text');
                    return;
                } else if(responseType === 'image') {
                    passData('img', url);
                    return;
                } else if(responseType === 'audio') {
                    passData('audio', url);
                    return;
                } else if(responseType === 'video') {
                    passData('video', url);
                    return;
                } else if(type !== 'resource') {
                    fetch('resource');
                    return;
                }
            }
            // parse HTML markup
            var docParse = function() {
                var html = proxify(xhrReq.responseText, proxy, resourceUrl);
                // pass all sanitized markup to the viewer
                passData('document', html);
                if (/#.+/.test(resourceUrl)) {
                    // scroll to a given page anchor
                    navigate('#' + resourceUrl.match(/#.+/));
                }
            };
            if (this.status === 200) {
                if (type === 'text') {
                    docParse();
                } else {
                    file = this.response;
                    if (file.size >= 9000000) {
                        assert = confirm('Too large resource! Proceed anyway?');
                        if (!assert) { return; }
                    }
                    reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onloadend = function() {
                        passData('resource', reader.result);
                    };
                }
            } else {
                alert('HTTPError: ' + this.status + ' ' + this.statusText);
                docParse();
            }
        };
        xhrReq.open('GET', url);
        xhrReq.send();
    };
    if (typeof type === 'string') {
        fetch(type);
    // is it a document?
    } else if (exts.test(resourceUrl)) {
        fetch('text');
    // perhaps an image?
    } else if(/\.(?:jpe?g|png|gif|bmp)(?:[?#].*)?$/i.test(resourceUrl)) {
        passData('img', url);
    // maybe some audio file?
    } else if(/\.(?:mp3|wav)(?:[?#].*)?$/i.test(resourceUrl)) {
        passData('audio', url);
    // probably a video?
    } else if(/\.(?:mp4|webm|ogg)(?:[?#].*)?$/i.test(resourceUrl)) {
        passData('video', url);
    } else {
        fetch('resource');
    }
}

/**
 * A proxy function for `navigate()`.
 * @param ev {object} optional, an event object.
 * @return void.
 */
function initNav(ev) {
    'use strict';
    var linkUrl;
    if (ev) {
        linkUrl = ev.linkUrl;
        if (linkUrl || ev.keyCode === 13) {
            navigate(linkUrl || navbar.value);
        }
    } else {
        navigate(navbar.value);
    }
}

/**
 * Receive data sent by the viewer.
 * @param data {object}, a data container object.
 * @return void.
 */
function receive(data) {
    'use strict';
    var linkUrl = data.linkUrl;
    var type = data.type;
    try {
        linkUrl = new URL(linkUrl);
        linkUrl = mkHstsCompat(linkUrl);
    } catch(e) {}
    navbar.value = linkUrl;
    // reset the view
    passData('', '');
    loadResource(linkUrl, type);
}

// Register event listeners for direct gesture-based navigations
document.getElementById('go').onclick = navbar.onkeydown = initNav;
chrome.runtime.onMessage.addListener(initNav);
