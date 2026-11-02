#!/usr/bin/env node
// Đọc độ dài file giọng đọc (public/voice/*) và ghi "voice" + "voiceDur" vào script.json.
// Quy ước tên: public/voice/<id cảnh>.mp3|wav|m4a|ogg  (vd s01.mp3). Cảnh nào đã có "voice" thì giữ nguyên đường dẫn.
// Dùng:  node tools/sync_voice.mjs story/script.json
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {PUBLIC, KIT, loadScript} from './lib.mjs';

const file = process.argv[2] ?? 'story/script.json';
const script = loadScript(file);

function probe(abs) {
  const args = ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', abs];
  const tries = [
    ['ffprobe', args],
    ['npx', ['--no-install', 'remotion', 'ffprobe', ...args]],
  ];
  for (const [cmd, a] of tries) {
    try {
      const out = execFileSync(cmd, a, {cwd: KIT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
      const d = parseFloat(out.split('\n').pop());
      if (d > 0) return d;
    } catch {}
  }
  return null;
}

let n = 0;
let missing = 0;
for (const s of script.scenes) {
  if (!s.voice && s.id) {
    for (const ext of ['mp3', 'wav', 'm4a', 'ogg']) {
      if (fs.existsSync(path.join(PUBLIC, 'voice', `${s.id}.${ext}`))) { s.voice = `voice/${s.id}.${ext}`; break; }
    }
  }
  if (!s.voice) { missing++; continue; }
  const abs = path.join(PUBLIC, s.voice);
  if (!fs.existsSync(abs)) { console.log(`✗ ${s.id}: không thấy ${s.voice}`); continue; }
  const d = probe(abs);
  if (!d) { console.log(`✗ ${s.id}: không đọc được độ dài (cần ffprobe hoặc "npm i" để dùng remotion ffprobe)`); continue; }
  s.voiceDur = Math.round(d * 1000) / 1000;
  delete s.dur; // để thời lượng theo giọng
  n++;
}
fs.writeFileSync(file, JSON.stringify(script, null, 1));
console.log(`✓ Đã đồng bộ ${n} giọng đọc. ${missing ? `${missing} cảnh chưa có giọng (sẽ tự tính theo số từ).` : ''}`);
