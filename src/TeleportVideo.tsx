import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { DetailedCharacter } from './components/Character';
import {
  CameraRig,
  SuburbanHouseAndStreet,
  DetailedBus,
  SneakerProp,
  TeleportBurst3D,
  CinematicLighting,
  AtmosphericDust,
} from './components/WorldProps';
import { Soundtrack } from './components/Soundtrack';

// =========================================================
// PHỤ ĐỀ CHUẨN THEO TỪNG CÂU THOẠI (00:00 - 01:05)
// =========================================================
const SUBTITLES = [
  { start: 0, end: 95, text: "You're late again. The bus is already pulling away from the corner..." },
  { start: 95, end: 165, text: "...and you're still on your porch with one shoe on." },
  { start: 165, end: 315, text: "So you look at the bus. You picture the seat in the back, the one by the window." },
  { start: 315, end: 355, text: "And you blink." },
  { start: 355, end: 470, text: "And you're on the bus. Sort of. You're sitting on somebody." },
  { start: 470, end: 545, text: '"Bro, where did you come from?"' },
  { start: 545, end: 610, text: '"I\'ve been here the whole time."' },
  { start: 610, end: 685, text: "He stares at you. Everybody stares at you." },
  { start: 685, end: 755, text: "Your other shoe is still on the porch." },
  { start: 755, end: 990, text: "So what if you could teleport? Here's how it works. First, the crazy part: teleportation is real. Kind of." },
  { start: 990, end: 1170, text: "In 1997, scientists in Innsbruck, Austria teleported a particle of light." },
  { start: 1170, end: 1350, text: "Not the light itself—its information. One photon became an exact copy of another without anything traveling between them." },
  { start: 1350, end: 1560, text: "In 2017, a satellite called Micius did it from space over a distance of up to 1,400 km." },
  { start: 1560, end: 1680, text: "But a photon is one tiny thing. You are not." },
  { start: 1680, end: 1830, text: "Some students at the University of Leicester worked out how much information it would take to describe one human being: a number with 43 digits." },
  { start: 1830, end: 1950, text: "Sending that much data would take about 350,000 times longer than the age of the universe." },
];

// =========================================================
// HIỆU ỨNG SÓNG NĂNG LƯỢNG & CHỚP GLITCH (CINEMATIC TELEPORT FX)
// =========================================================
const GlitchFlashOverlay: React.FC<{ triggerFrame: number }> = ({ triggerFrame }) => {
  const frame = useCurrentFrame();
  const diff = Math.abs(frame - triggerFrame);
  if (diff > 8) return null;

  const opacity = interpolate(diff, [0, 8], [0.95, 0], {
    easing: Easing.out(Easing.quad),
    extrapolateRight: 'clamp',
  });
  const ringScale = interpolate(diff, [0, 8], [0.2, 2.5], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 85, opacity }}>
      {/* Vòng sóng chấn động tỏa rộng trên toàn màn hình */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 400,
          height: 400,
          marginLeft: -200,
          marginTop: -200,
          borderRadius: '50%',
          border: '6px solid #22d3ee',
          boxShadow: '0 0 40px #22d3ee, inset 0 0 30px #f43f5e',
          transform: `scale(${ringScale})`,
          opacity: 1 - diff / 8,
        }}
      />
      {/* Dải quét quang sai màu (Chromatic Aberration Scanlines) */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background:
            'repeating-linear-gradient(0deg, rgba(34,211,238,0.4) 0px, #ffffff 4px, rgba(244,63,94,0.4) 8px, transparent 16px)',
          mixBlendMode: 'screen',
        }}
      />
    </AbsoluteFill>
  );
};

