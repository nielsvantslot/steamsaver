// Builds one unpacked extension per browser into build/<browser>.
// The manifest is vendor/manifest.json plus the browser specific parts of vendor/<browser>.json,
// with the version taken from package.json (bump it with `npm version patch`).
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const BROWSERS = ['chrome', 'firefox'];
const FOLDERS = ['js', 'css', 'img'];

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

const build = function () {
  const { version } = readJson('package.json');
  const base = readJson('vendor/manifest.json');

  for (const browser of BROWSERS) {
    const output = path.join(root, 'build', browser);

    fs.rmSync(output, { recursive: true, force: true });
    fs.mkdirSync(output, { recursive: true });

    for (const folder of FOLDERS) {
      fs.cpSync(path.join(root, folder), path.join(output, folder), { recursive: true });
    }

    const manifest = { ...base, ...readJson(`vendor/${browser}.json`), version };

    fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`built build/${browser} (${version})`);
  }
};

if (require.main === module) build();

module.exports = { build, BROWSERS };
