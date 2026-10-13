import { Verdict } from './verdict.js';
import { DomainList } from './domainList.js';
import { editDistance } from './editDistance.js';
import { visibleHostname } from './idn.js';
import { BRAND, IMITATED_NAMES, KNOWN_THIRD_PARTY_DOMAINS, TRUSTED_DOMAINS } from './steamDomains.js';

// A rule looks at a hostname and either gives a verdict or returns null, meaning "not my business".
// The classifier tries the rules in order, so a new kind of check is a new class here.

export class TrustedDomainRule {
  #domains;

  constructor(domains = TRUSTED_DOMAINS) {
    this.#domains = new DomainList(domains);
  }

  evaluate(hostname) {
    return this.#domains.includes(hostname) ? Verdict.SAFE : null;
  }
}

export class KnownToolRule {
  #domains;

  constructor(domains = KNOWN_THIRD_PARTY_DOMAINS) {
    this.#domains = new DomainList(domains);
  }

  evaluate(hostname) {
    return this.#domains.includes(hostname) ? Verdict.NEUTRAL : null;
  }
}

// Characters that are commonly swapped to make a lookalike: ste4m, stearn, steaml
const LOOKALIKE_CHARACTERS = { 0: 'o', 1: 'l', 3: 'e', 4: 'a', 5: 's', 7: 't' };

export class LookalikeRule {
  #brand;
  #imitatedNames;
  #maxTypos;

  constructor({ brand = BRAND, imitatedNames = IMITATED_NAMES, maxTypos = 2 } = {}) {
    this.#brand = brand;
    this.#imitatedNames = imitatedNames;
    this.#maxTypos = maxTypos;
  }

  evaluate(hostname) {
    const visible = visibleHostname(hostname);

    return this.#containsBrand(visible) || this.#isTypoOfImitatedName(visible) ? Verdict.HARMFUL : null;
  }

  #containsBrand(hostname) {
    const normalized = hostname
      .replace(/rn/g, 'm')
      .replace(/[013457]/g, (character) => LOOKALIKE_CHARACTERS[character] ?? character);

    return normalized.includes(this.#brand);
  }

  // typos that drop or change a letter, like "stemcommunity"
  #isTypoOfImitatedName(hostname) {
    return hostname.split(/[.-]/).some((label) =>
      this.#imitatedNames.some((name) => editDistance(label, name) <= this.#maxTypos)
    );
  }
}
