import React from 'react';
import {C} from '../theme';
import {Bench, BrickWall, Defs, Pigeon, Tree} from './props';
import {darken, lighten} from '../lib/util';
import type {Anchor, Light, SetDef, SetOptions} from './types';

const INK = C.ink;

const LampPost: React.FC<{x: number; baseY: number; topY: number; lit?: boolean}> = ({x, baseY, topY, lit}) => (
  <g strokeLinejoin="round">
    <path d={`M ${x - 22} ${baseY} L ${x - 14} ${baseY - 44} L ${x + 14} ${baseY - 44} L ${x + 22} ${baseY} Z`} fill="#1e1824" stroke={INK} strokeWidth={4} />
    <rect x={x - 8} y={topY + 110} width={16} height={baseY - topY - 150} fill="#1e1824" stroke={INK} strokeWidth={3} />
    <path d={`M ${x - 50} ${topY} L ${x + 50} ${topY} L ${x + 40} ${topY + 110} L ${x - 40} ${topY + 110} Z`} fill={lit ? '#ffe3a8' : '#2c2632'} stroke={INK} strokeWidth={5} />
    <path d={`M ${x - 34} ${topY + 10} L ${x + 34} ${topY + 10} L ${x + 28} ${topY + 100} L ${x - 28} ${topY + 100} Z`} fill={lit ? '#fff3cc' : '#4a4458'} opacity={lit ? 0.9 : 0.8} />
    <path d={`M ${x - 62} ${topY} L ${x} ${topY - 40} L ${x + 62} ${topY} Z`} fill="#1e1824" stroke={INK} strokeWidth={4} />
    <circle cx={x} cy={topY - 46} r={8} fill="#1e1824" stroke={INK} strokeWidth={3} />
  </g>
);

/* ---------- civic building at dusk (the opening establishing shot) ---------- */
const Civic: React.FC<{frame: number}> = ({frame}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
    <defs>
      <Defs id="cv-wall" stops={[[0, '#9d6b78'], [1, '#85566a']]} />
      <Defs id="cv-col" stops={[[0, '#e4b8a2'], [1, '#a2727b']]} vertical={false} />
      <Defs id="cv-walk" stops={[[0, '#bd9283'], [1, '#8a5d70']]} />
    </defs>
    <rect x={0} y={0} width={1920} height={340} fill="url(#cv-wall)" />
    {[110, 380].map((x) => <rect key={x} x={x} y={-10} width={104} height={250} rx={6} fill="#26142c" stroke="#6a4452" strokeWidth={7} />)}
    {[540, 770, 1000, 1230, 1460, 1690].map((x) => (
      <g key={x}>
        <rect x={x} y={0} width={80} height={340} fill="url(#cv-col)" />
        <rect x={x - 6} y={300} width={92} height={40} fill="#c79a8c" stroke={INK} strokeWidth={3} opacity={0.9} />
        <rect x={x - 6} y={0} width={92} height={26} fill="#c79a8c" opacity={0.9} />
      </g>))}
    <rect x={1335} y={0} width={104} height={340} fill="#6a2b22" stroke="#3a1a1f" strokeWidth={5} />
    <rect x={0} y={300} width={480} height={430} fill="#a97f77" />
    <rect x={0} y={296} width={490} height={20} fill="#c9a094" stroke={INK} strokeWidth={3} />
    <rect x={50} y={400} width={70} height={96} fill="#2a1a2e" stroke="#6a4452" strokeWidth={5} />
    {/* steps */}
    {Array.from({length: 14}).map((_, i) => (
      <g key={i}>
        <rect x={440} y={340 + i * 27.8} width={1480} height={27.8} fill="#cfa492" />
        <rect x={440} y={340 + i * 27.8} width={1480} height={9} fill="#e7c6b4" opacity={0.9} />
        <rect x={440} y={340 + i * 27.8 + 25} width={1480} height={3} fill="#6d4358" opacity={0.5} />
      </g>))}
    {/* sidewalk, curb, road */}
    <rect x={0} y={730} width={1920} height={256} fill="url(#cv-walk)" />
    {[200, 520, 840, 1160, 1480, 1800].map((x) => <rect key={x} x={x} y={730} width={3} height={256} fill="#5a3850" opacity={0.28} />)}
    <rect x={0} y={986} width={1920} height={30} fill="#5b3a4e" stroke={INK} strokeWidth={3} />
    <rect x={0} y={1016} width={1920} height={64} fill="#3d263c" />
    {/* diagonal sun / shadow */}
    <polygon points="560,0 1920,0 1920,1080 1070,1080" fill="#ffd7a8" opacity={0.22} style={{mixBlendMode: 'screen'}} />
    <polygon points="0,0 560,0 1070,1080 0,1080" fill="#2a1034" opacity={0.34} style={{mixBlendMode: 'multiply'}} />
    <LampPost x={330} baseY={930} topY={230} />
    <Bench x={640} seatY={858} w={440} />
    <Pigeon x={1330} y={768} frame={frame} />
  </svg>
);

