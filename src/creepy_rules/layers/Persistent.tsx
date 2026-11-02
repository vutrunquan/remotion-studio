import React from 'react';
import {AbsoluteFill, Img, staticFile, useVideoConfig} from 'remotion';
import type {Layout} from '../layout';
import {FONT} from '../theme';
import {rnd} from '../util';
import type {Meta} from '../types';

export const Grain: React.FC<{gf: number; k: number; boost?: number}> = ({gf, k, boost = 0}) => {
  if (k <= 0) return null;
  const x = Math.floor(rnd(`gx${gf}`) * 512);
  const y = Math.floor(rnd(`gy${gf}`) * 512);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile('fx/grain.png')})`, backgroundSize: '512px 512px',
        backgroundPosition: `${x}px ${y}px`, opacity: Math.min(1, 0.11 * k + boost * 0.35), mixBlendMode: 'screen', pointerEvents: 'none',
      }}
    />
  );
};

export const Dust: React.FC<{gf: number; k: number}> = ({gf, k}) => {
  const {width: W, height: H} = useVideoConfig();
  if (k <= 0) return null;
  const bucket = Math.floor(gf / 3);
  const specks = Array.from({length: Math.round(9 * k)}, (_, i) => {
    const r = rnd(`dust${bucket}-${i}`);
    if (r > 0.55) return null;
    const x = rnd(`dx${bucket}-${i}`) * W;
    const y = rnd(`dy${bucket}-${i}`) * H;
    const long = rnd(`dl${bucket}-${i}`) > 0.7;
    return (
      <div key={i} style={{position: 'absolute', left: x, top: y, width: long ? 8 + rnd(`dw${bucket}-${i}`) * 14 : 2.5, height: long ? 1.6 : 2.5, borderRadius: 3,
        background: '#fff', opacity: 0.35 + rnd(`do${bucket}-${i}`) * 0.5, transform: `rotate(${(rnd(`dr${bucket}-${i}`) - 0.5) * 80}deg)`}} />
    );
  });
  return <AbsoluteFill style={{pointerEvents: 'none'}}>{specks}</AbsoluteFill>;
};

export const Vignette: React.FC<{k: number}> = ({k}) =>
  k <= 0 ? null : (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 52%, rgba(0,0,0,${0.62 * k}) 100%)`, pointerEvents: 'none'}} />
  );

const pad2 = (n: number) => String(Math.floor(n)).padStart(2, '0');
export const timecode = (gf: number, fps: number) => {
  const s = Math.floor(gf / fps);
  return `${pad2(s / 3600)}:${pad2((s / 60) % 60)}:${pad2(s % 60)}:${pad2(gf % fps)}`;
};

export const Hud: React.FC<{gf: number; fps: number; layout: Layout; meta: Meta; rule: {active: number; total: number} | null; glitch: number; accent: string}> = ({gf, fps, layout, meta, rule, glitch}) => {
  if (meta.hud === false) return null;
  const fs = layout.hudFont;
  const col = 'rgba(255,255,255,0.42)';
  const fileNo = meta.fileNo !== undefined ? String(meta.fileNo).padStart(3, '0') : '';
  const split = glitch > 0.2 ? Math.max(1, glitch * 3) : 0;
  const text = {fontFamily: FONT, fontSize: fs, letterSpacing: '0.2em', color: col, fontWeight: 600, textShadow: split ? `${split}px 0 rgba(255,0,60,.6), ${-split}px 0 rgba(0,200,255,.6)` : 'none'} as React.CSSProperties;
  const bs = fs * 1.25;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: layout.hudPadX, top: layout.hudPadY, whiteSpace: 'nowrap', ...text}}>
        {(meta.fileLabel ?? 'FILE') + (fileNo ? ' ' + fileNo : '')}
        <span style={{margin: '0 0.7em', opacity: 0.7, fontWeight: 400}}>//</span>
        <span style={{fontWeight: 800, color: 'rgba(255,255,255,0.5)'}}>{(meta.channel ?? '').toUpperCase()}</span>
      </div>
      {rule && (
        <div style={{position: 'absolute', left: 0, right: 0, top: layout.portrait ? layout.hudPadY + fs * 2.6 : layout.hudPadY - bs * 0.2, display: 'flex', justifyContent: 'center', gap: bs * 0.22}}>
          {Array.from({length: rule.total}, (_, i) => {
            const on = i + 1 === rule.active;
            return (
              <div key={i} style={{width: bs, height: bs, borderRadius: bs * 0.2, boxSizing: 'border-box', border: `${Math.max(1.5, bs * 0.08)}px solid rgba(255,255,255,${on ? 1 : 0.4})`,
                background: on ? '#fff' : 'transparent', color: on ? '#0b0b0b' : 'rgba(255,255,255,0.5)', fontFamily: FONT, fontWeight: 700, fontSize: bs * 0.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transform: split ? `translateX(${i % 2 ? split : -split}px)` : undefined}}>
                {i + 1}
              </div>
            );
          })}
        </div>
      )}
      {meta.timecode !== false && (
        <div style={{position: 'absolute', right: layout.hudPadX, top: layout.hudPadY, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.12em', ...text, fontWeight: 500}}>
          {timecode(gf, fps)}
        </div>
      )}
    </AbsoluteFill>
  );
};
