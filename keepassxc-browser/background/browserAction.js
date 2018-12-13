'use strict';

const browserAction = {};

browserAction.show = function(callback, tab) {
    let data = {};
    if (!page.tabs[tab.id] || page.tabs[tab.id].stack.length === 0) {
        browserAction.showDefault(callback, tab);
        return;
    } else {
        data = page.tabs[tab.id].stack[page.tabs[tab.id].stack.length - 1];
    }

    browser.browserAction.setIcon({
        tabId: tab.id,
        path: '/icons/toolbar/' + browserAction.generateIconName(data.iconType, data.icon)
    });

    if (data.popup) {
        browser.browserAction.setPopup({
            tabId: tab.id,
            popup: 'popups/' + data.popup
        });
    }
};

browserAction.showDefault = function(callback, tab) {
    const stackData = {
        level: 1,
        iconType: 'normal',
        popup: 'popup.html'
    };
    keepass.isConfigured().then((response) => {
        if (!response || keepass.isDatabaseClosed || !keepass.isKeePassXCAvailable/* || page.tabs[tab.id].errorMessage*/) {
            stackData.iconType = 'cross';
        }

        if (page.tabs[tab.id].loginList.length > 0) {
            stackData.iconType = 'questionmark';
            stackData.popup = 'popup_login.html';
        }

        browserAction.stackUnshift(stackData, tab.id);
        browserAction.show(null, tab);
    });
};

browserAction.removeLevelFromStack = function(callback, tab, level, type, dontShow) {
    if (!page.tabs[tab.id]) {
        return;
    }

    if (!type) {
        type = '<=';
    }

    const newStack = [];
    for (const i of page.tabs[tab.id].stack) {
        if ((type === '<' && i.level >= level) ||
            (type === '<=' && i.level > level) ||
            (type === '=' && i.level !== level) ||
            (type === '==' && i.level !== level) ||
            (type === '!=' && i.level === level) ||
            (type === '>' && i.level <= level) ||
            (type === '>=' && i.level < level)) {
            newStack.push(i);
        }
    }

    page.tabs[tab.id].stack = newStack;

    if (!dontShow) {
        browserAction.show(callback, tab);
    }
};

browserAction.stackPop = function(tabId) {
    const id = tabId || page.currentTabId;
    page.tabs[id].stack.pop();
};

browserAction.stackPush = function(data, tabId) {
    const id = tabId || page.currentTabId;
    browserAction.removeLevelFromStack(null, { 'id': id }, data.level, '<=', true);
    page.tabs[id].stack.push(data);
};

browserAction.stackUnshift = function(data, tabId) {
    const id = tabId || page.currentTabId;
    browserAction.removeLevelFromStack(null, { 'id': id }, data.level, '<=', true);
    page.tabs[id].stack.unshift(data);
};

browserAction.generateIconName = function(iconType, icon) {
    if (icon) {
        return icon;
    }

    let name = 'icon_';
    name += (keepass.keePassXCUpdateAvailable()) ? 'new_' : '';
    name += (!iconType || iconType === 'normal') ? 'normal' : iconType;
    name += '.png';

    return name;
};

browserAction.ignoreSite = function(url) {
    browser.windows.getCurrent().then(() => {
        // Get current active window
        browser.tabs.query({ 'active': true, 'currentWindow': true }).then((tabs) => {
            const tab = tabs[0];

            // Send the message to the current tab's content script
            browser.runtime.getBackgroundPage().then(() => {
                browser.tabs.sendMessage(tab.id, {
                    action: 'ignore_site',
                    args: [ url ]
                });
            });
        });
    });
};
