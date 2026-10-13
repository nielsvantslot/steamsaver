// Builds one unpacked extension per browser into build/<browser>.
// The manifest is vendor/manifest.json plus the browser specific parts of vendor/<browser>.json,
// with the version taken from package.json (bump it with `npm version patch`).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export const BROWSERS = ['chrome', 'firefox'];

const FOLDERS = ['js', 'css', 'img'];

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

export const build = function () {
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

if (import.meta.url === pathToFileURL(process.argv[1]).href) build();