/* ---------- brick high street (wide daytime-ish shot) ---------- */
const Brick: React.FC<{frame: number}> = () => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
    <defs>
      <Defs id="bk-sky" stops={[[0, '#d1a99c'], [1, '#b08a92']]} />
      <Defs id="bk-walk" stops={[[0, '#c9a594'], [1, '#8a6074']]} />
      <Defs id="bk-road" stops={[[0, '#7e5d73'], [1, '#5c4562']]} />
    </defs>
    <rect x={0} y={0} width={1920} height={560} fill="url(#bk-sky)" />
    <Tree x={80} baseY={560} s={0.8} color="#3b4a44" />
    <BrickWall x={150} y={140} w={1770} h={430} base="#a35c55" />
    <rect x={150} y={128} width={1770} height={26} fill="#d8b5a6" stroke={INK} strokeWidth={4} />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <g key={i}>
        <rect x={220 + i * 245} y={190} width={96} height={140} fill="#33233a" stroke="#e0c0b0" strokeWidth={8} />
        <rect x={220 + i * 245} y={190} width={96} height={46} fill="#ffffff" opacity={0.08} />
      </g>))}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <g key={i}>
        <rect x={190 + i * 290} y={390} width={246} height={150} fill="#2c1e33" stroke="#d6b4a4" strokeWidth={8} />
        <rect x={190 + i * 290} y={372} width={246} height={34} fill={i % 2 ? '#7a3a50' : '#a8584a'} stroke={INK} strokeWidth={4} />
        <polygon points={`${200 + i * 290},500 ${300 + i * 290},400 ${330 + i * 290},400 ${230 + i * 290},500`} fill="#ffffff" opacity={0.06} />
      </g>))}
    <rect x={0} y={560} width={1920} height={140} fill="url(#bk-road)" />
    {Array.from({length: 9}).map((_, i) => <rect key={i} x={40 + i * 220} y={622} width={110} height={8} rx={4} fill="#d8c0c0" opacity={0.55} />)}
    <rect x={0} y={700} width={1920} height={24} fill="#dcc3b4" stroke={INK} strokeWidth={3} />
    <rect x={0} y={724} width={1920} height={356} fill="url(#bk-walk)" />
    <polygon points="0,724 260,724 40,1080 0,1080" fill="#2a1034" opacity={0.25} style={{mixBlendMode: 'multiply'}} />
    <Bench x={1560} seatY={900} w={360} />
    <LampPost x={1850} baseY={960} topY={260} />
  </svg>
);

