import { random } from 'remotion';

// Bộ tạo file WAV (Base64 Data URI) trực tiếp bằng thuật toán sóng âm
function createWavDataUri(
  durationSeconds: number,
  sampleGenerator: (t: number, progress: number) => number
): string {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // WAV Header chuẩn 44 bytes
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, 1, true);  // Mono (1 channel)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    const raw = Math.max(-1, Math.min(1, sampleGenerator(t, progress)));
    view.setInt16(44 + i * 2, raw * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

// 1. Tiếng nổ không khí "POP!" + Glitch khi dịch chuyển tức thời
export const SFX_TELEPORT_POP = createWavDataUri(0.32, (t, p) => {
  // Tần số tụt nhanh từ 420Hz xuống 45Hz tạo tiếng "Bụp" nén khí
  const freq = 45 + 375 * Math.exp(-t * 28);
  const subDrop = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 10);
  const glitchNoise = (random(null) * 2 - 1) * Math.exp(-t * 35) * 0.45;
  return (subDrop + glitchNoise) * (1 - p);
});

// 2. Tiếng rơi bịch xuống đùi hành khách khác trên xe buýt (Body Thud)
export const SFX_BODY_THUD = createWavDataUri(0.28, (t) => {
  const freq = 95 * Math.exp(-t * 18);
  return Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 12) * 0.9;
});

// 3. Tiếng động cơ xe buýt rời bến (Bus Engine Rumble)
export const SFX_BUS_ENGINE = createWavDataUri(3.5, (t, p) => {
  const rpm = 52 + p * 35;
  const rumble =
    Math.sin(2 * Math.PI * rpm * t) * 0.4 +
    Math.sin(2 * Math.PI * (rpm * 2) * t) * 0.25 +
    (random(null) * 2 - 1) * 0.08;
  const fadeOut = 1 - p * 0.75;
  return rumble * fadeOut * 0.5;
});

// 4. Tiếng Bíp khóa mục tiêu HUD (Sci-Fi Target Lock Beep)
export const SFX_HUD_BEEP = createWavDataUri(0.14, (t) => {
  const tone = Math.sin(2 * Math.PI * 1480 * t) + Math.sin(2 * Math.PI * 2960 * t) * 0.3;
  return tone * Math.exp(-t * 18) * 0.4;
});

// 5. Tiếng tia Laser lượng tử & Vệ tinh Micius (Quantum Beam Hum)
export const SFX_QUANTUM_BEAM = createWavDataUri(2.2, (t, p) => {
  const carrier = Math.sin(2 * Math.PI * (220 + Math.sin(t * 16) * 18) * t);
  const shimmer = Math.sin(2 * Math.PI * 880 * t) * 0.25;
  const envelope = Math.sin(p * Math.PI);
  return (carrier * 0.45 + shimmer) * envelope * 0.5;
});

// 6. Tiếng máy quét dữ liệu 43 chữ số (Digital Matrix Scan)
export const SFX_DATA_SCAN = createWavDataUri(2.5, (t, p) => {
  const stepFreq = 600 + ((Math.floor(t * 24) * 137) % 900);
  const beep = Math.sin(2 * Math.PI * stepFreq * t);
  const sweep = Math.sin(2 * Math.PI * (180 + p * 600) * t) * 0.35;
  return (beep * 0.25 + sweep * 0.35) * (1 - p * 0.3);
});
