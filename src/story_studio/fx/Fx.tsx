import React from 'react';
import {clamp, easeOut, hashStr, rng} from '../lib/util';
import {WORLD_H, WORLD_W} from '../theme';

/** Floating dust / bokeh specks (world space). Deterministic. */
export const Dust: React.FC<{frame: number; seed: string; count?: number; sparkle?: boolean}> = ({frame, seed, count = 70, sparkle}) => {
  const r = rng(hashStr(seed));
  return (
    <svg width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
      {Array.from({length: sparkle ? Math.round(count / 3) : count}).map((_, i) => {
        const x0 = r() * WORLD_W, y0 = r() * WORLD_H, s = (sparkle ? 5 : 1) + r() * (sparkle ? 9 : 3.2);
        const sp = 0.15 + r() * 0.5, ph = r() * 6.28, dr = (r() - 0.5) * 0.3;
        const y = (((y0 - frame * sp) % WORLD_H) + WORLD_H) % WORLD_H;
        const x = x0 + Math.sin(frame / 40 + ph) * 14 + frame * dr;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(frame / 18 + ph));
        if (sparkle) {
          return <path key={i} d={`M ${x} ${y - s} Q ${x} ${y} ${x + s} ${y} Q ${x} ${y} ${x} ${y + s} Q ${x} ${y} ${x - s} ${y} Q ${x} ${y} ${x} ${y - s} Z`} fill="#fff1cf" opacity={tw * 0.9} />;
        }
        return <circle key={i} cx={x} cy={y} r={s} fill="#fff0d6" opacity={tw * (s > 2.2 ? 0.55 : 0.85)} />;
      })}
    </svg>
  );
};

/** Soft diagonal beams of light (world space). */
export const LightShafts: React.FC<{frame: number}> = ({frame}) => (
  <svg width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
    {[0, 1, 2].map((i) => (
      <polygon key={i} points={`${300 + i * 260},0 ${420 + i * 260},0 ${900 + i * 260},1080 ${700 + i * 260},1080`} fill="#ffe2b8" opacity={0.05 + 0.02 * Math.sin(frame / 50 + i)} />
    ))}
  </svg>
);

/** Foreground venetian blinds seen out of focus - "looking out a window" (screen space). */
export const WindowBlinds: React.FC<{W: number; H: number; u: number}> = ({W, H, u}) => {
  const n = 8, h = H / n;
  return (
    <div style={{position: 'absolute', inset: 0, filter: `blur(${5 * u}px)`}}>
      {Array.from({length: n}).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', left: -20, right: -20, top: i * h + h * 0.18, height: h * 0.34,
          background: i % 2 ? 'linear-gradient(#3b2438,#6a4650)' : 'linear-gradient(#5a3a48,#2a1a30)', opacity: 0.88,
        }} />
      ))}
    </div>
  );
};

/** Transition overlays. p = 0..1 across the whole transition, cut happens at p = 0.5 */
export const BlindsWipe: React.FC<{p: number; W: number; H: number; u: number}> = ({p, W, H, u}) => {
  const n = 9, h = H / n;
  const c = 1 - Math.abs(2 * p - 1);
  return (
    <div style={{position: 'absolute', inset: 0, filter: `blur(${4 * u}px)`}}>
      {Array.from({length: n}).map((_, i) => {
        const local = clamp(c * 1.5 - (i / n) * 0.5);
        return <div key={i} style={{
          position: 'absolute', left: -20, right: -20, top: i * h + (h * (1 - local)) / 2, height: h * local + 1,
          background: i % 2 ? '#5a3a4a' : '#2a1a38',
        }} />;
      })}
    </div>
  );
};

export const FadeBlack: React.FC<{p: number}> = ({p}) => (
  <div style={{position: 'absolute', inset: 0, background: '#05030a', opacity: clamp((1 - Math.abs(2 * p - 1)) * 1.5)}} />
);
