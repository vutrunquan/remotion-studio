import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';

// --- DỮ LIỆU PHỤ ĐỀ & ĐỒNG HỒ HUD ---
const SUBTITLES = [
  { start: 1, end: 5, text: 'IF YOUR ROBOT VACUUM EVER STOPS AT YOUR BEDROOM\nDOOR, DO NOT OPEN THE DOOR.' },
  { start: 5, end: 7, text: 'DO NOT CHECK THE APP.' },
  { start: 7, end: 9.8, text: 'AND DO NOT ASK IT WHERE IT HAS BEEN.' },
  { start: 10, end: 11, text: 'THERE ARE SEVEN RULES.' },
  { start: 11, end: 13, text: 'YOU WILL BREAK THE FIFTH ONE AT THREE TWELVE.' },
  { start: 13, end: 15, text: 'EVERYONE DOES.' },
  { start: 15, end: 17, text: 'YOU BOUGHT IT TO SAVE TIME.' },
  { start: 17, end: 19, text: 'IT CLEANS WHILE YOU ARE OUT.' },
  { start: 19, end: 21, text: 'IT FINDS ITS WAY BACK TO THE DOCK.' },
  { start: 21, end: 23, text: 'A GREEN LIGHT BLINKS ONCE A SECOND.' },
  { start: 23, end: 25, text: 'GREEN MEANS IT IS FINE.' },
  { start: 25, end: 27, text: 'EVERY ROOM HAS A NAME IN THE APP.' },
  { start: 27, end: 29, text: 'IT CHOSE THE NAMES ITSELF.' },
  { start: 29, end: 31, text: 'EVERY MORNING, THE BIN IS FULL.' },
  { start: 31, end: 33, text: 'YOU NEVER LOOK AT WHAT IS IN IT.' },
  { start: 33, end: 35, text: 'IT HAS NEVER BEEN IN YOUR BEDROOM.' },
  { start: 35, end: 37, text: 'YOU KEEP THAT DOOR SHUT.' },
  { start: 37, end: 40, text: 'TONIGHT, THE APP SHOWS ONE MORE ROOM.' },
  { start: 40, end: 41, text: 'RULE ONE.' },
  { start: 41, end: 42, text: 'DO NOT LOOK AT THE MAP.' },
  { start: 42, end: 44, text: 'AT ONE, YOUR PHONE LIGHTS UP.' },
  { start: 44, end: 45, text: '"CLEANING STARTED."' },
  { start: 45, end: 47, text: 'YOU DID NOT START IT.' },
  { start: 47, end: 49, text: 'YOU WILL WANT TO SEE WHERE IT IS.' },
  { start: 49, end: 51, text: 'EVERYONE OPENS THE APP.' },
  { start: 51, end: 53, text: 'YOU TELL YOURSELF IT IS A GLITCH.' },
  { start: 53, end: 54, text: 'A BAD UPDATE.' },
  { start: 54, end: 55, text: 'A CAT ON THE SENSOR.' },
  { start: 55, end: 57, text: 'YOU DO NOT HAVE A CAT.' },
  { start: 57, end: 59.5, text: 'A ROBOT VACUUM DRAWS YOUR HOME WHILE IT CLEANS.' },
  { start: 59.5, end: 60, text: 'IT NAMES THE ROOMS.' },
];

const getHudTime = (sec: number) => {
  if (sec < 15) return '00:58';
  if (sec < 19) return '10:00';
  if (sec < 25) return '10:30';
  if (sec < 29) return '10:31';
  if (sec < 33) return '07:00';
  if (sec < 40) return '00:59';
  if (sec < 47) return '01:00';
  if (sec < 55) return '01:01';
  return '01:02';
};

