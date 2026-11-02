import React from 'react';
import {C} from '../theme';
import {darken, lighten, rng} from '../lib/util';

const INK = C.ink;

export const Defs: React.FC<{id: string; stops: [number, string][]; vertical?: boolean}> = ({id, stops, vertical = true}) => (
  <linearGradient id={id} x1="0" y1="0" x2={vertical ? 0 : 1} y2={vertical ? 1 : 0}>
    {stops.map(([o, c], i) => <stop key={i} offset={o} stopColor={c} />)}
  </linearGradient>
);

export const Lamp: React.FC<{x: number; baseY: number; topY: number; on?: boolean}> = ({x, baseY, topY, on = true}) => (
  <g strokeLinejoin="round">
    <ellipse cx={x} cy={baseY} rx={52} ry={13} fill="#2a2230" stroke={INK} strokeWidth={4} />
    <rect x={x - 5} y={topY + 90} width={10} height={baseY - topY - 90} fill="#2a2230" stroke={INK} strokeWidth={3} />
    <path d={`M ${x - 44} ${topY} L ${x + 44} ${topY} L ${x + 74} ${topY + 98} L ${x - 74} ${topY + 98} Z`} fill={on ? '#f7be78' : '#6a4a58'} stroke={INK} strokeWidth={5} />
    {on && <path d={`M ${x - 30} ${topY + 10} L ${x + 30} ${topY + 10} L ${x + 50} ${topY + 84} L ${x - 50} ${topY + 84} Z`} fill="#ffe0a8" opacity={0.7} />}
    <ellipse cx={x} cy={topY + 98} rx={74} ry={8} fill={on ? '#ffd9a0' : '#5a3a48'} stroke={INK} strokeWidth={3} />
  </g>
);

export const Clock: React.FC<{cx: number; cy: number; r?: number; time?: string}> = ({cx, cy, r = 54, time = '10:10'}) => {
  const [hh, mm] = time.split(':').map(Number);
  const ma = (mm / 60) * 360, ha = (((hh % 12) + mm / 60) / 12) * 360;
  const hand = (a: number, len: number, w: number) => (
    <line x1={cx} y1={cy} x2={cx + Math.sin((a * Math.PI) / 180) * len} y2={cy - Math.cos((a * Math.PI) / 180) * len} stroke={INK} strokeWidth={w} strokeLinecap="round" />
  );
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#f3e6e1" stroke={INK} strokeWidth={6} />
      <circle cx={cx} cy={cy} r={r - 7} fill="none" stroke="#c9b3ad" strokeWidth={2} />
      {Array.from({length: 12}).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={cx + Math.sin(a) * (r - 14)} y1={cy - Math.cos(a) * (r - 14)} x2={cx + Math.sin(a) * (r - 9)} y2={cy - Math.cos(a) * (r - 9)} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />;
      })}
      {hand(ha, r * 0.5, 5)}{hand(ma, r * 0.74, 3.6)}
      <circle cx={cx} cy={cy} r={4} fill={INK} />
    </g>
  );
};

export const Plant: React.FC<{x: number; baseY: number; s?: number}> = ({x, baseY, s = 1}) => {
  const leaves = [-72, -48, -26, -6, 14, 36, 60, 80];
  return (
    <g transform={`translate(${x} ${baseY}) scale(${s})`} strokeLinejoin="round">
      {leaves.map((a, i) => (
        <g key={i} transform={`translate(0 -86) rotate(${a}) scale(${0.85 + (i % 3) * 0.12})`}>
          <path d="M 0 0 C -52 -70 -40 -190 0 -270 C 40 -190 52 -70 0 0 Z" fill={i % 2 ? '#2a5238' : '#1f3d2d'} stroke={INK} strokeWidth={4} />
          <path d="M 0 -6 L 0 -246" stroke={lighten('#2a5238', 0.25)} strokeWidth={3} opacity={0.7} strokeLinecap="round" />
        </g>
      ))}
      <path d="M -50 -92 L 50 -92 L 38 0 L -38 0 Z" fill="#7a2338" stroke={INK} strokeWidth={5} />
      <rect x={-56} y={-104} width={112} height={16} rx={6} fill="#923049" stroke={INK} strokeWidth={4} />
    </g>
  );
};

export const Bench: React.FC<{x: number; seatY: number; w?: number; back?: boolean}> = ({x, seatY, w = 430, back = true}) => {
  const x0 = x - w / 2;
  const slat = (y: number, h = 22, c = '#7a3a22') => (
    <g key={y}>
      <rect x={x0} y={y} width={w} height={h} rx={5} fill={c} stroke={INK} strokeWidth={4} />
      <rect x={x0 + 6} y={y + 3} width={w - 12} height={5} rx={2.5} fill={lighten(c, 0.3)} opacity={0.7} />
    </g>
  );
  return (
    <g strokeLinejoin="round">
      {[x0 + 28, x0 + w - 28].map((lx) => (
        <g key={lx}>
          <path d={`M ${lx} ${seatY} L ${lx - 8} ${seatY + 76}`} stroke={INK} strokeWidth={13} strokeLinecap="round" />
          <path d={`M ${lx} ${seatY - (back ? 120 : 0)} L ${lx} ${seatY}`} stroke={INK} strokeWidth={11} strokeLinecap="round" />
        </g>
      ))}
      {back && [seatY - 126, seatY - 96, seatY - 66].map((y) => slat(y, 22, '#8a4426'))}
      {slat(seatY - 2, 24, '#7a3a22')}
    </g>
  );
};

