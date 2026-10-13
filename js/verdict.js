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

const looksLikeSteam = function (hostname) {
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
