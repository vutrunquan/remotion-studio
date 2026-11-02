import type {Scene, Script} from './types';
import {countWords} from './util';

export type TLItem = {
  scene: Scene;
  index: number;
  start: number; // frame bắt đầu
  frames: number;
  dur: number; // giây
  rule: {active: number; total: number} | null; // trạng thái thanh tiến độ HUD
};
export type Timeline = {items: TLItem[]; total: number; fps: number; introFrames: number; outroFrames: number};

export const DEFAULT_MIN: Record<string, number> = {
  rule: 3.2,
  exhibit: 3.2,
  counter: 2.2,
  title: 3,
  stage: 1.4,
  text: 1.8,
};

/** Thời lượng cảnh (giây): voice > dur > tự tính theo số từ. */
export function sceneDuration(s: Scene, wpm = 150): number {
  if (s.dur && s.dur > 0) return s.dur;
  const tpl = s.visual?.tpl ?? 'black';
  const min = s.min ?? DEFAULT_MIN[tpl] ?? 1.4;
  if (s.voice && s.voiceDur && s.voiceDur > 0) return Math.max(min, (s.voiceDelay ?? 0.15) + s.voiceDur + 0.35);
  const words = countWords(s.text);
  const ellipsis = /(\.\.\.|…)\s*$/.test(s.text ?? '') ? 0.35 : 0;
  const perWord = 60 / Math.max(60, wpm) * 1.05; // 150 wpm ≈ 0.42 s/từ
  return Math.max(min, 0.55 + words * perWord + ellipsis);
}

export function buildTimeline(script: Script): Timeline {
  const fps = script.meta?.fps ?? 30;
  const gap = Math.round((script.meta?.gap ?? 0) * fps);
  const introFrames = Math.round((script.meta?.introHold ?? 0) * fps);
  const outroFrames = Math.round((script.meta?.outroHold ?? 1) * fps);
  let cursor = introFrames;
  let active = 0;
  let total = script.meta?.ruleTotal ?? 0;
  const items: TLItem[] = [];
  (script.scenes ?? []).forEach((scene, index) => {
    const dur = sceneDuration(scene, script.meta?.wpm ?? 150);
    const frames = Math.max(1, Math.round(dur * fps));
    const v = scene.visual;
    if (v?.tpl === 'rule') {
      active = v.n ?? active + 1;
      total = v.total ?? total;
    }
    if (typeof scene.rule === 'number') active = scene.rule;
    items.push({
      scene,
      index,
      start: cursor,
      frames,
      dur: frames / fps,
      rule: active > 0 && total > 0 ? {active, total} : null,
    });
    cursor += frames + gap;
  });
  return {items, total: Math.max(1, cursor + outroFrames), fps, introFrames, outroFrames};
}
