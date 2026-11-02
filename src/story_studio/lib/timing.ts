import type {Shot, StoryMeta} from '../types';

export const framesOf = (s: Shot, fps: number) => Math.max(1, Math.round(s.durationSec * fps));

export interface TimelineItem {shot: Shot; from: number; frames: number; index: number}

export function buildTimeline(shots: Shot[], fps: number): TimelineItem[] {
  let at = 0;
  return shots.map((shot, index) => {
    const frames = framesOf(shot, fps);
    const item = {shot, from: at, frames, index};
    at += frames;
    return item;
  });
}

export const totalFrames = (shots: Shot[], fps: number) => shots.reduce((n, s) => n + framesOf(s, fps), 0);

export function dims(meta: StoryMeta): {width: number; height: number} {
  const res = meta.resolution ?? '1080p';
  const short = res === '720p' ? 720 : res === '4k' ? 2160 : 1080;
  const even = (n: number) => Math.round(n / 2) * 2;
  switch (meta.aspect ?? '16:9') {
    case '9:16': return {width: short, height: even((short * 16) / 9)};
    case '1:1': return {width: short, height: short};
    default: return {width: even((short * 16) / 9), height: short};
  }
}
