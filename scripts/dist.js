// Zips the builds for the Chrome Web Store and Firefox Add-ons into dist/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { build, BROWSERS } from './build.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
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
