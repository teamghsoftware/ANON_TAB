/**
 * Enforce a given proxy on all document elements upon sanitization.
 * @param raw {string}, raw HTML markup.
 * @param proxy {string}, a proxy endpoint.
 * @param baseURL {string}, a base document URL.
 * @return {string}, a markup string.
 */
function proxify(raw, proxy, baseURL) {
    'use strict';
    var clean;
    // DOMPurify's config
    var config = {
        ADD_TAGS: ['link', 'video', 'audio'],
        FORBID_ATTR: ['xlink:href'],
        WHOLE_DOCUMENT: true
    };

    /**
     * proxify both relative and absolute URIs.
     * @param uri {string}, a URI string.
     * @return {string}, a proxified URL string.
     */
    var proxUri = function(uri) {
        uri = /^\w+:\/\//.test(uri) ? uri :
              uri.startsWith('//') ? baseURL.match(/\w+:/)+uri :
              uri.startsWith('/') ? baseURL.match(/\w+:\/\/[^\/]+/)+uri :
              baseURL.match(/\w+:\/\/[^\/]+/) + '/' + uri;
        uri = new URL(uri);
        return proxy + encodeURIComponent(uri);
    };

    /**
     * handle any external CSS styles.
     * @return void.
     */
    var addExtStyles = function() {
        var rawStyles = '<style>' + this.response + '</style>';
        var cleanStyles = proxify(rawStyles, proxy, baseURL);
        window.passData('styles', cleanStyles, baseURL);
    };

    /**
     * fetch external CSS files.
     * @param src {string}, a URI string.
     * @return void.
     */
    var fetchStyles = function(src) {
        var css_xhr = new XMLHttpRequest();
        src = proxUri(src);
        css_xhr.onload = addExtStyles;
        css_xhr.open('GET', src);
        css_xhr.send();
    };

    /**
     * take CSS property-value pairs and proxify URLs in values,
     * then add the styles to an array of property-value pairs.
     * @param output {array}, a container empty array.
     * @param styles {array}, a styles container array.
     * @return void.
     */
    var proxStyles = function(output, styles) {
        var prop, pVal, src;
        // the regex to detect external content
        var regex = /(?:url\(["']?)(?!data:)([^'")]+)/gi;
        var pIndex = styles.length;
        while (pIndex--) {
            prop = styles[pIndex];
            pVal = styles[styles[pIndex]] || '';
            if (pVal.match(regex)) {
                src = regex.exec(pVal)[1];
                pVal = pVal.replace(regex, '$1' + proxUri(src));
                output.push(prop + ':' + pVal + ';');
                regex.lastIndex = 0;
            } else {
                output.push(prop + ':' + pVal + ';');
            }
        }
    };

    /**
     * take CSS rules and analyze them, proxify URIs via `proxStyles()`,
     * then create matching CSS text for later application to the DOM.
     * @param output {array}, a container empty array.
     * @param cssRules {array}, a CSSRuleList object.
     * @return void.
     */
    var addCSSRules = function(output, cssRules) {
        var rule, _rIndex, frame, importSrc;
        var rIndex = cssRules.length;
        while (rIndex--) {
            rule = cssRules[rIndex];
            switch (rule.type) {
                // a selector rule?
                case 1:
                    if (rule.selectorText) {
                        output.push(rule.selectorText + '{');
                        if (rule.style) {
                            proxStyles(output, rule.style);
                        }
                        output.push('}');
                    }
                    break;
                // a @media rule?
                case rule.MEDIA_RULE:
                    output.push('@media ' + rule.media.mediaText + '{');
                    addCSSRules(output, rule.cssRules);
                    output.push('}');
                    break;
                // a @font-face rule?
                case rule.FONT_FACE_RULE:
                    output.push('@font-face {');
                    if (rule.style) {
                        proxStyles(output, rule.style);
                    }
                    output.push('}');
                    break;
                // a @keyframes rule?
                case rule.KEYFRAMES_RULE:
                    output.push('@keyframes ' + rule.name + '{');
                    _rIndex = rule.cssRules.length;
                    while (_rIndex--) {
                        frame = rule.cssRules[_rIndex];
                        if (frame.type === 8 && frame.keyText) {
                            output.push(frame.keyText + '{');
                            if (frame.style) {
                                proxStyles(output, frame.style);
                            }
                            output.push('}');
                        }
                    }
                    output.push('}');
                    break;
                // an @import rule?
                case rule.IMPORT_RULE:
                    importSrc = rule.href;
                    if (importSrc) {
                        fetchStyles(importSrc);
                    }
                    break;
            }
        }
    };

    // enforce proxy for leaky CSS rules
    DOMPurify.addHook('uponSanitizeElement', function(node, data) {
        var cssRules, output;
        if (data.tagName === 'style' && node.sheet) {
            cssRules = node.sheet.cssRules;
            if (cssRules) {
                output = [];
                addCSSRules(output, cssRules);
                node.textContent = output.join('\n');
            }
        } else if(data.tagName === 'link') {
            if (node.getAttribute('rel') === 'stylesheet') {
                fetchStyles(node.getAttribute('href'));
            }
            node.parentNode.removeChild(node);
        }
    });

    // enforce proxy for all src attributes incl. style attributes
    DOMPurify.addHook('afterSanitizeAttributes', function(node) {
        var attrib, styles, output;
        // proxify a URL in case it's not a data URI or an anchor
        var proxAttribute = function(uri) {
            if (/^(data:|#)/i.test(uri)) {
                return uri;
            } else {
                return proxUri(uri);
            }
        };
        // attributes to proxify
        var attributes = ['href', 'src', 'action', 'background', 'poster'];
        var aIndex = attributes.length;
        while (aIndex--) {
            attrib = attributes[aIndex];
            if (node.hasAttribute(attrib)) {
                node.setAttribute(attrib,
                    proxAttribute(node.getAttribute(attrib))
                );
            }
        }
        if (node.hasAttribute('style')) {
            styles = node.style;
            output = [];
            if (styles) {
                proxStyles(output, styles);
            }
            // re-add styles in case any are left
            if (output.length) {
                node.setAttribute('style', output.join(''));
            } else {
                node.removeAttribute('style');
            }
        }
    });

    // sanitize our HTML markup
    clean = DOMPurify.sanitize(raw, config);

    // reset all hooks before returning
    DOMPurify.removeAllHooks();
    return clean;
}