// =========================================================
// PHÂN CẢNH 1 (00:00 - 00:11): TRÊN HIÊN NHÀ & XE BUÝT CHẠY XA
// (Ống kính Dolly mượt mà, chuyển động xe buýt có gia tốc tự nhiên)
// =========================================================
const Act1PorchMultiCam: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Xe buýt tăng tốc mượt mà có quán tính (Easing in-out)
  const busX = interpolate(frame, [0, 335], [-0.8, 12.5], {
    easing: Easing.bezier(0.35, 0, 0.25, 1),
    extrapolateRight: 'clamp',
  });

  // 4 Góc quay mượt mà với camera dolly chuyển động chậm:
  let camPos: [number, number, number] = [-0.6, 2.1, 4.8];
  let lookAt: [number, number, number] = [-1.2, 1.25, -1.5];

  if (frame < 95) {
    // Shot 1: Camera từ từ dolly sang trái theo dõi nhân vật
    const t = frame / 95;
    camPos = [-0.6 - t * 0.4, 2.1 + t * 0.08, 4.8 - t * 0.3];
    lookAt = [-1.2 - t * 0.3, 1.25, -1.5];
  } else if (frame >= 95 && frame < 165) {
    // Shot 2: Cận cảnh bàn chân, camera hạ thấp từ từ zoom vào chiếc giày
    const t = (frame - 95) / 70;
    const smoothT = Easing.out(Easing.cubic)(t);
    camPos = [-2.1 - smoothT * 0.15, 1.15 - smoothT * 0.1, 2.2 - smoothT * 0.25];
    lookAt = [-2.9, 0.62, 0.2];
  } else if (frame >= 165 && frame < 265) {
    // Shot 3: Góc nhìn từ hiên nhà hướng theo xe buýt đang chạy đi
    camPos = [-2.5, 1.85, 1.2];
    lookAt = [busX - 1.2, 1.25, -4.5];
  } else if (frame >= 265) {
    // Shot 4: Extreme Close-up vào mắt nhân vật, zoom chậm kịch tính
    const t = (frame - 265) / 70;
    const zoomIn = Easing.out(Easing.quad)(t) * 0.2;
    camPos = [-2.15 + zoomIn * 0.5, 1.98, 1.15 - zoomIn];
    lookAt = [-2.8, 1.92, 0.15];
  }

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #38bdf8 0%, #bae6fd 60%, #15803d 100%)',
      }}
    >
      <ThreeCanvas width={width} height={height}>
        <CameraRig
          position={camPos}
          lookAt={lookAt}
          fov={45}
          animTime={frame}
        />
        <CinematicLighting sunPosition={[9, 15, 9]} />
        <AtmosphericDust animTime={frame} count={28} />

        <SuburbanHouseAndStreet />

        {/* Nhân vật chính trên hiên nhà với hơi thở & nhấp nháy mắt tự nhiên */}
        <DetailedCharacter
          position={[-2.8, 0.44, 0.15]}
          rotation={[0, frame >= 265 ? 0.35 : 0.75, 0]}
          oneShoeOnly={true}
          pose="idle"
          eyeState={frame > 318 ? 'blink' : frame > 270 ? 'squint' : 'wide'}
          animTime={frame}
        />

        {/* Chiếc giày thứ hai lẻ loi trên sàn hiên */}
        <SneakerProp position={[-3.3, 0.46, 0.45]} rotation={[0, 0.6, 0]} scale={1.15} />

        {/* Xe buýt vàng có đèn pha volumetric */}
        <DetailedBus busX={busX} highlightRearSeat={frame >= 165 && frame < 265} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// =========================================================
