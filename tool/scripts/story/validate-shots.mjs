#!/usr/bin/env node
// usage: node validate-shots.mjs data/story.json   (run from the project folder so public/ is found)
import fs from 'node:fs';
import path from 'node:path';
import {EMOTES, FX, GRADES, POSES, PRESETS, PROPS, SETS, SIZES, TRANSITIONS} from './vocab.mjs';

const file = process.argv[2] ?? 'data/story.json';
const root = process.cwd();
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [], warns = [];
const E = (s, m) => errors.push(`${s}: ${m}`), W = (s, m) => warns.push(`${s}: ${m}`);
const tr = (v) => (Array.isArray(v) ? v.map((x) => x.v) : v === undefined ? [] : [v]);

if (!data.meta || !Array.isArray(data.shots)) { console.error('story.json needs { meta, shots[] }'); process.exit(1); }
const ids = new Set();
let total = 0;
for (const s of data.shots) {
  const id = s.id ?? '(no id)';
  if (ids.has(id)) E(id, 'duplicate id'); ids.add(id);
  if (!(s.durationSec > 0.3)) E(id, 'durationSec must be > 0.3');
  total += s.durationSec || 0;
  if (!SETS[s.set]) E(id, `unknown set "${s.set}" (${Object.keys(SETS).join(', ')})`);
  if (s.grade && !GRADES.includes(s.grade)) E(id, `unknown grade "${s.grade}"`);
  if (s.camera?.shot && !SIZES.includes(s.camera.shot)) E(id, `unknown camera size "${s.camera.shot}"`);
  if (s.transition && !TRANSITIONS.includes(s.transition)) E(id, `unknown transition "${s.transition}"`);
  for (const f of s.fx ?? []) if (!FX.includes(f)) E(id, `unknown fx "${f}"`);
  const cids = new Set();
  for (const c of s.characters ?? []) {
    if (!c.id) E(id, 'character without id'); if (cids.has(c.id)) E(id, `duplicate character id ${c.id}`); cids.add(c.id);
    if (!PRESETS.includes(c.preset)) E(id, `unknown preset "${c.preset}"`);
    if (c.at && SETS[s.set] && !SETS[s.set].includes(c.at)) E(id, `anchor "${c.at}" not in set ${s.set} (${SETS[s.set].join(', ')})`);
    if (!c.at && c.x === undefined) W(id, `character ${c.id} has no "at" or x: placed at centre`);
    for (const p of tr(c.pose)) if (!POSES.includes(p)) E(id, `unknown pose "${p}"`);
    for (const e of tr(c.emote)) if (!EMOTES.includes(e)) E(id, `unknown emote "${e}"`);
    if (c.prop && !PROPS.includes(c.prop)) E(id, `unknown prop "${c.prop}"`);
  }
  const f = s.camera?.focus;
  if (typeof f === 'string' && f !== 'center' && !cids.has(f.split('.')[0])) E(id, `camera.focus "${f}" is not a character in this shot`);
  if (s.counter && typeof s.counter.above === 'string' && !cids.has(s.counter.above)) E(id, `counter.above "${s.counter.above}" is not a character in this shot`);
  if (s.narration?.text) {
    const w = (s.narration.text.match(/\S+/g) || []).length, wps = w / s.durationSec;
    const lim = data.meta.lang === 'vi' ? 4.2 : 3.3;
    if (wps > lim) W(id, `narration too fast for its duration (${wps.toFixed(1)} words/s) - lengthen durationSec`);
    if (s.narration.audio && !fs.existsSync(path.join(root, 'public', s.narration.audio))) E(id, `audio file missing: public/${s.narration.audio}`);
  }
  for (const x of s.sfx ?? []) if (!fs.existsSync(path.join(root, 'public', x.file))) W(id, `sfx file missing: public/${x.file}`);
  if (s.title && s.title.lines.some((l) => l.length > 34)) W(id, 'title line is long (>34 chars): font will shrink');
}
if (data.meta.music && !fs.existsSync(path.join(root, 'public', data.meta.music))) E('meta', `music file missing: public/${data.meta.music}`);
const m = data.shots.length;
console.log(`${m} shots, ${(total / 60).toFixed(2)} min`);
warns.forEach((w) => console.log('warning:', w));
errors.forEach((e) => console.log('ERROR:  ', e));
console.log(errors.length ? `\n${errors.length} error(s)` : '\nOK');
process.exit(errors.length ? 1 : 0);
