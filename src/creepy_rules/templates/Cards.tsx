import React from 'react';
import {FONT, REF} from '../theme';
import {INK, W} from '../pictos/common';
import {clamp, easeOutCubic, rnd, useScene} from '../util';
import {SvgLines} from './common';

/** Thẻ tiêu đề: kicker nhỏ + tiêu đề lớn + vạch đỏ + dòng phụ. */
export const TitleCard: React.FC<{v: any}> = ({v}) => {
  const {t, accent, gt} = useScene();
  const cx = REF.cx;
  const cy = v.y ?? 300;
  const p = easeOutCubic(t / 0.5);
  const fl = t < 0.5 ? 0.7 + 0.3 * rnd(`ti${Math.floor(gt * 20)}`) : 1;
  return (
    <g opacity={p * fl}>
      {v.kicker && (
        <text x={cx} y={cy - 96} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight={600} fontSize={22} letterSpacing={9} fill="#9b9b9b">
          {String(v.kicker).toUpperCase()}
        </text>
      )}
      <SvgLines text={v.title ?? ''} x={cx} y={cy} size={v.size ?? 84} weight={800} spacing={4} accent={accent} />
      {v.line !== false && <line x1={cx - 210 * p} y1={cy + (v.size ?? 84) * 0.8} x2={cx + 210 * p} y2={cy + (v.size ?? 84) * 0.8} stroke={accent} strokeWidth={4} style={{filter: `drop-shadow(0 0 6px ${accent})`}} />}
      {v.sub && (
        <text x={cx} y={cy + (v.size ?? 84) * 0.8 + 44} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight={600} fontSize={26} letterSpacing={6} fill="#b5b5b5">
          {String(v.sub).toUpperCase()}
        </text>
      )}
    </g>
  );
};

/** Chữ lớn giữa màn hình (câu chốt / câu hỏi) — khác với phụ đề. */
export const TextCard: React.FC<{v: any}> = ({v}) => {
  const {t, accent} = useScene();
  const p = easeOutCubic(t / 0.3);
  return (
    <g opacity={p} transform={`translate(0 ${(1 - p) * 10})`}>
      <SvgLines text={v.text ?? ''} x={REF.cx} y={v.y ?? 300} size={v.size ?? 62} weight={v.weight ?? 800} spacing={3} accent={accent} />
    </g>
  );
};

/** Con dấu đỏ xoay nghiêng: CLASSIFIED / REDACTED / DO NOT OPEN... */
export const Stamp: React.FC<{v: any}> = ({v}) => {
  const {t, accent} = useScene();
  const k = clamp(t / 0.18);
  const s = 1.6 - 0.6 * easeOutCubic(k);
  const text = String(v.text ?? 'CLASSIFIED').toUpperCase();
  const size = v.size ?? 74;
  const w = text.length * size * 0.68 + 50;
  const col = v.color ?? accent;
  return (
    <g transform={`translate(${v.x ?? REF.cx} ${v.y ?? 300}) rotate(${v.rot ?? -9}) scale(${s})`} opacity={k}>
      <rect x={-w / 2} y={-size * 0.78} width={w} height={size * 1.56} rx={8} fill="none" stroke={col} strokeWidth={7} />
      <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight={800} fontSize={size} letterSpacing={6} fill={col}>
        {text}
      </text>
    </g>
  );
};
