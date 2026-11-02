import type {PoseName} from '../types';
import {lerp} from '../lib/util';

/** Body proportions: a big ball head on a simple jointed body (units, scaled by spec.scale). */
export const G = {thigh: 66, shin: 66, upper: 48, fore: 46, torso: 108, neck: 3, R: 62};

/**
 * Angles in degrees. 0 = limb points straight down, +90 = points forward (+x), +180 = straight up.
 * Upper limb angles are absolute, lower limb angles are RELATIVE to the upper limb.
 */
export interface PoseVals {
  torso: number;               // lean (+ = forward)
  head: number;                // head tilt
  hx: number; hy: number;      // head offset
  lL: [number, number]; lR: [number, number];
  aL: [number, number]; aR: [number, number];
  sx: number; hw: number; tw: number;   // shoulder / hip / torso half-widths
}

const P = (v: Partial<PoseVals>): PoseVals => ({
  torso: 0, head: 0, hx: 0, hy: 0,
  lL: [0, 0], lR: [0, 0], aL: [0, 0], aR: [0, 0],
  sx: 30, hw: 15, tw: 37, ...v,
});

export const POSES: Record<PoseName, PoseVals> = {
  stand:   P({lL: [3, 0], lR: [-3, 0], aL: [-5, -3], aR: [7, 5]}),
  back:    P({lL: [3, 0], lR: [-3, 0], aL: [-4, 0], aR: [4, 0]}),
  wave:    P({lL: [3, 0], lR: [-3, 0], aL: [-5, -3], aR: [150, 25]}),
  walk:    P({lL: [0, 0], lR: [0, 0], aL: [0, 6], aR: [0, 6], torso: 4}),   // animated in code
  sit:     P({lL: [86, -86], lR: [90, -90], aL: [18, 70], aR: [26, 64], sx: 15, hw: 5, tw: 33}),
  slump:   P({torso: 20, head: 10, hy: 7, hx: 6, lL: [84, -84], lR: [90, -90], aL: [28, 28], aR: [40, 32], sx: 15, hw: 5, tw: 33}),
  hold:    P({torso: 3, lL: [86, -86], lR: [90, -90], aL: [16, 66], aR: [30, 108], sx: 15, hw: 5, tw: 33}),
  scratch: P({torso: 2, head: 8, lL: [86, -86], lR: [90, -90], aL: [16, 62], aR: [158, 14], sx: 15, hw: 5, tw: 33}),
  lean:    P({torso: 5, head: -15, hx: -6, lL: [86, -86], lR: [90, -90], aL: [18, 70], aR: [26, 64], sx: 15, hw: 5, tw: 33}),
  kneel:   P({lL: [0, -92], lR: [84, -84], aL: [-8, 10], aR: [20, 40], sx: 17, hw: 8, tw: 34}),
};

export function lerpPose(a: PoseVals, b: PoseVals, t: number): PoseVals {
  const l2 = (x: [number, number], y: [number, number]): [number, number] => [lerp(x[0], y[0], t), lerp(x[1], y[1], t)];
  return {
    torso: lerp(a.torso, b.torso, t), head: lerp(a.head, b.head, t),
    hx: lerp(a.hx, b.hx, t), hy: lerp(a.hy, b.hy, t),
    lL: l2(a.lL, b.lL), lR: l2(a.lR, b.lR), aL: l2(a.aL, b.aL), aR: l2(a.aR, b.aR),
    sx: lerp(a.sx, b.sx, t), hw: lerp(a.hw, b.hw, t), tw: lerp(a.tw, b.tw, t),
  };
}

type V2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const dir = (deg: number): V2 => [Math.sin(rad(deg)), Math.cos(rad(deg))];
const rot = (v: V2, deg: number): V2 => {
  const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
};
const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const mul = (a: V2, k: number): V2 => [a[0] * k, a[1] * k];

function chain(start: V2, a1: number, a2: number, l1: number, l2: number) {
  const k = add(start, mul(dir(a1), l1));
  const e = add(k, mul(dir(a1 + a2), l2));
  return {k, e};
}

export interface Rig {
  hip: V2; neck: V2; head: V2;
  shL: V2; shR: V2;
  legL: {s: V2; k: V2; e: V2}; legR: {s: V2; k: V2; e: V2};
  armL: {s: V2; k: V2; e: V2}; armR: {s: V2; k: V2; e: V2};
}

/** Forward kinematics in local space (origin = floor under the body centre, y down). */
export function solveRig(p: PoseVals): Rig {
  const ext = (l: [number, number]) => G.thigh * Math.cos(rad(l[0])) + G.shin * Math.cos(rad(l[0] + l[1]));
  const hip: V2 = [0, -Math.max(ext(p.lL), ext(p.lR))];
  const hipL: V2 = [-p.hw, hip[1]], hipR: V2 = [p.hw, hip[1]];
  const legL = {s: hipL, ...chain(hipL, p.lL[0], p.lL[1], G.thigh, G.shin)};
  const legR = {s: hipR, ...chain(hipR, p.lR[0], p.lR[1], G.thigh, G.shin)};
  const neck = add(hip, rot([0, -G.torso], p.torso));
  const shL = add(neck, rot([-p.sx, 12], p.torso));
  const shR = add(neck, rot([p.sx, 12], p.torso));
  const armL = {s: shL, ...chain(shL, p.aL[0], p.aL[1], G.upper, G.fore)};
  const armR = {s: shR, ...chain(shR, p.aR[0], p.aR[1], G.upper, G.fore)};
  const head = add(add(neck, rot([0, -(G.neck + G.R)], p.torso * 0.4)), [p.hx, p.hy]);
  return {hip, neck, head, shL, shR, legL, legR, armL, armR};
}
