import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import './fonts';
import {Visual} from './templates';
import {Caption} from './layers/Caption';
import {Glitch} from './layers/Glitch';
import {fxAt} from './layers/fx';
import {makeLayout} from './layout';
import {glowFilter, REF} from './theme';
import type {Meta, Scene} from './types';
import type {TLItem} from './timeline';
import {SceneCtx, clamp, easeOutCubic, rnd} from './util';

export const DEFAULT_ACCENT = '#e51939';

/** Nội dung một cảnh: sân khấu SVG + phụ đề, bọc glitch/rung/zoom. fixedF dùng cho ảnh tổng hợp (Sheet). */
export const SceneContent: React.FC<{item: TLItem; meta: Meta; totalSec: number; fixedF?: number}> = ({item, meta, totalSec, fixedF}) => {
  const {width: W, height: H, fps} = useVideoConfig();
  const local = useCurrentFrame();
  const f = fixedF ?? local;
  const t = f / fps;
  const gf = item.start + f;
  const accent = meta.accent ?? DEFAULT_ACCENT;
  const layout = makeLayout(W, H);
  const st = fxAt(item.scene, t, gf / fps, gf, meta, totalSec);
  const glow = (meta.glow ?? 1) * (W / 1920) * (layout.portrait ? 1.2 : 1);
  const drift = (meta.drift ?? 1) * clamp(t / item.dur);
  const dscale = 1 + 0.02 * drift + st.zoom * 0.05;
  const sway = Math.sin(t * 0.7) * 1.6 * (meta.drift ?? 1);
  const sh = st.shake * 14;
  const shx = (rnd(`shx${gf}`) - 0.5) * sh;
  const shy = (rnd(`shy${gf}`) - 0.5) * sh;
  const flick = st.flicker > 0 ? 1 - st.flicker * 0.7 * (rnd(`fl${gf}`) > 0.5 ? 1 : 0.1) : 1;
  const v = item.scene.visual;
  const showCaption = item.scene.caption !== false && !!item.scene.text;
  const ctx = {f, gf, t, gt: gf / fps, fps, frames: item.frames, dur: item.dur, index: item.index, accent, meta};
  return (
    <SceneCtx.Provider value={ctx}>
      <AbsoluteFill>
        <Glitch strength={st.glitch} seed={st.seed}>
          <AbsoluteFill style={{transform: `translate(${shx}px, ${shy}px)`, opacity: flick}}>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, filter: glowFilter(glow), overflow: 'visible'}}>
              <g transform={`translate(${layout.tx + sway} ${layout.ty}) scale(${layout.s})`}>
                <g transform={`translate(${REF.cx} ${REF.cy}) scale(${dscale}) translate(${-REF.cx} ${-REF.cy})`}>
                  <Visual v={v} rule={item.rule} />
                </g>
              </g>
            </svg>
            {showCaption && <Caption text={item.scene.text!} t={t} at={item.scene.captionAt ?? 0.1} layout={layout} accent={accent} glow={Math.min(1.4, glow)} />}
          </AbsoluteFill>
        </Glitch>
        {st.flash > 0 && <AbsoluteFill style={{background: '#fff', opacity: st.flash * 0.9}} />}
        {st.black > 0 && <AbsoluteFill style={{background: '#000', opacity: st.black}} />}
      </AbsoluteFill>
    </SceneCtx.Provider>
  );
};
