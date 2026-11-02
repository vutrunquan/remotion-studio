import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {rnd} from '../util';

/** Glitch VHS: tách kênh RGB, xé lát ngang, vạch trắng. strength 0..1; seed đổi mỗi vài frame. */
export const Glitch: React.FC<{strength: number; seed: number; children: React.ReactNode}> = ({strength, seed, children}) => {
  const {width: W, height: H} = useVideoConfig();
  if (strength < 0.03) return <AbsoluteFill>{children}</AbsoluteFill>;
  const n = Math.round(2 + strength * 4);
  const slices = Array.from({length: n}, (_, i) => {
    const y0 = rnd(`gy${seed}-${i}`) * 0.92;
    const h = 0.015 + rnd(`gh${seed}-${i}`) * 0.08 * strength;
    const dx = (rnd(`gx${seed}-${i}`) - 0.5) * 0.12 * W * strength;
    return {y0, h, dx};
  });
  const streaks = Array.from({length: 4 + Math.round(strength * 8)}, (_, i) => ({
    x: rnd(`sx${seed}-${i}`) * 85,
    y: rnd(`sy${seed}-${i}`) * 100,
    w: 4 + rnd(`sw${seed}-${i}`) * 30 * strength,
    h: 1.5 + rnd(`sh${seed}-${i}`) * 3,
    o: 0.35 + rnd(`so${seed}-${i}`) * 0.55,
  }));
  const split = (3 + 9 * strength) * (0.6 + rnd(`gs${seed}`) * 0.8) * (W / 1920);
  const fid = `rgbsplit${seed}`;
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id={fid} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={split} dy={0} result="ro" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb" />
            <feOffset in="gb" dx={-split} dy={0} result="gbo" />
            <feBlend in="ro" in2="gbo" mode="screen" />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{filter: `url(#${fid})`}}>{children}</AbsoluteFill>
      {slices.map((s, i) => (
        <AbsoluteFill key={i} style={{clipPath: `inset(${(s.y0 * 100).toFixed(2)}% 0 ${((1 - s.y0 - s.h) * 100).toFixed(2)}% 0)`, transform: `translateX(${s.dx.toFixed(1)}px)`}}>
          {children}
        </AbsoluteFill>
      ))}
      {streaks.map((s, i) => (
        <div key={i} style={{position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: s.h * (H / 1080) , background: '#fff', opacity: s.o}} />
      ))}
    </AbsoluteFill>
  );
};
