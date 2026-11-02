#!/usr/bin/env node
// Bản nháp tự động: văn bản kịch bản (mỗi dòng = một câu phụ đề) -> story/script.json.
// Dùng:  node tools/draft.mjs kich-ban.txt story/script.json
//
// Dòng đầu có thể khai báo:   # channel: TÊN KÊNH   # file: 041   # rules: 7   # title: ...   # accent: #e51939
// Dòng "---" hoặc dòng trống KHÔNG tạo cảnh. Gắn nhãn tay bằng "@": 
//     DO NOT SCREAM.            @scream
//     THAT IS A LONG TIME.      @exhibit B | YEAR: 1910 | STATUS: WATCHING | img=images/b.jpg
// Bản nháp chỉ đoán theo từ khoá. Đạo diễn (Claude) PHẢI sửa lại hình cho từng cảnh trong script.json.
import fs from 'node:fs';
import {sceneDuration} from './lib.mjs';

const [src, out = 'story/script.json'] = process.argv.slice(2);
if (!src) { console.error('Dùng: node tools/draft.mjs kich-ban.txt [story/script.json]'); process.exit(1); }

const NUM = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12};
const toN = (w) => (/^\d+$/.test(w) ? parseInt(w, 10) : NUM[w.toLowerCase()]);
const meta = {channel: 'CHANNEL', fileNo: 1, fps: 30, aspect: '16:9', res: 1080, accent: '#e51939', autoGlitch: true, glitchEvery: 9, outroHold: 1};
const scenes = [];
let ruleTotal = 0;
let seq = 0;

const ROOM = (extra = {}) => ({tpl: 'stage', set: 'room', setArgs: extra.setArgs ?? {}, items: extra.items ?? []});

function guess(text, tag) {
  const t = text.trim();
  let m;
  if (tag) {
    const [name, ...rest] = tag.split('|').map((x) => x.trim());
    const [kind, arg] = name.split(/\s+/);
    if (kind === 'exhibit') {
      const img = rest.find((r) => r.startsWith('img='));
      return {tpl: 'exhibit', label: `EXHIBIT ${arg ?? 'A'}`, meta: rest.filter((r) => !r.startsWith('img=')), image: img?.slice(4)};
    }
    if (kind === 'scream') return {tpl: 'stage', items: [{kind: 'person', pose: 'scream', x: 609, y: 440, scale: 1.6}, {kind: 'cross', x: 609, y: 296, w: 290, h: 300, stroke: 14, t0: 0.25}]};
    if (kind === 'run') return {tpl: 'stage', items: [{kind: 'door', x: 800, y: 440, scale: 1.3}, {kind: 'person', pose: 'run', x: 520, y: 440, scale: 1.5}, {kind: 'speed', x: 400, y: 330, scale: 1.2}]};
    if (kind === 'stare') return {tpl: 'stage', items: [{kind: 'eye', x: 609, y: 280, scale: 1.7}, {kind: 'cross', x: 609, y: 280, w: 230, h: 230, stroke: 14, t0: 1}]};
    if (kind === 'room') return ROOM();
    if (kind === 'black') return {tpl: 'black'};
  }
  if ((m = /^RULE\s+(\w+)\b[.:\-–]?\s*(.*)$/i.exec(t)) && toN(m[1])) {
    const title = m[2].replace(/[.!]+$/, '');
    return {tpl: 'rule', n: toN(m[1]), title: title || undefined};
  }
  if ((m = /THERE ARE (\w+) RULES/i.exec(t)) && toN(m[1])) { ruleTotal = toN(m[1]); return {tpl: 'counter', n: toN(m[1])}; }
  if ((m = /^DO NOT (SCREAM|SHOUT|YELL)/i.exec(t))) return guess(t, 'scream');
  if ((m = /^DO NOT (RUN|FLEE|ESCAPE)/i.exec(t))) return guess(t, 'run');
  if ((m = /^DO NOT (STARE|LOOK|WATCH)/i.exec(t))) return guess(t, 'stare');
  if (/^EXHIBIT\b/i.test(t)) return guess(t, 'exhibit');
  return {tpl: 'black'};
}

for (const raw of fs.readFileSync(src, 'utf8').split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line === '---') continue;
  let m;
  if ((m = /^#\s*(\w+)\s*:\s*(.+)$/.exec(line))) {
    const k = m[1].toLowerCase();
    if (k === 'channel') meta.channel = m[2];
    else if (k === 'file') meta.fileNo = m[2];
    else if (k === 'rules') meta.ruleTotal = parseInt(m[2], 10);
    else if (k === 'title') meta.title = m[2];
    else if (k === 'accent') meta.accent = m[2];
    else if (k === 'aspect') meta.aspect = m[2];
    continue;
  }
  if (line.startsWith('//')) continue;
  const [textPart, ...tagParts] = line.split(/\s+@/);
  const tag = tagParts.join(' @') || undefined;
  const visual = guess(textPart, tag);
  seq++;
  const sc = {id: `s${String(seq).padStart(2, '0')}`, text: textPart.trim(), visual};
  if (visual.tpl === 'black') sc.note = 'TODO: chọn hình (stage/counter/exhibit/...)';
  scenes.push(sc);
}
if (!meta.ruleTotal && ruleTotal) meta.ruleTotal = ruleTotal;
const script = {meta, scenes};
fs.mkdirSync(out.split('/').slice(0, -1).join('/') || '.', {recursive: true});
fs.writeFileSync(out, JSON.stringify(script, null, 1));
const total = scenes.reduce((a, s) => a + sceneDuration(s), 0);
const todo = scenes.filter((s) => s.note?.startsWith('TODO')).length;
console.log(`✓ ${scenes.length} cảnh · ≈ ${total.toFixed(0)} s → ${out}`);
if (todo) console.log(`! ${todo} cảnh chưa có hình (visual.tpl = "black") — cần đạo diễn lại bằng tay.`);
