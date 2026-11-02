import React from 'react';
import {C} from '../theme';
import {Clock, Defs, Lamp, Plant, Sofa, Takeout} from './props';
import type {Anchor, Light, SetDef, SetOptions} from './types';

const INK = C.ink;

const Room: React.FC<{opts: SetOptions}> = ({opts}) => {
  const lamp = opts.lamp !== false;
  const slats = Array.from({length: 11});
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
      <defs>
        <Defs id="rm-wall" stops={[[0, '#8d5464'], [1, '#69384a']]} />
        <Defs id="rm-floor" stops={[[0, '#c9742f'], [1, '#6e3322']]} />
        <Defs id="rm-glass" stops={[[0, '#232a56'], [1, '#10142e']]} />
      </defs>
      {/* wall + floor */}
      <rect x={0} y={0} width={1920} height={800} fill="url(#rm-wall)" />
      <rect x={0} y={778} width={1920} height={26} fill="#d6b3a8" stroke={INK} strokeWidth={3} />
      <rect x={0} y={804} width={1920} height={276} fill="url(#rm-floor)" />
      {[850, 915, 990, 1065].map((y) => <rect key={y} x={0} y={y} width={1920} height={3} fill="#3a1a18" opacity={0.28} />)}
      <ellipse cx={980} cy={955} rx={640} ry={120} fill="#8a2b43" />
      <ellipse cx={980} cy={955} rx={450} ry={82} fill="#a8463f" opacity={0.92} />

      {/* window with blinds */}
      <g strokeLinejoin="round">
        <rect x={690} y={126} width={540} height={440} rx={6} fill="#4a3140" stroke={INK} strokeWidth={6} />
        <rect x={706} y={142} width={508} height={408} fill="url(#rm-glass)" />
        <polygon points="740,550 840,142 930,142 830,550" fill="#ffffff" opacity={0.05} />
        <polygon points="960,550 1030,142 1080,142 1010,550" fill="#ffffff" opacity={0.04} />
        <rect x={955} y={142} width={10} height={408} fill="#4a3140" stroke={INK} strokeWidth={3} />
        {slats.map((_, i) => <rect key={i} x={706} y={146 + i * 17} width={508} height={9} fill="#5b638f" opacity={0.9} />)}
        <rect x={706} y={146 + 11 * 17 - 2} width={508} height={10} fill="#3b2f55" stroke={INK} strokeWidth={3} />
        <rect x={670} y={566} width={580} height={24} rx={6} fill="#c79a92" stroke={INK} strokeWidth={4} />
      </g>

      {/* door (dark opening) */}
      <g>
        <rect x={1630} y={130} width={230} height={660} fill="#d9b5a9" stroke={INK} strokeWidth={5} />
        <rect x={1650} y={150} width={210} height={640} fill="#170d1a" />
      </g>

      <Clock cx={350} cy={270} time={opts.clock ?? '10:10'} />
      <Plant x={1470} baseY={808} s={1.05} />
      <Lamp x={520} baseY={812} topY={330} on={lamp} />
      <Sofa x={980} baseY={832} />
      {/* coffee table */}
      <g strokeLinejoin="round">
        <path d="M 870 972 L 862 1040 M 1090 972 L 1098 1040 M 905 982 L 900 1048 M 1055 982 L 1060 1048" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <ellipse cx={980} cy={955} rx={132} ry={30} fill="#c88a46" stroke={INK} strokeWidth={5} />
        <ellipse cx={980} cy={950} rx={116} ry={22} fill="#dba15a" opacity={0.7} />
        {opts.takeout !== false && <Takeout x={980} y={935} />}
      </g>
    </svg>
  );
};

const anchors: Record<string, Anchor> = {
  sofaL: {x: 905, y: 802, pose: 'sit'},
  sofaC: {x: 980, y: 802, pose: 'sit'},
  sofaR: {x: 1055, y: 802, pose: 'sit'},
  floorL: {x: 700, y: 960}, floorC: {x: 980, y: 1000}, floorR: {x: 1260, y: 960},
  door: {x: 1740, y: 800, pose: 'stand'},
  lamp: {x: 610, y: 850, pose: 'stand'},
};

const lights = (o: SetOptions): Light[] => {
  const out: Light[] = [{x: 960, y: 330, r: 460, color: '#7a86d8', opacity: 0.10}];
  if (o.lamp !== false) out.push({x: 520, y: 420, r: 600, color: '#ffb866', opacity: 0.62}, {x: 520, y: 840, r: 380, color: '#ff9a4a', opacity: 0.26});
  return out;
};

export const ROOM: SetDef = {Component: Room, anchors, floorY: 960, grade: 'warm', lights};
