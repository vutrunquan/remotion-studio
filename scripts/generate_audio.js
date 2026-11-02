const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate Voiceover lines
const lines = [
  { id: 0, text: "You're late again. The bus is already pulling away from the corner..." },
  { id: 1, text: "...and you're still on your porch with one shoe on. You picture the seat in the back..." },
  { id: 2, text: "And you're on the bus. Sort of. You're sitting on somebody." },
  { id: 3, text: "Bro, where did you come from? I've been here the whole time." },
  { id: 4, text: "Everybody stares at you. Your other shoe is still on the porch." },
  { id: 5, text: "So, what if you could teleport? First, the crazy part: teleportation is real. Kind of." },
  { id: 6, text: "In 1997, scientists in Innsbruck, Austria teleported a particle of light." },
  { id: 7, text: "Not the light itself, its information. One photon became an exact copy of another." },
  { id: 8, text: "In 2017, a satellite called Micius did it from space over a distance of up to 1400 kilometers." },
  { id: 9, text: "But a photon is one tiny thing. You are not." },
  { id: 10, text: "To describe one human being takes a number with 43 digits of information." },
];

console.log('Generating voiceover clips...');
for (const line of lines) {
  const aiffPath = path.join(publicDir, `voice_${line.id}.aiff`);
  const wavPath = path.join(publicDir, `voice_${line.id}.wav`);
  // Use Daniel voice with speech rate 175 wpm
  execSync(`say -v Daniel -r 175 -o "${aiffPath}" "${line.text}"`);
  execSync(`afconvert -f WAVE -d LEI16 "${aiffPath}" "${wavPath}"`);
  if (fs.existsSync(aiffPath)) fs.unlinkSync(aiffPath);
  console.log(`Generated voice_${line.id}.wav`);
}

// 2. Synthesize Teleport Glitch SFX (WAV 44.1kHz, 16-bit mono)
function createWavHeader(numSamples, sampleRate = 44100, numChannels = 1) {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = numSamples * numChannels * 2;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // 16-bit
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

console.log('Generating teleport glitch SFX...');
const sfxSampleRate = 44100;
const sfxDuration = 0.5; // 0.5s
const sfxSamples = Math.floor(sfxDuration * sfxSampleRate);
const sfxData = Buffer.alloc(sfxSamples * 2);

for (let i = 0; i < sfxSamples; i++) {
  const t = i / sfxSampleRate;
  // Frequency zap from 1200Hz down to 80Hz
  const freq = 1200 * Math.exp(-t * 9) + 80;
  const env = Math.exp(-t * 6);
  // Sine + noise
  const tone = Math.sin(2 * Math.PI * freq * t);
  const noise = (Math.random() * 2 - 1) * 0.35 * Math.exp(-t * 12);
  let sample = (tone * 0.65 + noise) * env;
  sample = Math.max(-1, Math.min(1, sample));
  const intSample = Math.floor(sample * 32767);
  sfxData.writeInt16LE(intSample, i * 2);
}

const glitchWav = Buffer.concat([createWavHeader(sfxSamples, sfxSampleRate, 1), sfxData]);
fs.writeFileSync(path.join(publicDir, 'teleport_glitch.wav'), glitchWav);
console.log('Generated teleport_glitch.wav');

// 3. Synthesize Ambient Sci-Fi BGM (65 seconds, 44.1kHz stereo)
console.log('Generating sci-fi ambient BGM...');
const bgmDuration = 66; // seconds
const bgmSamples = Math.floor(bgmDuration * sfxSampleRate);
const bgmData = Buffer.alloc(bgmSamples * 2 * 2); // 2 channels, 16-bit

// Frequencies for a mysterious space pad (Am9: A, C, E, B)
const freqs = [110, 130.81, 164.81, 246.94, 55]; // A2, C3, E3, B3, A1 bass

for (let i = 0; i < bgmSamples; i++) {
  const t = i / sfxSampleRate;
  
  // Fade in first 2s, fade out last 3s
  let masterEnv = 1;
  if (t < 2) masterEnv = t / 2;
  if (t > bgmDuration - 3) masterEnv = Math.max(0, (bgmDuration - t) / 3);

  // Subtle pulsing LFO (0.5 Hz)
  const lfo = 0.75 + 0.25 * Math.sin(2 * Math.PI * 0.5 * t);
  const slowLfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.1 * t);

  let left = 0;
  let right = 0;

  // Add chords
  for (let fIdx = 0; fIdx < freqs.length; fIdx++) {
    const f = freqs[fIdx];
    // Detune slightly for stereo chorus
    const wL = Math.sin(2 * Math.PI * (f + 0.2 * (fIdx + 1)) * t);
    const wR = Math.sin(2 * Math.PI * (f - 0.2 * (fIdx + 1)) * t);
    const weight = fIdx === 4 ? 0.35 : 0.15; // bass has more weight
    left += wL * weight;
    right += wR * weight;
  }

  // Soft rhythmic pulse in the second half
  if (t > 25) {
    const pulseEnv = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 2 * t)), 8);
    const pulseTone = Math.sin(2 * Math.PI * 220 * t) * pulseEnv * 0.18;
    left += pulseTone;
    right += pulseTone;
  }

  left = left * lfo * masterEnv * 0.28;
  right = right * slowLfo * masterEnv * 0.28;

  left = Math.max(-1, Math.min(1, left));
  right = Math.max(-1, Math.min(1, right));

  bgmData.writeInt16LE(Math.floor(left * 32767), i * 4);
  bgmData.writeInt16LE(Math.floor(right * 32767), i * 4 + 2);
}

const bgmWav = Buffer.concat([createWavHeader(bgmSamples, sfxSampleRate, 2), bgmData]);
fs.writeFileSync(path.join(publicDir, 'bgm.wav'), bgmWav);
console.log('Generated bgm.wav');
console.log('Audio generation finished successfully!');
