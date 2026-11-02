import type {CameraSpec, ShotSize} from '../types';
import {WORLD_H, WORLD_W} from '../theme';
import {clamp, easeInOut, lerp} from './util';

export const SIZE_ZOOM: Record<ShotSize, number> = {wide: 1, medium: 1.75, close: 2.9, xclose: 4.8};
/** default depth-of-field blur (screen px at 1080p) per shot size: the reference blurs backgrounds on every close-up */
export const SIZE_BLUR: Record<ShotSize, number> = {wide: 0, medium: 2.5, close: 7, xclose: 11};
/** slow default push-in over the shot (reference never holds a static frame) */
const SIZE_PUSH: Record<ShotSize, number> = {wide: 0.04, medium: 0.07, close: 0.07, xclose: 0.05};

export interface CamState {
  scale: number;       // world -> screen scale
  tx: number; ty: number;
  roll: number;
  blur: number;        // screen px
  zoom: number;
}

export function cameraState(
  cam: CameraSpec | undefined, p: number, focus: [number, number], W: number, H: number, u: number,
): CamState {
  const size: ShotSize = cam?.shot ?? 'wide';
  // portrait/square frames are narrower: pull non-wide shots back so subjects keep similar screen proportions
  const narrow = W / H < 1 ? 0.74 : W / H < 1.5 ? 0.88 : 1;
  const z0 = cam?.zoom ?? SIZE_ZOOM[size] * (size === 'wide' ? 1 : narrow);
  const z1 = cam?.zoomTo ?? z0 * (1 + SIZE_PUSH[size]);
  const e = easeInOut(clamp(p));
  const zoom = lerp(z0, z1, cam?.zoomTo !== undefined ? e : p);
  const roll0 = cam?.roll ?? 0;
  const roll = lerp(roll0, cam?.rollTo ?? roll0, e);
  const b0 = cam?.blur ?? SIZE_BLUR[size];
  const blur = lerp(b0, cam?.blurTo ?? b0, e) * u;

  const cover = Math.max(W / WORLD_W, H / WORLD_H);
  const extra = 1 + Math.abs(roll) * 0.02;
  const scale = cover * zoom * extra;
  const pan = cam?.pan ?? [0, 0];
  let tx = W / 2 - (focus[0] + pan[0] * p) * scale;
  let ty = H / 2 - (focus[1] + pan[1] * p) * scale;
  if (!roll) {
    tx = clamp(tx, W - WORLD_W * scale, 0);
    ty = clamp(ty, H - WORLD_H * scale, 0);
  }
  return {scale, tx, ty, roll, blur, zoom};
}
