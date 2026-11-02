import React from 'react';
import type {BadgeSpec, CounterSpec, TitleSpec} from '../types';
import {C, FONT} from '../theme';
import {clamp, easeOut, easeOutBack, lerp, prog} from '../lib/util';

interface Base {frame: number; fps: number; W: number; H: number; u: number; durFrames: number}

/** Big uppercase title card, e.g. "4 DAYS WITHOUT FOOD / -> WEAK, LIGHT-HEADED" */
export const TitleCard: React.FC<Base & {spec: TitleSpec}> = ({spec, frame, fps, W, H, u, durFrames}) => {
  const portrait = H > W;
  const at = Math.round((spec.at ?? 0.15) * fps);
  const end = spec.hold !== undefined ? at + Math.round(spec.hold * fps) : durFrames - Math.round(0.1 * fps);
  const out = 1 - prog(frame, end - Math.round(0.3 * fps), Math.round(0.3 * fps));
  const pos = spec.pos ?? 'right';
  const longest = Math.max(...spec.lines.map((l) => l.replace(/^->\s*/, '').length + (l.startsWith('->') ? 2 : 0)));
  const maxW = portrait ? W * 0.86 : pos === 'right' ? W * 0.47 : W * 0.7;
  const base = 62 * u;
  const size = Math.min(base, maxW / (Math.max(8, longest) * 0.86));
  const align = pos === 'center' || pos === 'bottom' ? 'center' : 'left';
  const style: React.CSSProperties = {position: 'absolute', fontFamily: FONT, textAlign: align as 'left' | 'center'};
  if (pos === 'right') { style.left = portrait ? W * 0.07 : W * 0.485; style.top = portrait ? H * 0.12 : H * 0.33; }
  if (pos === 'left') { style.left = W * 0.06; style.top = portrait ? H * 0.12 : H * 0.33; }
  if (pos === 'center') { style.left = 0; style.right = 0; style.top = H * 0.38; }
  if (pos === 'bottom') { style.left = 0; style.right = 0; style.top = H * 0.72; }
  return (
    <div style={{...style, opacity: out}}>
      {spec.lines.map((raw, i) => {
        const arrow = raw.startsWith('->');
        const text = raw.replace(/^->\s*/, '');
        const t = easeOut(prog(frame, at + i * 9, 12));
        return (
          <div key={i} style={{
            opacity: t, transform: `translateY(${(1 - t) * 14 * u}px)`,
            fontSize: size, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1.42,
            color: C.cream, textShadow: '0 2px 14px rgba(30,10,40,0.5)', whiteSpace: 'nowrap',
          }}>
            {arrow && <span style={{color: C.peach, fontSize: size * 0.7, marginRight: size * 0.42, verticalAlign: 'middle'}}>➔</span>}
            {text}
          </div>
        );
      })}
    </div>
  );
};

/** Small sentence-case caption in the bottom-left over a dark gradient band. */
export const Caption: React.FC<Base & {text: string}> = ({text, frame, fps, W, H, u, durFrames}) => {
  const a = prog(frame, Math.round(0.25 * fps), 10) * (1 - prog(frame, durFrames - 8, 8));
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: H * 0.13, opacity: a,
        background: 'linear-gradient(to bottom, rgba(24,10,36,0), rgba(24,10,36,0.5))'}} />
      <div style={{position: 'absolute', left: W * 0.047, bottom: H * 0.036, right: W * 0.05, opacity: a * 0.9,
        fontFamily: FONT, fontWeight: 500, fontSize: 26 * u, letterSpacing: '0.01em', color: C.creamDim, textShadow: '0 1px 6px rgba(20,8,30,0.6)'}}>
        {text}
      </div>
    </>
  );
};

/** Double-bordered label such as "11 P.M." (top-left) that pops in and fades. */
export const TimeBadge: React.FC<Base & {spec: BadgeSpec}> = ({spec, frame, fps, W, H, u}) => {
  const at = Math.round((spec.at ?? 0.3) * fps);
  const hold = Math.round((spec.hold ?? 2.2) * fps);
  const pop = easeOutBack(prog(frame, at, 9));
  const op = clamp((frame - at) / 5) * (1 - prog(frame, at + hold, Math.round(0.5 * fps)) * 0.85);
  if (frame < at || op <= 0.01) return null;
  const right = spec.pos === 'tr';
  const fs = 27 * u;
  return (
    <div style={{
      position: 'absolute', top: H * 0.055, [right ? 'right' : 'left']: W * 0.045, opacity: op,
      transform: `scale(${lerp(0.85, 1, pop)})`, transformOrigin: right ? 'top right' : 'top left',
      fontFamily: FONT, fontWeight: 800, fontSize: fs, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.cream,
      padding: `${fs * 0.34}px ${fs * 0.7}px`, border: `${3.5 * u}px solid ${C.cream}`, borderRadius: 12 * u,
      boxShadow: `inset 0 0 0 ${3 * u}px rgba(20,8,40,0.55), inset 0 0 0 ${4.5 * u}px ${C.cream}`,
      background: 'rgba(24,12,44,0.5)', textShadow: '0 2px 8px rgba(20,8,30,0.6)',
    }}>
      {spec.text}
      <div style={{position: 'absolute', left: 8 * u, bottom: -6 * u, width: 26 * u, height: 4 * u, background: C.cream, borderRadius: 2 * u, opacity: 0.9}} />
    </div>
  );
};

/** Red stamped counter floating above a character's head (world space). */
export const CounterStamp: React.FC<{spec: CounterSpec; frame: number; fps: number; x: number; y: number}> = ({spec, frame, fps, x, y}) => {
  const at = Math.round((spec.at ?? 0.2) * fps);
  if (frame < at) return null;
  const f = frame - at;
  const pop = easeOutBack(prog(f, 0, 8));
  const to = typeof spec.value === 'number' ? spec.value : NaN;
  let label: string;
  if (!isNaN(to) && spec.from !== undefined) {
    const k = easeOut(prog(f, 8, Math.round((spec.countSec ?? 1.2) * fps)));
    label = Math.round(lerp(spec.from, to, k)).toLocaleString('en-US');
  } else {
    label = typeof spec.value === 'number' ? spec.value.toLocaleString('en-US') : String(spec.value);
  }
  const shake = f < 10 ? Math.sin(f * 2.4) * (10 - f) * 0.25 : 0;
  const fs = 50;
  const padX = 22, padY = 8;
  const w = label.length * fs * 0.66 + padX * 2;
  const h = fs * 1.1 + padY * 2;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0}}>
      <div style={{
        position: 'absolute', left: -w / 2, top: -h, width: w, height: h, opacity: clamp(f / 4),
        transform: `scale(${lerp(1.7, 1, pop)}) rotate(${-1.4 + shake}deg)`, transformOrigin: 'bottom center',
      }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <rect x={3} y={3} width={w - 6} height={h - 6} rx={10} fill="rgba(60,10,30,0.28)" stroke={C.red} strokeWidth={5}
            strokeDasharray={`${w * 0.3} 6 ${w * 0.25} 8 ${w * 2}`} />
          <rect x={11} y={11} width={w - 22} height={h - 22} rx={5} fill="none" stroke={C.red} strokeWidth={2} />
        </svg>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT, fontWeight: 800, fontSize: fs, letterSpacing: '0.04em', color: C.red,
          textShadow: '0 0 14px rgba(212,31,69,0.55)'}}>
          {label}
        </div>
      </div>
    </div>
  );
};
