import { Verdict } from './verdict.js';
import { KnownToolRule, LookalikeRule, TrustedDomainRule } from './hostRules.js';

export class HostClassifier {
  #rules;

  // rules are tried in order, the first one with an opinion wins
  constructor(rules) {
    this.#rules = rules;
  }

  static withDefaultRules() {
    return new HostClassifier([new TrustedDomainRule(), new KnownToolRule(), new LookalikeRule()]);
  }

  classify(rawHostname) {
    const hostname = (rawHostname || '').toLowerCase().replace(/\.$/, '');

    if (!hostname) return Verdict.NEUTRAL;

    for (const rule of this.#rules) {
      const verdict = rule.evaluate(hostname);

      if (verdict) return verdict;
    }

    return Verdict.NEUTRAL;
  }
}
