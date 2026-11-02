import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

// --- COMPONENT NHÂN VẬT STICKMAN ---
export const Stickman: React.FC<{
  x?: number;
  y?: number;
  scale?: number;
  expression?: 'neutral' | 'skeptical' | 'smile' | 'talk';
  hoodieColor?: string;
}> = ({ x = 0, y = 0, scale = 1, expression = 'neutral', hoodieColor = '#1e66f5' }) => {
  const frame = useCurrentFrame();
  const blink = frame % 90 < 5 ? 0.1 : 1;
  const mouthOpen = expression === 'talk' ? Math.abs(Math.sin(frame * 0.4)) * 8 + 2 : 3;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
      }}
    >
      <svg width="240" height="400" viewBox="0 0 240 400">
        {/* Viền sáng Rim Light cam/hồng bên phải */}
        <circle cx="126" cy="80" r="55" fill="#f5a97f" />
        {/* Mũ Hoodie phía sau */}
        <path d="M 65 80 C 50 140, 60 200, 120 200 C 180 200, 190 140, 175 80 Z" fill={hoodieColor} />
        {/* Đầu nhân vật */}
        <circle cx="120" cy="80" r="55" fill="#11111b" />

        {/* Lông mày & Mắt */}
        <g transform={`translate(0, ${expression === 'skeptical' ? 4 : 0})`}>
          {/* Mắt trái */}
          <ellipse cx="105" cy="78" rx="9" ry={9 * blink} fill="#ffffff" />
          <line
            x1="92"
            y1="62"
            x2="116"
            y2={expression === 'skeptical' ? '66' : '60'}
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Mắt phải */}
          <ellipse cx="140" cy="78" rx="9" ry={9 * blink} fill="#ffffff" />
          <line
            x1="128"
            y1={expression === 'skeptical' ? '66' : '60'}
            x2="152"
            y2="62"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>

        {/* Miệng */}
        {expression === 'smile' ? (
          <path d="M 110 102 Q 123 115 136 102" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" />
        ) : (
          <rect x="112" y="102" width="22" height={mouthOpen} rx="3" fill="#ffffff" />
        )}

        {/* Thân áo Hoodie */}
        <path d="M 85 135 L 155 135 L 168 290 L 72 290 Z" fill="#f5a97f" transform="translate(5, 0)" />
        <path d="M 85 135 L 155 135 L 168 290 L 72 290 Z" fill={hoodieColor} />
        {/* Cổ và dây áo */}
        <rect x="113" y="128" width="14" height="25" fill="#11111b" />
        <line x1="112" y1="150" x2="112" y2="210" stroke="#ffffff" strokeWidth="3" />
        <line x1="128" y1="150" x2="128" y2="210" stroke="#ffffff" strokeWidth="3" />
      </svg>
    </div>
  );
};

