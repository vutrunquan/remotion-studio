import React from 'react';
import type {CharacterSpec, EmoteName, Keyed, PoseName} from '../types';
import {C, GRADES} from '../theme';
import {clamp, easeInOut, hashStr, lighten, darken, lerp} from '../lib/util';
import {G, POSES, PoseVals, Rig, lerpPose, solveRig} from './poses';
import {Outfit, PRESETS} from './presets';
import {Face} from './Face';

export type ResolvedChar = CharacterSpec & {x: number; y: number; scale: number};

const SW = 5.2; // outline half-thickness (limbs get 2x this on top of their width)

// ---- time tracks ------------------------------------------------------------
function trackAt<T>(v: T | Keyed<T>[] | undefined, t: number, def: T): {cur: T; prev: T; since: number} {
  if (v === undefined) return {cur: def, prev: def, since: 99};
  if (!Array.isArray(v)) return {cur: v as T, prev: v as T, since: 99};
  const keys = [...v].sort((a, b) => a.at - b.at);
  let i = 0;
  for (let k = 0; k < keys.length; k++) if (keys[k].at <= t) i = k;
  const prev = keys[Math.max(0, i - 1)].v;
  return {cur: keys[i].v, prev, since: t - keys[i].at};
}

export function poseAt(spec: ResolvedChar, t: number): PoseVals {
  const {cur, prev, since} = trackAt<PoseName>(spec.pose, t, 'stand');
  const b = easeInOut(clamp(since / 0.4));
  const base = lerpPose(POSES[prev] ?? POSES.stand, POSES[cur] ?? POSES.stand, b);
  const walking = cur === 'walk';
  if (walking) {
    const sw = Math.sin(t * Math.PI * 2 * 1.7);
    const w = POSES.walk;
    return {
      ...w, hy: -Math.abs(sw) * 3,
      lL: [sw * 28, Math.max(0, -sw) * 30], lR: [-sw * 28, Math.max(0, sw) * 30],
      aL: [-sw * 24, 8], aR: [sw * 24, 8],
    };
  }
  // gentle breathing / head bob on every pose
  const idle = Math.sin(t * 2.1 + hashStr(spec.id) % 7);
  return {...base, hy: base.hy + idle * 1.1, torso: base.torso + idle * 0.35};
}

export function emoteAt(spec: ResolvedChar, t: number): EmoteName {
  return trackAt<EmoteName>(spec.emote, t, 'neutral').cur;
}

/** local rig point -> world coordinates */
export function toWorld(spec: ResolvedChar, rig: Rig, p: [number, number]): [number, number] {
  const a = ((spec.rotate ?? 0) * Math.PI) / 180;
  const dx = p[0], dy = p[1] - rig.hip[1];
  const rx = dx * Math.cos(a) - dy * Math.sin(a);
  const ry = dx * Math.sin(a) + dy * Math.cos(a) + rig.hip[1];
  const sx = spec.scale * (spec.flip ? -1 : 1);
  return [spec.x + rx * sx, spec.y + ry * spec.scale];
}

export function charPoints(spec: ResolvedChar, t: number) {
  const rig = solveRig(poseAt(spec, t));
  return {
    head: toWorld(spec, rig, rig.head),
    hand: toWorld(spec, rig, rig.armR.e),
    feet: toWorld(spec, rig, [0, 0]),
    body: toWorld(spec, rig, [0, rig.hip[1] - G.torso * 0.5]),
    top: toWorld(spec, rig, [rig.head[0], rig.head[1] - G.R]),
  };
}

// ---- drawing helpers -------------------------------------------------------
const line = (a: [number, number], b: [number, number]) => `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`;

const Limb: React.FC<{pts: [number, number][]; w: number; fill: string; hi?: string}> = ({pts, w, fill, hi}) => {
  const d = pts.map((p, i) => (i ? 'L' : 'M') + ` ${p[0]} ${p[1]}`).join(' ');
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={d} stroke={C.ink} strokeWidth={w + SW * 2} />
      <path d={d} stroke={fill} strokeWidth={w} />
      {hi && pts.length > 1 && pts.slice(0, -1).map((p, i) => {
        const q = pts[i + 1];
        const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len; // normal
        const o = -w * 0.22;
        const a: [number, number] = [p[0] + dx * 0.18 + nx * o, p[1] + dy * 0.18 + ny * o];
        const b: [number, number] = [p[0] + dx * 0.72 + nx * o, p[1] + dy * 0.72 + ny * o];
        return <path key={i} d={line(a, b)} stroke={hi} strokeWidth={w * 0.2} opacity={0.55} />;
      })}
    </g>
  );
};

