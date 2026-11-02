import {C} from '../theme';

export type Kind = 'hoodie' | 'puffer' | 'blazer' | 'jacket';
export type Headgear = 'none' | 'beanie' | 'curl' | 'bob' | 'cap' | 'short';

export interface Outfit {
  kind: Kind; headgear: Headgear;
  top: string; top2: string; pants: string; shoe: string; hair: string; hat: string;
}

export const PRESETS: Record<string, Outfit> = {
  hoodie: {kind: 'hoodie', headgear: 'curl',   top: C.mustard,  top2: '#ab6342', pants: C.jeans,    shoe: '#e9e6f5', hair: '#8a5a2a', hat: '#8a5a2a'},
  beanie: {kind: 'puffer', headgear: 'beanie', top: C.olive,    top2: '#5f6e2a', pants: C.brown,    shoe: '#4a2a22', hair: '#4a2a22', hat: C.crimson},
  pink:   {kind: 'blazer', headgear: 'bob',    top: C.rosePink, top2: '#f4e6d4', pants: '#7d80b8',  shoe: '#efe6f3', hair: C.auburn,  hat: C.auburn},
  suit:   {kind: 'jacket', headgear: 'short',  top: C.charcoal, top2: '#3a3a4a', pants: '#3a3a4a',  shoe: '#2a2430', hair: '#2a2430', hat: '#2a2430'},
  teal:   {kind: 'jacket', headgear: 'cap',    top: C.teal,     top2: '#2b6e6e', pants: '#2a2f55',  shoe: '#e9e6f5', hair: '#2a2f55', hat: '#2a2f55'},
};

export const PRESET_NAMES = Object.keys(PRESETS);
