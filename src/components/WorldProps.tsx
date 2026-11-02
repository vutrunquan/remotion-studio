import React, { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// =========================================================
// BỘ ĐIỀU KHIỂN CAMERA ĐIỆN ẢNH VỚI CHUYỂN ĐỘNG HỮU CƠ & RUNG LẮC
// =========================================================
export const CameraRig: React.FC<{
  position: [number, number, number];
  lookAt: [number, number, number];
  fov?: number;
  shake?: number;
  animTime?: number;
}> = ({ position, lookAt, fov = 45, shake = 0, animTime = 0 }) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    // Độ trôi nhẹ tự nhiên như quay phim bằng gimbal thực thụ
    const floatX = animTime ? Math.sin(animTime * 0.035) * 0.025 : 0;
    const floatY = animTime ? Math.cos(animTime * 0.028) * 0.02 : 0;

    // Rung lắc va đập khi teleport hoặc rơi xuống ghế
    const shakeX = shake ? (Math.sin(animTime * 2.1) * shake) : 0;
    const shakeY = shake ? (Math.cos(animTime * 1.8) * shake) : 0;

    camera.position.set(
      position[0] + floatX + shakeX,
      position[1] + floatY + shakeY,
      position[2]
    );

    if ('fov' in camera) {
      (camera as THREE.PerspectiveCamera).fov = fov;
      camera.updateProjectionMatrix();
    }

    camera.lookAt(
      new THREE.Vector3(
        lookAt[0] + floatX * 0.5,
        lookAt[1] + floatY * 0.5,
        lookAt[2]
      )
    );
    camera.updateMatrixWorld();
  }, [camera, position, lookAt, fov, shake, animTime]);

  return null;
};

// =========================================================
// HỆ THỐNG ÁNH SÁNG 3 ĐIỂM ĐIỆN ẢNH (CINEMATIC LIGHTING)
// =========================================================
export const CinematicLighting: React.FC<{
  sunPosition?: [number, number, number];
  isNight?: boolean;
}> = ({ sunPosition = [8, 14, 8], isNight = false }) => {
  if (isNight) {
    return (
      <>
        <ambientLight intensity={0.4} color="#0f172a" />
        <directionalLight position={[-4, 8, 4]} intensity={0.7} color="#38bdf8" />
        <directionalLight position={[4, 6, -3]} intensity={0.5} color="#818cf8" />
      </>
    );
  }

  return (
    <>
      {/* Ánh sáng môi trường dịu nhẹ màu xanh da trời */}
      <ambientLight intensity={0.75} color="#f0f9ff" />
      {/* Nguồn sáng chính: Ánh nắng ấm ban mai */}
      <directionalLight
        position={sunPosition}
        intensity={1.35}
        color="#fffbeb"
        castShadow
      />
      {/* Ánh sáng hắt ngược (Fill Light) màu xanh lam mát */}
      <directionalLight
        position={[-sunPosition[0] * 0.5, 4, -sunPosition[2] * 0.5]}
        intensity={0.45}
        color="#bae6fd"
      />
    </>
  );
};

