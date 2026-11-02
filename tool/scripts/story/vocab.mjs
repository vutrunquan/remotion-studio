// Single source of truth for validators/parsers. KEEP IN SYNC with template/src (sets/*, characters/*, theme.ts).
export const SETS = {
  'living-room': ['sofaL', 'sofaC', 'sofaR', 'floorL', 'floorC', 'floorR', 'door', 'lamp'],
  'street-dusk': ['bench1', 'benchL', 'benchR', 'walkL', 'walkC', 'walkR'],
  'street-brick': ['bench1', 'walkL', 'walkC', 'walkR'],
  'street-night': ['walkL', 'walkC', 'walkR'],
  void: ['center'],
};
export const PRESETS = ['hoodie', 'beanie', 'pink', 'suit', 'teal'];
export const POSES = ['stand', 'sit', 'slump', 'hold', 'scratch', 'wave', 'lean', 'walk', 'kneel', 'back'];
export const EMOTES = ['neutral', 'happy', 'content', 'tired', 'sleepy', 'worried', 'surprised', 'smirk', 'sad', 'angry', 'closed'];
export const PROPS = ['none', 'cup', 'box', 'phone'];
export const FX = ['dust', 'sparkles', 'window-blinds', 'light-shafts', 'heavy-vignette', 'no-grain'];
export const TRANSITIONS = ['cut', 'black', 'blinds', 'dissolve'];
export const GRADES = ['none', 'dusk', 'warm', 'night-room', 'night-street', 'dim'];
export const SIZES = ['wide', 'medium', 'close', 'xclose'];
