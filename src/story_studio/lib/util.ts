export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
/** progress 0..1 of `frame` inside [start, start+dur] */
export const prog = (frame: number, start: number, dur: number) => clamp((frame - start) / Math.max(1, dur));

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/** deterministic PRNG (never use Math.random in a Remotion composition) */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- colour helpers -------------------------------------------------------
const h2r = (h: string): [number, number, number] => {
  const x = h.replace('#', '');
  const n = x.length === 3 ? x.split('').map((c) => c + c).join('') : x;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
};
const r2h = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export const mixHex = (a: string, b: string, t: number) => {
  const A = h2r(a), B = h2r(b);
  return r2h(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
};
export const lighten = (c: string, t: number) => mixHex(c, '#ffffff', t);
export const darken = (c: string, t: number) => mixHex(c, '#000000', t);
export const rgba = (c: string, a: number) => {
  const [r, g, b] = h2r(c);
  return `rgba(${r},${g},${b},${a})`;
};
