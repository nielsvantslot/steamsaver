import test from 'node:test';
import assert from 'node:assert/strict';
import { BadgePresenter } from '../js/background/BadgePresenter.js';
import { BannerPresenter } from '../js/background/BannerPresenter.js';
import { FooterScanner } from '../js/background/FooterScanner.js';
import { renderBanner } from '../js/background/banner.js';

const resolved = (calls, name) => (args) => {
  calls.push([name, args]);

  return Promise.resolve();
};

test('BadgePresenter sets text and color per verdict, and clears them on reset', () => {
  const calls = [];
  const badge = new BadgePresenter({
    setBadgeText: resolved(calls, 'text'),
    setBadgeBackgroundColor: resolved(calls, 'color'),
  });

  badge.show(1, 'safe');
  badge.show(2, 'harmful');
  badge.reset(3);

  assert.deepEqual(calls.filter(([name]) => name === 'text').map(([, args]) => args), [
    { tabId: 1, text: '✓' },
    { tabId: 2, text: '!' },
    { tabId: 3, text: '' },
  ]);
  assert.equal(calls.find(([name, args]) => name === 'color' && args.tabId === 2)[1].color, '#c00808');
});

test('BadgePresenter survives a tab that is already gone', () => {
  const failing = () => Promise.reject(new Error('No tab with id'));

  assert.doesNotThrow(() => new BadgePresenter({ setBadgeText: failing, setBadgeBackgroundColor: failing }).show(1, 'safe'));
});

test('BannerPresenter injects the banner for safe and harmful pages only', () => {
  const calls = [];
  const banner = new BannerPresenter({ executeScript: resolved(calls, 'inject') });

  banner.show(1, 'safe');
  banner.show(2, 'neutral');
  banner.show(3, 'harmful');
  banner.reset(4);

  assert.deepEqual(calls.map(([, args]) => [args.target.tabId, args.args[0]]), [[1, 'safe'], [3, 'harmful']]);
  assert.equal(calls[0][1].func, renderBanner);
});

test('the injected banner function does not depend on anything outside of itself', () => {
  // Chrome sends only the source of the function to the page
  const standalone = new Function(`return (${renderBanner.toString().replace(/^export\s+/, '')});`)();
  const added = [];
  const box = { style: {} };

  globalThis.document = {
    getElementById: () => null,
    createElement: () => box,
    body: { appendChild: (element) => added.push(element) },
  };

  try {
    standalone('harmful');
  } finally {
    delete globalThis.document;
  }

  assert.equal(added.length, 1);
  assert.equal(box.textContent, 'Potentially harmful site');
  assert.equal(box.style.backgroundColor, 'rgba(192, 8, 8, 0.5)');
});

test('FooterScanner injects the footer watcher into the tab', () => {
  const calls = [];

  new FooterScanner({ executeScript: resolved(calls, 'inject') }).watch(9);

  assert.deepEqual(calls[0][1], { target: { tabId: 9 }, files: ['js/content/footerWatcher.js'] });
});