// --- CÁC COMPONENT ĐỒ HỌA DÙNG CHUNG ---
const RobotVacuum: React.FC<{ x: number; y: number; scale?: number; glow?: boolean }> = ({
  x,
  y,
  scale = 1,
  glow = true,
}) => {
  const frame = useCurrentFrame();
  const blink = Math.sin(frame * 0.25) > 0 ? 1 : 0.2;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      {glow && (
        <div
          style={{
            position: 'absolute',
            width: 160,
            height: 90,
            left: -20,
            top: -45,
            background: 'radial-gradient(circle, rgba(34,197,94,0.45) 0%, rgba(0,0,0,0) 70%)',
            opacity: blink,
          }}
        />
      )}
      <svg width="120" height="45" viewBox="0 0 120 45">
        <ellipse cx="60" cy="28" rx="56" ry="12" fill="#000" stroke="#fff" strokeWidth="3" />
        <path d="M4 16 L4 28 A56 12 0 0 0 116 28 L116 16" fill="#000" stroke="#fff" strokeWidth="3" />
        <ellipse cx="60" cy="16" rx="56" ry="12" fill="#000" stroke="#fff" strokeWidth="3" />
        <circle cx="60" cy="16" r="5" fill="#22c55e" opacity={blink} />
      </svg>
    </div>
  );
};

const RedCross: React.FC<{ x: number; y: number; size?: number; progress: number }> = ({
  x,
  y,
  size = 60,
  progress,
}) => {
  const p1 = interpolate(progress, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' });
  const p2 = interpolate(progress, [0.5, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <svg
      width={size}
      height={size}
      style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, overflow: 'visible' }}
    >
      <line x1="0" y1="0" x2={size * p1} y2={size * p1} stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
      {p2 > 0 && (
        <line
          x1={size}
          y1="0"
          x2={size * (1 - p2)}
          y2={size * p2}
          stroke="#ef4444"
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

// --- CÁC PHÂN CẢNH (SCENES) ---

// Scene 1 & 8: Hành lang & Cửa phòng ngủ
const HallwayScene: React.FC<{ locked?: boolean }> = ({ locked = false }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [30, 90], [1, 1.18], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const robotX = locked
    ? interpolate(frame, [0, 60], [820, 660], { extrapolateRight: 'clamp' })
    : interpolate(frame, [0, 65], [580, 1020], { extrapolateRight: 'clamp' });
  const crossProgress = interpolate(frame, [95, 115], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: '60% 60%' }}>
      {/* Đường chân tường */}
      <div style={{ position: 'absolute', top: 760, left: 260, width: 1350, height: 2, background: '#555' }} />
      {/* Khung tranh treo tường */}
      <svg width="180" height="120" style={{ position: 'absolute', left: 480, top: 420 }}>
        <rect x="2" y="2" width="176" height="116" rx="6" fill="none" stroke="#666" strokeWidth="3" />
        <polyline points="20,95 65,45 105,80 135,55 160,95" fill="none" stroke="#666" strokeWidth="3" />
        <circle cx="135" cy="35" r="8" fill="none" stroke="#666" strokeWidth="3" />
      </svg>
      {/* Ổ điện */}
      <div
        style={{
          position: 'absolute',
          left: 810,
          top: 665,
          width: 34,
          height: 50,
          border: '2px solid #777',
          borderRadius: 4,
        }}
      />
      {/* Ánh sáng vàng khe cửa */}
      <div
        style={{
          position: 'absolute',
          left: 1060,
          top: 680,
          width: 280,
          height: 120,
          background: 'radial-gradient(ellipse at center, rgba(250,204,21,0.55) 0%, rgba(0,0,0,0) 70%)',
        }}
      />
      {/* Cánh cửa trắng */}
      <div
        style={{
          position: 'absolute',
          left: 1080,
          top: 310,
          width: 240,
          height: 450,
          border: '4px solid #fff',
          padding: 14,
          background: '#000',
        }}
      >
        <div style={{ width: '100%', height: '100%', background: '#fff', padding: 18, boxSizing: 'border-box' }}>
          <div style={{ width: '100%', height: 170, border: '3px solid #000', marginBottom: 24 }} />
          <div style={{ width: '100%', height: 170, border: '3px solid #000', position: 'relative' }}>
            {locked && frame > 75 && (
              <div style={{ position: 'absolute', left: 55, top: 35, fontSize: 70, color: '#000' }}>🔒</div>
            )}
          </div>
          <div
            style={{
              position: 'absolute',
              right: 28,
              top: 225,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#000',
            }}
          />
        </div>
      </div>

      <RobotVacuum x={robotX} y={745} />

      {!locked && crossProgress > 0 && <RedCross x={1290} y={540} size={90} progress={crossProgress} />}
      {locked && crossProgress > 0 && <RedCross x={1200} y={755} size={50} progress={crossProgress} />}
    </AbsoluteFill>
  );
};

// Scene 2: Hộp cảnh báo & Glitch
const WarningBoxesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const crossP = interpolate(frame, [30, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const showSecond = frame >= 60;
  const isGlitch = frame >= 120;
  const glitchOffset = isGlitch ? Math.sin(frame * 4) * 14 : 0;

  return (
    <AbsoluteFill style={{ transform: `translateX(${glitchOffset}px)` }}>
      <RobotVacuum x={960} y={280} scale={1.1} />
      <div
        style={{
          position: 'absolute',
          left: 510,
          top: 410,
          width: 780,
          height: 100,
          border: '3px solid #fff',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 54,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: 2,
        }}
      >
        CHECK THE APP
      </div>
      {crossP > 0 && <RedCross x={900} y={460} size={110} progress={crossP} />}

      {showSecond && (
        <div
          style={{
            position: 'absolute',
            left: 380,
            top: 590,
            width: 1000,
            height: 100,
            border: '3px solid #fff',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: 2,
          }}
        >
          ASK WHERE IT HAS BEEN
        </div>
      )}
    </AbsoluteFill>
  );
};

// Scene 3: 7 Ô Quy Tắc
const SevenRulesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const rules = [1, 2, 3, 4, 5, 6, 7];
  const isRed = frame >= 60;
  const showTime = frame >= 90;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 18 }}>
        {rules.map((num, idx) => {
          const appear = frame >= idx * 5;
          const highlight = num === 5 && isRed;
          return (
            <div
              key={num}
              style={{
                width: 120,
                height: 120,
                borderRadius: 12,
                background: highlight ? '#dc2626' : '#fff',
                color: highlight ? '#fff' : '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 64,
                fontWeight: 900,
                opacity: appear ? 1 : 0,
              }}
            >
              {num}
            </div>
          );
        })}
      </div>
      {showTime && (
        <div
          style={{
            position: 'absolute',
            top: 640,
            left: 1045,
            color: '#facc15',
            fontSize: 48,
            fontWeight: 800,
          }}
        >
          3:12
        </div>
      )}
    </AbsoluteFill>
  );
};

