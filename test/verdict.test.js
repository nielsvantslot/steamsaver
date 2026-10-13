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
