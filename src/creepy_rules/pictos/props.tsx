import React from 'react';
import {COLORS, FONT} from '../theme';
import {Cap, INK, P, W} from './common';
import {clamp, easeOutBack, easeOutCubic, kf, rnd} from '../util';

export const Window: React.FC<{item: any; t: number}> = ({item}) => (
  <g>
    <rect x={-67} y={-62.5} width={134} height={125} fill="none" stroke={W} strokeWidth={7} />
    <line x1={0} y1={-62} x2={0} y2={62} stroke={W} strokeWidth={6} />
    <line x1={-67} y1={0} x2={67} y2={0} stroke={W} strokeWidth={6} />
    <rect x={-78} y={65.5} width={156} height={11} rx={3} fill={W} />
    {item.moon !== false && <Moon x={23} y={-31} r={17} />}
  </g>
);

export const Moon: React.FC<{x?: number; y?: number; r?: number; color?: string}> = ({x = 0, y = 0, r = 17, color = COLORS.yellow}) => (
  <g transform={`translate(${x} ${y}) rotate(-20)`}>
    <circle r={r} fill={color} />
    <circle cx={r * 0.38} cy={-r * 0.12} r={r * 0.86} fill={INK} />
  </g>
);

const parseTime = (s: string) => {
  const m = /(\d{1,2}):(\d{2})/.exec(s);
  return m ? (parseInt(m[1], 10) % 12) * 60 + parseInt(m[2], 10) : 0;
};

export const Clock: React.FC<{item: any; t: number}> = ({item, t}) => {
  const mins = item.min !== undefined ? kf(item.min, t) : parseTime(String(item.time ?? '12:00')) + (item.run ? t * (item.run === true ? 6 : item.run) : 0);
  const ma = (mins % 60) * 6;
  const ha = (mins / 720) * 360;
  const hand = (deg: number, len: number, w: number) => {
    const r = (deg * Math.PI) / 180;
    return <line x1={0} y1={0} x2={len * Math.sin(r)} y2={-len * Math.cos(r)} stroke={W} strokeWidth={w} strokeLinecap="round" />;
  };
  return (
    <g>
      <circle r={35} fill="none" stroke={W} strokeWidth={4.5} />
      {hand(ha, 17, 4.5)}
      {hand(ma, 25, 3.5)}
      <circle r={2.6} fill={W} />
    </g>
  );
};