// PHÂN CẢNH 2 (00:11 - 00:25): TRÊN XE BUÝT & CẢNH CẮT CHIẾC GIÀY
// (Có độ rung chấn vật lý khi rơi xuống đùi, góc nhìn ngang mặt siêu sắc nét)
// =========================================================
const Act2InsideBusMultiCam: React.FC = () => {
  const frame = useCurrentFrame(); // 0 -> 420
  const { width, height } = useVideoConfig();

  const isPorchCutaway = frame >= 350;

  // Hiệu ứng rơi có nhún lò xo vật lý chân thực (Spring with damping)
  const dropY = spring({ frame, fps: 30, from: 1.45, to: 0.58, config: { damping: 12, mass: 0.8 } });
  const burstProgress = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: 'clamp' });

  // Rung lắc nhẹ của camera khi nhân vật rơi bịch xuống ghế
  const impactShake =
    frame < 16 ? Math.sin(frame * 1.5) * Math.exp(-frame * 0.22) * 0.09 : 0;

  // Hành khách quay đầu nhìn mượt mà (Cubic Easing)
  const headTurn = interpolate(frame, [260, 310], [0, 0.68], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 5 Góc quay điện ảnh
  let camPos: [number, number, number] = [0.25, 2.35, 4.4];
  let lookAt: [number, number, number] = [-0.45, 1.65, 0.2];

  if (frame >= 135 && frame < 210) {
    // Cận cảnh khi hỏi: "Bro, where did you come from?"
    camPos = [-0.15, 2.15, 2.45];
    lookAt = [-0.95, 1.95, 0.25];
  } else if (frame >= 210 && frame < 275) {
    // Cận cảnh nhân vật chính đáp: "I've been here the whole time."
    camPos = [-0.35, 2.25, 2.35];
    lookAt = [-0.95, 2.1, 0.4];
  } else if (frame >= 275 && frame < 350) {
    // Toàn cảnh cả xe nhìn chằm chằm
    camPos = [0.0, 2.45, 5.2];
    lookAt = [0.0, 1.75, -0.4];
  } else if (isPorchCutaway) {
    // Cắt về chiếc giày trên hiên nhà
    const t = (frame - 350) / 70;
    camPos = [-2.2 - t * 0.1, 1.05, 1.85 - t * 0.15];
    lookAt = [-3.1, 0.5, 0.35];
  }

  return (
    <AbsoluteFill
      style={{
        background: isPorchCutaway
          ? 'linear-gradient(180deg, #38bdf8 0%, #bae6fd 60%, #15803d 100%)'
          : '#0f172a',
      }}
    >
      <ThreeCanvas width={width} height={height}>
        <CameraRig
          position={camPos}
          lookAt={lookAt}
          fov={46}
          shake={impactShake}
          animTime={frame}
        />
        <ambientLight intensity={0.9} color="#e2e8f0" />
        <directionalLight position={[4, 8, 6]} intensity={1.25} color="#fffbeb" />
        <AtmosphericDust animTime={frame} count={18} />

        {!isPorchCutaway ? (
          <group>
            {/* Sàn xe buýt */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[4.6, 0.15, 10]} />
              <meshStandardMaterial color="#334155" roughness={0.6} />
            </mesh>
            {/* Vách xe & Dãy cửa sổ kính */}
            <mesh position={[-2.25, 1.6, 0]}>
              <boxGeometry args={[0.15, 3.2, 10]} />
              <meshStandardMaterial color="#eab308" roughness={0.4} />
            </mesh>
            <mesh position={[-2.16, 2.0, 0]}>
              <boxGeometry args={[0.05, 1.1, 8.5]} />
              <meshBasicMaterial color="#7dd3fc" />
            </mesh>
            <mesh position={[2.25, 1.6, 0]}>
              <boxGeometry args={[0.15, 3.2, 10]} />
              <meshStandardMaterial color="#eab308" roughness={0.4} />
            </mesh>
            <mesh position={[2.16, 2.0, 0]}>
              <boxGeometry args={[0.05, 1.1, 8.5]} />
              <meshBasicMaterial color="#7dd3fc" />
            </mesh>

            {/* Ghế ngồi của hành khách */}
            <mesh position={[-1.0, 0.45, 0.05]}>
              <boxGeometry args={[1.35, 0.85, 0.85]} />
              <meshStandardMaterial color="#0f766e" roughness={0.5} />
            </mesh>

            {/* Hành khách áo cam */}
            <DetailedCharacter
              position={[-1.0, 0.18, 0.22]}
              hoodieColor="#ea580c"
              pose="sit"
              eyeState="wide"
              talking={frame >= 135 && frame < 210}
              animTime={frame}
            />

            {/* Nhân vật chính ngồi trên đùi */}
            <DetailedCharacter
              position={[-0.96, dropY, 0.46]}
              hoodieColor="#2563eb"
              oneShoeOnly={true}
              pose="lapSit"
              eyeState={frame >= 210 && frame < 275 ? 'squint' : 'wide'}
              talking={frame >= 210 && frame < 275}
              animTime={frame}
            />

            <TeleportBurst3D position={[-0.96, 1.5, 0.46]} progress={burstProgress} />

            {/* Các hành khách xung quanh đồng loạt ngoái đầu nhìn */}
            {[
              [1.05, 0.18, 0.22, '#64748b'],
              [-1.0, 0.18, -1.65, '#7c3aed'],
              [1.05, 0.18, -1.65, '#16a34a'],
              [1.05, 0.18, 1.85, '#dc2626'],
            ].map(([x, y, z, color], idx) => (
              <group key={idx}>
                <mesh position={[Number(x), 0.45, Number(z) - 0.15]}>
                  <boxGeometry args={[1.35, 0.85, 0.85]} />
                  <meshStandardMaterial color="#0f766e" roughness={0.5} />
                </mesh>
                <DetailedCharacter
                  position={[Number(x), Number(y), Number(z)]}
                  hoodieColor={String(color)}
                  pose="sit"
                  eyeState="wide"
                  headYaw={idx % 2 === 0 ? -headTurn : headTurn}
                  animTime={frame}
                />
              </group>
            ))}
          </group>
        ) : (
          /* Cảnh cắt: Chiếc giày lẻ loi */
          <group>
            <SuburbanHouseAndStreet />
            <SneakerProp position={[-3.1, 0.46, 0.35]} rotation={[0, 0.55, 0]} scale={1.35} />
          </group>
        )}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// =========================================================
// PHÂN CẢNH 3 (00:25 - 00:33): "WHAT IF YOU COULD TELEPORT?"
// (Cổng Portal neon xoay quanh với hạt phát sáng lấp lánh)
// =========================================================
const Act3TitleSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const charX = frame < 75 ? -1.8 : frame < 150 ? 0 : 1.8;
  const titleScale = spring({ frame, fps: 30, from: 0.85, to: 1, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 55%, #1e293b 0%, #020617 80%)',
      }}
    >
      <ThreeCanvas width={width} height={height}>
        <CameraRig
          position={[0, 1.45, 5.4]}
          lookAt={[0, 1.25, 0]}
          fov={45}
          animTime={frame}
        />
        <ambientLight intensity={0.9} />
        <pointLight position={[0, 3, 3]} intensity={2.5} color="#38bdf8" />

        <gridHelper args={[30, 30, '#0284c7', '#0f172a']} position={[0, 0, 0]} />

        <DetailedCharacter
          position={[charX, 0, 0]}
          rotation={[0, frame * 0.035, 0]}
          oneShoeOnly={true}
          eyeState="wide"
          animTime={frame}
        />

        {[-1.8, 0, 1.8].map((px, i) => (
          <group key={i} position={[px, 1.1, -0.2]}>
            {/* Vòng Portal phát sáng rực rỡ */}
            <mesh rotation={[0, 0, frame * 0.05 + i]}>
              <torusGeometry args={[1.18, 0.038, 16, 64]} />
              <meshBasicMaterial color={px === charX ? '#22d3ee' : '#334155'} />
            </mesh>
            {/* Hạt năng lượng quay quanh vòng */}
            {px === charX &&
              Array.from({ length: 6 }).map((_, pi) => {
                const angle = frame * 0.08 + (pi * Math.PI) / 3;
                return (
                  <mesh
                    key={pi}
                    position={[Math.cos(angle) * 1.18, Math.sin(angle) * 1.18, 0]}
                  >
                    <sphereGeometry args={[0.045, 8, 8]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                );
              })}
          </group>
        ))}
      </ThreeCanvas>

      <div
        style={{
          position: 'absolute',
          top: 50,
          width: '100%',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          transform: `scale(${titleScale})`,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: 3,
            textShadow: '0 0 35px rgba(34,211,238,0.65)',
          }}
        >
          WHAT IF YOU COULD <span style={{ color: '#22d3ee' }}>TELEPORT?</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// =========================================================
// PHÂN CẢNH 4 (00:33 - 00:45): THÍ NGHIỆM LƯỢNG TỬ INNSBRUCK 1997
// (Tia Laser phát quang, hạt photon phát sáng, bàn thí nghiệm kim loại PBR)
// =========================================================
const Act4Innsbruck1997Lab: React.FC = () => {
  const frame = useCurrentFrame(); // 0 -> 360
  const { width, height } = useVideoConfig();

  const copyProgress = interpolate(frame, [110, 280], [0, 1], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 88%)',
      }}
    >
      <ThreeCanvas width={width} height={height}>
        <CameraRig
          position={[0, 2.0, 5.8]}
          lookAt={[0, 0.9, 0]}
          fov={45}
          animTime={frame}
        />
        <ambientLight intensity={0.85} color="#e2e8f0" />
        <directionalLight position={[3, 8, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[0, 2, 1]} intensity={2.0} color="#22d3ee" />

        {/* Mặt bàn quang học kim loại PBR */}
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[8.2, 0.25, 3.4]} />
          <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.3} />
        </mesh>

        {/* Nguồn phát tia Laser bên trái */}
        <mesh position={[-3.3, 0.65, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.95, 20]} />
          <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Chùm tia Laser phát sáng rực rỡ */}
        <mesh position={[-1.6, 0.65, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 2.8, 16]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>

        {/* Lăng kính bát diện (BBO Crystal) quay tròn ở trung tâm */}
        <mesh position={[0, 0.65, 0]} rotation={[frame * 0.02, frame * 0.03, 0]}>
          <octahedronGeometry args={[0.58, 0]} />
          <meshStandardMaterial color="#38bdf8" wireframe={true} />
        </mesh>

        {/* Các hạt photon lượng tử bay xoay quanh */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = i * 0.52 + frame * 0.03;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * 1.45,
                0.75 + Math.sin(frame * 0.05 + i) * 0.35,
                Math.sin(angle) * 0.95,
              ]}
            >
              <octahedronGeometry args={[0.075, 0]} />
              <meshBasicMaterial color="#67e8f9" />
            </mesh>
          );
        })}

        {/* Photon 1 (Gốc) */}
        <mesh position={[-2.1, 1.15, 0]} rotation={[frame * 0.03, frame * 0.04, 0]}>
          <icosahedronGeometry args={[0.38, 1]} />
          <meshStandardMaterial
            color="#f43f5e"
            emissive="#f43f5e"
            emissiveIntensity={1.2 - copyProgress * 0.65}
          />
        </mesh>

        {/* Photon 2 (Bản sao hoàn hảo) */}
        <mesh
          position={[2.2, 1.15, 0]}
          scale={0.25 + copyProgress * 0.75}
          rotation={[frame * 0.03, frame * 0.04, 0]}
        >
          <icosahedronGeometry args={[0.38, 1]} />
          <meshStandardMaterial
            color="#f43f5e"
            emissive="#f43f5e"
            emissiveIntensity={copyProgress * 1.3}
          />
        </mesh>
      </ThreeCanvas>

      <div style={{ position: 'absolute', top: 48, left: 72, fontFamily: 'monospace' }}>
        <div style={{ fontSize: 46, fontWeight: 900, color: '#38bdf8' }}>
          1997 — INNSBRUCK, AUSTRIA
        </div>
        <div style={{ fontSize: 26, color: '#cbd5e1', marginTop: 4 }}>
          QUANTUM STATE TELEPORTATION ({Math.round(copyProgress * 100)}%)
        </div>
      </div>
    </AbsoluteFill>
  );
};

