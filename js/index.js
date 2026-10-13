const engine = typeof browser !== 'undefined' ? browser : chrome;

// Chrome runs this file as a service worker and needs to import the helper itself,
// Firefox loads it through "background.scripts" in the manifest.
if (typeof importScripts === 'function') importScripts('verdict.js');

const BADGES = {
  safe: { text: '✓', color: '#1e8e1e' },
  harmful: { text: '!', color: '#c00808' },
  neutral: { text: '', color: '#808080' },
};

// Injected into the page, so it can't use anything from this file
const showBanner = function (verdict) {
  const id = 'steam_saver_banner';
  const colors = { safe: 'rgba(28, 190, 28, 0.5)', harmful: 'rgba(192, 8, 8, 0.5)' };
  const texts = { safe: 'This site is safe', harmful: 'Potentially harmful site' };

  document.getElementById(id)?.remove();

  const box = document.createElement('div');

  box.id = id;
  box.className = 'steam_saver';
  box.textContent = texts[verdict];
  Object.assign(box.style, {
    position: 'fixed',
    bottom: '100px',
    left: '0',
    width: '200px',
    height: '100px',
    color: '#fff',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors[verdict],
    borderTopRightRadius: '10px',
    borderBottomRightRadius: '10px',
    zIndex: '2147483647',
  });

  document.body.appendChild(box);
};

const setBadge = function (tabId, verdict) {
  const badge = BADGES[verdict];

  engine.action.setBadgeText({ tabId, text: badge.text }).catch(() => {});
  engine.action.setBadgeBackgroundColor({ tabId, color: badge.color }).catch(() => {});
};

const markTab = function (tabId, verdict) {
  setBadge(tabId, verdict);

  engine.scripting.executeScript({
    target: { tabId },
    func: showBanner,
    args: [verdict],
  }).catch((e) => console.error(e));
};

const hostnameOf = function (url) {
  try {
    const { protocol, hostname } = new URL(url);

    return protocol === 'http:' || protocol === 'https:' ? hostname : '';
  } catch (e) {
    return '';
  }
};

const handleTabUpdated = function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
    // don't show the verdict of the previous page
    setBadge(tabId, 'neutral');
  }

  if (changeInfo.status !== 'complete') return;

  const verdict = classifyHost(hostnameOf(tab.url));

  if (verdict !== 'neutral') markTab(tabId, verdict);

  // Real Steam pages are expected to show Valve's footer, everything else showing it is a fake
  if (verdict !== 'safe') {
    engine.scripting.executeScript({
      target: { tabId },
      files: ['./js/scripts/mutation.js'],
    }).catch((e) => console.error(e));
  }
};

// registered once: mutation.js reports from the page that is actually being impersonated
engine.runtime.onMessage.addListener((message, sender) => {
  if (message.message === 'textFound' && sender.tab) {
    markTab(sender.tab.id, 'harmful');
  }
});

engine.tabs.onUpdated.addListener(handleTabUpdated);
