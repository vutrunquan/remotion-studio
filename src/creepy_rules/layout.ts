import {REF} from './theme';

export type Layout = {
  W: number; H: number; portrait: boolean;
  s: number; tx: number; ty: number; // biến đổi từ toạ độ ref sang pixel: translate(tx ty) scale(s)
  captionY: number; captionSize: number; captionMaxW: number;
  hudFont: number; hudPadX: number; hudPadY: number;
};

export function makeLayout(W: number, H: number): Layout {
  const portrait = H > W * 1.1;
  const square = !portrait && Math.abs(W - H) < W * 0.1;
  let s: number, cx: number, cy: number;
  if (portrait) { s = W / 1000; cx = W / 2; cy = H * 0.4; }
  else if (square) { s = W / 1100; cx = W / 2; cy = H * 0.45; }
  else { s = W / 1200; cx = W / 2; cy = H / 2; }
  return {
    W, H, portrait, s,
    tx: cx - REF.cx * s,
    ty: cy - REF.cy * s,
    captionY: portrait ? H * 0.745 : square ? H * 0.9 : H * 0.885,
    captionSize: portrait ? W * 0.056 : square ? W * 0.05 : H * 0.042,
    captionMaxW: portrait ? W * 0.88 : square ? W * 0.84 : W * 0.74,
    hudFont: portrait ? W * 0.026 : Math.min(W, H * 1.78) * 0.0118,
    hudPadX: W * (portrait ? 0.04 : 0.016),
    hudPadY: H * (portrait ? 0.03 : 0.028),
  };
}
