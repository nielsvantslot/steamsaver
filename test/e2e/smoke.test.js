// End to end check of the built extension in Chromium. Needs the browser from
// `npx playwright install chromium` and opens a visible window (extensions don't run headless).
// The inventory part loads a public Steam inventory, so it breaks when Steam changes its pages
// and is skipped when Steam doesn't respond (it rate limits repeated loads).
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { build } from '../../scripts/build.js';

const EXTENSION = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'build', 'chrome');
const INVENTORY_URL = process.env.STEAM_INVENTORY_URL || 'https://steamcommunity.com/id/n_tty/inventory/#730_2';
const FOOTER = '© Valve Corporation. All rights reserved. All trademarks are property of their respective owners in the US and other countries.';

const FAKE_PAGES = {
  'https://stearncommunity.com/': '<body>log in with Steam</body>',
  'https://login.steampowered.com/': '<body>official</body>',
  'https://example-shop.com/plain': '<body>a shop</body>',
  'https://example-shop.com/copy': `<body>a shop ${FOOTER}</body>`,
  'https://steamdb.info/': '<body>a database</body>',
};

let context;
let serviceWorker;

test.before(async () => {
  build();

  context = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'steamsaver-')), {
    headless: false,
    viewport: { width: 1908, height: 1000 },
    args: [`--disable-extensions-except=${EXTENSION}`, `--load-extension=${EXTENSION}`],
  });

  for (const [url, body] of Object.entries(FAKE_PAGES)) {
    await context.route(url, (route) => route.fulfill({ status: 200, contentType: 'text/html', body }));
  }

  serviceWorker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');

  // the worker exists a moment before its script has registered the listeners
  for (let attempt = 0; attempt < 50 && !await serviceWorker.evaluate(() => chrome.tabs.onUpdated.hasListeners()); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
});

test.after(async () => {
  await context?.close();
});

const readVerdict = async function (page, url) {
  const banner = await page.locator('.steam_saver').allInnerTexts();
  const badge = await serviceWorker.evaluate(async (tabUrl) => {
    const [tab] = await chrome.tabs.query({ url: tabUrl });

    return chrome.action.getBadgeText({ tabId: tab.id });
  }, url);

  return { banner, badge };
};

// The verdict shows up a moment after the page loaded, so wait until it stops changing
const verdictOf = async function (url) {
  const page = await context.newPage();

  await page.goto(url);
  await page.waitForTimeout(1500);

  let previous = JSON.stringify(await readVerdict(page, url));

  for (let attempt = 0; attempt < 10; attempt++) {
    await page.waitForTimeout(700);

    const current = JSON.stringify(await readVerdict(page, url));

    if (current === previous) break;

    previous = current;
  }

  await page.close();

  return JSON.parse(previous);
};

test('official Steam hosts get the safe banner and badge', async () => {
  assert.deepEqual(await verdictOf('https://login.steampowered.com/'), { banner: ['This site is safe'], badge: '✓' });
});

test('lookalike hosts get the harmful banner and badge', async () => {
  assert.deepEqual(await verdictOf('https://stearncommunity.com/'), { banner: ['Potentially harmful site'], badge: '!' });
});

test('a page copying the Valve footer is harmful', async () => {
  assert.deepEqual(await verdictOf('https://example-shop.com/copy'), { banner: ['Potentially harmful site'], badge: '!' });
});

test('unrelated and known third-party hosts are left alone', async () => {
  assert.deepEqual(await verdictOf('https://example-shop.com/plain'), { banner: [], badge: '' });
  assert.deepEqual(await verdictOf('https://steamdb.info/'), { banner: [], badge: '' });
});

test('the whole inventory loads on one page and stays there', async (t) => {
  const page = await context.newPage();

  await page.goto(INVENTORY_URL);
  await page.waitForTimeout(9000);

  if (!await page.locator('.inventory_ctn').count()) {
    t.skip('Steam did not render the inventory (rate limited or private?)');
    return;
  }

  const items = () => page.locator('.inventory_ctn .inventory_page .itemHolder:not(.disabled)').count();

  assert.equal(await page.locator('#pagebtn_next').isVisible().catch(() => false), false, 'numbered pager is hidden');

  for (let i = 0; i < 12; i++) {
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(400);
  }

  await page.waitForTimeout(4000);

  const loaded = await items();
  const total = await page.evaluate(() => g_ActiveInventory.m_cItems);

  assert.ok(loaded > 25, `more than one page of items (${loaded})`);
  assert.ok(loaded >= total - 1, `all items present (${loaded} of ${total})`);

  // the info panel stays in view while scrolling through the items
  await page.mouse.wheel(0, -100000);
  await page.locator('.inventory_ctn .itemHolder .item').nth(3).click();
  await page.mouse.wheel(0, 2500);
  await page.waitForTimeout(1000);

  const panel = page.locator('.inventory_page_right');
  const top = (await panel.boundingBox()).y;

  assert.ok(top >= 0 && top < 100, `info panel is pinned at the top of the window (${top})`);
  assert.ok((await panel.innerText()).length > 20, 'info panel has content');

  // the full width of the Steam page isn't squeezed by the extension
  const widths = await page.evaluate(() => [document.documentElement.clientWidth, document.querySelector('#footer').getBoundingClientRect().width]);

  assert.ok(Math.abs(widths[0] - widths[1]) < 20, `footer spans the page (${widths})`);

  await page.close();
});
