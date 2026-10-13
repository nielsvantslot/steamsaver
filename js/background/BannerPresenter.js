import { Verdict } from './verdict.js';
import { renderBanner } from './banner.js';

// Shows the verdict as a box in the corner of the page.
export class BannerPresenter {
  #scripting;

  constructor(scripting) {
    this.#scripting = scripting;
  }

  show(tabId, verdict) {
    if (verdict === Verdict.NEUTRAL) return;

    this.#scripting.executeScript({
      target: { tabId },
      func: renderBanner,
      args: [verdict],
    }).catch((error) => console.error(error));
  }

  // the box disappears together with the page it was drawn in
  reset() {}
}
