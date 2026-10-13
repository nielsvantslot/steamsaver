// Watches a page that is not a Steam site for Valve's copyright footer, which only a copy of
// a Steam page would contain. Reports to the background script, which marks the tab as harmful.
(function () {
  if (window.steamSaverWatching) return;
  window.steamSaverWatching = true;

  const engine = typeof browser !== 'undefined' ? browser : chrome;
  const footer = /© Valve Corporation\. All rights reserved\. All trademarks are property of their respective owners in the US and other countries\./i;
  const MAX_CHECKS = 60;

  let checks = 0;

  const hasFooter = function (doc) {
    try {
      return !!doc.body && footer.test(doc.body.textContent);
    } catch (e) {
      // cross-origin frame, can't look inside
      return false;
    }
  };

  const check = function () {
    const documents = [document, ...[...document.querySelectorAll('iframe')].map((frame) => frame.contentDocument)];

    if (documents.some((doc) => doc && hasFooter(doc))) {
      clearInterval(interval);
      engine.runtime.sendMessage({ message: 'textFound' }).catch(() => {});
    } else if (++checks >= MAX_CHECKS) {
      clearInterval(interval);
    }
  };

  const interval = setInterval(check, 1000);
})();
