import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {StoryProps} from './types';
import {ShotView} from './Stage';
import {buildTimeline} from './lib/timing';
import {clamp, lerp} from './lib/util';
import {BlindsWipe, FadeBlack} from './fx/Fx';

const DissolveWrap: React.FC<{frames: number; children: React.ReactNode}> = ({frames, children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{opacity: clamp(f / Math.max(1, frames))}}>{children}</AbsoluteFill>;
};

const TransitionOverlay: React.FC<{kind: 'black' | 'blinds'; frames: number}> = ({kind, frames}) => {
  const f = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const u = (H >= W ? W : H) / 1080;
  const p = clamp((f + 0.5) / frames);
  return kind === 'black' ? <FadeBlack p={p} /> : <BlindsWipe p={p} W={W} H={H} u={u} />;
};

export const Story: React.FC<StoryProps> = ({meta, shots}) => {
  const {fps, durationInFrames, height: H} = useVideoConfig();
  const tl = React.useMemo(() => buildTimeline(shots, fps), [shots, fps]);

  // narration windows (for music ducking)
  const narr = React.useMemo(
    () => tl.filter((t) => t.shot.narration?.audio).map((t) => [t.from, t.from + t.frames] as [number, number]),
    [tl],
  );
  const duckTo = meta.duckTo ?? 0.45;
  const base = meta.musicVolume ?? 0.22;
  const musicVol = (f: number) => {
    let d = 1e9;
    for (const [a, b] of narr) {
      const dist = f >= a && f <= b ? 0 : Math.min(Math.abs(f - a), Math.abs(f - b));
      if (dist < d) d = dist;
      if (d === 0) break;
    }
    const k = clamp(d / (0.5 * fps));
    const duck = lerp(duckTo, 1, k);
    const fadeIn = clamp(f / (1.2 * fps)), fadeOut = clamp((durationInFrames - f) / (2 * fps));
    return base * duck * fadeIn * fadeOut;
  };
  const lb = clamp(meta.letterbox ?? 0, 0, 0.15);

  return (
    <AbsoluteFill style={{background: '#000'}}>
      {tl.map((t) => {
        const next = tl[t.index + 1]?.shot;
        const dissolveOut = next?.transition === 'dissolve' ? Math.round((next.transitionSec ?? 0.7) * fps) : 0;
        const dissolveIn = t.shot.transition === 'dissolve' && t.index > 0 ? Math.round((t.shot.transitionSec ?? 0.7) * fps) : 0;
        const view = <ShotView shot={t.shot} meta={meta} />;
        return (
          <Sequence key={t.shot.id + ':' + t.index} from={t.from} durationInFrames={t.frames + dissolveOut}>
            {dissolveIn ? <DissolveWrap frames={dissolveIn}>{view}</DissolveWrap> : view}
          </Sequence>
        );
      })}

      {tl.map((t) => {
        const k = t.shot.transition;
        if (t.index === 0 || (k !== 'black' && k !== 'blinds')) return null;
        const T = Math.max(4, Math.round((t.shot.transitionSec ?? 0.7) * fps));
        return (
          <Sequence key={'tr' + t.index} from={Math.max(0, t.from - Math.floor(T / 2))} durationInFrames={T}>
            <TransitionOverlay kind={k} frames={T} />
          </Sequence>
        );
      })}

      {lb > 0 && (<>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: H * lb, background: '#000'}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: H * lb, background: '#000'}} />
      </>)}

      {/* audio */}
      {meta.music && <Audio src={staticFile(meta.music)} volume={musicVol} loop />}
      {tl.map((t) => t.shot.narration?.audio && (
        <Sequence key={'vo' + t.index} from={t.from + Math.round((t.shot.narration.offsetSec ?? 0.1) * fps)}>
          <Audio src={staticFile(t.shot.narration.audio)} volume={meta.voiceVolume ?? 1} />
        </Sequence>
      ))}
      {tl.flatMap((t) => (t.shot.sfx ?? []).map((s, i) => (
        <Sequence key={`sfx${t.index}-${i}`} from={t.from + Math.round((s.at ?? 0) * fps)}>
          <Audio src={staticFile(s.file)} volume={s.volume ?? 0.6} />
        </Sequence>
      )))}
    </AbsoluteFill>
  );
};
