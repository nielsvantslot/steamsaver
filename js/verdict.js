// Decides how much a hostname should be trusted. No browser APIs in here so it can be
// unit tested with node (see test/verdict.test.js) and loaded by the background script.

// Valve's own domains: the domain itself and any subdomain are trusted
const TRUSTED_DOMAINS = ['steampowered.com', 'steamcommunity.com', 'steamgames.com'];

// Third-party tools that legitimately have "steam" in their name
const KNOWN_THIRD_PARTY_DOMAINS = ['steamdb.info', 'steamfolio.com', 'steaminventoryhelper.com'];

// Names that phishing sites like to imitate
const IMITATED_NAMES = ['steamcommunity', 'steampowered', 'steamgames'];

// Characters that are commonly swapped to make a lookalike: ste4m, stearn, steaml
const LOOKALIKE_CHARACTERS = { 0: 'o', 1: 'l', 3: 'e', 4: 'a', 5: 's', 7: 't' };

// Letters from other alphabets that look like latin ones, as used in "stеamcommunity.com"
const CONFUSABLE_LETTERS = {
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', х: 'x', у: 'y', і: 'i', ј: 'j', ѕ: 's', һ: 'h', ԁ: 'd', ԛ: 'q', ԝ: 'w', ѵ: 'v', ӏ: 'l', ԍ: 'g',
  ο: 'o', ν: 'v', α: 'a', ε: 'e', ι: 'i', κ: 'k', ρ: 'p', τ: 't', υ: 'u', χ: 'x',
};

// Browsers give us internationalized hostnames in punycode ("xn--stamcommunity-x3k.com"),
// this turns a label back into the characters the user sees (RFC 3492)
const decodePunycode = function (label) {
  const BASE = 36;
  const delimiter = label.lastIndexOf('-');
  const output = [...label.slice(0, Math.max(delimiter, 0))].map((character) => character.codePointAt(0));
  const digitOf = (character) => {
    const code = character.charCodeAt(0);

    return code - 48 < 10 ? code - 22 : code - 65 < 26 ? code - 65 : code - 97 < 26 ? code - 97 : BASE;
  };
  const adapt = (delta, count, first) => {
    let k = 0;

    delta = first ? Math.floor(delta / 700) : delta >> 1;
    delta += Math.floor(delta / count);

    for (; delta > 455; k += BASE) delta = Math.floor(delta / 35);

    return Math.floor(k + 36 * delta / (delta + 38));
  };

  let n = 128;
  let bias = 72;
  let i = 0;

  for (let index = delimiter > 0 ? delimiter + 1 : 0; index < label.length;) {
    const previous = i;

    for (let w = 1, k = BASE; ; k += BASE) {
      const digit = digitOf(label[index++] ?? '-');

      if (digit >= BASE) return label;

      i += digit * w;

      const threshold = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;

      if (digit < threshold) break;

      w *= BASE - threshold;
    }

    bias = adapt(i - previous, output.length + 1, previous === 0);
    n += Math.floor(i / (output.length + 1));
    i %= output.length + 1;
    output.splice(i++, 0, n);
  }

  return String.fromCodePoint(...output);
};

// what a person reads in the address bar, with lookalike letters turned into latin ones
const visibleHostname = function (hostname) {
  return hostname
    .split('.')
    .map((label) => (label.startsWith('xn--') ? decodePunycode(label.slice(4)) : label))
    .join('.')
    .normalize('NFKC')
    .replace(/./gu, (character) => CONFUSABLE_LETTERS[character] ?? character);
};

const isDomainOrSubdomain = function (hostname, domain) {
  return hostname === domain || hostname.endsWith('.' + domain);
};

const editDistance = function (a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const current = [i];

    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }

    previous = current;
  }

  return previous[b.length];
};

const looksLikeSteam = function (rawHostname) {
  const hostname = visibleHostname(rawHostname);
  const normalized = hostname
    .replace(/rn/g, 'm')
    .replace(/[013457]/g, (character) => LOOKALIKE_CHARACTERS[character] ?? character);

  if (normalized.includes('steam')) return true;

  // typos that drop or change a letter, like "stemcommunity"
  return hostname.split(/[.-]/).some((label) =>
    IMITATED_NAMES.some((name) => editDistance(label, name) <= 2)
  );
};

// 'safe' = official Steam, 'harmful' = pretends to be Steam, 'neutral' = nothing to say
const classifyHost = function (rawHostname) {
  const hostname = (rawHostname || '').toLowerCase().replace(/\.$/, '');

  if (!hostname) return 'neutral';

  if (TRUSTED_DOMAINS.some((domain) => isDomainOrSubdomain(hostname, domain))) return 'safe';

  if (KNOWN_THIRD_PARTY_DOMAINS.some((domain) => isDomainOrSubdomain(hostname, domain))) return 'neutral';

  return looksLikeSteam(hostname) ? 'harmful' : 'neutral';
};

if (typeof module !== 'undefined') module.exports = { classifyHost };
