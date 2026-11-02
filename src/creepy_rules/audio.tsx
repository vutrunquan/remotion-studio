import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {autoGlitchEvents} from './layers/fx';
import {counterTimes} from './templates/Counter';
import type {Script} from './types';
import type {Timeline, TLItem} from './timeline';

export type SfxEvent = {frame: number; name: string; vol: number};

const itemsOf = (v: any): any[] => (v?.tpl === 'stage' ? v.items ?? [] : []);

/** Gom SFX của một cảnh: SFX khai báo tay + SFX tự động theo mẫu cảnh. */
export function sceneSfx(it: TLItem, fps: number, auto: boolean): SfxEvent[] {
  const out: SfxEvent[] = [];
  const s = it.scene;
  const add = (t: number, name: string, vol = 1) => {
    const fr = it.start + Math.round(t * fps);
    if (fr >= it.start && fr < it.start + it.frames) out.push({frame: fr, name, vol});
  };
  (s.sfx ?? []).forEach((e) => add(e.t ?? 0, e.name, e.vol ?? 1));
  if (!auto) return out;
  if (s.transition === 'glitch') add(0, 'glitch', 0.7);
  if (s.transition === 'flash') add(0, 'hit', 0.8);
  (s.fx ?? []).forEach((e) => {
    if (e.type === 'glitch') add(e.t, 'glitch', 0.6);
    if (e.type === 'flash' || e.type === 'shake') add(e.t, 'hit', 0.7);
  });
  const v = s.visual;
  if (v?.tpl === 'rule') add(0, 'boom', 1);
  if (v?.tpl === 'title') add(0, 'boom', 0.8);
  if (v?.tpl === 'stamp') add(0, 'hit', 1);
  if (v?.tpl === 'exhibit') add(0.04, 'shutter', 0.8);
  if (v?.tpl === 'counter') {
    const {n, popStart, popGap} = counterTimes(v);
    if (!v.static) for (let i = 0; i < n; i++) add(popStart + i * popGap, 'tick', 0.55);
    if ((v.crossed ?? []).length) add(v.crossAt ?? 0.3, 'hit', 0.9);
    if ((v.classified ?? []).length) add(v.classifiedAt ?? 0.9, 'static', 0.8);
  }
  itemsOf(v).forEach((i) => {
    if (i.kind === 'cross') add(i.t0 ?? 0, 'hit', 0.8);
    if (i.kind === 'check') add(i.t0 ?? 0, 'ding', 0.7);
  });
  return out;
}

export const AudioMix: React.FC<{script: Script; tl: Timeline}> = ({script, tl}) => {
  const meta = script.meta ?? {};
  const fps = tl.fps;
  const sfxVol = meta.sfxVolume ?? 0.8;
  const voiceVol = meta.voiceVolume ?? 1;
  const auto = meta.autoSfx !== false;
  const events: SfxEvent[] = [];
  tl.items.forEach((it) => events.push(...sceneSfx(it, fps, auto)));
  if (auto && meta.autoGlitch !== false) {
    autoGlitchEvents(tl.total / fps, meta.glitchEvery ?? 8).forEach((e) => {
      const fr = Math.round(e.start * fps);
      const it = tl.items.find((x) => fr >= x.start && fr < x.start + x.frames);
      if (it && !it.scene.noGlitch) events.push({frame: fr, name: 'glitch', vol: 0.5});
    });
  }
  const music = meta.music;
  const musicSrc = music === false ? null : music?.src ? staticFile(music.src) : staticFile('sfx/drone.wav');
  const musicVol = music === false ? 0 : (music && music.volume) ?? 0.22;
  return (
    <>
      {musicSrc && (
        <Sequence from={0} durationInFrames={tl.total} layout="none">
          <Audio
            src={musicSrc}
            loop
            volume={(f) => musicVol * Math.min(1, f / (fps * 1.5)) * Math.min(1, (tl.total - f) / (fps * 2))}
          />
        </Sequence>
      )}
      {tl.items.map((it) =>
        it.scene.voice ? (
          <Sequence key={`v${it.index}`} from={it.start + Math.round((it.scene.voiceDelay ?? 0.15) * fps)} layout="none">
            <Audio src={staticFile(it.scene.voice)} volume={voiceVol} />
          </Sequence>
        ) : null,
      )}
      {events.map((e, i) => (
        <Sequence key={`s${i}`} from={e.frame} durationInFrames={Math.round(fps * 6)} layout="none">
          <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={sfxVol * e.vol} />
        </Sequence>
      ))}
    </>
  );
};
