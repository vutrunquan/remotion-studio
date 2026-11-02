#!/usr/bin/env node
// Xuất ảnh tổng hợp (mỗi ô một cảnh) để duyệt nhanh: out/sheet_01.png, ...
// Dùng:  node tools/sheet.mjs story/script.json [--page 2] [--cols 3 --rows 3]
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {KIT, loadScript} from './lib.mjs';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--')) ?? 'story/script.json';
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? parseInt(args[i + 1], 10) : d;
};
const cols = opt('cols', 3);
const rows = opt('rows', 3);
const only = opt('page', 0);
const script = loadScript(file);
const per = cols * rows;
const pages = Math.ceil(script.scenes.length / per);
fs.mkdirSync(path.join(KIT, 'out'), {recursive: true});
for (let p = 0; p < pages; p++) {
  if (only && only !== p + 1) continue;
  const props = path.join(KIT, 'out', `_sheet_props_${p + 1}.json`);
  fs.writeFileSync(props, JSON.stringify({...script, sheet: {page: p, cols, rows}}));
  const out = path.join('out', `sheet_${String(p + 1).padStart(2, '0')}.png`);
  console.log(`→ ${out} (cảnh ${p * per + 1}–${Math.min(script.scenes.length, (p + 1) * per)})`);
  const r = spawnSync('npx', ['remotion', 'still', 'src/index.ts', 'Sheet', out, `--props=${props}`], {cwd: KIT, stdio: 'inherit', shell: process.platform === 'win32'});
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log('✓ Xong. Mở các file out/sheet_*.png để duyệt.');
