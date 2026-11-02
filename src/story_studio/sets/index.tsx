import type {SetDef} from './types';
import {ROOM} from './Room';
import {STREET_BRICK, STREET_DUSK, STREET_NIGHT, VOID} from './Street';

/**
 * Set registry. A set = a 1920x1080 SVG "world", named anchors for characters and light sources.
 * To add a set: build a component, export a SetDef, register it here, add to references/scene-vocabulary.md.
 */
export const SETS: Record<string, SetDef> = {
  'living-room': ROOM,
  'street-dusk': STREET_DUSK,
  'street-brick': STREET_BRICK,
  'street-night': STREET_NIGHT,
  void: VOID,
};

export const SET_NAMES = Object.keys(SETS);
export * from './types';