const Hand: React.FC<{p: [number, number]; skin: string}> = ({p, skin}) => (
  <circle cx={p[0]} cy={p[1]} r={10.5} fill={skin} stroke={C.ink} strokeWidth={4} />
);

const Shoe: React.FC<{p: [number, number]; color: string; dirDeg: number}> = ({p, color, dirDeg}) => (
  <g transform={`translate(${p[0]} ${p[1]}) rotate(${dirDeg})`}>
    <ellipse cx={9} cy={-2} rx={20} ry={10.5} fill={color} stroke={C.ink} strokeWidth={4.4} />
    <path d="M -6 3 L 26 3" stroke={C.ink} strokeWidth={2.4} opacity={0.45} strokeLinecap="round" />
  </g>
);

function Torso({o, tw, uid}: {o: Outfit; tw: number; uid: string}) {
  const T = G.torso;
  const hi = lighten(o.top, 0.4);
  return (
    <g>
      <rect x={-tw} y={-T} width={tw * 2} height={T + 6} rx={26} fill={o.top} stroke={C.ink} strokeWidth={SW + 0.4} strokeLinejoin="round" />
      <path d={`M ${-tw + 9} ${-T + 24} L ${-tw + 9} ${-14}`} stroke={hi} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
      {o.kind === 'hoodie' && (<>
        <path d={`M ${-24} ${-T + 4} Q 0 ${-T + 30} 24 ${-T + 4} Q 0 ${-T - 8} ${-24} ${-T + 4} Z`} fill={o.top2} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <path d={`M -9 ${-T + 24} L -9 ${-T + 52} M 9 ${-T + 24} L 9 ${-T + 52}`} stroke="#f6ead9" strokeWidth={2.6} strokeLinecap="round" />
        <circle cx={-9} cy={-T + 54} r={3} fill="#f6ead9" stroke={C.ink} strokeWidth={1.6} /><circle cx={9} cy={-T + 54} r={3} fill="#f6ead9" stroke={C.ink} strokeWidth={1.6} />
        <path d={`M ${-tw + 14} ${-44} L ${tw - 14} ${-44} L ${tw - 8} ${-12} L ${-tw + 8} ${-12} Z`} fill={darken(o.top, 0.08)} stroke={C.ink} strokeWidth={3.6} strokeLinejoin="round" />
      </>)}
      {o.kind === 'puffer' && (<>
        <rect x={-18} y={-T - 8} width={36} height={22} rx={10} fill={o.top2} stroke={C.ink} strokeWidth={4} />
        <path d={`M 0 ${-T + 12} L 0 4`} stroke={C.ink} strokeWidth={3.2} />
        {[-62, -36, -10].map((y) => <path key={y} d={`M ${-tw + 4} ${y} Q 0 ${y + 5} ${tw - 4} ${y}`} stroke={darken(o.top, 0.25)} strokeWidth={3} fill="none" strokeLinecap="round" />)}
      </>)}
      {o.kind === 'blazer' && (<>
        <path d={`M -16 ${-T + 2} L 0 ${-T + 44} L 16 ${-T + 2} Z`} fill={o.top2} stroke={C.ink} strokeWidth={3.4} strokeLinejoin="round" />
        <path d={`M -22 ${-T + 6} L -4 ${-T + 52} M 22 ${-T + 6} L 4 ${-T + 52}`} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
      </>)}
      {o.kind === 'jacket' && (<>
        <path d={`M -16 ${-T + 2} L 0 ${-T + 30} L 16 ${-T + 2}`} fill="none" stroke={C.ink} strokeWidth={3.4} strokeLinejoin="round" />
        <path d={`M 0 ${-T + 30} L 0 4`} stroke={C.ink} strokeWidth={3} />
      </>)}
    </g>
  );
}

