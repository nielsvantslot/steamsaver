import test from 'node:test';
import assert from 'node:assert/strict';
import { TabGuard } from '../js/background/TabGuard.js';
import { HostClassifier } from '../js/background/HostClassifier.js';
import { Verdict } from '../js/background/verdict.js';

// a stand-in for the browser: records the listeners and lets a test fire them
const setup = function () {
  const listeners = {};
  const events = [];
  const event = (name) => ({ addListener: (listener) => (listeners[name] = listener) });

  const presenter = (name) => ({
    show: (tabId, verdict) => events.push(`${name}.show ${tabId} ${verdict}`),
    reset: (tabId) => events.push(`${name}.reset ${tabId}`),
  });

  new TabGuard({
    tabs: { onUpdated: event('tabUpdated') },
    runtime: { onMessage: event('message') },
    classifier: HostClassifier.withDefaultRules(),
    presenters: [presenter('badge'), presenter('banner')],
    footerScanner: { watch: (tabId) => events.push(`scan ${tabId}`) },
  }).start();

  return {
    events,
    load: (tabId, url) => {
      listeners.tabUpdated(tabId, { status: 'complete' }, { url });

      return events.splice(0);
    },
    message: (message, sender) => {
      listeners.message(message, sender);

      return events.splice(0);
    },
    listeners,
  };
};

test('registers its listeners when it starts', () => {
  const { listeners } = setup();

  assert.equal(typeof listeners.tabUpdated, 'function');
  assert.equal(typeof listeners.message, 'function');
});

test('an official Steam page is marked safe and not scanned', () => {
  const { load } = setup();

  assert.deepEqual(load(1, 'https://store.steampowered.com/app/730'), ['badge.show 1 safe', 'banner.show 1 safe']);
});

test('a lookalike is marked harmful and scanned for the Valve footer', () => {
  const { load } = setup();

  assert.deepEqual(load(2, 'https://stearncommunity.com/login'), ['badge.show 2 harmful', 'banner.show 2 harmful', 'scan 2']);
});

test('an unrelated page is only scanned', () => {
  const { load } = setup();

  assert.deepEqual(load(3, 'https://example.org/'), ['badge.show 3 neutral', 'banner.show 3 neutral', 'scan 3']);
});

test('pages that are not http(s) or have no url count as unrelated', () => {
  const { load } = setup();

  for (const url of ['chrome://extensions', 'about:blank', undefined, 'not a url']) {
    assert.deepEqual(load(4, url), ['badge.show 4 neutral', 'banner.show 4 neutral', 'scan 4'], String(url));
  }
});

test('the verdict of the previous page is cleared while a tab loads', () => {
  const { listeners, events } = setup();

  listeners.tabUpdated(5, { status: 'loading' }, { url: 'https://stearncommunity.com/' });

  assert.deepEqual(events, ['badge.reset 5', 'banner.reset 5']);
});

test('other tab updates are ignored', () => {
  const { listeners, events } = setup();

  listeners.tabUpdated(6, { title: 'new title' }, { url: 'https://stearncommunity.com/' });

  assert.deepEqual(events, []);
});

test('a page that turns out to contain the Valve footer is marked harmful', () => {
  const { message } = setup();

  assert.deepEqual(
    message({ message: TabGuard.FOOTER_FOUND }, { tab: { id: 7 } }),
    ['badge.show 7 harmful', 'banner.show 7 harmful']
  );
});

test('messages without a tab or with another meaning are ignored', () => {
  const { message } = setup();

  assert.deepEqual(message({ message: TabGuard.FOOTER_FOUND }, {}), []);
  assert.deepEqual(message({ message: 'something else' }, { tab: { id: 8 } }), []);
});

test('the footer message name matches what the content script sends', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../js/content/footerWatcher.js', import.meta.url), 'utf8');

  assert.ok(source.includes(`FOOTER_FOUND = '${TabGuard.FOOTER_FOUND}'`));
  assert.equal(Verdict.HARMFUL, 'harmful');
});
