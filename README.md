# Steam saver

Browser extension (Chrome and Firefox, manifest v3) that does two things:

1. **Verifies Steam pages.** Every page you open is classified from its hostname:
   - official Steam domains (`steamcommunity.com`, `steampowered.com`, `steamgames.com` and their subdomains) get a green *"This site is safe"* box and a ✓ on the toolbar icon
   - sites that imitate Steam (`stearncommunity.com`, `steamcomunnity.com`, `ste4mpowered.com`, `steamcommunity.com.evil.com`, and Unicode lookalikes such as a Cyrillic "е" in `stеamcommunity.com`, ...) get a red *"Potentially harmful site"* box and a **!** on the icon
   - pages that are not Steam but contain Valve's copyright footer (a copied Steam page) are marked harmful too
   - known third-party tools (SteamDB, Steamfolio, Steam Inventory Helper) are left alone

   The box is drawn inside the page, so a malicious page could draw the same box. Trust the toolbar icon, the page can't change that.
2. **Shows a whole Steam inventory on one page** (`https://steamcommunity.com/id/<name>/inventory/`) instead of 25 items per page, with the item info panel pinned next to the items while you scroll.

## Install

```
npm install
npm run build
```

Then load the unpacked folder `build/chrome` at `chrome://extensions` (developer mode), or `build/firefox` at `about:debugging` (Firefox 128 or newer, the extension needs the permission to run on all sites).

`npm run dist` writes zips for both stores to `dist/`. The version comes from `package.json`, bump it with `npm version patch`.

## Development

| command | what it does |
| --- | --- |
| `npm run build` | builds `build/chrome` and `build/firefox` from `js/`, `css/`, `img/` and `vendor/` |
| `npm test` | unit tests: the hostname rules, `TabGuard` against a fake browser, the presenters |
| `npm run test:e2e` | opens Chromium with the built extension and checks the banners, the badge and a real public inventory (needs `npx playwright install chromium`, the inventory part needs Steam to respond) |

The manifest is `vendor/manifest.json` plus the browser specific parts in `vendor/chrome.json` and `vendor/firefox.json`.

### How it works

```
js/background/   ES modules: the background script (a service worker in Chrome)
  index.js             wires everything together, nothing else
  TabGuard.js          checks a page when it has loaded and tells the presenters what to show
  HostClassifier.js    runs a hostname through the rules, the first opinion wins
  hostRules.js         one class per kind of check: TrustedDomainRule, KnownToolRule, LookalikeRule
  idn.js               punycode and lookalike letters (Cyrillic, Greek) back to what you see
  BadgePresenter.js    verdict on the toolbar icon (a page can't imitate this)
  BannerPresenter.js   verdict as a box in the page (banner.js is the code that runs in the page)
  FooterScanner.js     starts the footer watcher in a tab
js/content/      classic scripts, browsers can't load content scripts as modules
  footerWatcher.js     looks for Valve's copyright footer on pages that aren't Steam
  inventoryPatch.js    patches Steam's own inventory script in the page (see below)
css/steamInventory.css lays out the item grid and pins the info panel
```

The browser API is passed into the classes (`new TabGuard({ tabs, runtime, ... })`) instead of being used as a global, so `npm test` can run them against a fake browser.

**Adding a check:** write a class with `evaluate(hostname)` that returns a `Verdict` or `null` in `hostRules.js` and add it to `HostClassifier.withDefaultRules()`.

**Showing the verdict somewhere else:** write a class with `show(tabId, verdict)` and `reset(tabId)` and add it to `presenters` in `index.js`.

#### The inventory patch

`inventoryPatch.js` runs inside the inventory page itself (`"world": "MAIN"`). It leaves Steam's own `economy_v2.js` alone and patches a few of its functions right after it has run. Each patch is a class that lists the Steam internals it relies on: `ContinuousScrollPatch`, `EagerItemsPatch` and `ItemGridRepair`, which repairs the grid if something removes the loaded items. If Steam renames one of them, that patch is skipped with a warning in the console and the inventory falls back to Steam's normal paged view. `npm run test:e2e` is the quickest way to notice.
