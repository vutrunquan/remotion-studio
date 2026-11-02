import type React from 'react';
import type {PoseName} from '../types';

export interface Light {x: number; y: number; r: number; color: string; opacity: number}
export interface SetOptions {lamp?: boolean; clock?: string; takeout?: boolean}
export interface Anchor {x: number; y: number; pose?: PoseName; scale?: number; flip?: boolean}

export interface SetDef {
  Component: React.FC<{opts: SetOptions; frame: number; fps: number}>;
  anchors: Record<string, Anchor>;
  /** default floor line for characters without an anchor */
  floorY: number;
  /** default grade id when the shot does not set one */
  grade: string;
  lights?: (opts: SetOptions) => Light[];
}
