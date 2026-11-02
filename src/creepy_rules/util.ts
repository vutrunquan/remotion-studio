import React from 'react';
import {random} from 'remotion';
import type {KF, Meta} from './types';

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInCubic = (t: number) => Math.pow(clamp(t), 3);
export const easeInOutCubic = (t: number) => {
  t = clamp(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOutBack = (t: number, s = 1.70158) => {
  t = clamp(t);
  return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
};
export const smooth = (a: number, b: number, v: number) => easeInOutCubic((v - a) / (b - a));

/** Giá trị keyframe: số, hoặc [[giây, giá trị], ...] (nội suy mượt). */
export function kf(v: KF<number> | undefined, t: number, dflt = 0): number {
  if (v === undefined || v === null) return dflt;
  if (!Array.isArray(v)) return v as number;
  const a = v as Array<[number, number]>;
  if (!a.length) return dflt;
  if (t <= a[0][0]) return a[0][1];
  for (let i = 1; i < a.length; i++) {
    if (t <= a[i][0]) {
      const [t0, v0] = a[i - 1];
      const [t1, v1] = a[i];
      return lerp(v0, v1, easeInOutCubic((t - t0) / Math.max(1e-6, t1 - t0)));
    }
  }
  return a[a.length - 1][1];
}

export const rnd = (seed: string | number) => random(seed as any);

// ---------- Ngữ cảnh cảnh ----------
export type SceneCtxT = {
  f: number; // frame cục bộ trong cảnh
  gf: number; // frame toàn phim
  t: number; // giây cục bộ
  gt: number; // giây toàn phim
  fps: number;
  frames: number;
  dur: number;
  index: number;
  accent: string;
  meta: Meta;
};
export const SceneCtx = React.createContext<SceneCtxT>({
  f: 0, gf: 0, t: 0, gt: 0, fps: 30, frames: 90, dur: 3, index: 0, accent: '#e51939', meta: {},
});
export const useScene = () => React.useContext(SceneCtx);

// ---------- Văn bản ----------
export const stripMarkup = (s = '') => s.replace(/\*/g, '');
export const countWords = (s = '') => stripMarkup(s).trim().split(/\s+/).filter(Boolean).length;

/** Tách "*từ nhấn*" thành các đoạn [{text, hl}] */
export function splitHighlight(s = ''): Array<{text: string; hl: boolean}> {
  const out: Array<{text: string; hl: boolean}> = [];
  const parts = s.split('*');
  parts.forEach((p, i) => {
    if (p) out.push({text: p, hl: i % 2 === 1});
  });
  return out;
}
