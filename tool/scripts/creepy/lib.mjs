// Hàm dùng chung cho các công cụ dòng lệnh (Node >= 18, không cần cài thêm gói).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PUBLIC = path.join(KIT, 'public');

export const TEMPLATES = ['stage', 'counter', 'exhibit', 'rule', 'title', 'text', 'stamp', 'black'];
export const KINDS = ['dog', 'person', 'armchair', 'dinner', 'bed', 'window', 'clock', 'tv', 'fridge', 'bowl', 'door', 'eye', 'agent', 'key', 'check', 'cross', 'speed', 'lamp', 'phone', 'nightstand', 'bubble', 'house', 'moon', 'box', 'text', 'svg', 'sweat'];
export const SETS = ['room', 'diningRoom', 'bedroom', 'void'];
export const DOG_POSES = ['quad', 'rear', 'stand'];
export const PERSON_POSES = ['stand', 'scream', 'frozen', 'handsUp', 'cover', 'tpose', 'run', 'walk'];
export const SFX = ['boom', 'hit', 'glitch', 'static', 'whoosh', 'tick', 'ding', 'shutter', 'riser', 'heartbeat'];
export const FX = ['glitch', 'flash', 'shake', 'flicker', 'zoom', 'blackout'];
export const DEFAULT_MIN = {rule: 3.2, exhibit: 3.2, counter: 2.2, title: 3, stage: 1.4, text: 1.8};

export const stripMarkup = (s = '') => s.replace(/\*/g, '');
export const countWords = (s = '') => stripMarkup(s).trim().split(/\s+/).filter(Boolean).length;

export function sceneDuration(s, wpm = 150) {
  if (s.dur > 0) return s.dur;
  const tpl = s.visual?.tpl ?? 'black';
  const min = s.min ?? DEFAULT_MIN[tpl] ?? 1.4;
  if (s.voice && s.voiceDur > 0) return Math.max(min, (s.voiceDelay ?? 0.15) + s.voiceDur + 0.35);
  const ell = /(\.\.\.|…)\s*$/.test(s.text ?? '') ? 0.35 : 0;
  return Math.max(min, 0.55 + countWords(s.text) * (60 / Math.max(60, wpm)) * 1.05 + ell);
}

export function loadScript(file) {
  const raw = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`✗ ${file} không phải JSON hợp lệ: ${e.message}`);
    process.exit(2);
  }
}

export const fmtTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
export const exists = (rel) => fs.existsSync(path.join(PUBLIC, rel));
