# AnonTab
let AnonTab = ``` `${NoScript + HTTPSEverywhere + PrivateBrowsing + proxy}` ```;

## What does it do?

AnonTab allows you to browse safely, anonymously and privately to any suspicious URLs from within your everyday browser!

This extension simply equips your web browser with a special tab in which your real IP address is masked via public Google proxy servers; all connections are SSL/TLS encrypted. No tracking, no logs, no scripts and no history entries—totally off the record browsing. Fear not!

___Built on top of [DOMPurify](https://github.com/cure53/DOMPurify).___

## Screenshots:
<a href="https://raw.githubusercontent.com/0xsobky/AnonTab/master/screenshots/anontab.png" target="_blank"><img width="50%" src="https://raw.githubusercontent.com/0xsobky/AnonTab/master/screenshots/at_thumb.png" alt="AnonTab"></img></a>
<a href="https://raw.githubusercontent.com/0xsobky/AnonTab/master/screenshots/context_menu.png" target="blank"><img width="50%" src="https://raw.githubusercontent.com/0xsobky/AnonTab/master/screenshots/cm_thumb.png" alt="Context Menu"></img></a>

## Downloads:
* For Firefox: [AnonTab.xpi](https://github.com/0xsobky/AnonTab/raw/master/downloads/AnonTab.xpi) (also on [store](https://addons.mozilla.org/en-US/firefox/addon/anontab/))
* For Chrome/Chromium: [AnonTab.crx](https://github.com/0xsobky/AnonTab/raw/master/downloads/AnonTab.crx)

## Does it leak?

###### Leakproof against [HTTPLeaks](https://github.com/cure53/HTTPLeaks):
<a href="https://raw.githubusercontent.com/0xsobky/AnonTab/master/screenshots/network_log.png" target="blank"><img width="50%" src="https://raw.githubusercontent.com/0xsobky/AnonTab/master/screenshots/nl_thumb.png" alt="Leakproof against HTTPLeaks"></img></a>

###### And also [IPLeak](https://ipleak.net/):
<a href="https://raw.githubusercontent.com/0xsobky/AnonTab/master/screenshots/ipleaks.png" target="blank"><img width=50% src="https://raw.githubusercontent.com/0xsobky/AnonTab/master/screenshots/ipl_thumb.png" alt="Leakproof against IPLeaks"></img></a>

## Is it secure?
Likely yes. Unless you can bypass both of [_DOMPurify_](https://github.com/cure53/DOMPurify) and the restricted [content security policy](https://github.com/0xSobky/AnonTab/blob/master/src/manifest.json#L10) in place.

## Notes:
* Users of the µBlock browser extension (or uBlock Origin) are advised to add `ananontab.resource-scheme` to their whitelist.

## What do people say about it?
Go check [the reviews](https://addons.mozilla.org/en-US/firefox/addon/anontab/reviews/).

## Credits:
* [@0xSobky](https://twitter.com/0xSobky)
