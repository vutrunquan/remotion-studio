#!/usr/bin/env node
/**
 * Render a video of ANY length: split on shot boundaries into chunks, render each chunk muted
 * (resumable: finished chunks are skipped), render the audio mix once, concatenate, loudness-normalise.
 *
 * usage (from the project folder):
 *   node ../scripts/render-long.mjs --project . [--props data/story.json] [--out out/story.mp4]
 *        [--chunk-sec 60] [--concurrency 4] [--crf 18] [--no-loudnorm] [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const a = process.argv.slice(2);
const opt = (n, d) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : d; };
const has = (n) => a.includes(n);
const project = path.resolve(opt('--project', '.'));
const propsRel = opt('--props', 'data/story.json');
const out = path.resolve(project, opt('--out', 'out/story.mp4'));
const chunkSec = +opt('--chunk-sec', 60);
const conc = opt('--concurrency', '');
const crf = opt('--crf', '18');
const dry = has('--dry-run');

const props = JSON.parse(fs.readFileSync(path.resolve(project, propsRel), 'utf8'));
const fps = props.meta.fps ?? 30;
const frames = props.shots.map((s) => Math.max(1, Math.round(s.durationSec * fps)));
const total = frames.reduce((x, y) => x + y, 0);

// chunk boundaries on shot boundaries
const chunks = [];
let start = 0, acc = 0;
for (let i = 0; i < frames.length; i++) {
  acc += frames[i];
  if (acc >= chunkSec * fps || i === frames.length - 1) { chunks.push([start, start + acc - 1]); start += acc; acc = 0; }
}
const hasAudio = !!props.meta.music || props.shots.some((s) => s.narration?.audio || (s.sfx && s.sfx.length));
console.log(`${props.shots.length} shots, ${total} frames (${(total / fps / 60).toFixed(1)} min) -> ${chunks.length} chunk(s), audio: ${hasAudio}`);

const dir = path.join(path.dirname(out), 'chunks');
fs.mkdirSync(dir, {recursive: true});
const run = (cmd, args) => {
  console.log('$', cmd, args.join(' '));
  if (dry) return;
  const r = spawnSync(cmd, args, {cwd: project, stdio: 'inherit', shell: process.platform === 'win32'});
  if (r.status !== 0) { console.error(`command failed (${r.status})`); process.exit(r.status ?? 1); }
};
const remotion = (target, extra) => run('npx', ['remotion', 'render', 'src/index.ts', 'Story', target, `--props=${propsRel}`, ...(conc ? [`--concurrency=${conc}`] : []), ...extra]);

const list = [];
chunks.forEach(([f0, f1], i) => {
  const file = path.join(dir, `c${String(i).padStart(3, '0')}.mp4`);
  list.push(file);
  if (!dry && fs.existsSync(file) && fs.statSync(file).size > 1000) { console.log(`chunk ${i + 1}/${chunks.length}: exists, skipped (delete to re-render)`); return; }
  console.log(`chunk ${i + 1}/${chunks.length}: frames ${f0}-${f1}`);
  remotion(path.relative(project, file), [`--frames=${f0}-${f1}`, '--muted', '--codec=h264', `--crf=${crf}`]);
});

const listFile = path.join(dir, 'list.txt');
const video = path.join(dir, 'video.mp4');
if (!dry) fs.writeFileSync(listFile, list.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', video]);

if (hasAudio) {
  const wav = path.join(dir, 'audio.wav');
  remotion(path.relative(project, wav), ['--codec=wav']);
  run('ffmpeg', ['-y', '-v', 'error', '-i', video, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    ...(has('--no-loudnorm') ? [] : ['-af', 'loudnorm=I=-16:TP=-3:LRA=7']), '-shortest', out]);
} else run('ffmpeg', ['-y', '-v', 'error', '-i', video, '-c', 'copy', out]);
console.log(dry ? 'dry run only' : `done -> ${out}`);