function HairBack({o, R}: {o: Outfit; R: number}) {
  if (o.headgear !== 'bob') return null;
  return <path d={`M ${-R - 8} ${R - 4} L ${-R - 8} 6 C ${-R - 12} ${-R - 16} ${R + 12} ${-R - 16} ${R + 8} 6 L ${R + 8} ${R - 4} Q 0 ${R + 12} ${-R - 8} ${R - 4} Z`}
    fill={o.hair} stroke={C.ink} strokeWidth={SW} strokeLinejoin="round" />;
}

function HairFront({o, R, uid, back}: {o: Outfit; R: number; uid: string; back: boolean}) {
  const clip = `url(#clip-${uid})`;
  switch (o.headgear) {
    case 'beanie':
    case 'cap': {
      const cuff = lighten(o.hat, 0.12);
      return (
        <g>
          <g clipPath={clip}>
            <rect x={-R - 6} y={-R - 6} width={R * 2 + 12} height={R - 6} fill={o.hat} />
            <path d={`M ${-R - 6} -30 Q 0 -22 ${R + 6} -30 L ${R + 6} -12 Q 0 -4 ${-R - 6} -12 Z`} fill={cuff} stroke={C.ink} strokeWidth={3.6} strokeLinejoin="round" />
            {[-40, -26, -12, 2, 16, 30, 44].map((x) => <path key={x} d={`M ${x} -28 L ${x} -10`} stroke={darken(o.hat, 0.3)} strokeWidth={2.2} opacity={0.7} />)}
          </g>
          {o.headgear === 'beanie' && <circle cx={0} cy={-R - 7} r={11} fill={lighten(o.hat, 0.1)} stroke={C.ink} strokeWidth={4} />}
        </g>
      );
    }
    case 'curl':
      return <path d={`M -2 ${-R + 1} C -4 ${-R - 16} 16 ${-R - 20} 14 ${-R - 8} C 12 ${-R - 1} 2 ${-R - 3} 5 ${-R - 9}`} fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />;
    case 'short':
      return (
        <g clipPath={clip}>
          <rect x={-R - 6} y={-R - 6} width={R * 2 + 12} height={R - 14} fill={back ? o.hair : o.hair} />
          {back && <rect x={-R - 6} y={-R - 6} width={R * 2 + 12} height={R * 2 + 12} fill={o.hair} />}
        </g>
      );
    case 'bob':
      return (
        <g>
          <g clipPath={clip}>
            {back
              ? <rect x={-R - 6} y={-R - 6} width={R * 2 + 12} height={R * 2 + 12} fill={o.hair} />
              : <>
                <path d={`M ${-R - 6} 6 L ${-R - 6} ${-R - 6} L ${R + 6} ${-R - 6} L ${R + 6} 6 Q ${R * 0.6} -20 0 -26 Q ${-R * 0.6} -20 ${-R - 6} 6 Z`} fill={o.hair} />
                <path d={`M ${-R - 6} 0 Q ${-R + 12} 14 ${-R + 16} ${R * 0.62} L ${-R - 6} ${R * 0.62} Z`} fill={o.hair} />
                <path d={`M ${R + 6} 0 Q ${R - 12} 14 ${R - 16} ${R * 0.62} L ${R + 6} ${R * 0.62} Z`} fill={o.hair} />
                <path d={`M ${-R + 2} 2 Q ${-R * 0.55} -22 0 -27 Q ${R * 0.55} -22 ${R - 2} 2`} fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
                <path d={`M ${-R * 0.85} ${-R * 0.55} Q 0 ${-R * 1.05} ${R * 0.85} ${-R * 0.55}`} fill="none" stroke="#2a1530" strokeWidth={8} strokeLinecap="round" />
              </>}
          </g>
        </g>
      );
    default: return null;
  }
}

