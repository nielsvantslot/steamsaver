# Steam saver

Browser extension (Chrome and Firefox, manifest v3) that does two things:

1. **Verifies Steam pages.** Every page you open is classified from its hostname:
   - official Steam domains (`steamcommunity.com`, `steampowered.com`, `steamgames.com` and their subdomains) get a green *"This site is safe"* box and a ✓ on the toolbar icon
   - sites that imitate Steam (`stearncommunity.com`, `steamcomunnity.com`, `ste4mpowered.com`, `steamcommunity.com.evil.com`, ...) get a red *"Potentially harmful site"* box and a **!** on the icon
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
| `npm test` | unit tests of the hostname classification (`js/verdict.js`) |
| `npm run test:e2e` | opens Chromium with the built extension and checks the banners, the badge and a real public inventory (needs `npx playwright install chromium`, the inventory part needs Steam to respond) |

The manifest is `vendor/manifest.json` plus the browser specific parts in `vendor/chrome.json` and `vendor/firefox.json`.

### How it works

- `js/index.js` is the background script. It classifies the hostname of a page with `js/verdict.js` when it finishes loading, sets the badge and injects the box. `js/scripts/mutation.js` is injected into pages that are not official Steam sites and looks for Valve's footer.
- `js/pagePatch.js` runs inside the inventory page itself (`"world": "MAIN"`). It leaves Steam's own `economy_v2.js` alone and only switches it to Steam's responsive layout, which has one continuously scrolling page. It also repairs the grid if something removes the loaded items afterwards.
- `css/steamInventory.css` lays out the item grid and pins the info panel.

The inventory part relies on a few internals of Steam's script (`InitDynamicInventoryItemAutosizing`, `g_bEnableDynamicSizing`, `CSingleResponsivePage`). If Steam renames them the extension logs a warning in the console and the inventory falls back to Steam's normal paged view. `npm run test:e2e` is the quickest way to notice.
