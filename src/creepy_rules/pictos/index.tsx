import React from 'react';
import {Dog, dogSnout} from './dog';
import {Armchair, Bed, Dinner, FrontPerson, SidePerson} from './person';
import {
  Agent, BoxLabel, Bowl, Bubble, CautionTape, Cctv, Check, Clock, Creature, Cross, CustomSvg, Door, Elevator, Eye, Fridge, House, KeyRing, Lamp, Mirror, Moon, Nightstand, Phone,
  Speed, Sweat, TextLabel, Tv, Window,
} from './props';
import {W} from './common';
import {clamp, easeOutBack, easeOutCubic, kf, lerp} from '../util';

type KindProps = {item: any; t: number; lt: number; accent: string};

const Person: React.FC<KindProps> = (p) => (['run', 'walk'].includes(p.item.pose) ? <SidePerson item={p.item} t={p.t} /> : <FrontPerson item={p.item} t={p.t} />);

export const KINDS: Record<string, React.FC<any>> = {
  dog: Dog,
  person: Person,
  armchair: Armchair,
  dinner: Dinner,
  bed: Bed,
  window: Window,
  clock: Clock,
  tv: Tv,
  fridge: Fridge,
  bowl: Bowl,
  door: Door,
  eye: Eye,
  agent: Agent,
  key: KeyRing,
  check: Check,
  cross: Cross,
  speed: Speed,
  lamp: Lamp,
  phone: Phone,
  nightstand: Nightstand,
  bubble: Bubble,
  house: House,
  moon: ({item}: any) => <Moon r={item.r ?? 30} />,
  box: BoxLabel,
  text: TextLabel,
  svg: CustomSvg,
  sweat: Sweat,
  elevator: Elevator,
  cctv: Cctv,
  mirror: Mirror,
  tape: CautionTape,
  creature: Creature,
};
export const KIND_NAMES = Object.keys(KINDS);

/** Một vật/nhân vật trên sân khấu: lo vị trí, tỉ lệ, lật, mờ, xuất hiện/biến mất. */
export const Item: React.FC<{item: any; t: number; accent: string}> = ({item, t, accent}) => {
  const Comp = KINDS[item.kind];
  if (!Comp) return null;
  const t0 = item.t0 ?? 0;
  const t1 = item.t1 ?? Infinity;
  if (t < t0 || t > t1) return null;
  const lt = t - t0;
  const x = kf(item.x, t, 0);
  const y = kf(item.y, t, 0);
  const s = kf(item.scale, t, 1);
  const rot = kf(item.rot, t, 0);
  const blur = kf(item.blur, t, 0);
  let op = kf(item.opacity, t, 1);
  let pop = 1;
  const animIn = item.pop !== false && (t0 > 0 || item.pop === true);
  if (animIn) {
    const p = clamp(lt / (item.popDur ?? 0.22));
    pop = 0.8 + 0.2 * easeOutBack(p);
    op *= easeOutCubic(p);
  }
  if (isFinite(t1)) op *= clamp((t1 - t) / 0.12);
  if (op <= 0.002) return null;
  const sx = (item.flip ? -s : s) * pop;
  const sy = s * pop;
  const style: React.CSSProperties = {};
  if (blur > 0.1) style.filter = `blur(${blur}px)`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sx} ${sy})`} opacity={op} style={style}>
      <Comp item={item} t={t} lt={lt} accent={accent} />
    </g>
  );
};

type Pt = [number, number];
/** Điểm neo để nối đường (dotted/gaze) vào vật. "id@phần": head | snout | pocket | center | feet */
export function anchorOf(item: any, part: string | undefined, t: number): Pt {
  const x = kf(item.x, t, 0);
  const y = kf(item.y, t, 0);
  const s = kf(item.scale, t, 1);
  const f = item.flip ? -1 : 1;
  const at = (dx: number, dy: number): Pt => [x + dx * s * f, y + dy * s];
  const kind = item.kind;
  if (kind === 'dog') {
    const sn = dogSnout(item, t);
    return part === 'feet' ? at(0, 0) : part === 'head' ? at(sn[0] - 30, sn[1] - 6) : at(sn[0], sn[1]);
  }
  if (kind === 'armchair') return at(-15, -172);
  if (kind === 'person') return part === 'pocket' ? at(30, -62) : part === 'feet' ? at(0, 0) : at(0, -157);
  if (kind === 'bed') return at(-70, -76);
  if (kind === 'fridge') return part === 'center' ? at(0, -100) : at(-46, -100);
  if (kind === 'bowl') return at(0, -22);
  if (kind === 'agent') return at(0, 0);
  return part === 'feet' ? at(0, 0) : at(0, -60);
}

function resolveEnd(e: any, items: any[], t: number, side: 'from' | 'to', link: any): Pt {
  let p: Pt = [0, 0];
  if (Array.isArray(e)) p = [kf(e[0], t, 0), kf(e[1], t, 0)];
  else if (typeof e === 'string') {
    const [id, part] = e.split('@');
    const it = items.find((i) => i.id === id);
    if (it) p = anchorOf(it, part, t);
  }
  const dx = side === 'from' ? link.fromDx ?? 0 : link.toDx ?? 0;
  const dy = side === 'from' ? link.fromDy ?? 0 : link.toDy ?? 0;
  return [p[0] + dx, p[1] + dy];
}

export const Link: React.FC<{link: any; items: any[]; t: number; accent: string}> = ({link, items, t, accent}) => {
  const start = link.start ?? 0.3;
  const dur = link.dur ?? 0.9;
  const p = easeOutCubic((t - start) / dur);
  if (p <= 0) return null;
  let a = resolveEnd(link.from, items, t, 'from', link);
  let b = resolveEnd(link.to, items, t, 'to', link);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const ux = (b[0] - a[0]) / len;
  const uy = (b[1] - a[1]) / len;
  const gapA = link.gapFrom ?? 12;
  const gapB = link.gapTo ?? 14;
  a = [a[0] + ux * gapA, a[1] + uy * gapA];
  b = [b[0] - ux * gapB, b[1] - uy * gapB];
  const e: Pt = [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
  const style = link.style ?? 'dotted';
  if (style === 'gaze') {
    return (
      <line x1={a[0]} y1={a[1]} x2={e[0]} y2={e[1]} stroke={link.color ?? accent} strokeWidth={3.4}
        strokeDasharray="3.6 6.4" strokeDashoffset={-t * 14} style={{filter: `drop-shadow(0 0 5px ${link.color ?? accent})`}} />
    );
  }
  if (style === 'solid') return <line x1={a[0]} y1={a[1]} x2={e[0]} y2={e[1]} stroke={link.color ?? W} strokeWidth={3.5} strokeLinecap="round" />;
  return (
    <line x1={a[0]} y1={a[1]} x2={e[0]} y2={e[1]} stroke={link.color ?? W} strokeWidth={4.6}
      strokeLinecap="round" strokeDasharray="0.1 10.5" strokeDashoffset={-t * 12} />
  );
};
