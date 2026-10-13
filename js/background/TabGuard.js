import { Verdict } from './verdict.js';

// Checks every page that finishes loading and tells the presenters what to show.
export class TabGuard {
  // what footerWatcher.js sends when it finds the footer, keep in sync with that file
  static FOOTER_FOUND = 'textFound';

  #tabs;
  #runtime;
  #classifier;
  #presenters;
  #footerScanner;

  constructor({ tabs, runtime, classifier, presenters, footerScanner }) {
    this.#tabs = tabs;
    this.#runtime = runtime;
    this.#classifier = classifier;
    this.#presenters = presenters;
    this.#footerScanner = footerScanner;
  }

  // Has to run while the background script starts: browsers only wake it up for listeners
  // that were registered right away.
  start() {
    this.#tabs.onUpdated.addListener((tabId, changeInfo, tab) => this.#onTabUpdated(tabId, changeInfo, tab));
    this.#runtime.onMessage.addListener((message, sender) => this.#onMessage(message, sender));
  }

  #onTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'loading') {
      // don't show the verdict of the previous page
      this.#presenters.forEach((presenter) => presenter.reset(tabId));
    }

    if (changeInfo.status !== 'complete') return;

    const verdict = this.#classifier.classify(this.#hostnameOf(tab.url));

    this.#show(tabId, verdict);

    // Real Steam pages are expected to show Valve's footer, everything else showing it is a fake
    if (verdict !== Verdict.SAFE) this.#footerScanner.watch(tabId);
  }

  #onMessage(message, sender) {
    if (message.message === TabGuard.FOOTER_FOUND && sender.tab) {
      this.#show(sender.tab.id, Verdict.HARMFUL);
    }
  }

  #show(tabId, verdict) {
    this.#presenters.forEach((presenter) => presenter.show(tabId, verdict));
  }

  #hostnameOf(url) {
    try {
      const { protocol, hostname } = new URL(url);

      return protocol === 'http:' || protocol === 'https:' ? hostname : '';
    } catch (error) {
      return '';
    }
  }
}
