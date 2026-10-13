const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyHost } = require('../js/verdict.js');

test('official Steam hosts are safe', () => {
  for (const host of [
    'steamcommunity.com',
    'store.steampowered.com',
    'help.steampowered.com',
    'login.steampowered.com',
    'checkout.steampowered.com',
    'steampowered.com',
    'partner.steamgames.com',
    'www.steamcommunity.com',
  ]) {
    assert.equal(classifyHost(host), 'safe', host);
  }
});

test('known third-party Steam tools are neutral', () => {
  for (const host of ['steamdb.info', 'www.steamdb.info', 'steamfolio.com', 'steaminventoryhelper.com']) {
    assert.equal(classifyHost(host), 'neutral', host);
  }
});

test('lookalike domains are harmful', () => {
  for (const host of [
    'steamcommunity.com.evil.com',
    'steam-community.ru',
    'steamcomunnity.com',
    'stearncommunity.com',
    'ste4mpowered.com',
    'steamcommunnity.com',
    'steam.trade-offers.net',
    'store.steampowered.com.login.example',
  ]) {
    assert.equal(classifyHost(host), 'harmful', host);
  }
});

test('unrelated hosts are neutral', () => {
  for (const host of ['google.com', 'github.com', 'steak.com', 'localhost', '', 'example.org']) {
    assert.equal(classifyHost(host), 'neutral', host);
  }
});

test('a trusted domain only counts as a real suffix', () => {
  assert.equal(classifyHost('notsteamcommunity.com'), 'harmful');
  assert.equal(classifyHost('steamcommunity.com.'), 'safe');
});

test('internationalized lookalikes are harmful', () => {
  // browsers hand us the punycode form of hostnames with non-ASCII characters
  const { domainToASCII } = require('node:url');

  for (const host of [
    'stеamcommunity.com', // cyrillic е
    'steаmpowered.com', // cyrillic а
    'steamcоmmunity.com', // cyrillic о
    'ѕteamcommunity.com', // cyrillic ѕ
    'steаm.com', // cyrillic а, nothing else to go on
    'ѕteam-trade.net',
  ]) {
    const ascii = domainToASCII(host);

    assert.match(ascii, /xn--/, `${host} is punycode`);
    assert.equal(classifyHost(ascii), 'harmful', ascii);
  }
});

test('other internationalized hosts are neutral', () => {
  const { domainToASCII } = require('node:url');

  for (const host of ['münchen.de', 'пример.рф', '日本語.jp']) {
    assert.equal(classifyHost(domainToASCII(host)), 'neutral', host);
  }
});
