import React from 'react';
import type {EmoteName} from '../types';
import {C} from '../theme';

type EyeKind = 'dot' | 'half' | 'lid' | 'smile' | 'closed' | 'wide';
type MouthKind = 'flat' | 'smile' | 'o' | 'wave' | 'frown' | 'smirk' | 'small-o';
interface EC { eyes: EyeKind; by: number; bl: number; br: number; mouth: MouthKind; blush?: boolean }

// brow rotation: + = clockwise. Worried = inner ends up (L -, R +), angry = inner ends down (L +, R -)
export const EMOTES: Record<EmoteName, EC> = {
  neutral:   {eyes: 'dot',    by: -17, bl: 0,   br: 0,   mouth: 'flat'},
  happy:     {eyes: 'dot',    by: -20, bl: -6,  br: 6,   mouth: 'smile', blush: true},
  content:   {eyes: 'smile',  by: -19, bl: -4,  br: 4,   mouth: 'smile', blush: true},
  tired:     {eyes: 'half',   by: -14, bl: 8,   br: -8,  mouth: 'flat'},
  sleepy:    {eyes: 'lid',    by: -13, bl: 4,   br: -4,  mouth: 'small-o'},
  worried:   {eyes: 'dot',    by: -21, bl: -17, br: 17,  mouth: 'wave'},
  surprised: {eyes: 'wide',   by: -27, bl: -4,  br: 4,   mouth: 'o'},
  smirk:     {eyes: 'half',   by: -18, bl: -10, br: 6,   mouth: 'smirk'},
  sad:       {eyes: 'dot',    by: -19, bl: -15, br: 15,  mouth: 'frown'},
  angry:     {eyes: 'dot',    by: -15, bl: 16,  br: -16, mouth: 'frown'},
  closed:    {eyes: 'closed', by: -16, bl: 0,   br: 0,   mouth: 'flat'},
};

interface FaceProps {emote: EmoteName; blink: boolean; look: number; view: 'front' | 'side'}

export const Face: React.FC<FaceProps> = ({emote, blink, look, view}) => {
  const e = EMOTES[emote] ?? EMOTES.neutral;
  const ox = view === 'side' ? 17 : 0;
  const ex = view === 'side' ? 17 : 24;
  const ey = 5;
  const sw = 5;
  const common = {stroke: C.ink, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'};

  const eye = (cx: number) => {
    const x = cx + ox + look * 3;
    if (blink && e.eyes !== 'closed' && e.eyes !== 'smile') return <path key={cx} d={`M ${x - 7} ${ey} L ${x + 7} ${ey}`} {...common} />;
    switch (e.eyes) {
      case 'wide': return <circle key={cx} cx={x} cy={ey} r={7} fill={C.ink} />;
      case 'half': return (
        <g key={cx}>
          <path d={`M ${x - 6} ${ey + 1} A 6 6 0 0 0 ${x + 6} ${ey + 1} Z`} fill={C.ink} />
          <path d={`M ${x - 9} ${ey} L ${x + 9} ${ey - 1}`} {...common} />
        </g>);
      case 'lid': return (
        <g key={cx}>
          <ellipse cx={x} cy={ey + 2} rx={5.4} ry={2.6} fill={C.ink} />
          <path d={`M ${x - 9} ${ey - 1} Q ${x} ${ey - 3} ${x + 9} ${ey - 1}`} {...common} />
        </g>);
      case 'smile': return <path key={cx} d={`M ${x - 8} ${ey + 3} Q ${x} ${ey - 8} ${x + 8} ${ey + 3}`} {...common} />;
      case 'closed': return <path key={cx} d={`M ${x - 8} ${ey} Q ${x} ${ey + 6} ${x + 8} ${ey}`} {...common} />;
      default: return <circle key={cx} cx={x} cy={ey} r={6.2} fill={C.ink} />;
    }
  };

  const brow = (cx: number, rotDeg: number, flip: number) => {
    const x = cx + ox;
    return <path key={'b' + cx} d={`M ${x - 11} ${e.by} L ${x + 11} ${e.by}`} {...common} transform={`rotate(${rotDeg * flip} ${x} ${e.by})`} />;
  };

  const my = 31;
  const mx = ox * 0.9;
  let mouth: React.ReactNode;
  switch (e.mouth) {
    case 'smile': mouth = <path d={`M ${mx - 13} ${my - 3} Q ${mx} ${my + 10} ${mx + 13} ${my - 3}`} {...common} />; break;
    case 'o': mouth = <ellipse cx={mx} cy={my + 2} rx={4.6} ry={6.4} fill="#3a1d2e" stroke={C.ink} strokeWidth={2.4} />; break;
    case 'small-o': mouth = <ellipse cx={mx + 3} cy={my + 1} rx={3.8} ry={5} fill="#3a1d2e" stroke={C.ink} strokeWidth={2} />; break;
    case 'wave': mouth = <path d={`M ${mx - 11} ${my + 2} q 5.5 -7 11 0 t 11 0`} {...common} />; break;
    case 'frown': mouth = <path d={`M ${mx - 12} ${my + 6} Q ${mx} ${my - 5} ${mx + 12} ${my + 6}`} {...common} />; break;
    case 'smirk': mouth = <path d={`M ${mx - 12} ${my + 3} Q ${mx + 2} ${my + 9} ${mx + 13} ${my - 3}`} {...common} />; break;
    default: mouth = <path d={`M ${mx - 8} ${my} L ${mx + 8} ${my}`} {...common} />;
  }

  return (
    <g>
      {e.blush && (<>
        <ellipse cx={-ex - 12 + ox} cy={22} rx={9} ry={5} fill={C.blush} opacity={0.5} />
        <ellipse cx={ex + 12 + ox} cy={22} rx={9} ry={5} fill={C.blush} opacity={0.5} />
      </>)}
      {eye(-ex)}{eye(ex)}
      {brow(-ex, e.bl, 1)}{brow(ex, e.br, 1)}
      {mouth}
    </g>
  );
};
