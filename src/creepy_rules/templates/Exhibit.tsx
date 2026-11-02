import React from 'react';
import {staticFile} from 'remotion';
import {FONT, REF} from '../theme';
import {INK, W} from '../pictos/common';
import {clamp, easeOutCubic, rnd, useScene} from '../util';

/** Ảnh tư liệu "EXHIBIT A": khung ảnh nghiêng nhẹ, 4 góc ngắm, thanh đỏ + dòng chú thích bên phải. */
export const Exhibit: React.FC<{v: any}> = ({v}) => {
  const {t, dur, accent, gt} = useScene();
  const landscape = v.layout === 'landscape';
  const [cx, cy, w, h] = v.box ?? (landscape ? [452, 300, 540, 400] : [428, 298, 408, 478]);
  const [ix, iy] = v.info ?? [cx + w / 2 + 52, cy - h / 2 + 26];
  const p = clamp(t / dur);
  const intro = easeOutCubic(t / 0.35);
  const tilt = (v.tilt ?? (landscape ? 0.6 : -1.3)) + Math.sin(t * 0.8) * 0.35;
  const zoom = 1 + (v.zoom ?? 0.07) * p;
  const flick = 0.94 + 0.06 * rnd(`ex${Math.floor(gt * 9)}`);
  const id = `exclip${Math.round(cx)}${Math.round(cy)}`;
  const b = 7;
  const off = 13;
  const arm = 26;
  const corner = (sx: number, sy: number) => (
    <path d={`M${sx * (w / 2 + off)} ${sy * (h / 2 + off - arm)} L${sx * (w / 2 + off)} ${sy * (h / 2 + off)} L${sx * (w / 2 + off - arm)} ${sy * (h / 2 + off)}`} fill="none" stroke="#8a8a8a" strokeWidth={2.6} />
  );
  const lines: string[] = v.meta ?? [];
  return (
    <g opacity={intro}>
      <g transform={`translate(${cx} ${cy})`}>
        {corner(-1, -1)}{corner(1, -1)}{corner(-1, 1)}{corner(1, 1)}
        <g transform={`rotate(${tilt}) scale(${0.96 + 0.04 * intro})`}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={W} />
          <clipPath id={id}>
            <rect x={-w / 2 + b} y={-h / 2 + b} width={w - 2 * b} height={h - 2 * b} />
          </clipPath>
          <g clipPath={`url(#${id})`}>
            {v.image ? (
              <image href={staticFile(v.image)} x={-w / 2 + b} y={-h / 2 + b} width={w - 2 * b} height={h - 2 * b}
                preserveAspectRatio="xMidYMid slice"
                transform={`scale(${zoom})`}
                style={{filter: `grayscale(${v.gray === false ? 0 : 1}) contrast(1.12) brightness(${flick})`}} />
            ) : (
              <g>
                <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#242424" />
                <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={22} fill="#777" letterSpacing={3}>
                  {v.placeholder ?? 'PUT IMAGE IN public/images'}
                </text>
              </g>
            )}
          </g>
        </g>
      </g>
      <g opacity={easeOutCubic((t - 0.15) / 0.3)} transform={`translate(${ix} ${iy})`}>
        <rect x={0} y={-24} width={7} height={40} fill={accent} />
        <text x={22} y={-3} fontFamily={FONT} fontWeight={800} fontSize={31} letterSpacing={2} fill={W} dominantBaseline="central">
          {String(v.label ?? 'EXHIBIT A').toUpperCase()}
        </text>
        {lines.map((ln, i) => (
          <text key={i} x={22} y={32 + i * 26} fontFamily={FONT} fontWeight={600} fontSize={16.5} letterSpacing={2.2} fill={i === lines.length - 1 && v.dimLast ? '#6f6f6f' : '#a8a8a8'} dominantBaseline="central">
            {String(ln).toUpperCase()}
          </text>
        ))}
      </g>
    </g>
  );
};
