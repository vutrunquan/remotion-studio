#!/usr/bin/env node
/**
 * script -> data/story.json
 *
 * Two input styles (auto-detected):
 *  A) DIRECTED script: blocks that start with  "--- id | set=.. cam=.."  (see references/script-format.md)
 *  B) PROSE script: plain narration. A rule-based "auto director" drafts shots (sets, camera rhythm,
 *     emotions, title cards, time badges, counters). Good as a first draft for ANY length; a director pass
 *     (Claude) should then refine it into style A.
 *
 * usage: node script-to-shots.mjs script.txt [-o data/story.json] [--lang en|vi] [--wps 2.6] [--aspect 16:9]
 */
import fs from 'node:fs';
import path from 'node:path';
import {SETS} from './vocab.mjs';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const input = args.find((a) => !a.startsWith('-') && a !== flag('-o') && a !== flag('--lang') && a !== flag('--wps') && a !== flag('--aspect'));
if (!input) { console.error('usage: script-to-shots.mjs script.txt [-o out.json] [--lang en|vi] [--wps N] [--aspect 16:9|9:16|1:1]'); process.exit(1); }
const outPath = flag('-o', 'data/story.json');
const text = fs.readFileSync(input, 'utf8').replace(/\r/g, '');

// ---------------------------------------------------------------- header
const meta = {title: path.basename(input, path.extname(input)), aspect: flag('--aspect', '16:9'), resolution: '1080p', fps: 30, lang: flag('--lang', 'en')};
let defaultGrade;
let wps;
const lines = text.split('\n');
let bodyStart = 0;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i].trim();
  if (!l || l.startsWith('#')) { bodyStart = i + 1; continue; }
  if (l.startsWith('---')) break;
  const m = l.match(/^(TITLE|ASPECT|RESOLUTION|FPS|LANG|MUSIC|MUSIC_VOLUME|VOICE_VOLUME|GRADE|GRAIN|LETTERBOX|WPS)\s*:\s*(.+)$/i);
  if (!m) break;
  const k = m[1].toUpperCase(), v = m[2].trim();
  if (k === 'TITLE') meta.title = v; else if (k === 'ASPECT') meta.aspect = v; else if (k === 'RESOLUTION') meta.resolution = v;
  else if (k === 'FPS') meta.fps = +v; else if (k === 'LANG') meta.lang = v; else if (k === 'MUSIC') meta.music = v;
  else if (k === 'MUSIC_VOLUME') meta.musicVolume = +v; else if (k === 'VOICE_VOLUME') meta.voiceVolume = +v;
  else if (k === 'GRADE') defaultGrade = v; else if (k === 'GRAIN') meta.grain = +v; else if (k === 'LETTERBOX') meta.letterbox = +v;
  else if (k === 'WPS') wps = +v;
  bodyStart = i + 1;
}
if (flag('--wps')) wps = +flag('--wps');
wps = wps ?? (meta.lang === 'vi' ? 3.3 : 2.6);
const body = lines.slice(bodyStart).join('\n');
const warnings = [];

