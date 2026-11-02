import React from 'react';

export interface DetailedCharacterProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  hoodieColor?: string;
  pantsColor?: string;
  oneShoeOnly?: boolean;
  pose?: 'idle' | 'run' | 'sit' | 'lapSit';
  eyeState?: 'normal' | 'wide' | 'squint' | 'blink';
  talking?: boolean;
  headYaw?: number;
  headPitch?: number;
  animTime?: number;
  hasShadow?: boolean;
}

export const DetailedCharacter: React.FC<DetailedCharacterProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  hoodieColor = '#2563eb',
  pantsColor = '#1e293b',
  oneShoeOnly = false,
  pose = 'idle',
  eyeState = 'normal',
  talking = false,
  headYaw = 0,
  headPitch = 0,
  animTime = 0,
  hasShadow = true,
}) => {
  const isRunning = pose === 'run';
  const isSitting = pose === 'sit' || pose === 'lapSit';

  // Hơi thở nhẹ nhàng tự nhiên (Breathing & Organic Micro-motion)
  const breath = Math.sin(animTime * 0.12) * 0.016;
  const idleSway = isSitting ? 0 : Math.sin(animTime * 0.06) * 0.012;

  // Tự động chớp mắt tự nhiên mỗi ~75 frames (Natural Blinking Cycle)
  const isNaturalBlink = eyeState === 'normal' && animTime % 75 >= 71;

  // Khớp chân chuyển động mượt mà
  const leftLegRot = isSitting
    ? -Math.PI / 2.15
    : isRunning
    ? Math.sin(animTime * 0.35) * 0.72
    : 0;
  const rightLegRot = isSitting
    ? -Math.PI / 2.15
    : isRunning
    ? -Math.sin(animTime * 0.35) * 0.72
    : 0;

  // Khớp tay vung nhịp nhàng
  const leftArmRotX = isSitting
    ? -0.35 + breath * 2
    : isRunning
    ? -Math.sin(animTime * 0.35) * 0.62
    : Math.sin(animTime * 0.08) * 0.06;

  const rightArmRotX = isSitting
    ? -0.35 + breath * 2
    : isRunning
    ? Math.sin(animTime * 0.35) * 0.62
    : -Math.sin(animTime * 0.08) * 0.06;

  // Độ mở của mắt
  const effectiveEyeState = isNaturalBlink ? 'blink' : eyeState;
  const eyeScaleY =
    effectiveEyeState === 'blink'
      ? 0.05
      : effectiveEyeState === 'squint'
      ? 0.42
      : effectiveEyeState === 'wide'
      ? 1.35
      : 1;

  // Cử động nói chuyện mượt mà theo nhịp âm thanh
  const mouthHeight = talking
    ? 0.022 + Math.abs(Math.sin(animTime * 0.52)) * 0.055
    : 0.012;

  // Dây áo hoodie đung đưa theo chuyển động
  const stringSway = Math.sin(animTime * 0.15) * 0.03;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* BÓNG ĐỔ TIẾP XÚC DƯỚI ĐẤT (Soft Contact Shadow) */}
      {hasShadow && !isSitting && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.38, 24]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.28} />
        </mesh>
      )}

      {/* ================= ĐẦU & BIỂU CẢM ================= */}
      <group
        position={[idleSway, 1.66 + breath, 0]}
        rotation={[headPitch + breath * 0.5, headYaw, 0]}
      >
        {/* Lớp viền sáng Rim Light thanh lịch bao quanh đầu đen */}
        <mesh scale={1.045}>
          <sphereGeometry args={[0.29, 32, 32]} />
          <meshBasicMaterial color="#475569" side={1} />
        </mesh>

        {/* Khối cầu đầu đen bóng nhẹ đặc trưng IFOLOGY */}
        <mesh castShadow>
          <sphereGeometry args={[0.29, 32, 32]} />
          <meshStandardMaterial
            color="#07090e"
            roughness={0.25}
            metalness={0.2}
          />
        </mesh>

        {/* Điểm nhấn ánh sáng phản chiếu trên trán (Specular Gloss Dot) */}
        <mesh position={[-0.12, 0.16, 0.23]} scale={[0.04, 0.04, 0.01]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
        </mesh>

        {/* Mắt trái phát sáng tinh tế */}
        <mesh position={[-0.095, 0.035, 0.258]} scale={[1, eyeScaleY, 0.35]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Mắt phải phát sáng */}
        <mesh position={[0.095, 0.035, 0.258]} scale={[1, eyeScaleY, 0.35]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Lông mày khi mở to hoặc nheo mắt */}
        {eyeState === 'wide' && (
          <>
            <mesh position={[-0.095, 0.115, 0.26]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[0.08, 0.016, 0.01]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.095, 0.115, 0.26]} rotation={[0, 0, -0.2]}>
              <boxGeometry args={[0.08, 0.016, 0.01]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </>
        )}

        {/* Miệng */}
        <mesh position={[0, -0.095, 0.27]}>
          <boxGeometry args={[talking ? 0.095 : 0.07, mouthHeight, 0.02]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* ================= THÂN ÁO HOODIE ================= */}
      {/* Vành cổ áo hoodie */}
      <mesh position={[0, 1.38 + breath, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.065, 16, 32]} />
        <meshStandardMaterial color={hoodieColor} roughness={0.5} />
      </mesh>

      {/* Thân áo nở nhẹ theo nhịp thở */}
      <mesh
        position={[0, 1.04 + breath * 0.5, 0]}
        scale={[1 + breath, 1, 1 + breath]}
        castShadow
      >
        <cylinderGeometry args={[0.22, 0.26, 0.7, 24]} />
        <meshStandardMaterial color={hoodieColor} roughness={0.55} />
      </mesh>

      {/* Túi Kangaroo trước bụng */}
      <mesh position={[0, 0.88 + breath * 0.5, 0.22]}>
        <boxGeometry args={[0.26, 0.18, 0.08]} />
        <meshStandardMaterial color={hoodieColor} roughness={0.65} />
      </mesh>

      {/* 2 Dây áo Hoodie màu trắng buông thõng trước ngực */}
      <mesh
        position={[-0.06, 1.25, 0.23]}
        rotation={[0, 0, stringSway]}
      >
        <cylinderGeometry args={[0.01, 0.01, 0.18, 8]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh
        position={[0.06, 1.25, 0.23]}
        rotation={[0, 0, -stringSway]}
      >
        <cylinderGeometry args={[0.01, 0.01, 0.18, 8]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      {/* ================= TAY TRÁI & TAY PHẢI ================= */}
      <group position={[-0.28, 1.3 + breath, 0]} rotation={[leftArmRotX, 0, 0.14]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.055, 0.52, 16]} />
          <meshStandardMaterial color={hoodieColor} roughness={0.55} />
        </mesh>
        <mesh position={[0, -0.54, 0]}>
          <sphereGeometry args={[0.062, 16, 16]} />
          <meshStandardMaterial color="#07090e" roughness={0.3} metalness={0.1} />
        </mesh>
      </group>

      <group position={[0.28, 1.3 + breath, 0]} rotation={[rightArmRotX, 0, -0.14]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.055, 0.52, 16]} />
          <meshStandardMaterial color={hoodieColor} roughness={0.55} />
        </mesh>
        <mesh position={[0, -0.54, 0]}>
          <sphereGeometry args={[0.062, 16, 16]} />
          <meshStandardMaterial color="#07090e" roughness={0.3} metalness={0.1} />
        </mesh>
      </group>

      {/* ================= CHÂN TRÁI (GIÀY SNEAKER CHI TIẾT) ================= */}
      <group position={[-0.12, 0.68, 0]} rotation={[leftLegRot, 0, 0]}>
        <mesh position={[0, -0.31, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.065, 0.62, 16]} />
          <meshStandardMaterial color={pantsColor} roughness={0.7} />
        </mesh>
        {/* Giày Sneaker cao cấp có đế cao su, viền đỏ và dây buộc */}
        <group position={[0, -0.62, 0.06]}>
          {/* Thân giày màu đỏ thể thao */}
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[0.16, 0.1, 0.28]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} />
          </mesh>
          {/* Đế giày cao su trắng dày dặn */}
          <mesh position={[0, -0.04, 0]}>
            <boxGeometry args={[0.175, 0.045, 0.31]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
          {/* Mũi giày bo tròn màu trắng */}
          <mesh position={[0, 0.015, 0.11]}>
            <cylinderGeometry args={[0.07, 0.08, 0.08, 16]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Dây giày trắng phía trên */}
          {[-0.03, 0, 0.03].map((z, idx) => (
            <mesh key={idx} position={[0, 0.085, z]}>
              <boxGeometry args={[0.11, 0.012, 0.02]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
      </group>

      {/* ================= CHÂN PHẢI (TẤT TRẮNG HOẶC GIÀY) ================= */}
      <group position={[0.12, 0.68, 0]} rotation={[rightLegRot, 0, 0]}>
        <mesh position={[0, -0.31, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.065, 0.62, 16]} />
          <meshStandardMaterial color={pantsColor} roughness={0.7} />
        </mesh>
        {!oneShoeOnly ? (
          <group position={[0, -0.62, 0.06]}>
            <mesh position={[0, 0.03, 0]}>
              <boxGeometry args={[0.16, 0.1, 0.28]} />
              <meshStandardMaterial color="#ef4444" roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.04, 0]}>
              <boxGeometry args={[0.175, 0.045, 0.31]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
          </group>
        ) : (
          /* Tất trắng mịn có bo gân ở cổ chân */
          <group position={[0, -0.61, 0.04]}>
            <mesh>
              <boxGeometry args={[0.12, 0.09, 0.22]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.06, -0.05]}>
              <cylinderGeometry args={[0.062, 0.062, 0.07, 12]} />
              <meshStandardMaterial color="#e2e8f0" />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};
