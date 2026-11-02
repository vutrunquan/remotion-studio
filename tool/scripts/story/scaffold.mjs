#!/usr/bin/env node
/** usage: node scaffold.mjs <target-dir> [--install]   copies template/ into a new Remotion project */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, '..', 'template');
const target = path.resolve(process.argv[2] ?? 'my-story-video');
if (fs.existsSync(path.join(target, 'package.json'))) { console.error(`${target} already has a project. Choose another folder.`); process.exit(1); }
fs.cpSync(src, target, {recursive: true, filter: (p) => !/node_modules|[\\/]out([\\/]|$)/.test(p)});
// scripts live next to the template inside the plugin; copy them into the project so the project is self-contained
fs.cpSync(here, path.join(target, 'scripts'), {recursive: true});
const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
pkg.scripts['render:long'] = 'node scripts/render-long.mjs --project .';
pkg.scripts.validate = 'node scripts/validate-shots.mjs data/story.json';
pkg.scripts.tts = 'node scripts/tts.mjs --story data/story.json';
pkg.scripts.draft = 'node scripts/script-to-shots.mjs script.txt -o data/story.json';
fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify(pkg, null, 2));
console.log(`project created: ${target}`);
if (process.argv.includes('--install')) {
  const r = spawnSync('npm', ['install'], {cwd: target, stdio: 'inherit', shell: process.platform === 'win32'});
  process.exit(r.status ?? 0);
}
console.log('next: cd', target, '&& npm install && npm run studio');
