import React from 'react';
import {FONT, REF} from '../theme';
import {INK, W} from '../pictos/common';
import {clamp, easeOutBack, easeOutCubic, useScene} from '../util';

export const ProgressBoxes: React.FC<{total: number; active: number; size: number; gap: number; x: number; y: number; dim?: number}> = ({total, active, size, gap, x, y, dim = 0.38}) => {
  const tw = total * size + (total - 1) * gap;
  return (
    <g transform={`translate(${x - tw / 2 + size / 2} ${y})`}>
      {Array.from({length: total}, (_, i) => {
        const on = i + 1 === active;
        return (
          <g key={i} transform={`translate(${i * (size + gap)} 0)`}>
            <rect x={-size / 2} y={-size / 2} width={size} height={size} rx={size * 0.18} fill={on ? W : 'none'} stroke={W} strokeWidth={Math.max(2, size * 0.06)} opacity={on ? 1 : dim} />
            <text x={0} y={size * 0.02} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight={700} fontSize={size * 0.48} fill={on ? INK : W} opacity={on ? 1 : dim + 0.1}>
              {i + 1}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/** Thẻ "RULE 1 — ACT NORMAL" */
export const RuleCard: React.FC<{v: any; total: number; active: number}> = ({v, total, active}) => {
  const {t, accent} = useScene();
  const cx = REF.cx;
  const cy = v.y ?? 300;
  const n = v.n ?? active;
  const pop = easeOutCubic(t / 0.4);
  const sc = 1.12 - 0.12 * pop;
  const flash = Math.max(0, 1 - t / 0.25);
  const lineP = easeOutCubic((t - 0.12) / 0.45);
  const titleP = easeOutCubic((t - 0.28) / 0.35);
  const boxX = cx + 150;
  return (
    <g>
      <g transform={`translate(${cx} ${cy}) scale(${sc}) translate(${-cx} ${-cy})`} opacity={pop}>
        <text x={boxX - 66 - 26} y={cy - 38} textAnchor="end" dominantBaseline="central" fontFamily={FONT} fontWeight={800} fontSize={92} letterSpacing={2} fill={W}>
          {String(v.word ?? 'RULE').toUpperCase()}
        </text>
        <rect x={boxX - 66} y={cy - 104} width={132} height={132} rx={22} fill={W} style={{filter: `drop-shadow(0 0 ${10 + flash * 30}px rgba(255,255,255,${0.5 + flash * 0.5}))`}} />
        <text x={boxX} y={cy - 36} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight={800} fontSize={112} fill={INK}>
          {n}
        </text>
      </g>
      <line x1={cx - 230 * lineP} y1={cy + 62} x2={cx + 230 * lineP} y2={cy + 62} stroke={accent} strokeWidth={4.5} style={{filter: `drop-shadow(0 0 7px ${accent})`}} />
      {v.title && (
        <text x={cx} y={cy + 110} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight={700} fontSize={46} letterSpacing={4} fill={W} opacity={titleP} transform={`translate(0 ${(1 - titleP) * 8})`}>
          {String(v.title).toUpperCase()}
        </text>
      )}
      {total > 0 && <ProgressBoxes total={total} active={active} size={38} gap={11} x={cx} y={cy + 196} />}
    </g>
  );
};
