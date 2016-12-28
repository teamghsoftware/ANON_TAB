var tabId;

/**
 * Create a new AnonTab instance.
 * @param linkUrl {string}, a URL string.
 * @param flag {string}, a context label.
 * @return void.
 */
function openTab(linkUrl, flag) {
    chrome.tabs.create({active: true, url: 'main.html'}, function(tab) {
        if (flag === 'contextMenu') {
            tabId = tab.id;
        }
    });
    chrome.tabs.onUpdated.addListener(function listener(_tabId, changeInfo) {
        if (tabId === _tabId && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            chrome.tabs.sendMessage(tabId, {linkUrl: linkUrl, type: null});
        }
    });
}

chrome.browserAction.onClicked.addListener(function(activeTab) {
    openTab();
});

chrome.contextMenus.create({
    "title": "Open Link in AnonTab",
    "contexts": ["link"],
    "onclick" : function(params) {
        var linkUrl = params.linkUrl;
        openTab(linkUrl, 'contextMenu');
    }
});
