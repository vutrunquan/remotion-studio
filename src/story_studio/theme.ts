// Palette + type tokens measured from the reference video (see references/style-bible.md)
export const WORLD_W = 1920;
export const WORLD_H = 1080;

export const C = {
  ink: '#1c1430',          // thick outline of everything
  head: '#f1e7ee',         // warm interior head
  headDusk: '#eedfd4',
  headNight: '#c2c4e1',
  neck: '#cdc8de',
  cream: '#f6ead9',        // all UI text
  creamDim: '#e6d6d6',
  peach: '#f0a868',        // arrow / accent in title card
  red: '#d41f45',          // counter stamp
  blush: '#ee8f9a',
  // character outfits
  mustard: '#dfa749', rosePink: '#d77483', olive: '#8a9a3c', crimson: '#a8314f',
  auburn: '#b5562e', jeans: '#4f5f9c', teal: '#3f9a96', charcoal: '#4b4a5c', brown: '#6b3a2c',
  // world
  aubergine: '#301627', plum: '#4a293a', mauve: '#815a67', dust: '#c39d85',
  indigo: '#1b1430', nightBlue: '#2e1e3d', nightSlate: '#322d50',
  lampGlow: '#ffb866',
};

export const FONT = "'Montserrat', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

export interface Grade {
  /** multiply layer over everything */
  tint: string; tintOpacity: number;
  /** screen layer (haze / ambient glow) */
  haze: string; hazeOpacity: number;
  vignette: number;
  saturate: number; brightness: number;
  /** head colour used by characters in this grade */
  head: string;
}

export const GRADES: Record<string, Grade> = {
  none:          {tint: '#ffffff', tintOpacity: 0,    haze: '#000000', hazeOpacity: 0,    vignette: 0.25, saturate: 1,    brightness: 1,    head: C.head},
  dusk:          {tint: '#b88aa6', tintOpacity: 0.72, haze: '#8a4f7c', hazeOpacity: 0.12, vignette: 0.6,  saturate: 1.08, brightness: 0.93, head: C.headDusk},
  warm:          {tint: '#a97788', tintOpacity: 0.66, haze: '#a55a45', hazeOpacity: 0.08, vignette: 0.7,  saturate: 1.05, brightness: 0.88, head: C.head},
  'night-room':  {tint: '#5a4a8c', tintOpacity: 0.74, haze: '#2a2060', hazeOpacity: 0.16, vignette: 0.74, saturate: 0.95, brightness: 0.86, head: '#d3d0ea'},
  'night-street':{tint: '#40407f', tintOpacity: 0.76, haze: '#1a1860', hazeOpacity: 0.16, vignette: 0.74, saturate: 0.95, brightness: 0.9,  head: '#cfd0ee'},
  dim:           {tint: '#2c2250', tintOpacity: 0.80, haze: '#120d2a', hazeOpacity: 0.22, vignette: 0.8,  saturate: 0.92, brightness: 0.82, head: '#b4b3dc'},
};
