/**
 * Background Service Worker (Manifest V3)
 */

// Enable the side panel to open automatically when user clicks the extension action icon in the toolbar
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => console.error('Error configuring side panel behavior:', err));
  }
});

// Explicit action click fallback to ensure side panel opens
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (chrome.sidePanel && chrome.sidePanel.open && tab.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  } catch (err) {
    console.error('Error opening side panel:', err);
  }
});

// Forward relevant tab change events to the side panel if it is open
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    chrome.runtime
      .sendMessage({
        type: 'TAB_UPDATED',
        tabId,
        url: tab.url,
        title: tab.title,
      })
      .catch(() => {
        // Expected error when side panel is closed (no receiver)
      });
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    chrome.runtime
      .sendMessage({
        type: 'TAB_ACTIVATED',
        tabId: activeInfo.tabId,
        url: tab.url,
        title: tab.title,
      })
      .catch(() => {
        // Expected error when side panel is closed (no receiver)
      });
  } catch (err) {
    // Tab might be closing or inaccessible
  }
});