export const Tv: React.FC<{item: any; t: number}> = ({item, t}) => {
  const on = item.on !== false;
  const k = Math.floor(t * 14);
  const lines = Array.from({length: 7}, (_, i) => ({
    y: -156 + i * 10 + (rnd(`tv${k}-${i}`) - 0.5) * 5,
    h: 2.5 + rnd(`tvh${k}-${i}`) * 4,
    o: 0.35 + rnd(`tvo${k}-${i}`) * 0.5,
  }));
  return (
    <g>
      <line x1={-35} y1={-209} x2={-2} y2={-168} stroke={W} strokeWidth={4.5} strokeLinecap="round" />
      <line x1={36} y1={-205} x2={3} y2={-168} stroke={W} strokeWidth={4.5} strokeLinecap="round" />
      <rect x={-62} y={-167} width={124} height={86} rx={10} fill={W} />
      <rect x={-52} y={-159} width={90} height={70} rx={5} fill={on ? '#c9c9c9' : '#1b1b1b'} />
      {on && lines.map((l, i) => <rect key={i} x={-52} y={l.y} width={90} height={l.h} fill="#3a3a3a" opacity={l.o} />)}
      <circle cx={50} cy={-147} r={3.2} fill={INK} />
      <circle cx={50} cy={-135} r={3.2} fill={INK} />
      <rect x={-56} y={-77} width={113} height={8} rx={3} fill={W} />
      <line x1={-45} y1={-70} x2={-48} y2={0} stroke={W} strokeWidth={5} strokeLinecap="round" />
      <line x1={46} y1={-70} x2={50} y2={0} stroke={W} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

export const Fridge: React.FC<{item: any; t: number}> = () => (
  <g>
    <rect x={-45} y={-200} width={90} height={200} rx={9} fill={W} />
    <line x1={-45} y1={-142} x2={45} y2={-142} stroke={INK} strokeWidth={4} />
    <rect x={-35} y={-178} width={6} height={28} rx={3} fill={INK} />
    <rect x={-35} y={-130} width={6} height={40} rx={3} fill={INK} />
  </g>
);

export const Bowl: React.FC<{item: any; t: number}> = () => (
  <g>
    <circle cx={-9} cy={-34} r={9} fill={W} />
    <circle cx={9} cy={-36} r={9.5} fill={W} />
    <path d="M-36 -30 L36 -30 Q34 -8 24 0 L-24 0 Q-34 -8 -36 -30 Z" fill={W} strokeLinejoin="round" />
  </g>
);

export const Door: React.FC<{item: any; t: number}> = ({item}) => {
  const open = clamp(kf(item.open, 0, 0));
  return (
    <g>
      <rect x={-40} y={-200} width={80} height={200} rx={2} fill={W} />
      <circle cx={item.knobLeft ? -24 : 24} cy={-98} r={3.6} fill={INK} />
    </g>
  );
};

export const Eye: React.FC<{item: any; t: number}> = ({item, t}) => {
  const blink = item.blink ? Math.max(0, 1 - Math.abs(((t * 0.5) % 1) - 0.5) * 18) : 0;
  const open = 1 - Math.min(1, blink);
  return (
    <g>
      <path d={`M-72 0 Q0 ${-64 * open} 72 0 Q0 ${64 * open} -72 0 Z`} fill="none" stroke={W} strokeWidth={8} strokeLinejoin="round" />
      <ellipse cx={0} cy={0} rx={26} ry={26 * open} fill={W} />
      {item.pupil && <circle cx={0} cy={0} r={9} fill={INK} />}
    </g>
  );
};

export const Agent: React.FC<{item: any; t: number}> = () => (
  <g>
    <circle cx={0} cy={0} r={50} fill={W} />
    <rect x={-43} y={-10} width={39} height={23} rx={9} fill={INK} />
    <rect x={4} y={-10} width={39} height={23} rx={9} fill={INK} />
    <rect x={-6} y={-4} width={12} height={5} fill={INK} />
    <path d="M-96 150 L-96 94 Q-96 66 -66 64 L66 64 Q96 66 96 94 L96 150 Z" fill={W} />
    <polygon points="-17,64 17,64 0,104" fill={INK} />
    <polygon points="0,98 9,112 5,150 -5,150 -9,112" fill={INK} />
  </g>
);

export const KeyRing: React.FC<{item: any; t: number; lt: number}> = ({t}) => {
  const k = 1 + 0.07 * Math.sin(t * 6);
  return (
    <g transform={`scale(${k})`}>
      <circle r={16} fill="none" stroke={COLORS.yellow} strokeWidth={2.6} />
      <g stroke={COLORS.yellow} strokeWidth={2.4} fill="none" strokeLinecap="round">
        <circle cx={-6} cy={0} r={3.6} />
        <line x1={-2.4} y1={0} x2={8} y2={0} />
        <line x1={5} y1={0} x2={5} y2={4} />
        <line x1={8} y1={0} x2={8} y2={3.6} />
      </g>
    </g>
  );
};

export const Check: React.FC<{item: any; t: number; lt: number}> = ({lt}) => {
  const s = easeOutBack(lt / 0.28);
  return (
    <g transform={`scale(${Math.max(0.001, s)})`}>
      <circle r={17} fill={COLORS.green} />
      <path d="M-7.5 0.5 L-2 6.5 L8 -5.5" fill="none" stroke={W} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

export const Cross: React.FC<{item: any; t: number; lt: number; accent: string}> = ({item, lt, accent}) => {
  const w = item.w ?? 90;
  const h = item.h ?? item.w ?? 90;
  const sw = item.stroke ?? 11;
  const p1 = easeOutCubic(lt / 0.16);
  const p2 = easeOutCubic((lt - 0.09) / 0.16);
  const col = item.color ?? accent;
  return (
    <g stroke={col} strokeWidth={sw} strokeLinecap="round" style={{filter: `drop-shadow(0 0 8px ${col})`}}>
      <line x1={-w / 2} y1={-h / 2} x2={-w / 2 + w * p1} y2={-h / 2 + h * p1} />
      {p2 > 0 && <line x1={w / 2} y1={-h / 2} x2={w / 2 - w * p2} y2={-h / 2 + h * p2} />}
    </g>
  );
};

export const Speed: React.FC<{item: any; t: number; accent: string}> = ({t, accent}) => {
  const k = Math.floor(t * 12) % 3;
  const bars: Array<[number, number, number]> = [[-70, -4, 64], [-92, 18, 48 + k * 6], [-58, 40, 56]];
  return (
    <g>
      {bars.map(([x, y, w], i) => (
        <rect key={i} x={x - w + 70} y={y - 2} width={w} height={4.5} rx={2.2} fill={W} />
      ))}
      <line x1={-30} y1={-32} x2={-18} y2={-18} stroke={accent} strokeWidth={6} strokeLinecap="round" style={{filter: `drop-shadow(0 0 6px ${accent})`}} />
    </g>
  );
};

export const Lamp: React.FC<{item: any; t: number}> = ({item, t}) => {
  const on = item.on !== false && (item.onAt === undefined || t >= item.onAt) && (item.offAt === undefined || t < item.offAt);
  const fl = item.flicker ? 0.6 + 0.4 * rnd(`lamp${Math.floor(t * 18)}`) : 1;
  return (
    <g>
      {on && <polygon points="-38,-148 38,-148 90,0 -90,0" fill={W} opacity={0.09 * fl} />}
      <rect x={-3.5} y={-148} width={7} height={144} rx={3} fill={W} />
      <ellipse cx={0} cy={-4} rx={24} ry={6} fill={W} />
      <polygon points="-22,-196 22,-196 40,-150 -40,-150" fill={on ? COLORS.yellow : W} opacity={on ? fl : 1} />
    </g>
  );
};

const activeIn = (v: any, t: number, dflt = false) => {
  if (v === undefined) return dflt;
  if (Array.isArray(v)) return t >= v[0] && t < v[1];
  return !!v;
};

/** Điện thoại: lit (sáng), ring (rung + sóng chuông; true hoặc [giây bắt đầu, giây kết thúc]), waves (chỉ sóng âm),
 *  label/sub (chữ trên màn hình), buttons (nút nghe xanh + nút cúp đỏ), litAt (giây bật sáng). Gốc = tâm máy, cao 132. */
export const Phone: React.FC<{item: any; t: number; accent?: string}> = ({item, t, accent = '#e51939'}) => {
  const lit = item.litAt !== undefined ? t >= item.litAt : item.lit !== false;
  const ring = activeIn(item.ring, t);
  const waves = ring || activeIn(item.waves, t);
  const shake = ring ? Math.sin(t * 38) * 3.2 : 0;
  const pulse = lit ? 0.88 + 0.12 * Math.sin(t * 8) : 0;
  const arc = (k: number, side: number) => {
    const r = 56 + k * 15;
    const o = Math.max(0, (Math.sin(t * 8 - k * 1.3) + 1) / 2) * (0.9 - k * 0.22);
    return <path key={`${k}${side}`} d={`M ${side * r * 0.5} ${-r * 0.8} A ${r} ${r} 0 0 ${side > 0 ? 1 : 0} ${side * r * 0.5} ${r * 0.8}`} fill="none" stroke={W} strokeWidth={4} strokeLinecap="round" opacity={o} />;
  };
  return (
    <g>
      {waves && [0, 1, 2].map((k) => [arc(k, 1), arc(k, -1)])}
      <g transform={`rotate(${shake})`}>
        <rect x={-36} y={-66} width={72} height={132} rx={14} fill={W} />
        <rect x={-30} y={-58} width={60} height={116} rx={8} fill={lit ? '#dbe9ff' : '#161616'} opacity={lit ? pulse : 1} />
        {lit && !item.label && (
          <>
            <rect x={-22} y={-40} width={44} height={6} rx={3} fill="#4b6a99" />
            <rect x={-22} y={-26} width={32} height={6} rx={3} fill="#4b6a99" />
          </>
        )}
        {lit && item.label && (
          <>
            <text x={0} y={-36} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={5.2} letterSpacing={0.8} fill="#4b6a99">{String(item.sub ?? 'INCOMING CALL').toUpperCase()}</text>
            <circle cx={0} cy={-14} r={11} fill="#9db6dd" />
            <text x={0} y={11} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={item.labelSize ?? 8.5} letterSpacing={0.6} fill={INK}>{String(item.label).toUpperCase()}</text>
          </>
        )}
        {lit && item.buttons && (
          <>
            <circle cx={-14} cy={38} r={9} fill={COLORS.green} />
            <circle cx={14} cy={38} r={9} fill={accent} />
            <rect x={9} y={37} width={10} height={2.6} rx={1.3} fill={W} />
          </>
        )}
        <rect x={-8} y={-62} width={16} height={3.5} rx={1.7} fill={INK} />
      </g>
    </g>
  );
};

export const Nightstand: React.FC<{item: any; t: number}> = () => (
  <g>
    <rect x={-48} y={-104} width={96} height={9} rx={3} fill={W} />
    <rect x={-41} y={-95} width={82} height={95} rx={3} fill={W} />
    <rect x={-33} y={-62} width={66} height={3.5} fill={INK} />
    <circle cx={0} cy={-46} r={3.4} fill={INK} />
  </g>
);

/** Bong bóng thoại: text, w (tự tính), tail: "left" | "right" | "down" | "none". */
export const Bubble: React.FC<{item: any; t: number; accent?: string}> = ({item, accent = '#e51939'}) => {
  const text = String(item.text ?? '').toUpperCase();
  const size = item.size ?? 24;
  const w = item.w ?? Math.max(96, text.length * size * 0.72 + 44);
  const h = item.h ?? size * 2.3;
  const tail = item.tail ?? 'left';
  const col = item.color === 'accent' ? accent : item.color ?? W;
  const tailPath = tail === 'left' ? `M ${-w / 2 + 26} ${h / 2 - 2} L ${-w / 2 - 6} ${h / 2 + 24} L ${-w / 2 + 52} ${h / 2 - 2}` : tail === 'right' ? `M ${w / 2 - 26} ${h / 2 - 2} L ${w / 2 + 6} ${h / 2 + 24} L ${w / 2 - 52} ${h / 2 - 2}` : tail === 'down' ? `M -14 ${h / 2 - 2} L 0 ${h / 2 + 22} L 14 ${h / 2 - 2}` : '';
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.34} fill="rgba(0,0,0,0.78)" stroke={col} strokeWidth={4} />
      {tailPath && <path d={tailPath} fill="rgba(0,0,0,0.78)" stroke={col} strokeWidth={4} strokeLinejoin="round" />}
      <text x={0} y={size * 0.04} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight={800} fontSize={size} letterSpacing={2} fill={col}>{text}</text>
    </g>
  );
};

export const House: React.FC<{item: any; t: number}> = ({item, t}) => (
  <g>
    <polygon points="-92,-92 0,-176 92,-92 92,0 -92,0" fill={W} />
    <rect x={-17} y={-62} width={34} height={62} fill={INK} />
    <rect x={-70} y={-82} width={34} height={30} fill={item.lit ? COLORS.yellow : INK} />
    <rect x={36} y={-82} width={34} height={30} fill={item.lit2 ? COLORS.yellow : INK} />
  </g>
);

export const BoxLabel: React.FC<{item: any; t: number}> = ({item}) => {
  const s = item.size ?? 60;
  const filled = !!item.filled;
  return (
    <g>
      <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={s * 0.17} fill={filled ? W : 'none'} stroke={W} strokeWidth={Math.max(2.5, s * 0.05)} />
      <text x={0} y={s * 0.17} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={s * 0.5} fill={filled ? INK : W}>
        {item.label ?? ''}
      </text>
    </g>
  );
};

export const TextLabel: React.FC<{item: any; t: number; accent: string}> = ({item, accent}) => (
  <text
    x={0} y={0} textAnchor={item.anchor ?? 'middle'} fontFamily={FONT} fontWeight={item.weight ?? 800}
    fontSize={item.size ?? 28} letterSpacing={item.spacing ?? 2} fill={item.color === 'accent' ? accent : item.color ?? W}
  >
    {String(item.text ?? '').toUpperCase()}
  </text>
);

export const CustomSvg: React.FC<{item: any; t: number}> = ({item}) => (
  <g fill={item.fill ?? W} stroke={item.stroke ?? 'none'} strokeWidth={item.strokeWidth ?? 0} dangerouslySetInnerHTML={{__html: item.markup ?? ''}} />
);

export const Sweat: React.FC<{item: any; t: number}> = ({t}) => {
  const k = (t * 1.1) % 1;
  return (
    <g transform={`translate(0 ${k * 16})`} opacity={1 - k * 0.7}>
      <path d="M0 -8 C 5 -1 6 3 0 6 C -6 3 -5 -1 0 -8 Z" fill={COLORS.blue} />
    </g>
  );
};

export const Elevator: React.FC<{item: any; t: number; accent: string}> = ({item, t, accent}) => {
  const floor = item.floor ?? 'B4';
  const open = clamp(item.open ?? 0.12);
  const doorW = 86;
  const h = 250;
  const flick = item.flicker ? 0.7 + 0.3 * rnd(`elev${Math.floor(t * 12)}`) : 1;
  return (
    <g>
      <rect x={-106} y={-h} width={212} height={h} fill="#141414" stroke={W} strokeWidth={6} rx={4} />
      <rect x={-86} y={-h + 10} width={172} height={h - 10} fill="#050505" />
      {item.creature && (
        <g opacity={flick}>
          <circle cx={-18} cy={-h * 0.6} r={6} fill={accent} />
          <circle cx={18} cy={-h * 0.6} r={6} fill={accent} />
        </g>
      )}
      <rect x={-86 - (doorW - 10) * open} y={-h + 8} width={doorW} height={h - 8} fill="#242424" stroke={W} strokeWidth={4} />
      <line x1={-86 - (doorW - 10) * open + doorW - 14} y1={-h * 0.6} x2={-86 - (doorW - 10) * open + doorW - 14} y2={-h * 0.4} stroke={W} strokeWidth={4} strokeLinecap="round" />
      <rect x={-doorW * (1 - open)} y={-h + 8} width={doorW} height={h - 8} fill="#242424" stroke={W} strokeWidth={4} />
      <line x1={-doorW * (1 - open) + 14} y1={-h * 0.6} x2={-doorW * (1 - open) + 14} y2={-h * 0.4} stroke={W} strokeWidth={4} strokeLinecap="round" />
      <rect x={-45} y={-h - 38} width={90} height={30} rx={4} fill="#0d0d0d" stroke={W} strokeWidth={3.5} />
      <text x={0} y={-h - 17} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={17} letterSpacing={2} fill={accent} style={{filter: `drop-shadow(0 0 6px ${accent})`}}>
        {String(floor).toUpperCase()}
      </text>
      <rect x={114} y={-h * 0.55} width={26} height={54} rx={4} fill="#1f1f1f" stroke={W} strokeWidth={2.5} />
      <circle cx={127} cy={-h * 0.55 + 16} r={5.5} fill={item.buttonUp ? accent : '#4a4a4a'} stroke={W} strokeWidth={1.5} />
      <circle cx={127} cy={-h * 0.55 + 38} r={5.5} fill={item.buttonDown ? accent : '#4a4a4a'} stroke={W} strokeWidth={1.5} />
    </g>
  );
};

export const Cctv: React.FC<{item: any; t: number; accent: string}> = ({item, t, accent}) => {
  const blink = Math.sin(t * 7) > 0;
  const label = item.label ?? 'CAM 04 [LIVE]';
  return (
    <g>
      <path d="M -30 -30 L 0 -15 L 0 0" fill="none" stroke={W} strokeWidth={6} strokeLinecap="round" />
      <g transform="rotate(28)">
        <rect x={-20} y={-16} width={64} height={32} rx={5} fill="#222" stroke={W} strokeWidth={4.5} />
        <polygon points="44,-18 64,-24 64,24 44,18" fill="#111" stroke={W} strokeWidth={3.5} />
        <circle cx={-8} cy={-6} r={4.5} fill={blink ? accent : '#441111'} style={blink ? {filter: `drop-shadow(0 0 6px ${accent})`} : undefined} />
        <line x1={48} y1={-12} x2={58} y2={-16} stroke={W} strokeWidth={2} />
      </g>
      {item.showLabel !== false && (
        <text x={20} y={32} fontFamily={FONT} fontWeight={800} fontSize={12} letterSpacing={1.5} fill={W}>
          {label}
        </text>
      )}
    </g>
  );
};

export const Mirror: React.FC<{item: any; t: number; accent: string}> = ({item, t, accent}) => {
  const w = item.w ?? 96;
  const h = item.h ?? 180;
  return (
    <g>
      <rect x={-w / 2 - 8} y={-h - 8} width={w + 16} height={h + 16} rx={w * 0.1} fill="#1e1e1e" stroke={W} strokeWidth={5} />
      <rect x={-w / 2} y={-h} width={w} height={h} rx={w * 0.08} fill="#0d131a" stroke={W} strokeWidth={2} />
      <line x1={-w * 0.3} y1={-h + 16} x2={w * 0.35} y2={-16} stroke="#ffffff" strokeWidth={3} opacity={0.15} />
      <line x1={-w * 0.15} y1={-h + 16} x2={w * 0.45} y2={-32} stroke="#ffffff" strokeWidth={1.5} opacity={0.15} />
      {item.shadow !== false && (
        <g opacity={item.shadowOpacity ?? 0.85}>
          <circle cx={0} cy={-h * 0.65} r={w * 0.18} fill="#000" stroke="#333" strokeWidth={2} />
          <path d={`M ${-w * 0.28} ${-h * 0.42} Q 0 ${-h * 0.5} ${w * 0.28} ${-h * 0.42} L ${w * 0.35} 0 L ${-w * 0.35} 0 Z`} fill="#000" stroke="#333" strokeWidth={2} />
          <circle cx={-w * 0.07} cy={-h * 0.65} r={3} fill={accent} />
          <circle cx={w * 0.07} cy={-h * 0.65} r={3} fill={accent} />
        </g>
      )}
    </g>
  );
};

export const CautionTape: React.FC<{item: any}> = ({item}) => {
  const w = item.w ?? 480;
  const h = 32;
  const text = String(item.text ?? 'DO NOT CROSS // RESTRICTED AREA').toUpperCase();
  return (
    <g transform={`rotate(${item.rot ?? -8})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#facc15" stroke={INK} strokeWidth={3} />
      <g opacity={0.18}>
        {Array.from({length: Math.floor(w / 40)}).map((_, i) => (
          <polygon key={i} points={`${-w / 2 + i * 40},${-h / 2} ${-w / 2 + i * 40 + 16},${-h / 2} ${-w / 2 + i * 40 - 8},${h / 2} ${-w / 2 + i * 40 - 24},${h / 2}`} fill="#000" />
        ))}
      </g>
      <text x={0} y={h * 0.16} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={13} letterSpacing={3} fill="#000">
        {text}
      </text>
    </g>
  );
};

export const Creature: React.FC<{item: any; t: number; accent: string}> = ({item, t, accent}) => {
  const sway = Math.sin(t * 3.5) * 5;
  const h = item.h ?? 230;
  return (
    <g transform={`translate(${sway} 0)`}>
      <ellipse cx={0} cy={-h * 0.55} rx={22} ry={55} fill="#080808" stroke={W} strokeWidth={3.5} />
      <circle cx={0} cy={-h * 0.88} r={20} fill="#080808" stroke={W} strokeWidth={3.5} />
      <circle cx={-7} cy={-h * 0.89} r={item.eyeR ?? 4.5} fill={item.eyeColor ?? W} />
      <circle cx={7} cy={-h * 0.89} r={item.eyeR ?? 4.5} fill={item.eyeColor ?? W} />
      <path d={`M -20 ${-h * 0.72} Q -45 ${-h * 0.35} -38 0`} fill="none" stroke={W} strokeWidth={4} strokeLinecap="round" />
      <path d={`M 20 ${-h * 0.72} Q 45 ${-h * 0.35} 38 0`} fill="none" stroke={W} strokeWidth={4} strokeLinecap="round" />
      {[-4, 0, 4].map((dx, i) => (
        <React.Fragment key={i}>
          <line x1={-38} y1={0} x2={-38 + dx * 2} y2={14} stroke={W} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={38} y1={0} x2={38 + dx * 2} y2={14} stroke={W} strokeWidth={2.5} strokeLinecap="round" />
        </React.Fragment>
      ))}
      <line x1={-12} y1={-h * 0.28} x2={-16} y2={0} stroke={W} strokeWidth={4.5} strokeLinecap="round" />
      <line x1={12} y1={-h * 0.28} x2={16} y2={0} stroke={W} strokeWidth={4.5} strokeLinecap="round" />
    </g>
  );
};
