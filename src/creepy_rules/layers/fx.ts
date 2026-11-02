import type {Meta, Scene} from '../types';
import {clamp, rnd} from '../util';

export type FxState = {glitch: number; flash: number; shake: number; flicker: number; zoom: number; black: number; seed: number};

/** Danh sách cú glitch tự động theo thời gian toàn phim: mỗi `every` giây một cú ngắn, vị trí có hạt giống (lặp lại được). */
export function autoGlitchEvents(totalSec: number, every: number): Array<{start: number; d: number; s: number}> {
  const out: Array<{start: number; d: number; s: number}> = [];
  for (let k = 0; k * every < totalSec; k++) {
    const start = k * every + 2 + rnd(`ag${k}`) * Math.max(1, every - 4);
    const d = 0.28 + rnd(`agd${k}`) * 0.25;
    if (start > 1.5 && start < totalSec - 1.5) out.push({start, d, s: 0.55 + rnd(`ags${k}`) * 0.3});
  }
  return out;
}

export function autoGlitchAt(gt: number, every: number, total: number): number {
  const k = Math.floor(gt / every);
  for (const kk of [k, k - 1]) {
    if (kk < 0) continue;
    const start = kk * every + 2 + rnd(`ag${kk}`) * Math.max(1, every - 4);
    const d = 0.28 + rnd(`agd${kk}`) * 0.25;
    if (start > 1.5 && start < total - 1.5 && gt >= start && gt < start + d) return 0.55 + rnd(`ags${kk}`) * 0.3;
  }
  return 0;
}

export function fxAt(scene: Scene, t: number, gt: number, gf: number, meta: Meta, totalSec: number): FxState {
  const st: FxState = {glitch: 0, flash: 0, shake: 0, flicker: 0, zoom: 0, black: 0, seed: Math.floor(gf / 2)};
  const tr = scene.transition;
  if (tr === 'glitch' && t < 0.3) st.glitch = Math.max(st.glitch, 1 - t / 0.3);
  if (tr === 'dip' && t < 0.3) st.black = Math.max(st.black, 1 - t / 0.3);
  if (tr === 'flash' && t < 0.2) st.flash = Math.max(st.flash, 1 - t / 0.2);
  for (const e of scene.fx ?? []) {
    const d = e.d ?? (e.type === 'glitch' ? 0.35 : 0.25);
    if (t < e.t || t >= e.t + d) continue;
    const k = 1 - (t - e.t) / d;
    const s = (e.s ?? 0.9) * (e.type === 'glitch' ? 0.55 + 0.45 * rnd(`fxk${gf}`) : k);
    if (e.type === 'glitch') st.glitch = Math.max(st.glitch, s);
    if (e.type === 'flash') st.flash = Math.max(st.flash, k * (e.s ?? 0.8));
    if (e.type === 'shake') st.shake = Math.max(st.shake, k * (e.s ?? 0.8));
    if (e.type === 'flicker') st.flicker = Math.max(st.flicker, e.s ?? 0.8);
    if (e.type === 'zoom') st.zoom = Math.max(st.zoom, k * (e.s ?? 0.5));
    if (e.type === 'blackout') st.black = 1;
  }
  if (meta.autoGlitch !== false && !scene.noGlitch) {
    st.glitch = Math.max(st.glitch, autoGlitchAt(gt, meta.glitchEvery ?? 8, totalSec));
  }
  return st;
}