// =========================================================
// HẠT BỤI KHÔNG GIAN LƠ LỬNG TRONG KHÔNG KHÍ (ATMOSPHERIC DUST)
// =========================================================
export const AtmosphericDust: React.FC<{ animTime?: number; count?: number }> = ({
  animTime = 0,
  count = 24,
}) => {
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const speed = 0.015 + (i % 5) * 0.005;
        const x = ((i * 1.7 + animTime * speed) % 18) - 9;
        const y = 0.4 + ((i * 1.3 + Math.sin(animTime * 0.02 + i) * 0.4) % 4.5);
        const z = ((i * 2.3) % 10) - 5;
        const scale = 0.02 + (i % 4) * 0.012;

        return (
          <mesh key={i} position={[x, y, z]} scale={scale}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.35 + Math.sin(animTime * 0.05 + i) * 0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// =========================================================
// CHIẾC GIÀY SNEAKER LẺ LOI CÓ BÓNG ĐỔ DƯỚI ĐẤT
// =========================================================
export const SneakerProp: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Bóng đổ tiếp xúc mềm dưới sàn */}
    <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.22, 20]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.32} />
    </mesh>

    {/* Thân giày màu đỏ thể thao */}
    <mesh position={[0, 0.055, 0]}>
      <boxGeometry args={[0.16, 0.1, 0.28]} />
      <meshStandardMaterial color="#ef4444" roughness={0.4} />
    </mesh>
    {/* Đế cao su trắng */}
    <mesh position={[0, 0.0, 0]}>
      <boxGeometry args={[0.175, 0.045, 0.31]} />
      <meshStandardMaterial color="#ffffff" roughness={0.25} />
    </mesh>
    {/* Lưỡi gà & Cổ giày */}
    <mesh position={[0, 0.1, -0.02]}>
      <boxGeometry args={[0.11, 0.06, 0.08]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
    {/* Dây giày trắng */}
    {[-0.03, 0, 0.03].map((z, i) => (
      <mesh key={i} position={[0, 0.108, z]}>
        <boxGeometry args={[0.11, 0.012, 0.02]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    ))}
  </group>
);

// =========================================================
// NGÔI NHÀ, HIÊN GỖ VÀ CON ĐƯỜNG ĐƯỢC CHĂM CHÚT CHI TIẾT
// =========================================================
export const SuburbanHouseAndStreet: React.FC = () => {
  return (
    <group>
      {/* Thảm cỏ sân vườn với màu xanh tự nhiên */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#166534" roughness={0.88} />
      </mesh>

      {/* Lề đá phân cách sân cỏ và vỉa hè (Kerbstone) */}
      <mesh position={[0, 0.06, -1.0]}>
        <boxGeometry args={[100, 0.12, 0.15]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Vỉa hè bê tông sáng sủa */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -1.75]}>
        <planeGeometry args={[100, 1.35]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>

      {/* Mặt đường nhựa Asphalt cao cấp */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -4.6]}>
        <planeGeometry args={[100, 4.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} />
      </mesh>

      {/* Vạch kẻ đường vàng đứt đoạn có độ bóng nhẹ */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-36 + i * 4, 0.025, -4.6]}>
          <planeGeometry args={[1.8, 0.16]} />
          <meshStandardMaterial color="#facc15" roughness={0.3} />
        </mesh>
      ))}

      {/* KHỐI NGÔI NHÀ & HIÊN GỖ (Được lùi ra sau z = -0.5 để không bao giờ chắn camera) */}
      <group position={[-3.2, 0, -0.6]}>
        {/* Bóng đổ dưới hiên nhà */}
        <mesh position={[0, 0.01, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.2, 2.6]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.3} />
        </mesh>

        {/* Sàn hiên nhà ghép nan gỗ */}
        <mesh position={[0, 0.22, 0.6]}>
          <boxGeometry args={[3.8, 0.44, 2.2]} />
          <meshStandardMaterial color="#92400e" roughness={0.65} />
        </mesh>

        {/* Lan can hiên nhà (Porch Railing) */}
        <mesh position={[-1.75, 0.72, 0.6]}>
          <boxGeometry args={[0.08, 0.6, 2.1]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>

        {/* Bậc tam cấp xuống sân */}
        <mesh position={[2.05, 0.11, 0.6]}>
          <boxGeometry args={[0.55, 0.22, 1.4]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>

        {/* Tường nhà sơn màu ghi nhạt hiện đại */}
        <mesh position={[0, 2.15, -1.1]}>
          <boxGeometry args={[3.8, 3.8, 1.2]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>

        {/* Khung & Cửa chính bằng gỗ sẫm */}
        <mesh position={[-0.45, 1.38, -0.48]}>
          <boxGeometry args={[0.95, 1.9, 0.06]} />
          <meshStandardMaterial color="#78350f" roughness={0.5} />
        </mesh>

        {/* Cửa sổ phát ánh đèn ấm từ bên trong phòng */}
        <mesh position={[0.95, 1.62, -0.48]}>
          <boxGeometry args={[0.92, 0.92, 0.06]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        {/* Khung chia ô cửa sổ hình chữ thập */}
        <mesh position={[0.95, 1.62, -0.44]}>
          <boxGeometry args={[0.04, 0.92, 0.04]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.95, 1.62, -0.44]}>
          <boxGeometry args={[0.92, 0.04, 0.04]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>

        {/* 2 Cột trụ hiên nhà màu trắng tinh tế */}
        <mesh position={[-1.7, 1.5, 1.55]}>
          <cylinderGeometry args={[0.08, 0.08, 2.45, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[1.7, 1.5, 1.55]}>
          <cylinderGeometry args={[0.08, 0.08, 2.45, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>

        {/* Mái hiên nhà bo dốc che nắng */}
        <mesh position={[0, 2.8, 0.55]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[4.1, 0.18, 2.7]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
      </group>

      {/* Dãy cây cảnh quan Low-Poly xanh tươi */}
      {[-9, -4, 2, 8, 14].map((x, idx) => (
        <group key={idx} position={[x, 0, -7.8]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.16, 0.22, 1.8, 12]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
          <mesh position={[0, 2.35, 0]}>
            <sphereGeometry args={[1.1, 16, 16]} />
            <meshStandardMaterial color="#15803d" roughness={0.6} />
          </mesh>
          <mesh position={[0.3, 2.7, 0.2]}>
            <sphereGeometry args={[0.75, 12, 12]} />
            <meshStandardMaterial color="#16a34a" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// =========================================================
// XE BUÝT VÀNG NÂNG CẤP VỚI ĐÈN PHA VOLUMETRIC & BÓNG TIẾP XÚC
// =========================================================
export const DetailedBus: React.FC<{
  busX: number;
  highlightRearSeat?: boolean;
}> = ({ busX, highlightRearSeat = false }) => {
  const wheelRot = -busX * 1.8;

  return (
    <group position={[busX, 1.05, -4.5]}>
      {/* Bóng đổ mềm của xe buýt trên mặt đường */}
      <mesh position={[0, -1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.6, 2.4]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>

      {/* Thân xe chính màu vàng bóng */}
      <mesh castShadow>
        <boxGeometry args={[5.3, 1.85, 2.0]} />
        <meshStandardMaterial
          color="#facc15"
          roughness={0.28}
          metalness={0.15}
        />
      </mesh>

      {/* Dải nẹp đen trang trí dọc thân xe */}
      <mesh position={[0, -0.18, 1.01]}>
        <boxGeometry args={[5.32, 0.14, 0.02]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>

      {/* Kính chắn gió phía trước & Gương chiếu hậu */}
      <mesh position={[2.66, 0.28, 0]}>
        <boxGeometry args={[0.04, 0.85, 1.75]} />
        <meshStandardMaterial color="#0284c7" roughness={0.1} />
      </mesh>
      {/* 2 Đèn pha vàng phát sáng ở đầu xe */}
      <mesh position={[2.67, -0.45, 0.72]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
      <mesh position={[2.67, -0.45, -0.72]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>

      {/* Luồng sáng đèn pha chiếu về phía trước (Volumetric Headlight Cone) */}
      <mesh
        position={[4.1, -0.45, 0.72]}
        rotation={[0, 0, -Math.PI / 2]}
      >
        <coneGeometry args={[0.45, 2.8, 16, 1, true]} />
        <meshBasicMaterial
          color="#fef08a"
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2 Đèn hậu màu đỏ phía sau */}
      <mesh position={[-2.66, -0.45, 0.72]}>
        <boxGeometry args={[0.04, 0.18, 0.18]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[-2.66, -0.45, -0.72]}>
        <boxGeometry args={[0.04, 0.18, 0.18]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Dãy 4 ô cửa sổ kính sáng */}
      {[-1.72, -0.56, 0.6, 1.76].map((wx, i) => (
        <mesh key={i} position={[wx, 0.3, 1.01]}>
          <boxGeometry args={[0.88, 0.6, 0.04]} />
          <meshBasicMaterial
            color={i === 0 && highlightRearSeat ? '#ffffff' : '#38bdf8'}
          />
        </mesh>
      ))}

      {/* Khung ngắm mục tiêu tròn màu đỏ nổi bật ở ghế sau */}
      {highlightRearSeat && (
        <group position={[-1.72, 0.3, 1.05]}>
          <mesh>
            <ringGeometry args={[0.38, 0.48, 36]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh>
            <ringGeometry args={[0.12, 0.16, 24]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      )}

      {/* 4 Bánh xe quay tròn có mâm bạc sáng */}
      {[
        [-1.55, -0.9, 0.95],
        [1.55, -0.9, 0.95],
        [-1.55, -0.9, -0.95],
        [1.55, -0.9, -0.95],
      ].map((pos, idx) => (
        <group
          key={idx}
          position={pos as [number, number, number]}
          rotation={[Math.PI / 2, wheelRot, 0]}
        >
          {/* Lốp xe cao su đen có vân */}
          <mesh>
            <cylinderGeometry args={[0.42, 0.42, 0.24, 24]} />
            <meshStandardMaterial color="#090d16" roughness={0.8} />
          </mesh>
          {/* Mâm vành hợp kim bạc */}
          <mesh position={[0, 0.13, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.03, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.2} />
          </mesh>
          {/* Trục tâm bánh xe */}
          <mesh position={[0, 0.145, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.02, 12]} />
            <meshStandardMaterial color="#090d16" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// =========================================================
// HẠT NĂNG LƯỢNG TELEPORT NỞ BÙNG (EXPANDING PARTICLES)
// =========================================================
export const TeleportBurst3D: React.FC<{
  position: [number, number, number];
  progress: number;
}> = ({ position, progress }) => {
  if (progress <= 0 || progress >= 1) return null;
  const radius = 0.2 + Math.pow(progress, 0.5) * 1.8;
  const scale = 1 - progress;

  return (
    <group position={position}>
      {/* Vòng sóng chấn động tỏa ra dạng đĩa */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.85, radius, 32]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={scale * 0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 12 mảnh pha lê năng lượng đa diện tỏa ra mọi hướng */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle * 3) * 0.5 * (1 - progress),
              Math.sin(angle) * radius,
            ]}
            scale={scale * 1.2}
            rotation={[angle + progress * 4, angle, 0]}
          >
            <octahedronGeometry args={[0.13, 0]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#38bdf8' : '#ffffff'} />
          </mesh>
        );
      })}
    </group>
  );
};
