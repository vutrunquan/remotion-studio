import React, {useMemo} from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {Dust, Grain, Hud, Vignette} from './layers/Persistent';
import {makeLayout} from './layout';
import {DEFAULT_ACCENT, SceneContent} from './SceneContent';
import {FONT} from './theme';
import {buildTimeline} from './timeline';
import type {Script} from './types';

/** Ảnh tổng hợp: mỗi ô là một cảnh ở 70% thời lượng (đã có chữ/hiệu ứng). Dùng để duyệt nhanh cả phim. */
export const Sheet: React.FC<Script> = (script) => {
  const {width: W, height: H, fps} = useVideoConfig();
  const tl = useMemo(() => buildTimeline(script), [script]);
  const cols = script.sheet?.cols ?? 3;
  const rows = script.sheet?.rows ?? 3;
  const page = script.sheet?.page ?? 0;
  const per = cols * rows;
  const meta = {...(script.meta ?? {}), autoGlitch: false};
  const layout = makeLayout(W, H);
  const items = tl.items.slice(page * per, page * per + per);
  const cw = W / cols;
  const chh = H / rows;
  return (
    <AbsoluteFill style={{background: '#222'}}>
      {items.map((it, i) => {
        const fixedF = Math.min(it.frames - 1, Math.round(it.frames * 0.7));
        const gf = it.start + fixedF;
        return (
          <div key={it.index} style={{position: 'absolute', left: (i % cols) * cw, top: Math.floor(i / cols) * chh, width: cw - 4, height: chh - 4, overflow: 'hidden', background: '#000'}}>
            <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${(cw - 4) / W})`, transformOrigin: '0 0'}}>
              <SceneContent item={it} meta={meta} totalSec={tl.total / fps} fixedF={fixedF} />
              <Grain gf={gf} k={1} />
              <Vignette k={1} />
              <Hud gf={gf} fps={fps} layout={layout} meta={meta} rule={it.rule} glitch={0} accent={meta.accent ?? DEFAULT_ACCENT} />
            </div>
            <div style={{position: 'absolute', left: 6, bottom: 4, fontFamily: FONT, fontSize: 15, color: '#ff0', background: 'rgba(0,0,0,.6)', padding: '1px 5px'}}>
              #{it.index + 1} {it.scene.id ?? ''} · {(it.start / fps).toFixed(1)}s · {it.dur.toFixed(1)}s
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
