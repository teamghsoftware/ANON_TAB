// Document's current location
var docHref = location.hash;

/**
 * Recieve data sent by other scripts.
 * @param data {object}, a container object.
 * @return void.
 */
function receive(data) {
    'use strict';
    var target, _target, styleEl;
    var proxy = data.proxyUrl;
    var type = data.dataType;
    var dataVal = data.dataVal;
    /**
     * modify the innerHTML property of the body element.
     * @param data {string}, a markup string.
     * @param reset {boolean}, a switch to reset the body.
     * @return void.
     */
    var setBody = function(dataVal, reset) {
        var body = document.body;
        if (reset === true) {
            body.innerHTML = '';
            body.style.wordWrap = 'initial';
        }
        body.innerHTML += dataVal;
    };
    /**
     * view media elements.
     * @param url {string}, a URL string.
     * @param type {string}, the element's tag name.
     * @return void.
     */
    var viewMedia = function(url, type) {
        var el = document.createElement(type);
        el.src = url;
        el.controls = true;
        el.onerror = function() {
            url = decodeURIComponent(url.replace(proxy, ''));
            parent.receive({linkUrl: url, type: 'text'});
        };
        setBody('', true);
        document.body.appendChild(el);
    };
    // prefix all links by '#'
    var linkify = function() {
        var link, href;
        var links = document.links;
        var index = links.length;
        while (index--) {
            link = links[index];
            href = decodeURIComponent(link.href);
            if (href.indexOf(proxy) === 0) {
                href = '#' + href.replace(proxy, '');
            } else {
                href = href.replace(/^[^#]*/, '#');
            }
            link.href = href;
        }
    };
    // make GET forms functional
    var formify = function() {
        var form, formAction;
        var forms = document.forms;
        var formSubmit = function() {
            var params = [];
            var queryBuild = function(container) {
                var el;
                var childElms = container.children;
                var index = childElms.length;
                while (index--) {
                    el = childElms[index];
                    if (el.hasAttribute('name') && el.value) {
                        params.push(el.name + '=' + el.value);
                    } else if(el.children) {
                        queryBuild(el);
                    }
                }
            };
            queryBuild(this);
            formAction = decodeURIComponent(this.action.replace(proxy, ''));
            location.hash = encodeURI(formAction + '?' + params.join('&'));
            return false;
        };
        var formHandle = function() {
            alert('Form type not supported.');
            return false;
        };
        var index = forms.length;
        while (index--) {
            form = forms[index];
            if (form.method === 'get' && form.action) {
                form.onsubmit = formSubmit;
            } else {
                form.onsubmit = formHandle;
            }
        }
    };
    if (type === 'document') {
        setBody(dataVal, true);
        linkify();
        formify();
    } else if(type === 'styles') {
        target = data.targetPage;
        _target = docHref;
        if (target === _target) {
            styleEl = document.createElement('style');
            styleEl.innerHTML = dataVal;
            document.body.appendChild(styleEl);
        }
    } else if(type === 'img' ||
                  type === 'audio' ||
                      type === 'video') {
        viewMedia(dataVal, type);
    } else if(type === 'resource') {
        setBody(dataVal, true);
        document.body.style.wordWrap = 'break-word';
    } else if(type === 'href') {
        if (dataVal === location.hash.slice(1)) {
            // reset the hash silently
            history.pushState(null, null, '#');
        }
        location.hash = dataVal;
    } else {
        setBody('', true);
    }
}

window.onhashchange = function() {
    'use strict';
    var anchor;
    var hash = location.hash.slice(1);
    if (hash) {
        if (hash.indexOf('#') !== 0) {
            parent.receive({linkUrl: hash, type: null});
            docHref = hash;
        } else {
            anchor = document.getElementsByName(hash.slice(1))[0];
            if (typeof anchor === 'object') {
                anchor.scrollIntoView();
            }
        }
    }
};

// A defense in depth against redirections
window.onunload = function() {
    'use strict';
    window.stop();
};