// Scene 4: Phòng khách thường ngày
const LivingRoomScene: React.FC = () => {
  const frame = useCurrentFrame();
  const personX = interpolate(frame, [45, 90], [560, 1540], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const personOpacity = interpolate(frame, [95, 115], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const robotX =
    frame < 110
      ? interpolate(frame, [40, 105], [430, 1100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : interpolate(frame, [110, 175], [1100, 430], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 760, left: 180, width: 1560, height: 2, background: '#555' }} />
      {/* Cửa sổ */}
      <div
        style={{
          position: 'absolute',
          left: 340,
          top: 230,
          width: 180,
          height: 180,
          border: '4px solid #fff',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
        }}
      >
        <div style={{ border: '1px solid #fff' }} />
        <div style={{ border: '1px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #facc15' }} />
        </div>
        <div style={{ border: '1px solid #fff' }} />
        <div style={{ border: '1px solid #fff' }} />
      </div>
      {/* Trạm sạc */}
      <div
        style={{
          position: 'absolute',
          left: 240,
          top: 670,
          width: 90,
          height: 90,
          background: '#fff',
          borderRadius: 12,
        }}
      />
      {/* Sofa */}
      <div
        style={{
          position: 'absolute',
          left: 650,
          top: 560,
          width: 520,
          height: 195,
          background: '#fff',
          borderRadius: 20,
          border: '4px solid #000',
        }}
      />
      {/* Cửa ra vào */}
      <div
        style={{
          position: 'absolute',
          left: 1440,
          top: 380,
          width: 190,
          height: 380,
          border: '4px solid #fff',
          padding: 8,
        }}
      >
        <div style={{ width: '100%', height: '100%', background: frame > 80 && frame < 120 ? '#000' : '#fff' }} />
      </div>
      {/* Nhân vật YOU */}
      <div style={{ position: 'absolute', left: personX, top: 460, opacity: personOpacity, textAlign: 'center' }}>
        <div style={{ color: '#facc15', fontWeight: 800, fontSize: 24, marginBottom: 8 }}>YOU</div>
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#fff', margin: '0 auto 8px' }} />
        <div style={{ width: 64, height: 110, borderRadius: 14, background: '#fff', margin: '0 auto' }} />
      </div>
      <RobotVacuum x={robotX} y={745} />
    </AbsoluteFill>
  );
};

// Scene 5 & 13: Cận cảnh Robot (có hoặc không có bóng mèo nét đứt)
const CloseupRobotScene: React.FC<{ showGhostCat?: boolean }> = ({ showGhostCat = false }) => {
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      {showGhostCat && (
        <svg width="220" height="260" style={{ position: 'absolute', top: 260 }}>
          <ellipse
            cx="110"
            cy="190"
            rx="55"
            ry="65"
            fill="none"
            stroke="#888"
            strokeWidth="3"
            strokeDasharray="8 6"
          />
          <circle cx="110" cy="95" r="40" fill="none" stroke="#888" strokeWidth="3" strokeDasharray="8 6" />
          <polygon points="75,65 85,25 105,58" fill="none" stroke="#888" strokeWidth="3" strokeDasharray="6 4" />
          <polygon points="145,65 135,25 115,58" fill="none" stroke="#888" strokeWidth="3" strokeDasharray="6 4" />
        </svg>
      )}
      <RobotVacuum x={960} y={600} scale={4.2} />
    </AbsoluteFill>
  );
};

// Scene 6 & 9: Bản đồ trên App (Map View)
const MapAppScene: React.FC<{ showExtraRoom?: boolean }> = ({ showExtraRoom = false }) => {
  const frame = useCurrentFrame();
  const showNames = showExtraRoom || frame > 60;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 840,
          height: 580,
          border: '4px solid #fff',
          borderRadius: 18,
          position: 'relative',
          padding: 28,
        }}
      >
        <div style={{ color: '#aaa', fontSize: 24, fontWeight: 700, letterSpacing: 3 }}>MAP</div>
        <div
          style={{
            position: 'absolute',
            right: 28,
            top: 28,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#22c55e',
          }}
        />
        {/* Khung các phòng */}
        <div
          style={{
            position: 'absolute',
            left: 50,
            top: 85,
            width: 580,
            height: 450,
            border: '3px solid #fff',
          }}
        >
          {/* KITCHEN */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: 230, height: 220, border: '2px solid #fff' }}>
            {showNames && <span style={roomLabelStyle}>KITCHEN</span>}
          </div>
          {/* LIVING ROOM */}
          <div style={{ position: 'absolute', left: 0, top: 220, width: 230, height: 230, border: '2px solid #fff' }}>
            {showNames && <span style={roomLabelStyle}>LIVING ROOM</span>}
          </div>
          {/* HALL */}
          <div style={{ position: 'absolute', left: 230, top: 110, width: 130, height: 340, border: '2px solid #fff' }}>
            {showNames && <span style={roomLabelStyle}>HALL</span>}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#fff',
                margin: '160px auto 0',
              }}
            />
          </div>
          {/* BATHROOM */}
          <div style={{ position: 'absolute', left: 360, top: 0, width: 220, height: 180, border: '2px solid #fff' }}>
            {showNames && <span style={roomLabelStyle}>BATHROOM</span>}
          </div>
          {/* BEDROOM */}
          <div style={{ position: 'absolute', left: 360, top: 180, width: 220, height: 270, border: '2px solid #fff' }}>
            {showNames && <span style={roomLabelStyle}>BEDROOM</span>}
          </div>
        </div>

        {/* Phòng số 6 bí ẩn */}
        {showExtraRoom && frame > 25 && (
          <div
            style={{
              position: 'absolute',
              left: 645,
              top: 300,
              width: 140,
              height: 235,
              border: '3px dashed #aaa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#aaa',
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            6
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const roomLabelStyle: React.CSSProperties = {
  display: 'block',
  textAlign: 'center',
  marginTop: 75,
  color: '#fff',
  fontWeight: 800,
  fontSize: 22,
  letterSpacing: 1.5,
};

// Scene 10: Rule 1 Title Card
const RuleOneScene: React.FC = () => {
  const frame = useCurrentFrame();
  const lineW = interpolate(frame, [0, 25], [0, 460], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontSize: 130, fontWeight: 900, color: '#fff', letterSpacing: 4 }}>RULE</span>
        <div
          style={{
            width: 135,
            height: 135,
            background: '#fff',
            color: '#000',
            borderRadius: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 105,
            fontWeight: 900,
          }}
        >
          1
        </div>
      </div>
      <div style={{ width: lineW, height: 6, background: '#dc2626', marginTop: 18 }} />
      {frame > 25 && (
        <div style={{ color: '#fff', fontSize: 44, fontWeight: 800, marginTop: 32, letterSpacing: 2 }}>
          DO NOT LOOK AT THE MAP
        </div>
      )}
    </AbsoluteFill>
  );
};

// Scene 11: Phòng ngủ lúc 1:00 AM
const BedroomNightScene: React.FC = () => {
  const frame = useCurrentFrame();
  const phoneGlow = frame > 20;
  const isGlitch = frame >= 85 && frame <= 105;
  const sitUp = frame >= 150;

  return (
    <AbsoluteFill style={{ filter: isGlitch ? 'drop-shadow(6px 0 0 #ef4444) drop-shadow(-6px 0 0 #3b82f6)' : 'none' }}>
      <div style={{ position: 'absolute', top: 760, left: 160, width: 1600, height: 2, background: '#555' }} />
      {/* Tủ đầu giường */}
      <div style={{ position: 'absolute', left: 290, top: 600, width: 140, height: 160, background: '#fff' }} />
      {/* Điện thoại phát sáng & Thông báo */}
      {phoneGlow && !sitUp && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 325,
              top: 585,
              width: 70,
              height: 12,
              background: '#facc15',
              boxShadow: '0 0 40px 15px rgba(250,204,21,0.65)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 160,
              top: 430,
              padding: '18px 36px',
              border: '3px solid #fff',
              borderRadius: 12,
              background: '#000',
              color: '#fff',
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            CLEANING STARTED
          </div>
        </>
      )}
      {/* Giường ngủ */}
      <div style={{ position: 'absolute', left: 490, top: 530, width: 22, height: 230, background: '#fff' }} />
      <div style={{ position: 'absolute', left: 490, top: 700, width: 650, height: 35, background: '#fff' }} />
      {!sitUp ? (
        <div
          style={{
            position: 'absolute',
            left: 570,
            top: 635,
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: '#fff',
          }}
        />
      ) : (
        /* Nhân vật ngồi dậy cầm điện thoại */
        <div style={{ position: 'absolute', left: 960, top: 470 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff', marginBottom: 10 }} />
          <div style={{ width: 56, height: 140, borderRadius: 14, background: '#fff' }} />
          <div
            style={{
              position: 'absolute',
              left: 95,
              top: 10,
              width: 65,
              height: 110,
              border: '3px solid #facc15',
              borderRadius: 10,
              transform: 'rotate(-12deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#facc15',
              fontSize: 38,
              fontWeight: 900,
              boxShadow: '0 0 50px 10px rgba(250,204,21,0.4)',
            }}
          >
            ?
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Scene 12: 3 Lý do (A Glitch / A Bad Update / A Cat on the Sensor)
const ExcusesStackScene: React.FC = () => {
  const frame = useCurrentFrame();
  const items = [
    { text: 'A GLITCH', appear: 0, dimAt: 60 },
    { text: 'A BAD UPDATE', appear: 60, dimAt: 105 },
    { text: 'A CAT ON THE SENSOR', appear: 105, dimAt: 999 },
  ];
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 36 }}>
      {items.map((it, i) => {
        if (frame < it.appear) return null;
        const dimmed = frame >= it.dimAt;
        return (
          <div
            key={i}
            style={{
              padding: '22px 64px',
              border: '3px solid #fff',
              borderRadius: 10,
              color: '#fff',
              fontSize: 48,
              fontWeight: 800,
              opacity: dimmed ? 0.35 : 1,
            }}
          >
            {it.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// --- COMPONENT TỔNG HỢP ---
export const BotCase002: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const activeSub = SUBTITLES.find((s) => sec >= s.start && sec < s.end);
  const recBlink = Math.sin(frame * 0.2) > 0 ? 1 : 0.25;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* LỚP PHÂN CẢNH */}
      <Sequence durationInFrames={150}>
        <HallwayScene />
      </Sequence>
      <Sequence from={150} durationInFrames={150}>
        <WarningBoxesScene />
      </Sequence>
      <Sequence from={300} durationInFrames={150}>
        <SevenRulesScene />
      </Sequence>
      <Sequence from={450} durationInFrames={180}>
        <LivingRoomScene />
      </Sequence>
      <Sequence from={630} durationInFrames={120}>
        <CloseupRobotScene />
      </Sequence>
      <Sequence from={750} durationInFrames={120}>
        <MapAppScene />
      </Sequence>
      <Sequence from={870} durationInFrames={120}>
        <LivingRoomScene />
      </Sequence>
      <Sequence from={990} durationInFrames={120}>
        <HallwayScene locked />
      </Sequence>
      <Sequence from={1110} durationInFrames={90}>
        <MapAppScene showExtraRoom />
      </Sequence>
      <Sequence from={1200} durationInFrames={60}>
        <RuleOneScene />
      </Sequence>
      <Sequence from={1260} durationInFrames={240}>
        <BedroomNightScene />
      </Sequence>
      <Sequence from={1500} durationInFrames={150}>
        <ExcusesStackScene />
      </Sequence>
      <Sequence from={1650} durationInFrames={60}>
        <CloseupRobotScene showGhostCat />
      </Sequence>
      <Sequence from={1710} durationInFrames={90}>
        <MapAppScene />
      </Sequence>

      {/* GLOBAL HUD TRÊN CÙNG */}
      <div
        style={{
          position: 'absolute',
          top: 48,
          left: 72,
          right: 140,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#888',
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 3,
        }}
      >
        <div>B.O.T. — CASE 002</div>
        {sec >= 40 && (
          <div style={{ display: 'flex', gap: 12 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <div
                key={d}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: d === 0 ? '#fff' : 'transparent',
                  border: '2px solid #888',
                }}
              />
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#ef4444',
              opacity: recBlink,
            }}
          />
          <span>{getHudTime(sec)}</span>
        </div>
      </div>

      {/* GLOBAL SUBTITLES DƯỚI ĐÁY */}
      {activeSub && (
        <div
          style={{
            position: 'absolute',
            bottom: 85,
            width: '100%',
            textAlign: 'center',
            color: '#fff',
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 1.5,
            lineHeight: 1.4,
            whiteSpace: 'pre-line',
          }}
        >
          {activeSub.text}
        </div>
      )}
    </AbsoluteFill>
  );
};
