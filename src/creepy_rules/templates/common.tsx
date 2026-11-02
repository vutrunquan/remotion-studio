import React from 'react';
import {FONT} from '../theme';
import {splitHighlight} from '../util';

/** Nhiều dòng chữ SVG, hỗ trợ *nhấn* */
export const SvgLines: React.FC<{
  text: string; x: number; y: number; size: number; weight?: number; spacing?: number; lineHeight?: number;
  anchor?: 'start' | 'middle' | 'end'; fill?: string; accent: string; opacity?: number;
}> = ({text, x, y, size, weight = 800, spacing = 2, lineHeight = 1.18, anchor = 'middle', fill = '#fff', accent, opacity = 1}) => {
  const lines = String(text ?? '').toUpperCase().split('\n');
  const y0 = y - ((lines.length - 1) * size * lineHeight) / 2;
  return (
    <text x={x} y={y0} textAnchor={anchor} fontFamily={FONT} fontWeight={weight} fontSize={size} letterSpacing={spacing} fill={fill} opacity={opacity} dominantBaseline="central">
      {lines.map((ln, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : size * lineHeight}>
          {splitHighlight(ln).map((seg, j) => (
            <tspan key={j} fill={seg.hl ? accent : fill}>{seg.text}</tspan>
          ))}
        </tspan>
      ))}
    </text>
  );
};
