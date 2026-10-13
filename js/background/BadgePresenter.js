import { Verdict } from './verdict.js';

const BADGES = {
  [Verdict.SAFE]: { text: '✓', color: '#1e8e1e' },
  [Verdict.HARMFUL]: { text: '!', color: '#c00808' },
  [Verdict.NEUTRAL]: { text: '', color: '#808080' },
};

// Shows the verdict on the toolbar icon. Unlike the banner, a page can't imitate this.
export class BadgePresenter {
  #action;

  constructor(action) {
    this.#action = action;
  }

  show(tabId, verdict) {
    const { text, color } = BADGES[verdict];

    this.#action.setBadgeText({ tabId, text }).catch(() => {});
    this.#action.setBadgeBackgroundColor({ tabId, color }).catch(() => {});
  }

  reset(tabId) {
    this.show(tabId, Verdict.NEUTRAL);
  }
}
