// Starts js/content/footerWatcher.js in a tab: it looks for Valve's copyright footer, which
// only a copy of a Steam page would show on a site that isn't Steam.
export class FooterScanner {
  #scripting;
  #file;

  constructor(scripting, file = 'js/content/footerWatcher.js') {
    this.#scripting = scripting;
    this.#file = file;
  }

  watch(tabId) {
    this.#scripting.executeScript({
      target: { tabId },
      files: [this.#file],
    }).catch((error) => console.error(error));
  }
}
