import React from 'react';
import {Cross} from '../pictos/props';
import {COLORS, FONT, REF} from '../theme';
import {clamp, easeOutBack, rnd, useScene} from '../util';
import {W, INK} from '../pictos/common';

/** Hàng ô đánh số 1..N: pop lần lượt, gạch chéo đỏ, "CLASSIFIED". Dùng cho "THERE ARE SEVEN RULES". */
export const counterTimes = (v: any) => {
  const n = v.n ?? 7;
  const popStart = v.popStart ?? 0.1;
  const popGap = v.popGap ?? 0.13;
  return {n, popStart, popGap, popEnd: popStart + n * popGap};
};

export const Counter: React.FC<{v: any}> = ({v}) => {
  const {t, accent, gt} = useScene();
  const {n, popStart, popGap} = counterTimes(v);
  const size = v.size ?? Math.min(88, (880 - (n - 1) * 30) / n);
  const gap = v.gap ?? size * 0.34;
  const total = n * size + (n - 1) * gap;
  const x0 = REF.cx - total / 2 + size / 2;
  const y = v.y ?? 312;
  const crossed: number[] = v.crossed ?? [];
  const classified: number[] = v.classified ?? [];
  const crossAt = v.crossAt ?? 0.3;
  const classifiedAt = v.classifiedAt ?? 0.9;
  const dimOthers = classified.length > 0 && t >= classifiedAt;
  const nums = Array.from({length: n}, (_, i) => i + 1);
  return (
    <g>
      {nums.map((i) => {
        const cx = x0 + (i - 1) * (size + gap);
        const popT = v.static ? -9 : popStart + (i - 1) * popGap;
        const p = easeOutBack((t - popT) / 0.3);
        // ô số 2 xuất hiện nhỏ hơn một chút rồi lớn dần (như video mẫu)
        const sc = Math.max(0.001, v.static ? 1 : p);
        const isClassified = classified.includes(i);
        const morph = isClassified ? clamp((t - classifiedAt) / 0.14) : 0;
        const flick = isClassified && t >= classifiedAt && t < classifiedAt + 0.3 ? Math.floor(gt * 30) % 2 === 0 : false;
        const showIcon = isClassified && morph > 0 && (morph >= 1 || flick);
        const dim = dimOthers && !isClassified ? 0.2 : 1;
        const col = v.color ?? W;
        const cr = crossed.includes(i);
        return (
          <g key={i} transform={`translate(${cx} ${y}) scale(${sc})`} opacity={dim} style={dim < 1 ? {filter: 'blur(0.8px)'} : undefined}>
            {!showIcon ? (
              <>
                <rect x={-size / 2} y={-size / 2} width={size} height={size} rx={size * 0.17} fill="rgba(0,0,0,0.55)" stroke={col} strokeWidth={Math.max(3, size * 0.05)} />
                <text x={0} y={size * 0.02} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight={800} fontSize={size * 0.47} fill={col}>
                  {v.labels?.[i - 1] ?? i}
                </text>
              </>
            ) : (
              <g>
                <rect x={-size * 0.46} y={-size * 0.34} width={size * 0.92} height={size * 0.28} rx={size * 0.1} fill={W} />
                <rect x={-size * 0.46} y={size * 0.06} width={size * 0.92} height={size * 0.28} rx={size * 0.1} fill={W} />
                <rect x={-size * 0.34} y={-size * 0.01} width={size * 0.68} height={size * 0.045} fill={W} opacity={0.9} />
                <text x={0} y={size * 0.72} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size * 0.15} letterSpacing={2} fill={accent}>
                  {v.classifiedLabel ?? 'CLASSIFIED'}
                </text>
              </g>
            )}
            {cr && t >= crossAt && <Cross item={{w: size * 1.1, h: size * 1.1, stroke: Math.max(8, size * 0.12)}} t={t} lt={t - crossAt} accent={accent} />}
          </g>
        );
      })}
    </g>
  );
};
