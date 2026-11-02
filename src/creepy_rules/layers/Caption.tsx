import React from 'react';
import type {Layout} from '../layout';
import {FONT} from '../theme';
import {clamp, easeOutCubic, splitHighlight} from '../util';

/** Phụ đề kể chuyện: chữ in hoa Montserrat đậm, giữa dưới, tối đa 2 dòng cân bằng, phát sáng nhẹ. */
export const Caption: React.FC<{text: string; t: number; at: number; layout: Layout; accent: string; glow: number}> = ({text, t, at, layout, accent, glow}) => {
  const p = easeOutCubic((t - at) / 0.2);
  if (!text || p <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: layout.captionY, display: 'flex', justifyContent: 'center', transform: 'translateY(-50%)'}}>
      <div
        style={{
          fontFamily: FONT, fontWeight: 700, fontSize: layout.captionSize, letterSpacing: '0.035em', lineHeight: 1.22,
          textTransform: 'uppercase', textAlign: 'center', color: '#fff', maxWidth: layout.captionMaxW,
          textWrap: 'balance' as any, opacity: p, transform: `translateY(${(1 - p) * 10}px)`,
          textShadow: glow > 0 ? `0 0 ${6 * glow}px rgba(255,255,255,0.55), 0 0 ${22 * glow}px rgba(255,255,255,0.18)` : 'none',
        }}
      >
        {splitHighlight(text).map((s, i) => (
          <span key={i} style={s.hl ? {color: accent, textShadow: `0 0 ${10 * glow}px ${accent}`} : undefined}>{s.text}</span>
        ))}
      </div>
    </div>
  );
};
