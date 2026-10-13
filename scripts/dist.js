// Zips the builds for the Chrome Web Store and Firefox Add-ons into dist/.
const fs = require('node:fs');
const path = require('node:path');
const AdmZip = require('adm-zip');
const { build, BROWSERS } = require('./build');

const root = path.join(__dirname, '..');
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

build();
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });

for (const browser of BROWSERS) {
  const zip = new AdmZip();
  const file = path.join(root, 'dist', `steam-saver-${browser}-${version}.zip`);

  zip.addLocalFolder(path.join(root, 'build', browser));
  zip.writeZip(file);
  console.log(`wrote ${path.relative(root, file)}`);
}
