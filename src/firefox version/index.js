var buttons = require('sdk/ui/button/action');
var contextMenu = require('sdk/context-menu');
var data = require('sdk/self').data;
var tabs = require('sdk/tabs');
var pageURI = '../main.html';

var button = buttons.ActionButton({
    id: 'anontab',
    label: 'AnonTab',
    icon: {
        '16': './images/icon_16.png',
        '32': './images/icon_32.png',
        '64': './images/icon_64.png',
    },
    onClick: function() {
        tabs.open(data.url(pageURI));
    },
});

var menuItem = contextMenu.Item({
    label: 'Open Link in AnonTab',
    context: contextMenu.SelectorContext('a'),
    contentScript: 'self.on("click", function(node) {' +
                   'self.postMessage(node.href);' +
                   '});',
    onMessage: function(href) {
        tabs.open({
            url: data.url(pageURI),
            onLoad: function(tab) {
                tab.attach({
                    contentScript: 'document.getElementById("navbar").value="' +
                        encodeURI(href) + '"; document.getElementById("go").click();',
                });
            },
        });
    },
});