function Prop({kind, p, angle}: {kind: string; p: [number, number]; angle: number}) {
  if (kind === 'cup') return (
    <g transform={`translate(${p[0]} ${p[1] - 10}) rotate(${angle * 0.15})`}>
      <path d="M -13 -18 L 13 -18 L 10 18 L -10 18 Z" fill="#e2c4a0" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <rect x={-15} y={-24} width={30} height={9} rx={3} fill="#9a6a4a" stroke={C.ink} strokeWidth={3.4} />
      <path d="M -12 -4 L 12 -4 L 11 7 L -11 7 Z" fill="#c79c78" opacity={0.9} />
    </g>);
  if (kind === 'box') return (
    <g transform={`translate(${p[0]} ${p[1] - 8}) rotate(${angle * 0.1})`}>
      <path d="M -17 -14 L 17 -14 L 12 16 L -12 16 Z" fill="#ece3da" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M -17 -14 L 0 -22 L 17 -14" fill="#d8cdc3" stroke={C.ink} strokeWidth={3.4} strokeLinejoin="round" />
      <path d="M 6 -26 L 20 -40" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    </g>);
  if (kind === 'phone') return (
    <g transform={`translate(${p[0] + 4} ${p[1] - 12}) rotate(${angle * 0.1 - 10})`}>
      <rect x={-9} y={-17} width={18} height={32} rx={4} fill="#242238" stroke={C.ink} strokeWidth={3.4} />
      <rect x={-6} y={-13} width={12} height={22} rx={2} fill="#9fd0ff" opacity={0.85} />
    </g>);
  if (kind === 'umbrella') return (
    <g transform={`translate(${p[0] + 6} ${p[1] - 40}) rotate(${angle * 0.1 - 15})`}>
      {/* Closed umbrella shaft */}
      <line x1={0} y1={-30} x2={0} y2={60} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      {/* Umbrella canopy folded */}
      <path d="M -8 -15 Q 0 -35 8 -15 L 4 35 L -4 35 Z" fill="#2d3748" stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
      {/* J handle */}
      <path d="M 0 60 Q 0 74 -10 74 Q -18 74 -18 64" fill="none" stroke="#795548" strokeWidth={4} strokeLinecap="round" />
    </g>);
  if (kind === 'envelope' || kind === 'letter') return (
    <g transform={`translate(${p[0]} ${p[1] - 10}) rotate(${angle * 0.1 + 8})`}>
      <rect x={-18} y={-12} width={36} height={24} rx={2} fill="#eed9c4" stroke={C.ink} strokeWidth={3.4} />
      <polygon points="-18,-12 0,2 18,-12" fill="#e0c4a8" stroke={C.ink} strokeWidth={2.6} strokeLinejoin="round" />
      <circle cx={0} cy={1} r={4} fill="#b91c1c" />
    </g>);
  if (kind === 'book') return (
    <g transform={`translate(${p[0]} ${p[1] - 10}) rotate(${angle * 0.1})`}>
      <rect x={-15} y={-20} width={30} height={40} rx={3} fill="#1e3a5f" stroke={C.ink} strokeWidth={3.5} />
      <line x1={-10} y1={-20} x2={-10} y2={20} stroke="#cbd5e1" strokeWidth={2} />
      <line x1={-5} y1={-12} x2={8} y2={-12} stroke="#f8fafc" strokeWidth={2} />
      <line x1={-5} y1={-4} x2={8} y2={-4} stroke="#f8fafc" strokeWidth={2} />
    </g>);
  return null;
}