// =========================================================
// PHÂN CẢNH 5 (00:45 - 00:56): VỆ TINH MICIUS & SO SÁNH PHOTON VS NGƯỜI
// (Độ sâu vũ trụ với chùm laser lượng tử 1,400 KM mượt mà)
// =========================================================
const Act5MiciusAndScaleComparison: React.FC = () => {
  const frame = useCurrentFrame(); // 0 -> 330
  const { width, height } = useVideoConfig();

  const isComparisonShot = frame >= 210;
  const kmCounter = Math.round(
    interpolate(frame, [15, 175], [0, 1400], {
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 82%)',
      }}
    >
      <ThreeCanvas width={width} height={height}>
        <CameraRig
          position={isComparisonShot ? [0, 1.25, 4.8] : [0, 0.5, 6.2]}
          lookAt={isComparisonShot ? [0, 1.05, 0] : [0, 0.0, 0]}
          fov={45}
          animTime={frame}
        />
        <ambientLight intensity={0.8} />
        <directionalLight position={[6, 5, 5]} intensity={1.5} />
        <pointLight position={[0, 1.7, 1]} intensity={1.5} color="#22d3ee" />

        {!isComparisonShot ? (
          <group>
            {/* Trái Đất xanh biển */}
            <mesh position={[0, -2.6, 0]} rotation={[0, frame * 0.005, 0]}>
              <sphereGeometry args={[2.2, 36, 36]} />
              <meshStandardMaterial color="#1d4ed8" roughness={0.55} />
            </mesh>
            {/* Lưới kinh vĩ tuyến sáng */}
            <mesh position={[0, -2.6, 0]} rotation={[0, frame * 0.005, 0]}>
              <sphereGeometry args={[2.22, 24, 24]} />
              <meshBasicMaterial color="#38bdf8" wireframe={true} transparent opacity={0.3} />
            </mesh>

            {/* Vệ tinh Micius bay trên quỹ đạo */}
            <group position={[0, 1.65, 0]} rotation={[0.2, frame * 0.01, -0.1]}>
              <mesh>
                <boxGeometry args={[0.62, 0.62, 0.88]} />
                <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.3} />
              </mesh>
              <mesh position={[-1.35, 0, 0]}>
                <boxGeometry args={[1.85, 0.05, 0.58]} />
                <meshStandardMaterial color="#0284c7" />
              </mesh>
              <mesh position={[1.35, 0, 0]}>
                <boxGeometry args={[1.85, 0.05, 0.58]} />
                <meshStandardMaterial color="#0284c7" />
              </mesh>
            </group>

            {/* Chùm tia lượng tử chiếu rọi 1,400 KM */}
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.02, 0.16, 2.4, 16]} />
              <meshBasicMaterial color="#22d3ee" transparent opacity={0.82} />
            </mesh>
          </group>
        ) : (
          /* So sánh kích thước trực quan */
          <group>
            <mesh position={[-1.5, 1.05, 0]}>
              <sphereGeometry args={[0.11, 20, 20]} />
              <meshBasicMaterial color="#22d3ee" />
            </mesh>
            <mesh position={[-1.5, 1.05, 0]}>
              <ringGeometry args={[0.24, 0.28, 32]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>

            <DetailedCharacter
              position={[1.4, 0, 0]}
              rotation={[0, -0.25, 0]}
              hoodieColor="#2563eb"
              eyeState="wide"
              animTime={frame}
            />
          </group>
        )}
      </ThreeCanvas>

      {!isComparisonShot ? (
        <div
          style={{
            position: 'absolute',
            top: 54,
            right: 80,
            textAlign: 'right',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ fontSize: 42, fontWeight: 900, color: '#f8fafc' }}>2017 — MICIUS</div>
          <div style={{ fontSize: 84, fontWeight: 900, color: '#22d3ee' }}>
            {kmCounter.toLocaleString()} KM
          </div>
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 64,
            width: '100%',
            display: 'flex',
            justifyContent: 'space-around',
            fontFamily: 'monospace',
            fontWeight: 900,
            fontSize: 42,
          }}
        >
          <div style={{ color: '#22d3ee' }}>1 PHOTON (TINY)</div>
          <div style={{ color: '#ffffff' }}>1 HUMAN BEING</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// =========================================================
