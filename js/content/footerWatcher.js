// Watches a page that is not a Steam site for Valve's copyright footer, which only a copy of
// a Steam page would contain. Reports to the background script, which marks the tab as harmful.
// Injected by FooterScanner, as a classic script: browsers can't load content scripts as modules.
(function () {
  // what TabGuard listens for, keep in sync with TabGuard.FOOTER_FOUND
  const FOOTER_FOUND = 'textFound';
  const VALVE_FOOTER = /© Valve Corporation\. All rights reserved\. All trademarks are property of their respective owners in the US and other countries\./i;

  class FooterWatcher {
    #runtime;
    #document;
    #footer;
    #maxChecks;
    #intervalMs;
    #checks = 0;
    #timer;

    constructor({ runtime, document, footer = VALVE_FOOTER, maxChecks = 60, intervalMs = 1000 }) {
      this.#runtime = runtime;
      this.#document = document;
      this.#footer = footer;
      this.#maxChecks = maxChecks;
      this.#intervalMs = intervalMs;
    }

    start() {
      this.#timer = setInterval(() => this.#check(), this.#intervalMs);
    }

    #check() {
      const iframes = [...this.#document.querySelectorAll('iframe')];
      const documents = [this.#document, ...iframes.map((frame) => frame.contentDocument)];

      if (documents.some((doc) => this.#hasFooter(doc))) {
        this.#stop();
        this.#runtime.sendMessage({ message: FOOTER_FOUND }).catch(() => {});
      } else if (++this.#checks >= this.#maxChecks) {
        this.#stop();
      }
    }

    #hasFooter(doc) {
      try {
        return !!doc?.body && this.#footer.test(doc.body.textContent);
      } catch (error) {
        // cross-origin frame, can't look inside
        return false;
      }
    }

    #stop() {
      clearInterval(this.#timer);
    }
  }

  // the background script injects this on every page load, one watcher per page is enough
  if (window.steamSaverWatching) return;
  window.steamSaverWatching = true;

  const engine = globalThis.browser ?? globalThis.chrome;

  new FooterWatcher({ runtime: engine.runtime, document }).start();
})();