// ---- main component ----------------------------------------------------------
export const Character: React.FC<{
  spec: ResolvedChar; frame: number; fps: number; headColor: string; camScale: number;
}> = ({spec, frame, fps, headColor, camScale}) => {
  const t = frame / fps;
  const base = PRESETS[spec.preset] ?? PRESETS.hoodie;
  const o: Outfit = {
    ...base,
    ...(spec.colors?.top && {top: spec.colors.top}), ...(spec.colors?.top2 && {top2: spec.colors.top2}),
    ...(spec.colors?.pants && {pants: spec.colors.pants}), ...(spec.colors?.shoe && {shoe: spec.colors.shoe}),
    ...(spec.colors?.hair && {hair: spec.colors.hair}), ...(spec.colors?.hat && {hat: spec.colors.hat}),
  };
  const skin = spec.colors?.skin ?? headColor;
  const uid = spec.id.replace(/[^a-z0-9]/gi, '') + '-' + (hashStr(spec.id) % 997);
  const pose = poseAt(spec, t);
  const rig = solveRig(pose);
  const view = spec.view ?? (pose.sx < 20 ? 'side' : 'front');
  const isBack = view === 'back' || (spec.pose === 'back');
  const faceView: 'front' | 'side' = view === 'side' ? 'side' : 'front';
  const emote = emoteAt(spec, t);
  const blink = (frame + (hashStr(spec.id) % 70)) % 96 < 4;
  const R = G.R;

  // movement
  const mt = clamp(t / 1); // moveTo handled by the stage (x,y already interpolated)
  void mt;
  const fade = spec.fadeIn ? clamp(t / spec.fadeIn) : 1;
  const glow = spec.glow ?? 0;
  const rim = 0.55 + glow * 0.45;
  const filters: string[] = [];
  if (glow > 0) filters.push(`drop-shadow(0px 0px ${10 + glow * 22}px rgba(255,172,90,${0.3 + glow * 0.5}))`);
  if (spec.blur) filters.push(`blur(${spec.blur / Math.max(0.2, camScale * spec.scale)}px)`);

  const sx = spec.scale * (spec.flip ? -1 : 1);
  const hipY = rig.hip[1];

  const legL = rig.legL, legR = rig.legR;
  const footDir = (l: typeof legL) => {
    // direction of the shin decides foot direction: mostly forward
    return l.e[1] > l.k[1] + 20 ? 0 : 0;
  };

  return (
    <g
      transform={`translate(${spec.x} ${spec.y}) scale(${sx} ${spec.scale}) rotate(${spec.rotate ?? 0} 0 ${hipY})`}
      opacity={fade * (spec.fadeIn ? 1 : 1)}
      style={filters.length ? {filter: filters.join(' ')} : undefined}
    >
      <defs>
        <clipPath id={`clip-${uid}`}><circle cx={0} cy={0} r={R} /></clipPath>
        <radialGradient id={`hg-${uid}`} cx="38%" cy="32%" r="80%">
          <stop offset="0%" stopColor={lighten(skin, 0.35)} />
          <stop offset="60%" stopColor={skin} />
          <stop offset="100%" stopColor={darken(skin, 0.14)} />
        </radialGradient>
      </defs>

      {/* legs */}
      <Limb pts={[legL.s, legL.k, legL.e]} w={27} fill={darken(o.pants, 0.12)} />
      <Shoe p={legL.e} color={o.shoe} dirDeg={footDir(legL)} />
      <Limb pts={[legR.s, legR.k, legR.e]} w={27} fill={o.pants} hi={lighten(o.pants, 0.35)} />
      <Shoe p={legR.e} color={o.shoe} dirDeg={footDir(legR)} />

      {/* far arm */}
      <Limb pts={[rig.armL.s, rig.armL.k, rig.armL.e]} w={22} fill={darken(o.top, 0.1)} hi={lighten(o.top, 0.4)} />
      <Hand p={rig.armL.e} skin={skin} />

      {/* torso */}
      <g transform={`translate(${rig.hip[0]} ${rig.hip[1]}) rotate(${pose.torso})`}>
        <Torso o={o} tw={pose.tw} uid={uid} />
      </g>

      {/* neck */}
      <rect x={rig.neck[0] - 8 + pose.hx * 0.5} y={rig.neck[1] - 16} width={16} height={20} rx={3} fill={C.neck} stroke={C.ink} strokeWidth={4} />

      {/* near arm + prop */}
      <Limb pts={[rig.armR.s, rig.armR.k, rig.armR.e]} w={22} fill={o.top} hi={lighten(o.top, 0.4)} />
      {spec.prop && spec.prop !== 'none' && <Prop kind={spec.prop} p={rig.armR.e} angle={pose.aR[0]} />}
      <Hand p={rig.armR.e} skin={skin} />

      {/* head */}
      <g transform={`translate(${rig.head[0]} ${rig.head[1]}) rotate(${pose.head})`}>
        <HairBack o={o} R={R} />
        <circle r={R} fill={`url(#hg-${uid})`} stroke={C.ink} strokeWidth={SW + 0.6} />
        {!isBack && <Face emote={emote} blink={blink} look={spec.look ?? 0} view={faceView} />}
        <HairFront o={o} R={R} uid={uid} back={isBack} />
        {/* warm rim light, left/top edge */}
        <path d={`M ${-R * 0.95} ${-R * 0.34} A ${R + 3.5} ${R + 3.5} 0 0 1 ${-R * 0.34} ${-R * 0.95}`} fill="none" stroke="#f7b45e" strokeWidth={3} strokeLinecap="round" opacity={rim} transform="translate(-1.5 -1.5)" />
      </g>
    </g>
  );
};