/* ---------- night street ---------- */
const NightStreet: React.FC<{frame: number}> = () => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
    <defs>
      <Defs id="ns-sky" stops={[[0, '#251f52'], [1, '#43386f']]} />
      <Defs id="ns-walk" stops={[[0, '#6c68ac'], [1, '#3c3a78']]} />
    </defs>
    <rect x={0} y={0} width={1920} height={640} fill="url(#ns-sky)" />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => {
      const x = i * 290 - 30, c = ['#3a3062', '#463a6c', '#2d2a58'][i % 3];
      return (
        <g key={i}>
          <rect x={x} y={90 + (i % 2) * 24} width={284} height={470} fill={c} stroke={INK} strokeWidth={4} />
          {[0, 1].map((r) => [0, 1].map((k) => (
            <rect key={r + '-' + k} x={x + 36 + k * 120} y={140 + r * 140} width={74} height={96}
              fill={(i + r + k) % 3 === 0 ? '#ffb347' : '#1a1740'} stroke={lighten(c, 0.3)} strokeWidth={5} opacity={(i + r + k) % 3 === 0 ? 0.95 : 1} />
          )))}
          <rect x={x + 108} y={430} width={66} height={130} fill="#1a1230" stroke={INK} strokeWidth={4} />
        </g>);
    })}
    {Array.from({length: 96}).map((_, i) => <rect key={i} x={i * 20 + 4} y={508} width={4} height={56} fill="#15122c" />)}
    <rect x={0} y={506} width={1920} height={6} fill="#15122c" />
    <rect x={0} y={564} width={1920} height={150} fill="#34306a" />
    <rect x={0} y={714} width={1920} height={20} fill="#8480c4" stroke={INK} strokeWidth={3} />
    <rect x={0} y={734} width={1920} height={346} fill="url(#ns-walk)" />
    <Tree x={190} baseY={740} s={0.95} color="#2b3d5c" accent="#f0862a" />
    <Tree x={1050} baseY={740} s={0.95} color="#2b3d5c" accent="#f0862a" />
    <Tree x={1750} baseY={740} s={0.95} color="#2b3d5c" accent="#f0862a" />
    {[700, 1450].map((x) => <ellipse key={x} cx={x} cy={930} rx={44} ry={13} fill="#1d1b44" stroke={INK} strokeWidth={3} />)}
    <LampPost x={330} baseY={880} topY={240} lit />
  </svg>
);

const VoidSet: React.FC = () => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
    <defs><Defs id="vd" stops={[[0, '#3a2a4a'], [1, '#1a1228']]} /></defs>
    <rect width={1920} height={1080} fill="url(#vd)" />
    <rect y={820} width={1920} height={260} fill="#241a34" />
  </svg>
);

const sA = (a: Record<string, Anchor>) => a;

export const STREET_DUSK: SetDef = {
  Component: ({frame}) => <Civic frame={frame} />,
  anchors: sA({
    bench1: {x: 640, y: 930, pose: 'sit'}, benchL: {x: 560, y: 930, pose: 'sit'}, benchR: {x: 730, y: 930, pose: 'sit'},
    walkL: {x: 300, y: 1000, pose: 'stand'}, walkC: {x: 960, y: 1000, pose: 'stand'}, walkR: {x: 1500, y: 1000, pose: 'stand'},
  }),
  floorY: 1000, grade: 'dusk',
  lights: () => [{x: 1500, y: 700, r: 760, color: '#ffd0a0', opacity: 0.2}],
};

export const STREET_BRICK: SetDef = {
  Component: ({frame}) => <Brick frame={frame} />,
  anchors: sA({
    bench1: {x: 1560, y: 970, pose: 'sit', scale: 0.8}, walkL: {x: 520, y: 900, pose: 'stand', scale: 0.8},
    walkC: {x: 960, y: 920, pose: 'stand', scale: 0.8}, walkR: {x: 1500, y: 900, pose: 'stand', scale: 0.8},
  }),
  floorY: 920, grade: 'dusk',
  lights: () => [{x: 160, y: 420, r: 900, color: '#ffd9a8', opacity: 0.32}],
};

export const STREET_NIGHT: SetDef = {
  Component: ({frame}) => <NightStreet frame={frame} />,
  anchors: sA({
    walkL: {x: 330, y: 900, pose: 'walk', scale: 0.8}, walkC: {x: 960, y: 900, pose: 'walk', scale: 0.8}, walkR: {x: 1500, y: 900, pose: 'walk', scale: 0.8},
  }),
  floorY: 900, grade: 'night-street',
  lights: () => [{x: 330, y: 330, r: 560, color: '#ffe0a0', opacity: 0.6}, {x: 330, y: 900, r: 380, color: '#ffd090', opacity: 0.3}],
};

export const VOID: SetDef = {Component: VoidSet, anchors: {center: {x: 960, y: 900, pose: 'stand'}}, floorY: 900, grade: 'dim'};
