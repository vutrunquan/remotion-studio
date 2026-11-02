#!/usr/bin/env node
// Kiểm tra kịch bản trước khi dựng: mẫu cảnh, vật thể, liên kết, file ảnh/giọng, thời lượng.
// Dùng:  node tools/validate.mjs story/script.json
import {DOG_POSES, FX, KINDS, PERSON_POSES, SETS, SFX, TEMPLATES, countWords, exists, fmtTime, loadScript, sceneDuration} from './lib.mjs';

const file = process.argv[2] ?? 'story/script.json';
const script = loadScript(file);
const errors = [];
const warns = [];
const E = (id, m) => errors.push(`  ✗ [${id}] ${m}`);
const Wn = (id, m) => warns.push(`  ! [${id}] ${m}`);

if (!Array.isArray(script.scenes) || !script.scenes.length) {
  console.error('✗ Kịch bản không có "scenes".');
  process.exit(1);
}
const meta = script.meta ?? {};
if (!meta.channel) Wn('meta', 'chưa có meta.channel (chữ HUD "FILE 0xx // KÊNH")');
if (meta.fps && ![24, 25, 30, 50, 60].includes(meta.fps)) Wn('meta', `fps=${meta.fps} lạ, nên dùng 30`);

let total = (meta.introHold ?? 0);
const ids = new Set();
script.scenes.forEach((s, i) => {
  const id = s.id ?? `#${i + 1}`;
  if (s.id) {
    if (ids.has(s.id)) E(id, 'trùng id');
    ids.add(s.id);
  }
  const v = s.visual;
  if (!v) Wn(id, 'không có visual (chỉ có phụ đề trên nền đen)');
  else {
    if (!TEMPLATES.includes(v.tpl)) E(id, `tpl "${v.tpl}" không có. Dùng: ${TEMPLATES.join(', ')}`);
    if (v.tpl === 'stage') {
      if (v.set && !SETS.includes(v.set)) E(id, `set "${v.set}" không có. Dùng: ${SETS.join(', ')}`);
      const items = v.items ?? [];
      const itemIds = new Set(items.map((x) => x.id).filter(Boolean));
      if (v.set === 'room') ['window', 'clock', 'tv', 'chair'].forEach((x) => itemIds.add(x));
      if (v.set === 'bedroom') ['clock', 'bed'].forEach((x) => itemIds.add(x));
      if (v.set === 'diningRoom') ['window', 'dinner'].forEach((x) => itemIds.add(x));
      items.forEach((it, k) => {
        if (!KINDS.includes(it.kind)) E(id, `items[${k}].kind "${it.kind}" không có. Dùng: ${KINDS.join(', ')}`);
        if (it.kind === 'dog' && it.pose && !DOG_POSES.includes(it.pose)) E(id, `dog.pose "${it.pose}" không có (${DOG_POSES.join('/')})`);
        if (it.kind === 'person' && it.pose && !PERSON_POSES.includes(it.pose)) E(id, `person.pose "${it.pose}" không có (${PERSON_POSES.join('/')})`);
        if (it.x === undefined && !['cross', 'check'].includes(it.kind) && !(v.set && it.id)) Wn(id, `items[${k}] (${it.kind}) thiếu x — sẽ nằm ở góc trên trái`);
      });
      (v.links ?? []).forEach((l, k) => {
        for (const side of ['from', 'to']) {
          const e = l[side];
          if (typeof e === 'string' && !itemIds.has(e.split('@')[0])) E(id, `links[${k}].${side} = "${e}" không khớp id nào`);
        }
      });
    }
    if (v.tpl === 'exhibit') {
      if (v.image && !exists(v.image)) E(id, `không thấy ảnh public/${v.image}`);
      if (!v.image) Wn(id, 'exhibit chưa có "image" → dùng ô giữ chỗ');
    }
    if (v.tpl === 'rule' && !v.title) Wn(id, 'rule không có "title"');
    if (v.tpl === 'black' && s.note && /todo/i.test(s.note)) Wn(id, `chưa dựng hình: ${s.note}`);
  }
  if (s.voice && !exists(s.voice)) E(id, `không thấy giọng public/${s.voice}`);
  if (s.voice && !s.voiceDur) Wn(id, 'có voice nhưng chưa có voiceDur → chạy: npm run voice');
  (s.sfx ?? []).forEach((e) => { if (!SFX.includes(e.name)) E(id, `sfx "${e.name}" không có (${SFX.join(', ')})`); });
  (s.fx ?? []).forEach((e) => { if (!FX.includes(e.type)) E(id, `fx.type "${e.type}" không có (${FX.join(', ')})`); });
  const words = countWords(s.text);
  if (words > 14) Wn(id, `phụ đề ${words} từ — dài quá, nên tách cảnh (≤ 12 từ)`);
  if (!s.text && !s.dur) Wn(id, 'không có text lẫn dur → thời lượng tối thiểu');
  const dur = sceneDuration(s, meta.wpm ?? 150);
  if (s.dur === undefined && s.voice === undefined && s.text) {
    /* tự tính */
  }
  total += Math.round(dur * (meta.fps ?? 30)) / (meta.fps ?? 30) + (meta.gap ?? 0);
});
total += meta.outroHold ?? 1;

console.log(`\n${script.scenes.length} cảnh · tổng ≈ ${fmtTime(total)} (${total.toFixed(1)} s) · ${meta.fps ?? 30} fps · ${meta.aspect ?? '16:9'} ${meta.res ?? 1080}p`);
if (warns.length) console.log(`\nCảnh báo (${warns.length}):\n${warns.join('\n')}`);
if (errors.length) {
  console.log(`\nLỗi (${errors.length}):\n${errors.join('\n')}\n`);
  process.exit(1);
}
console.log('\n✓ Kịch bản hợp lệ.\n');