// PHÂN CẢNH 6 (00:56 - 01:05): LỒNG QUÉT 43 DIGITS & BIỂU ĐỒ 350,000X
// (Dãy ô vuông lượn sóng sin sống động + Biểu đồ tròn phát sáng neon)
// =========================================================
const Act6Leicester43DigitsAndCircularChart: React.FC = () => {
  const frame = useCurrentFrame(); // 0 -> 270
  const { width, height } = useVideoConfig();

  const scanY = 1.0 + Math.sin(frame * 0.14) * 0.85;
  const showCircularChart = frame >= 135;

  const progress = interpolate(frame, [140, 245], [0, 1], {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const circleCircumference = 2 * Math.PI * 120;
  const strokeDashoffset = circleCircumference * (1 - progress);

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 88%)',
      }}
    >
      <ThreeCanvas width={width} height={height}>
        <CameraRig
          position={[0, 1.15, 5.4]}
          lookAt={[0, 1.05, 0]}
          fov={45}
          animTime={frame}
        />
        <ambientLight intensity={0.95} />
        <pointLight position={[0, 2.5, 3]} intensity={2.2} color="#22d3ee" />

        {/* Nhân vật + Lồng quét Wireframe Cyan đầy đủ từ đỉnh đầu đến chân */}
        <group position={[showCircularChart ? -1.35 : 0, 0, 0]}>
          <DetailedCharacter
            position={[0, 0, 0]}
            rotation={[0, frame * 0.035, 0]}
            hoodieColor="#0284c7"
            eyeState="wide"
            animTime={frame}
          />
          <mesh position={[0, 1.02, 0]} rotation={[0, -frame * 0.015, 0]}>
            <cylinderGeometry args={[0.88, 0.88, 2.15, 24, 10, true]} />
            <meshBasicMaterial color="#06b6d4" wireframe={true} transparent opacity={0.5} />
          </mesh>
          <mesh position={[0, scanY, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 0.98, 36]} />
            <meshBasicMaterial color="#22d3ee" side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Dãy 20 khối lập phương dao động theo hàm sóng Sin 3D */}
        <group position={[-1.5, 2.25, 0]}>
          {Array.from({ length: 20 }).map((_, i) => (
            <mesh
              key={i}
              position={[
                i * 0.16 - 1.5,
                Math.sin(frame * 0.16 + i * 0.45) * 0.16,
                Math.cos(frame * 0.1 + i * 0.3) * 0.08,
              ]}
              rotation={[frame * 0.04, frame * 0.03, 0]}
            >
              <boxGeometry args={[0.09, 0.09, 0.09]} />
              <meshBasicMaterial color="#22d3ee" />
            </mesh>
          ))}
        </group>
      </ThreeCanvas>

      {/* Chữ 43 DIGITS sắc nét */}
      <div style={{ position: 'absolute', top: 58, left: 82, fontFamily: 'monospace' }}>
        <div style={{ fontSize: 26, color: '#94a3b8', fontWeight: 700 }}>
          HUMAN DATA COMPLEXITY
        </div>
        <div
          style={{
            fontSize: 78,
            fontWeight: 900,
            color: '#22d3ee',
            marginTop: 4,
            textShadow: '0 0 25px rgba(34,211,238,0.5)',
          }}
        >
          43 DIGITS
        </div>
      </div>

      {/* BIỂU ĐỒ TRÒN 350,000X PHÁT SÁNG NEON */}
      {showCircularChart && (
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: '10%',
            width: 380,
            height: 380,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'monospace',
            filter: 'drop-shadow(0 0 16px rgba(34,211,238,0.45))',
          }}
        >
          <svg width="300" height="300" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="150"
              cy="150"
              r="120"
              stroke="rgba(34, 211, 238, 0.2)"
              strokeWidth="18"
              fill="transparent"
            />
            <circle
              cx="150"
              cy="150"
              r="120"
              stroke="#22d3ee"
              strokeWidth="18"
              fill="transparent"
              strokeDasharray={circleCircumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 52, fontWeight: 900, color: '#ffffff' }}>
              {Math.round(progress * 350000).toLocaleString()}X
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#22d3ee', marginTop: 4 }}>
              AGE OF UNIVERSE
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// =========================================================
// TIMELINE TỔNG HỢP 1 PHÚT ĐẦU TIÊN
// =========================================================
export const TeleportVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const activeSubtitle = SUBTITLES.find((s) => frame >= s.start && frame < s.end);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Âm thanh SFX đồng bộ + Lồng tiếng voiceover */}
      <Soundtrack enableVoiceover={true} />

      <Sequence durationInFrames={335}>
        <Act1PorchMultiCam />
      </Sequence>

      <Sequence from={335} durationInFrames={420}>
        <Act2InsideBusMultiCam />
      </Sequence>

      <Sequence from={755} durationInFrames={235}>
        <Act3TitleSequence />
      </Sequence>

      <Sequence from={990} durationInFrames={360}>
        <Act4Innsbruck1997Lab />
      </Sequence>

      <Sequence from={1350} durationInFrames={330}>
        <Act5MiciusAndScaleComparison />
      </Sequence>

      <Sequence from={1680} durationInFrames={270}>
        <Act6Leicester43DigitsAndCircularChart />
      </Sequence>

      {/* Hiệu ứng sóng chấn động & vạch Glitch khi dịch chuyển */}
      <GlitchFlashOverlay triggerFrame={335} />
      <GlitchFlashOverlay triggerFrame={755} />

      {/* Lớp viền điện ảnh mềm mại 4 góc (Cinematic Vignette) */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background:
            'radial-gradient(circle, rgba(0,0,0,0) 65%, rgba(0,0,0,0.55) 100%)',
          zIndex: 80,
        }}
      />

      {/* Phụ đề dưới đáy màn hình với viền xanh Cyan */}
      {activeSubtitle && (
        <div
          style={{
            position: 'absolute',
            bottom: 42,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            zIndex: 90,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(2, 6, 23, 0.88)',
              color: '#f8fafc',
              padding: '12px 30px',
              borderRadius: 12,
              fontSize: 28,
              fontFamily: 'sans-serif',
              fontWeight: 800,
              maxWidth: '82%',
              textAlign: 'center',
              borderBottom: '3px solid #22d3ee',
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            }}
          >
            {activeSubtitle.text}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
