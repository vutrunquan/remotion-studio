import React, {useMemo} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {AudioMix} from './audio';
import {fxAt} from './layers/fx';
import {Dust, Grain, Hud, Vignette} from './layers/Persistent';
import {makeLayout} from './layout';
import {DEFAULT_ACCENT, SceneContent} from './SceneContent';
import {buildTimeline} from './timeline';
import type {Script} from './types';

export const Rules: React.FC<Script> = (script) => {
  const {width, height, fps} = useVideoConfig();
  const gf = useCurrentFrame();
  const tl = useMemo(() => buildTimeline(script), [script]);
  const meta = script.meta ?? {};
  const layout = makeLayout(width, height);
  const totalSec = tl.total / fps;
  const cur = tl.items.find((it) => gf >= it.start && gf < it.start + it.frames);
  const ref = cur ?? (gf < (tl.items[0]?.start ?? 0) ? tl.items[0] : tl.items[tl.items.length - 1]);
  const st = cur ? fxAt(cur.scene, (gf - cur.start) / fps, gf / fps, gf, meta, totalSec) : null;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {tl.items.map((it) => (
        <Sequence key={it.index} from={it.start} durationInFrames={it.frames}>
          <SceneContent item={it} meta={meta} totalSec={totalSec} />
        </Sequence>
      ))}
      <Grain gf={gf} k={meta.grain ?? 1} boost={st?.glitch ?? 0} />
      <Dust gf={gf} k={meta.dust ?? 1} />
      <Vignette k={meta.vignette ?? 1} />
      <Hud gf={gf} fps={fps} layout={layout} meta={meta} rule={ref?.rule ?? null} glitch={st?.glitch ?? 0} accent={meta.accent ?? DEFAULT_ACCENT} />
      <AudioMix script={script} tl={tl} />
    </AbsoluteFill>
  );
};
