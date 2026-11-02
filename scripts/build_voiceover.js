const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const publicDir = path.join(__dirname, '..', 'public');
const tempDir = path.join(__dirname, '..', 'temp_voice');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const SUBTITLES = [
  { start: 0, end: 95, text: "You're late again. The bus is already pulling away from the corner..." },
  { start: 95, end: 165, text: "...and you're still on your porch with one shoe on." },
  { start: 165, end: 315, text: "So you look at the bus. You picture the seat in the back—the one by the window." },
  { start: 315, end: 355, text: "And you blink." },
  { start: 355, end: 470, text: "And you're on the bus. Sort of. You're sitting on somebody." },
  { start: 470, end: 545, text: "Bro, where did you come from?" },
  { start: 545, end: 610, text: "I've been here the whole time." },
  { start: 610, end: 685, text: "He stares at you. Everybody stares at you." },
  { start: 685, end: 755, text: "Your other shoe is still on the porch." },
  { start: 755, end: 990, text: "So, what if you could teleport? Here's how it works. First, the crazy part: teleportation is real. Kind of." },
  { start: 990, end: 1170, text: "In 1997, scientists in Innsbruck, Austria teleported a particle of light." },
  { start: 1170, end: 1350, text: "Not the light itself—its information. One photon became an exact copy of another without anything traveling between them." },
  { start: 1350, end: 1560, text: "In 2017, a satellite called Micius did it from space over a distance of up to 1400 kilometers." },
  { start: 1560, end: 1680, text: "But a photon is one tiny thing. You are not." },
  { start: 1680, end: 1830, text: "Students at the University of Leicester worked out how much information it takes to describe one human being: a number with 43 digits." },
  { start: 1830, end: 1950, text: "Sending that much data would take about 350,000 times longer than the age of the universe." },
];

const sampleRate = 44100;
const totalDurationSec = 65.2;
const totalSamples = Math.ceil(totalDurationSec * sampleRate);
const mixedBuffer = new Int16Array(totalSamples); // Mono 16-bit PCM

console.log('Generating voice clips and mixing to timeline...');

for (let i = 0; i < SUBTITLES.length; i++) {
  const item = SUBTITLES[i];
  const aiffPath = path.join(tempDir, `clip_${i}.aiff`);
  const rawPath = path.join(tempDir, `clip_${i}.raw`);
  
  // Rate: normal 175 wpm. For short prompt we can keep natural pacing
  execSync(`say -v Daniel -r 175 -o "${aiffPath}" "${item.text}"`);
  // Convert to raw 16-bit signed LE PCM 44100Hz mono
  execSync(`afconvert -f 'caff' -d LEI16@44100 -c 1 "${aiffPath}" "${rawPath}"`);
  
  // Read raw audio data (skipping CAF header or reading PCM)
  const wavPath = path.join(tempDir, `clip_${i}.wav`);
  execSync(`afconvert -f 'WAVE' -d LEI16@44100 -c 1 "${aiffPath}" "${wavPath}"`);
  
  const wavBytes = fs.readFileSync(wavPath);
  // WAV header is 44 bytes, subsequent bytes are int16 LE
  const pcmBytes = wavBytes.subarray(44);
  const pcmInt16 = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, pcmBytes.byteLength / 2);
  
  const startSample = Math.floor((item.start / 30) * sampleRate);
  for (let s = 0; s < pcmInt16.length; s++) {
    if (startSample + s < totalSamples) {
      mixedBuffer[startSample + s] = pcmInt16[s];
    }
  }
  console.log(`Pasted clip ${i} at frame ${item.start} (${(item.start/30).toFixed(2)}s)`);
}

// Write combined 65s WAV
function createWavHeader(numSamples, sRate = 44100, numChannels = 1) {
  const byteRate = sRate * numChannels * 2;
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
  buffer.writeUInt32LE(sRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // 16-bit
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

const header = createWavHeader(totalSamples, sampleRate, 1);
const dataBuf = Buffer.from(mixedBuffer.buffer);
const finalWav = Buffer.concat([header, dataBuf]);
const finalWavPath = path.join(publicDir, 'voiceover.wav');
fs.writeFileSync(finalWavPath, finalWav);

// Convert to public/voiceover.mp3 (AAC in mp4 container or m4a formatted as mp3)
const finalMp3Path = path.join(publicDir, 'voiceover.mp3');
execSync(`afconvert -f m4af -d aac "${finalWavPath}" "${finalMp3Path}"`);

console.log('voiceover.mp3 generated successfully in public/ !');
