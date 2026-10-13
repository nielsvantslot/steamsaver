// Internationalized hostnames: turns what the browser hands us ("xn--stem-73d.com") back into
// what a person reads in the address bar, with lookalike letters swapped for latin ones.

// Letters from other alphabets that look like latin ones, as used in "stеamcommunity.com"
const CONFUSABLE_LETTERS = {
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', х: 'x', у: 'y', і: 'i', ј: 'j', ѕ: 's', һ: 'h', ԁ: 'd', ԛ: 'q', ԝ: 'w', ѵ: 'v', ӏ: 'l', ԍ: 'g',
  ο: 'o', ν: 'v', α: 'a', ε: 'e', ι: 'i', κ: 'k', ρ: 'p', τ: 't', υ: 'u', χ: 'x',
};

const BASE = 36;

const digitOf = function (character) {
  const code = character.charCodeAt(0);

  if (code - 48 < 10) return code - 22; // 0-9
  if (code - 65 < 26) return code - 65; // A-Z
  if (code - 97 < 26) return code - 97; // a-z

  return BASE;
};

const adaptBias = function (delta, count, first) {
  let k = 0;

  delta = first ? Math.floor(delta / 700) : delta >> 1;
  delta += Math.floor(delta / count);

  for (; delta > 455; k += BASE) delta = Math.floor(delta / 35);

  return Math.floor(k + 36 * delta / (delta + 38));
};

// RFC 3492, the part of a label after "xn--"
export const decodePunycode = function (label) {
  const delimiter = label.lastIndexOf('-');
  const output = [...label.slice(0, Math.max(delimiter, 0))].map((character) => character.codePointAt(0));

  let n = 128;
  let bias = 72;
  let i = 0;

  for (let index = delimiter > 0 ? delimiter + 1 : 0; index < label.length;) {
    const previous = i;

    for (let weight = 1, k = BASE; ; k += BASE) {
      const digit = digitOf(label[index++] ?? '-');

      if (digit >= BASE) return label;

      i += digit * weight;

      const threshold = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;

      if (digit < threshold) break;

      weight *= BASE - threshold;
    }

    bias = adaptBias(i - previous, output.length + 1, previous === 0);
    n += Math.floor(i / (output.length + 1));
    i %= output.length + 1;
    output.splice(i++, 0, n);
  }

  return String.fromCodePoint(...output);
};

export const visibleHostname = function (hostname) {
  return hostname
    .split('.')
    .map((label) => (label.startsWith('xn--') ? decodePunycode(label.slice(4)) : label))
    .join('.')
    .normalize('NFKC')
    .replace(/./gu, (character) => CONFUSABLE_LETTERS[character] ?? character);
};
