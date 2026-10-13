// Valve's own domains: the domain itself and any subdomain are trusted
export const TRUSTED_DOMAINS = ['steampowered.com', 'steamcommunity.com', 'steamgames.com'];

// Third-party tools that legitimately have "steam" in their name
export const KNOWN_THIRD_PARTY_DOMAINS = ['steamdb.info', 'steamfolio.com', 'steaminventoryhelper.com'];

// Names that phishing sites like to imitate
export const IMITATED_NAMES = ['steamcommunity', 'steampowered', 'steamgames'];

// The word that gives a lookalike away when it shows up in a hostname
export const BRAND = 'steam';
