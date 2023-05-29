const engine = typeof browser !== 'undefined' ? browser : chrome;

const steam = new Set([
  "store.steampowered.com",
  "help.steampowered.com",
  "steamcommunity.com",
]);

const exceptions = new Set([
  "steamfolio.com",
  "steamdb.info",
  "steaminventoryhelper.com",
]);

function handleTabUpdated(tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    const base_url = new URL(tab.url).hostname;

    if (tab.url.match('chrome://')) return;

    if (steam.has(base_url)) {
      engine.scripting.executeScript({
        files: ['./js/scripts/approve.js'],
        target: {tabId: tabId}
      })
      .catch(e => console.error(e));
    } else if (!exceptions.has(base_url) && base_url.includes("steam")) {
      engine.scripting.executeScript({
        files: ['./js/scripts/deny.js'],
        target: {tabId: tabId}
      })
      .catch(e => console.error(e));
    }

    engine.scripting.executeScript({
      files: ['./js/scripts/mutation.js'],
      target: {tabId: tabId}
    })
    .then(() => {
      engine.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.message === 'textFound') {
          engine.scripting.executeScript({
            files: ['./js/scripts/deny.js'],
            target: {tabId: tabId}
          });
        }
      });
    })
    .catch(e => console.error(e));
  }
}

try {
  engine.tabs.onUpdated.addListener(handleTabUpdated);
} catch (e) {
  console.error(e);
}