// --- SCENE 1: $1,000,000 ZOOM & CHUYỂN CẢNH (00:00 - 00:04) ---
export const Scene1MoneyIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, 60], [1, 12], { extrapolateRight: 'clamp' });
  const showCharacter = frame >= 50;
  const charSpring = spring({ frame: frame - 50, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#111622', justifyContent: 'center', alignItems: 'center' }}>
      {!showCharacter ? (
        <div
          style={{
            fontSize: 150,
            fontWeight: 900,
            color: '#e5e0d5',
            fontFamily: 'Inter, sans-serif',
            transform: `scale(${zoom})`,
          }}
        >
          $1,000,000
        </div>
      ) : (
        <AbsoluteFill style={{ backgroundColor: '#232733' }}>
          {/* Background cửa hàng làm mờ */}
          <div style={{ filter: 'blur(5px)', width: '100%', height: '100%', background: '#2c3040' }}>
            <div style={{ position: 'absolute', left: 600, top: 150, width: 700, height: 450, background: '#1e222d', border: '8px solid #454b5e' }}>
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 32, padding: 15, letterSpacing: 6, fontWeight: 'bold' }}>
                ELECTRONICS
              </div>
            </div>
          </div>
          {/* Nhân vật chính xuất hiện */}
          <Stickman
            x={750}
            y={interpolate(charSpring, [0, 1], [600, 320])}
            scale={2.2}
            expression="skeptical"
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// --- SCENE 2: SPLIT SCREEN & APTITUDE TEST (00:17 - 00:25) ---
export const Scene2AptitudeTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stampProgress = spring({ frame: frame - 35, fps, config: { damping: 10, stiffness: 160 } });
  const stampScale = interpolate(stampProgress, [0, 1], [3, 1]);
  const stampOpacity = interpolate(frame, [35, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#161922', justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 1300,
          height: 720,
          backgroundColor: '#e6e9ef',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
          position: 'relative',
        }}
      >
        {/* Thanh tiêu đề xanh */}
        <div style={{ backgroundColor: '#1e3a8a', padding: '24px 48px', color: '#ffffff', fontSize: 36, fontWeight: 800, letterSpacing: 2 }}>
          APTITUDE TEST
        </div>

        {/* Điểm số bên trái */}
        <div style={{ padding: '60px 80px' }}>
          <div style={{ fontSize: 36, color: '#4b5563', fontWeight: 700 }}>SCORE</div>
          <div style={{ fontSize: 160, color: '#1f2937', fontWeight: 900, lineHeight: 1.1 }}>100</div>
        </div>

        {/* Biểu đồ hình chuông (Bell Curve) bên phải */}
        <svg width="600" height="360" style={{ position: 'absolute', right: 60, top: 160 }}>
          <line x1="40" y1="280" x2="560" y2="280" stroke="#374151" strokeWidth="4" />
          <path
            d="M 50 280 C 180 280, 220 50, 300 50 C 380 50, 420 280, 550 280"
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="6"
          />
          <line x1="300" y1="50" x2="300" y2="280" stroke="#dc2626" strokeWidth="3" strokeDasharray="6,6" />
          <polygon points="300,45 288,20 312,20" fill="#dc2626" />
          <text x="275" y="325" fontSize="32" fontWeight="bold" fill="#1f2937">100</text>
        </svg>

        {/* Con dấu EXACTLY AVERAGE */}
        <div
          style={{
            position: 'absolute',
            left: 80,
            bottom: 90,
            border: '8px solid #15803d',
            borderRadius: 12,
            padding: '12px 36px',
            color: '#15803d',
            fontSize: 44,
            fontWeight: 900,
            opacity: stampOpacity,
            transform: `rotate(-8deg) scale(${stampScale})`,
          }}
        >
          EXACTLY AVERAGE
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- SCENE 3: XÓA DỮ LIỆU KHỎI DANH SÁCH (00:26 - 00:31) ---
export const Scene3DataWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const names = ['KIM', 'JOSE', 'RITA', 'OMAR', 'LIN', 'LEO', 'PAUL', 'SAM'];
  const scrollY = interpolate(frame, [0, 40], [0, -60], { extrapolateRight: 'clamp' });
  const wipeWidth = interpolate(frame, [45, 75], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#111622', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 700, borderLeft: '3px solid #374151', borderRight: '3px solid #374151', padding: 40, transform: `translateY(${scrollY}px)` }}>
        {names.map((name) => {
          const isLeo = name === 'LEO';
          return (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '18px 28px',
                marginBottom: 16,
                border: isLeo ? '3px solid #eab308' : 'none',
                borderRadius: 12,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #9ca3af', marginRight: 24 }} />
              <div style={{ color: '#e5e7eb', fontSize: 36, fontWeight: 700, width: 160 }}>{name}</div>
              <div style={{ flex: 1, height: 14, backgroundColor: '#4b5563', borderRadius: 7 }} />

              {/* Hiệu ứng quét xóa mục LEO */}
              {isLeo && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${wipeWidth}%`,
                    backgroundColor: '#ca8a04',
                    opacity: 0.85,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// --- SCENE 4: ZOOM CHUNG CƯ PHÒNG 500 (00:49 - 00:56) ---
export const Scene4ApartmentZoom: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 90], [1, 4.5], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 180px)',
          gap: 36,
          padding: 60,
          backgroundColor: '#334155',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {Array.from({ length: 15 }).map((_, idx) => {
          const isTarget = idx === 7;
          return (
            <div
              key={idx}
              style={{
                width: 180,
                height: 220,
                backgroundColor: isTarget ? '#fef08a' : '#1e293b',
                border: '8px solid #1e293b',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {isTarget && (
                <>
                  <div style={{ position: 'absolute', top: -35, width: '100%', textAlign: 'center', color: '#facc15', fontWeight: 900, fontSize: 28 }}>
                    500
                  </div>
                  <Stickman x={-30} y={40} scale={0.65} expression="neutral" />
                </>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// --- ROOT COMPOSITION ---
export const StickmanStoryVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={90}>
        <Scene1MoneyIntro />
      </Sequence>
      <Sequence from={90} durationInFrames={90}>
        <Scene2AptitudeTest />
      </Sequence>
      <Sequence from={180} durationInFrames={90}>
        <Scene3DataWipe />
      </Sequence>
      <Sequence from={270} durationInFrames={90}>
        <Scene4ApartmentZoom />
      </Sequence>
    </AbsoluteFill>
  );
};