const wordsOf = (s) => (s.trim().match(/\S+/g) || []).length;
const durFor = (narr, min = 1.4) => Math.max(min, +(wordsOf(narr) / wps + 0.4).toFixed(2));
const num = (v) => (v === undefined || v === '' || isNaN(+v) ? undefined : +v);
const kv = (s) => {
  const o = {};
  for (const m of s.matchAll(/(\w+)=("[^"]*"|\S+)/g)) o[m[1]] = m[2].replace(/^"|"$/g, '');
  return o;
};
const track = (v) => {
  if (v === undefined) return undefined;
  const parts = v.split('|');
  if (parts.length === 1 && !parts[0].includes('@')) return parts[0];
  return parts.map((p, i) => { const [val, at] = p.split('@'); return {at: at ? +at : i === 0 ? 0 : i, v: val}; });
};

// ---------------------------------------------------------------- style A: directed
function parseDirected(src) {
  const shots = [];
  let cur = null;
  const flush = () => { if (cur) { finish(cur); shots.push(cur); } cur = null; };
  const finish = (s) => {
    if (s._narr.length) s.narration = {text: s._narr.join(' ')};
    if (s._dur === undefined) {
      s.durationSec = s.narration ? durFor(s.narration.text) : s.title ? 2.6 : 2;
      s._auto = true;
    } else s.durationSec = s._dur;
    delete s._narr; delete s._dur;
  };
  for (const raw of src.split('\n')) {
    const l = raw.trim();
    if (!l || l.startsWith('#')) continue;
    if (l.startsWith('---')) {
      flush();
      const parts = l.replace(/^-+\s*/, '').split('|').map((x) => x.trim());
      const id = parts[0] && !parts[0].includes('=') ? parts.shift() : `s${String(shots.length + 1).padStart(3, '0')}`;
      const f = kv(parts.join(' '));
      cur = {id, set: f.set ?? shots.at(-1)?.set ?? 'street-dusk', _narr: [], _dur: num(f.dur)};
      cur.camera = {shot: f.cam ?? 'wide'};
      if (f.grade ?? defaultGrade) cur.grade = f.grade ?? defaultGrade;
      if (f.in) cur.transition = f.in;
      if (f.insec) cur.transitionSec = +f.insec;
      cur.characters = [];
      continue;
    }
    if (!cur) { warnings.push(`line outside any shot ignored: "${l.slice(0, 50)}"`); continue; }
    const m = l.match(/^([A-Z_]+)\s*:\s*(.*)$/);
    if (!m) { cur._narr.push(l); continue; }          // bare lines = narration
    const key = m[1], val = m[2];
    const [main, ...optParts] = val.split(' ; ');
    const opt = kv(optParts.join(' '));
    switch (key) {
      case 'NARR': cur._narr.push(val); break;
      case 'DUR': cur._dur = +val; break;
      case 'CHAR': {
        const f = kv(val);
        const c = {id: f.id ?? f.preset, preset: f.preset ?? 'hoodie'};
        if (f.at) c.at = f.at;
        for (const k of ['x', 'y', 'scale', 'rotate', 'glow', 'blur', 'look']) if (num(f[k]) !== undefined) c[k] = num(f[k]);
        if (f.fade) c.fadeIn = +f.fade;
        if (f.flip) c.flip = f.flip !== '0';
        if (f.view) c.view = f.view;
        if (f.prop) c.prop = f.prop;
        if (f.pose) c.pose = track(f.pose);
        if (f.emote) c.emote = track(f.emote);
        if (f.move) { const [mx, my] = f.move.split(','); c.moveTo = {}; if (num(mx) !== undefined) c.moveTo.x = +mx; if (num(my) !== undefined) c.moveTo.y = +my; }
        for (const k of ['top', 'top2', 'pants', 'hair', 'hat', 'shoe', 'skin']) if (f[k]) (c.colors ??= {})[k] = f[k];
        cur.characters.push(c);
        break;
      }
      case 'CAM': {
        const f = kv(val), c = cur.camera;
        if (f.size) c.shot = f.size;
        for (const k of ['zoom', 'roll', 'blur']) if (num(f[k]) !== undefined) c[k] = num(f[k]);
        if (f.to) c.zoomTo = +f.to; if (f.rollTo) c.rollTo = +f.rollTo; if (f.blurTo) c.blurTo = +f.blurTo;
        if (f.focus) c.focus = f.focus.includes(',') ? f.focus.split(',').map(Number) : f.focus;
        if (f.pan) c.pan = f.pan.split(',').map(Number);
        break;
      }
      case 'TEXT': cur.title = {lines: main.split(' / ').map((x) => x.trim()), ...(opt.at && {at: +opt.at}), ...(opt.hold && {hold: +opt.hold}), ...(opt.pos && {pos: opt.pos})}; break;
      case 'CAPTION': cur.caption = val; break;
      case 'BADGE': cur.badge = {text: main.trim(), ...(opt.at && {at: +opt.at}), ...(opt.hold && {hold: +opt.hold}), ...(opt.pos && {pos: opt.pos})}; break;
      case 'COUNTER': cur.counter = {value: isNaN(+main.replace(/,/g, '')) ? main.trim() : +main.replace(/,/g, ''), ...(opt.from && {from: +opt.from}), ...(opt.above && {above: opt.above.includes(',') ? opt.above.split(',').map(Number) : opt.above}), ...(opt.at && {at: +opt.at}), ...(opt.count && {countSec: +opt.count})}; break;
      case 'FX': cur.fx = val.split(',').map((x) => x.trim()).filter(Boolean); break;
      case 'OPT': { const f = kv(val); cur.setOptions = {}; if (f.lamp) cur.setOptions.lamp = f.lamp !== '0'; if (f.clock) cur.setOptions.clock = f.clock; if (f.takeout) cur.setOptions.takeout = f.takeout !== '0'; break; }
      case 'SFX': (cur.sfx ??= []).push({file: main.trim(), ...(opt.at && {at: +opt.at}), ...(opt.vol && {volume: +opt.vol})}); break;
      case 'NOTES': cur.notes = val; break;
      default: warnings.push(`${cur.id}: unknown key ${key}`);
    }
  }
  flush();
  return shots;
}

// ---------------------------------------------------------------- style B: prose auto-director
const has = (s, words) => words.some((w) => s.includes(w));
const EMO = [
  ['worried', ['worr', 'afraid', 'scared', 'anxious', 'fear', 'panic', 'hungry', 'lo lắng', 'sợ', 'hoảng', 'đói']],
  ['surprised', ['suddenly', 'shock', 'wow', 'realiz', 'discover', 'bất ngờ', 'sốc', 'phát hiện']],
  ['sleepy', ['sleep', 'yawn', 'dream', 'drowsy', 'ngủ', 'ngáp']],
  ['tired', ['tired', 'weak', 'exhaust', 'dizzy', 'light-headed', 'fatigue', 'mệt', 'yếu', 'kiệt sức', 'choáng']],
  ['sad', ['sad', 'cry', 'lonely', 'loss', 'grief', 'buồn', 'khóc', 'cô đơn']],
  ['angry', ['angry', 'furious', 'rage', 'hate', 'tức', 'giận']],
  ['happy', ['happy', 'love', 'laugh', 'smile', 'joy', 'celebrat', 'vui', 'hạnh phúc', 'cười', 'yêu']],
  ['smirk', ['but ', 'however', 'actually', 'secret', 'nhưng', 'thực ra']],
];
const emoteOf = (s) => (EMO.find(([, ws]) => has(s, ws)) ?? ['neutral'])[0];
const setOf = (s, prev, i) => {
  const night = has(s, ['night', 'midnight', 'dark', 'late ', 'p.m', ' pm', 'đêm', 'khuya', 'tối']);
  const indoor = has(s, ['home', 'house', 'room', 'couch', 'sofa', 'apartment', 'kitchen', 'bed', 'living', 'watching tv', 'nhà', 'phòng', 'bếp', 'ghế sofa']);
  const outdoor = has(s, ['street', 'walk', 'outside', 'park', 'bench', 'city', 'road', 'cafe', 'coffee', 'phố', 'đường', 'công viên', 'ghế đá', 'quán']);
  if (indoor) return {set: 'living-room', night};
  if (outdoor && night) return {set: 'street-night', night};
  if (outdoor) return {set: i % 2 ? 'street-brick' : 'street-dusk', night};
  return {set: prev ?? 'street-dusk', night};
};
const ABBR = /\b(a\.m\.|p\.m\.|mr\.|mrs\.|ms\.|dr\.|vs\.|e\.g\.|i\.e\.)/gi;
const sentences = (p) => p.replace(/\s+/g, ' ')
  .replace(ABBR, (m) => m.replace(/\./g, '\u0001'))
  .split(/(?<=[.!?…])\s+/).map((x) => x.replace(/\u0001/g, '.').trim()).filter(Boolean);
const splitLong = (s, max = 18) => {
  if (wordsOf(s) <= max) return [s];
  const parts = s.split(/(?<=[,;:])\s+|\s+(?=(?:and|but|because|while|which|when|then|và|nhưng|vì|khi)\s)/i);
  const out = []; let cur = '';
  for (const p of parts) {
    if (cur && wordsOf(cur + ' ' + p) > max) { out.push(cur); cur = p; } else cur = cur ? cur + ' ' + p : p;
  }
  if (cur) out.push(cur);
  return out;
};

function draft(src) {
  const paras = src.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && !p.startsWith('#'));
  const shots = [];
  const rhythm = ['wide', 'medium', 'close', 'medium', 'close', 'medium'];
  let prevSet, n = 0, scene = 0;
  for (const para of paras) {
    scene++;
    let beat = 0;
    for (const sent of sentences(para)) {
      for (const chunk of splitLong(sent)) {
        const low = chunk.toLowerCase();
        const {set, night} = setOf(low, prevSet, scene);
        const changed = prevSet !== undefined && set !== prevSet;
        if (changed) beat = 0;
        prevSet = set;
        const emote = emoteOf(low);
        const living = set === 'living-room';
        const walking = set === 'street-night' || has(low, ['walk', 'đi bộ']);
        const second = /\b(she|her|girlfriend|wife|mother|mom|friend|sister|they|cô ấy|bạn gái|vợ|mẹ|bạn)\b/i.test(chunk) || has(low, ['cô ấy', 'bạn gái']);
        let size = rhythm[beat % rhythm.length];
        if (emote !== 'neutral' && beat > 0 && size === 'medium') size = 'close';
        beat++;
        const hero = {id: 'hero', preset: 'hoodie', emote};
        const other = {id: 'other', preset: 'pink', emote: emote === 'tired' ? 'worried' : emote === 'neutral' ? 'content' : emote};
        if (living) { hero.at = second ? 'sofaL' : 'sofaC'; hero.pose = emote === 'tired' || emote === 'sleepy' ? 'slump' : 'sit'; other.at = 'sofaR'; other.pose = 'lean'; }
        else if (walking) { hero.preset = 'teal'; hero.at = 'walkL'; hero.pose = 'walk'; hero.moveTo = {x: 1200}; other.at = 'walkC'; other.pose = 'walk'; }
        else { hero.preset = 'beanie'; hero.at = set === 'street-brick' ? 'walkC' : 'bench1'; hero.pose = set === 'street-brick' ? 'stand' : 'hold'; if (hero.pose === 'hold') hero.prop = 'cup'; other.at = 'walkR'; other.pose = 'stand'; }
        const chars = second ? [hero, other] : [hero];
        const shot = {id: `s${String(++n).padStart(3, '0')}`, set, camera: {shot: size}, characters: chars, narration: {text: chunk}};
        if (living && night) shot.grade = 'night-room';
        else if (defaultGrade) shot.grade = defaultGrade;
        if (changed && has(low, ['later', 'that night', 'next', 'then', 'after', 'sau đó', 'đêm đó', 'hôm sau'])) shot.transition = 'blinds';
        else if (changed) shot.transition = 'dissolve';
        const tm = chunk.match(/^(\d[\d,]*)\s+(days?|hours?|weeks?|months?|years?|ngày|giờ|tuần|tháng|năm)\b[^,.:;!?]*/i);
        if (tm) { const head = tm[0].trim().split(/\s+/).slice(0, 6).join(' '); const rest = chunk.slice(tm[0].length).replace(/^[\s,:;-]+/, '').split(/[.!?]/)[0].split(/\s+/).slice(0, 4).join(' '); shot.title = {lines: [head, ...(rest ? ['-> ' + rest] : [])]}; shot.caption = chunk; shot.camera.shot = 'wide'; }
        const bm = chunk.match(/\b(\d{1,2})(?::(\d{2}))?\s?([ap])\.?m\.?/i);
        if (bm) shot.badge = {text: `${bm[1]}${bm[2] ? ':' + bm[2] : ''} ${bm[3].toUpperCase()}.M.`};
        if (bm && living) shot.setOptions = {clock: `${(+bm[1] % 12) + (/p/i.test(bm[3]) ? 12 : 0)}:${bm[2] ?? '00'}`.replace(/^(\d+):/, (_, h) => `${+h % 12 || 12}:`)};
        const cm = chunk.match(/\b\d{1,3}(?:,\d{3})+\b|\b(?!(?:19|20)\d\d\b)\d{4,}\b/);
        if (cm && !tm) { shot.counter = {value: +cm[0].replace(/,/g, ''), from: 0, above: 'hero'}; }
        if (has(low, ['love', 'kiss', 'yêu', 'hug', 'dream', 'magic'])) shot.fx = ['dust'];
        shot.durationSec = durFor(chunk, shot.title ? 2.4 : 1.4);
        shots.push(shot);
      }
    }
  }
  return shots;
}

// ---------------------------------------------------------------- run
const directed = /^\s*---/m.test(body);
const shots = directed ? parseDirected(body) : draft(body);
if (!shots.length) { console.error('No shots found in the script.'); process.exit(1); }

// de-duplicate ids
const seen = new Set();
for (const s of shots) { let id = s.id, k = 2; while (seen.has(id)) id = `${s.id}_${k++}`; s.id = id; seen.add(id); if (!SETS[s.set]) warnings.push(`${s.id}: unknown set "${s.set}"`); if (s.camera && !s.camera.shot) s.camera.shot = 'wide'; if (s._auto) { delete s._auto; } }

fs.mkdirSync(path.dirname(path.resolve(outPath)), {recursive: true});
fs.writeFileSync(outPath, JSON.stringify({meta, shots}, null, 2));
const total = shots.reduce((n, s) => n + s.durationSec, 0);
console.log(`${directed ? 'directed' : 'prose (auto-director draft)'} script -> ${outPath}`);
console.log(`${shots.length} shots, ${(total / 60).toFixed(1)} min (${total.toFixed(1)}s) at ${wps} words/s, lang=${meta.lang}`);
for (const w of warnings) console.log('warning:', w);
