// ---------------------------------------------------------------------------
// Data model. A video = { meta, shots[] }. Everything is plain JSON so a script
// of ANY length can be converted into shots and rendered without touching code.
// ---------------------------------------------------------------------------

export type ShotSize = 'wide' | 'medium' | 'close' | 'xclose';

export type EmoteName =
  | 'neutral' | 'happy' | 'content' | 'tired' | 'sleepy' | 'worried'
  | 'surprised' | 'smirk' | 'sad' | 'angry' | 'closed';

export type PoseName =
  | 'stand' | 'sit' | 'slump' | 'hold' | 'scratch' | 'wave' | 'lean'
  | 'walk' | 'kneel' | 'back';

export type PropName = 'none' | 'cup' | 'box' | 'phone' | 'umbrella' | 'envelope' | 'letter' | 'book';

/** Value that changes over the shot. `at` is seconds from the start of the shot. */
export interface Keyed<T> { at: number; v: T }

export interface CharacterSpec {
  id: string;
  /** hoodie | beanie | pink | suit | teal  (see characters/presets.ts) */
  preset: string;
  colors?: Partial<{top: string; top2: string; pants: string; hair: string; hat: string; shoe: string; skin: string}>;
  /** Named anchor of the set (e.g. "sofaL", "bench1"). Sets x, y and a default pose. */
  at?: string;
  x?: number; y?: number;
  moveTo?: {x?: number; y?: number};
  scale?: number;
  flip?: boolean;
  view?: 'front' | 'side' | 'back';
  pose?: PoseName | Keyed<PoseName>[];
  emote?: EmoteName | Keyed<EmoteName>[];
  prop?: PropName;
  /** degrees, rotates the whole body around the hips (lying, falling, tilting) */
  rotate?: number;
  /** 0..1 warm rim glow around the character (the "lit from a lamp" close-ups) */
  glow?: number;
  /** extra CSS blur in screen px (out-of-focus character) */
  blur?: number;
  /** seconds, character ghosts in */
  fadeIn?: number;
  /** -1..1 where the eyes look */
  look?: number;
}

export interface CameraSpec {
  /** default zoom for the size: wide 1, medium 1.7, close 2.9, xclose 4.8 */
  shot?: ShotSize;
  zoom?: number;
  /** end zoom (slow push-in / pull-out). Omit for a gentle default push */
  zoomTo?: number;
  /** "center" | characterId | "characterId.head|hand|feet" | [x,y] in world px (1920x1080) */
  focus?: string | [number, number];
  /** world px the camera drifts by over the shot */
  pan?: [number, number];
  /** dutch angle in degrees, and end angle */
  roll?: number;
  rollTo?: number;
  /** depth-of-field blur on the background, screen px. Default by shot size */
  blur?: number;
  blurTo?: number;
}

export interface TitleSpec {
  /** lines; a line starting with "->" gets the accent arrow */
  lines: string[];
  at?: number;       // s from shot start (default 0.15)
  hold?: number;     // s visible (default: until the shot ends)
  pos?: 'right' | 'center' | 'left' | 'bottom';
}

export interface BadgeSpec { text: string; at?: number; hold?: number; pos?: 'tl' | 'tr' }

export interface CounterSpec {
  value: number | string;
  from?: number;           // count up from this value
  countSec?: number;       // count-up duration (default 1.2)
  at?: number;
  /** character id to float above, or [x,y] world px */
  above?: string | [number, number];
}

export type FxName = 'dust' | 'sparkles' | 'window-blinds' | 'light-shafts' | 'heavy-vignette' | 'no-grain';
export type TransitionName = 'cut' | 'black' | 'blinds' | 'dissolve';

export interface Shot {
  id: string;
  durationSec: number;
  set: string;                       // see sets/index.tsx
  setOptions?: {lamp?: boolean; clock?: string; takeout?: boolean};
  grade?: string;                    // dusk | warm | night-room | night-street | dim | none
  camera?: CameraSpec;
  characters?: CharacterSpec[];
  title?: TitleSpec;
  caption?: string;
  badge?: BadgeSpec;
  counter?: CounterSpec;
  fx?: FxName[];
  /** transition between the previous shot and this one */
  transition?: TransitionName;
  transitionSec?: number;            // total length, centred on the cut (default 0.7)
  narration?: {text: string; audio?: string; offsetSec?: number};
  sfx?: {at?: number; file: string; volume?: number}[];
  notes?: string;
}

export interface StoryMeta {
  title?: string;
  aspect?: '16:9' | '9:16' | '1:1';
  resolution?: '720p' | '1080p' | '4k';
  fps?: number;
  lang?: string;
  /** file inside public/, e.g. "audio/music.mp3" */
  music?: string;
  musicVolume?: number;     // 0..1, default 0.22
  duckTo?: number;          // music multiplier under narration, default 0.45
  voiceVolume?: number;     // default 1
  grain?: number;           // 0..1 default 0.35
  letterbox?: number;       // 0..0.15 cinematic bars, default 0
}

export type StoryProps = {meta: StoryMeta; shots: Shot[]};
