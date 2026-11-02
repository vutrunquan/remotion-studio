import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CharacterSpec, Shot, StoryMeta} from './types';
import {GRADES, WORLD_H, WORLD_W} from './theme';
import {SETS, SetDef} from './sets';
import {Character, ResolvedChar, charPoints} from './characters/Character';
import {cameraState} from './lib/camera';
import {clamp, lerp} from './lib/util';
import {Caption, CounterStamp, TimeBadge, TitleCard} from './overlays/Overlays';
import {Dust, LightShafts, WindowBlinds} from './fx/Fx';

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>',
)}")`;

function resolveChar(c: CharacterSpec, set: SetDef, p: number): ResolvedChar {
  const a = c.at ? set.anchors[c.at] : undefined;
  let x = c.x ?? a?.x ?? 960;
  let y = c.y ?? a?.y ?? set.floorY;
  if (c.moveTo) { x = lerp(x, c.moveTo.x ?? x, p); y = lerp(y, c.moveTo.y ?? y, p); }
  return {...c, x, y, scale: c.scale ?? a?.scale ?? 1, flip: c.flip ?? a?.flip, pose: c.pose ?? a?.pose ?? 'stand'};
}

function resolveFocus(shot: Shot, chars: ResolvedChar[], t: number, narrow: boolean): [number, number] {
  const f = shot.camera?.focus;
  if (Array.isArray(f)) return f;
  if (f === 'center') return [WORLD_W / 2, WORLD_H / 2];
  if (typeof f === 'string') {
    const [id, part = 'body'] = f.split('.');
    const c = chars.find((k) => k.id === id);
    if (c) {
      const pts = charPoints(c, t) as Record<string, [number, number]>;
      const q = pts[part] ?? pts.body;
      return part === 'head' && (shot.camera?.shot === 'close') ? [q[0], q[1] + (shot.counter ? -25 : 45)] : q;
    }
  }
  if (!chars.length) return [WORLD_W / 2, WORLD_H / 2];
  const size = shot.camera?.shot ?? 'wide';
  const pts = chars.map((c) => charPoints(c, t));
  const avg = (sel: (p: ReturnType<typeof charPoints>) => [number, number]): [number, number] => [
    pts.reduce((s, p) => s + sel(p)[0], 0) / pts.length, pts.reduce((s, p) => s + sel(p)[1], 0) / pts.length];
  if (size === 'wide') return narrow || (shot.camera?.zoom && shot.camera.zoom > 1) ? avg((p) => p.body) : [WORLD_W / 2, WORLD_H / 2];
  if (size === 'medium') return avg((p) => [p.head[0], (p.head[1] + p.feet[1]) / 2]);
  if (size === 'close') return avg((p) => [p.head[0], p.head[1] + (shot.counter ? -25 : 45)]);
  return avg((p) => p.head);
}

export const ShotView: React.FC<{shot: Shot; meta: StoryMeta}> = ({shot, meta}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const u = (H >= W ? W : H) / 1080;
  const durFrames = Math.max(1, Math.round(shot.durationSec * fps));
  const p = clamp(frame / durFrames);
  const t = frame / fps;

  const set = SETS[shot.set] ?? SETS.void;
  const grade = GRADES[shot.grade ?? set.grade] ?? GRADES.none;
  const opts = shot.setOptions ?? {};
  const chars = (shot.characters ?? []).map((c) => resolveChar(c, set, p));
  const focus = resolveFocus(shot, chars, Math.min(t, shot.durationSec), W / H < 1.5);
  const cam = cameraState(shot.camera, p, focus, W, H, u);
  const fx = new Set(shot.fx ?? []);
  const SetC = set.Component;
  const lights = set.lights?.(opts) ?? [];
  const sorted = [...chars].sort((a, b) => a.y - b.y);

  let counterPos: [number, number] | null = null;
  if (shot.counter) {
    const a = shot.counter.above;
    if (Array.isArray(a)) counterPos = a;
    else {
      const c = chars.find((k) => k.id === a) ?? chars[0];
      if (c) { const top = charPoints(c, t).top; counterPos = [top[0], top[1] - 18]; }
    }
  }
  const vig = Math.min(0.92, grade.vignette + (fx.has('heavy-vignette') ? 0.2 : 0));
  const grain = fx.has('no-grain') ? 0 : meta.grain ?? 0.35;
  const common = {frame, fps, W, H, u, durFrames};

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `rotate(${cam.roll}deg)`, transformOrigin: '50% 50%'}}>
        <div style={{
          position: 'absolute', left: 0, top: 0, width: WORLD_W, height: WORLD_H, transformOrigin: '0 0',
          transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.scale})`,
          filter: grade.saturate !== 1 || grade.brightness !== 1 ? `saturate(${grade.saturate}) brightness(${grade.brightness})` : undefined,
        }}>
          <div style={{position: 'absolute', inset: 0, background: '#1a1228', filter: cam.blur > 0.3 ? `blur(${cam.blur / cam.scale}px)` : undefined}}>
            <SetC opts={opts} frame={frame} fps={fps} />
          </div>
          <svg width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} style={{position: 'absolute', inset: 0}}>
            {sorted.map((c) => <Character key={c.id} spec={c} frame={frame} fps={fps} headColor={grade.head} camScale={cam.scale} />)}
          </svg>
          {grade.tintOpacity > 0 && <div style={{position: 'absolute', inset: 0, background: grade.tint, opacity: grade.tintOpacity, mixBlendMode: 'multiply'}} />}
          {lights.map((l, i) => (
            <div key={i} style={{position: 'absolute', left: l.x - l.r, top: l.y - l.r, width: l.r * 2, height: l.r * 2, borderRadius: '50%',
              background: `radial-gradient(circle, ${l.color} 0%, rgba(0,0,0,0) 68%)`, opacity: l.opacity * (1 + 0.015 * Math.sin(frame / 7 + i)), mixBlendMode: 'screen'}} />
          ))}
          {grade.hazeOpacity > 0 && <div style={{position: 'absolute', inset: 0, background: grade.haze, opacity: grade.hazeOpacity, mixBlendMode: 'screen'}} />}
          {(fx.has('dust') || fx.has('sparkles')) && <Dust frame={frame} seed={shot.id} sparkle={fx.has('sparkles') && !fx.has('dust')} />}
          {fx.has('dust') && fx.has('sparkles') && <Dust frame={frame} seed={shot.id + 's'} sparkle count={60} />}
          {fx.has('light-shafts') && <LightShafts frame={frame} />}
          {shot.counter && counterPos && <CounterStamp spec={shot.counter} frame={frame} fps={fps} x={counterPos[0]} y={counterPos[1]} />}
        </div>
      </div>

      {fx.has('window-blinds') && <WindowBlinds W={W} H={H} u={u} />}
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 48%, rgba(8,3,16,0) 50%, rgba(8,3,16,${vig}) 100%)`}} />
      {grain > 0 && <div style={{position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundPosition: `${(frame * 37) % 240}px ${(frame * 91) % 240}px`, mixBlendMode: 'overlay', opacity: grain * 0.22}} />}

      {shot.title && <TitleCard spec={shot.title} {...common} />}
      {shot.caption && <Caption text={shot.caption} {...common} />}
      {shot.badge && <TimeBadge spec={shot.badge} {...common} />}
    </AbsoluteFill>
  );
};
