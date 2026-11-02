import React from 'react';
import {COLORS} from '../theme';

export type P = [number, number];
export const W = COLORS.white;
export const INK = COLORS.ink;

/** Viên thuốc: đoạn thẳng bo tròn hai đầu (xương của pictogram) */
export const Cap: React.FC<{a: P; b: P; w: number; c?: string; o?: number}> = ({a, b, w, c = W, o = 1}) => (
  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" opacity={o} />
);

/** Chuỗi đoạn (chân/tay nhiều khớp) */
export const Chain: React.FC<{pts: P[]; w: number; c?: string; outline?: number}> = ({pts, w, c = W, outline = 0}) => {
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return (
    <>
      {outline > 0 && (
        <path d={d} fill="none" stroke={INK} strokeWidth={w + outline * 2} strokeLinecap="round" strokeLinejoin="round" />
      )}
      <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
};

export const fk = (o: P, len: number, deg: number): P => [
  o[0] + len * Math.sin((deg * Math.PI) / 180),
  o[1] + len * Math.cos((deg * Math.PI) / 180),
];
export const mixP = (a: P, b: P, p: number): P => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];