export const Sofa: React.FC<{x: number; baseY: number}> = ({x, baseY}) => {
  const body = '#76505f', cush = '#8a6676', arm = '#6a4756';
  const x0 = x - 280;
  return (
    <g strokeLinejoin="round">
      {[x0 + 40, x0 + 520].map((fx) => <rect key={fx} x={fx} y={baseY - 8} width={22} height={24} rx={4} fill="#2a1d2b" stroke={INK} strokeWidth={3} />)}
      <rect x={x0 + 50} y={baseY - 250} width={460} height={190} rx={40} fill={body} stroke={INK} strokeWidth={5} />
      {[0, 1, 2].map((i) => <rect key={i} x={x0 + 66 + i * 148} y={baseY - 236} width={140} height={150} rx={26} fill={cush} stroke={INK} strokeWidth={4} />)}
      <rect x={x0 + 20} y={baseY - 112} width={520} height={110} rx={32} fill={body} stroke={INK} strokeWidth={5} />
      {[0, 1, 2].map((i) => <rect key={i} x={x0 + 34 + i * 170} y={baseY - 104} width={162} height={72} rx={24} fill={cush} stroke={INK} strokeWidth={4} />)}
      <rect x={x0 - 10} y={baseY - 168} width={84} height={172} rx={36} fill={arm} stroke={INK} strokeWidth={5} />
      <rect x={x0 + 486} y={baseY - 168} width={84} height={172} rx={36} fill={arm} stroke={INK} strokeWidth={5} />
    </g>
  );
};

export const Takeout: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g strokeLinejoin="round">
    {[[-26, 0, 1], [20, -4, 0.9]].map(([dx, dy, s], i) => (
      <g key={i} transform={`translate(${x + dx} ${y + dy}) scale(${s})`}>
        <path d="M -20 -20 L 20 -20 L 14 18 L -14 18 Z" fill="#e6ddd4" stroke={INK} strokeWidth={3.6} />
        <path d="M -20 -20 L 0 -30 L 20 -20" fill="#d3c8be" stroke={INK} strokeWidth={3.2} />
      </g>))}
  </g>
);

export const Pigeon: React.FC<{x: number; y: number; frame: number}> = ({x, y, frame}) => {
  const hop = Math.abs(Math.sin(frame / 14)) > 0.97 ? -5 : 0;
  const peck = Math.sin(frame / 9) > 0.6 ? 8 : 0;
  return (
    <g transform={`translate(${x} ${y + hop})`} strokeLinejoin="round">
      <ellipse cx={0} cy={0} rx={22} ry={13} fill="#a9a2c9" stroke={INK} strokeWidth={3.4} />
      <path d="M -22 -2 L -38 -8 L -24 6 Z" fill="#8b84ad" stroke={INK} strokeWidth={3} />
      <g transform={`rotate(${peck} 14 -4)`}>
        <circle cx={18} cy={-9} r={8} fill="#b9b3d6" stroke={INK} strokeWidth={3.2} />
        <path d="M 25 -9 L 33 -7 L 25 -5 Z" fill="#e8a05a" stroke={INK} strokeWidth={2} />
        <circle cx={20} cy={-11} r={1.8} fill={INK} />
      </g>
      <path d="M -4 12 L -4 20 M 6 12 L 6 20" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
};

export const Tree: React.FC<{x: number; baseY: number; s?: number; color?: string; accent?: string}> = ({x, baseY, s = 1, color = '#2c4a46', accent}) => {
  const r = rng(Math.round(x));
  return (
    <g transform={`translate(${x} ${baseY}) scale(${s})`} strokeLinejoin="round">
      <path d="M -8 0 L -6 -150 L 6 -150 L 8 0 Z" fill="#3a2430" stroke={INK} strokeWidth={4} />
      <ellipse cx={0} cy={-210} rx={100} ry={88} fill={color} stroke={INK} strokeWidth={5} />
      {accent && Array.from({length: 9}).map((_, i) => <circle key={i} cx={(r() - 0.5) * 150} cy={-210 + (r() - 0.5) * 120} r={7} fill={accent} />)}
    </g>
  );
};

export const BrickWall: React.FC<{x: number; y: number; w: number; h: number; base: string}> = ({x, y, w, h, base}) => {
  const rows = Math.floor(h / 22);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={base} />
      {Array.from({length: rows}).map((_, i) => <rect key={i} x={x} y={y + i * 22} width={w} height={2.4} fill={darken(base, 0.28)} opacity={0.55} />)}
    </g>
  );
};
