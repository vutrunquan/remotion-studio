#!/usr/bin/env node
/**
 * Narration audio per shot + auto timing.
 *   node tts.mjs --story data/story.json --provider edge|openai|elevenlabs|dir [--voice NAME] [--out public/audio/vo] [--pad 0.35]
 *  - edge       needs `pip install edge-tts` (free). voices: en-US-AndrewNeural, vi-VN-HoaiMyNeural, vi-VN-NamMinhNeural
 *  - openai     env OPENAI_API_KEY   (voice e.g. alloy)
 *  - elevenlabs env ELEVENLABS_API_KEY, --voice <voice_id>
 *  - dir        you already have <shot-id>.mp3 (or .wav/.m4a) files in --out: only measure + wire them in
 * Result: narration.audio set per shot and durationSec = audio length + pad (so picture follows the voice).
 * Re-runnable: existing audio files are kept, durations are refreshed.
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const a = process.argv.slice(2);
const opt = (n, d) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : d; };
const storyPath = opt('--story', 'data/story.json');
const provider = opt('--provider', 'dir');
const outDir = opt('--out', 'public/audio/vo');
const pad = +opt('--pad', 0.35);
const story = JSON.parse(fs.readFileSync(storyPath, 'utf8'));
const vi = (story.meta.lang ?? 'en').startsWith('vi');
const voice = opt('--voice', provider === 'edge' ? (vi ? 'vi-VN-HoaiMyNeural' : 'en-US-AndrewNeural') : provider === 'openai' ? 'alloy' : '');
fs.mkdirSync(outDir, {recursive: true});

const duration = (f) => {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], {encoding: 'utf8'});
  return parseFloat(r.stdout);
};
const find = (id) => ['mp3', 'wav', 'm4a', 'ogg'].map((e) => path.join(outDir, `${id}.${e}`)).find((f) => fs.existsSync(f));

async function synth(text, file) {
  if (provider === 'edge') {
    const r = spawnSync('edge-tts', ['--voice', voice, '--text', text, '--write-media', file], {stdio: 'inherit'});
    if (r.status !== 0) throw new Error('edge-tts failed (pip install edge-tts)');
  } else if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {method: 'POST',
      headers: {Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({model: 'gpt-4o-mini-tts', voice, input: text, response_format: 'mp3'})});
    if (!res.ok) throw new Error(`openai tts ${res.status}: ${await res.text()}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  } else if (provider === 'elevenlabs') {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {method: 'POST',
      headers: {'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json'},
      body: JSON.stringify({text, model_id: 'eleven_multilingual_v2'})});
    if (!res.ok) throw new Error(`elevenlabs ${res.status}: ${await res.text()}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  } else throw new Error(`no audio for shot and provider "${provider}" cannot synthesise`);
}

let n = 0, total = 0;
for (const s of story.shots) {
  if (!s.narration?.text) { total += s.durationSec; continue; }
  let f = find(s.id);
  if (!f) { f = path.join(outDir, `${s.id}.mp3`); if (provider === 'dir') { console.log(`no audio for ${s.id}, keeping estimated duration`); total += s.durationSec; continue; } await synth(s.narration.text, f); n++; }
  const d = duration(f);
  if (!(d > 0)) { console.log(`cannot read duration of ${f}`); total += s.durationSec; continue; }
  s.narration.audio = path.relative('public', f).split(path.sep).join('/');
  s.durationSec = Math.max(1.2, +(d + pad + (s.narration.offsetSec ?? 0.1)).toFixed(2));
  total += s.durationSec;
}
fs.writeFileSync(storyPath, JSON.stringify(story, null, 2));
console.log(`synthesised ${n} clip(s); total runtime now ${(total / 60).toFixed(2)} min -> ${storyPath}`);
