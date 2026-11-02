import React from 'react';
import {COLORS} from '../theme';
import {Cap, Chain, INK, P, W, fk, mixP} from './common';
import {kf} from '../util';

const ARM_W = 12;

/** Người nhìn chính diện (kiểu biển báo): đứng, hét (giơ tay chữ V), đóng băng... Gốc toạ độ = giữa hai bàn chân. */
export const FrontPerson: React.FC<{item: any; t: number}> = ({item, t}) => {
  const pose = item.pose ?? 'stand';
  const fill = item.fill ?? W;
  let aL = 4, aR = 4, spread = 0, mouth = false, headDy = 0, shake = 0;
  if (pose === 'scream') { aL = aR = 152; spread = 5; mouth = true; headDy = -3; }
  if (pose === 'frozen') { aL = aR = 2; shake = Math.sin(t * 40) * 0.8; }
  if (pose === 'handsUp') { aL = aR = 165; }
  if (pose === 'cover') { aL = aR = 160; }
  if (pose === 'tpose') { aL = aR = 90; }
  const shL: P = [-27, -122];
  const shR: P = [27, -122];
  const aLend = fk(shL, 60, -aL);
  const aRend = fk(shR, 60, aR);
  // fk dùng góc tính từ hướng xuống; âm = sang trái
  return (
    <g transform={`translate(${shake} 0)`}>
      <circle cx={0} cy={-157 + headDy} r={22} fill={fill} />
      {mouth && <ellipse cx={0} cy={-151 + headDy} rx={6.5} ry={9} fill={INK} />}
      <rect x={-24} y={-130} width={48} height={68} rx={12} fill={fill} />
      <Cap a={shL} b={aLend} w={ARM_W} c={fill} />
      <Cap a={shR} b={aRend} w={ARM_W} c={fill} />
      <g transform={`rotate(${-spread} -12 -62)`}>
        <rect x={-22} y={-64} width={20} height={64} rx={9} fill={fill} />
      </g>
      <g transform={`rotate(${spread} 12 -62)`}>
        <rect x={2} y={-64} width={20} height={64} rx={9} fill={fill} />
      </g>
    </g>
  );
};

/** Người nhìn nghiêng: chạy / đi bộ. Gốc = giữa hai bàn chân (chạm đất y=0), nhìn sang +x. */
export const SidePerson: React.FC<{item: any; t: number}> = ({item, t}) => {
  const pose = item.pose ?? 'run';
  const run = pose === 'run';
  const spd = item.speed ?? (run ? 7 : 4);
  const osc = item.animate === false ? 0 : Math.sin(t * spd);
  const lean = run ? 14 : 4;
  const hip: P = [0, -72];
  const lr = (lean * Math.PI) / 180;
  const shoulder: P = [hip[0] + 56 * Math.sin(lr), hip[1] - 56 * Math.cos(lr)];
  const neckDir = [Math.sin((lean * Math.PI) / 180), -Math.cos((lean * Math.PI) / 180)];
  const head: P = [shoulder[0] + neckDir[0] * 30, shoulder[1] + neckDir[1] * 30];
  const A = run ? 52 : 26;
  const legF: [number, number] = [A * (0.65 + 0.35 * osc), run ? -8 + 12 * osc : -4];
  const legB: [number, number] = [-A * (0.55 + 0.35 * osc), run ? -70 - 14 * osc : -22];
  const kneeF = fk(hip, 36, legF[0]);
  const footF = fk(kneeF, 34, legF[1]);
  const kneeB = fk(hip, 36, legB[0]);
  const footB = fk(kneeB, 34, legB[1]);
  const armNear: P[] = [shoulder, fk(shoulder, 30, run ? 38 - 10 * osc : 22 * osc), fk(fk(shoulder, 30, run ? 38 - 10 * osc : 22 * osc), 28, run ? 125 : 12 * osc)];
  const armFar: P[] = [shoulder, fk(shoulder, 30, run ? -42 + 10 * osc : -22 * osc), fk(fk(shoulder, 30, run ? -42 + 10 * osc : -22 * osc), 28, run ? -125 : -12 * osc)];
  const fill = item.fill ?? W;
  return (
    <g>
      <Chain pts={armFar} w={ARM_W} c="#cfcfcf" />
      <Chain pts={[hip, kneeB, footB]} w={17} c="#d6d6d6" />
      <Cap a={hip} b={shoulder} w={36} c={fill} />
      <circle cx={head[0]} cy={head[1]} r={21} fill={fill} />
      <Chain pts={[hip, kneeF, footF]} w={18} c={fill} outline={2} />
      <Cap a={footF} b={[footF[0] + 11, footF[1] + 1]} w={11} c={fill} />
      <Chain pts={armNear} w={ARM_W} c={fill} outline={2.4} />
    </g>
  );
};

const CHAIR = '#ebebeb';

/** Ghế bành + người ngồi. Gốc = giữa đáy ghế (266,435 trong toạ độ ref gốc). */
export const Armchair: React.FC<{item: any; t: number}> = ({item, t}) => {
  const sitter = item.sitter ?? 'sit';
  const lounge = sitter === 'lounge';
  const tense = sitter === 'tense';
  const head: P = lounge ? [-47, -160] : tense ? [-13, -180] : [-23, -173];
  const neck: P = lounge ? [-40, -134] : tense ? [-14, -146] : [-26, -142];
  const hip: P = lounge ? [-12, -62] : tense ? [-8, -62] : [-6, -62];
  const knee: P = lounge ? [46, -60] : [53, -60];
  const foot: P = lounge ? [88, -34] : [55, -12];
  const arm: P[] = lounge
    ? [[-38, -128], [-20, -92], [14, -66]]
    : tense
    ? [[-14, -138], [-2, -100], [30, -92]]
    : [[-25, -136], [-10, -100], [46, -92]];
  const sweat = item.sweat ? ((t * 1.1) % 1) : -1;
  return (
    <g>
      {/* ghế */}
      <rect x={-86} y={-163} width={32} height={144} rx={14} fill={CHAIR} />
      <rect x={-86} y={-50} width={120} height={31} rx={12} fill={CHAIR} />
      <rect x={24} y={-55} width={62} height={55} rx={12} fill={CHAIR} />
      <rect x={-80} y={-24} width={12} height={16} rx={3} fill={CHAIR} />
      {sitter !== 'none' && (
        <>
          <circle cx={head[0]} cy={head[1]} r={23} fill={W} />
          <Cap a={neck} b={hip} w={40} c={W} />
          <Chain pts={[hip, knee, foot]} w={30} c={W} outline={2} />
          {!lounge && <Cap a={foot} b={[foot[0] + 16, foot[1] + 2]} w={14} c={W} />}
          <Chain pts={arm} w={13} c={W} outline={2.6} />
        </>
      )}
      {sweat >= 0 && sitter !== 'none' && (
        <g transform={`translate(${head[0] - 30} ${head[1] - 4 + sweat * 16})`} opacity={1 - sweat * 0.7}>
          <path d="M0 -8 C 5 -1 6 3 0 6 C -6 3 -5 -1 0 -8 Z" fill={COLORS.blue} />
        </g>
      )}
    </g>
  );
};

/** Bàn ăn + người ăn + ghế trống. Gốc = sàn giữa bàn. */
export const Dinner: React.FC<{item: any; t: number}> = ({item, t}) => {
  const bite = Math.sin(t * 2.2);
  const hand: P = [-84 + Math.max(0, bite) * 18, -112 - Math.max(0, bite) * 26];
  return (
    <g>
      {/* ghế người ăn (trái) */}
      <rect x={-172} y={-132} width={13} height={134} rx={5} fill={W} />
      <rect x={-172} y={-70} width={62} height={9} rx={4} fill={W} />
      {/* người */}
      <circle cx={-141} cy={-168} r={22} fill={W} />
      <Cap a={[-143, -142]} b={[-141, -80]} w={36} c={W} />
      <Chain pts={[[-141, -78], [-102, -78], [-102, -6]]} w={22} c={W} />
      <Chain pts={[[-146, -134], [-126, -108], hand]} w={12} c={W} outline={2.4} />
      {/* bàn */}
      <rect x={-112} y={-108} width={224} height={9} rx={4} fill={W} />
      <rect x={-102} y={-100} width={9} height={100} rx={4} fill={W} />
      <rect x={93} y={-100} width={9} height={100} rx={4} fill={W} />
      <ellipse cx={-62} cy={-112} rx={22} ry={4} fill={W} />
      {/* ghế trống (phải) */}
      <rect x={146} y={-132} width={13} height={134} rx={5} fill={W} />
      <rect x={112} y={-70} width={47} height={9} rx={4} fill={W} />
    </g>
  );
};

/** Giường + người nằm/ngồi dậy. wake: 0 nằm -> 1 ngồi dậy (keyframe được). Gốc = sàn giữa giường. */
export const Bed: React.FC<{item: any; t: number}> = ({item, t}) => {
  const wake = Math.min(1, Math.max(0, kf(item.wake, t, 0)));
  const hip: P = [-30, -66];
  const shoulder = mixP([-66, -62], [-52, -122], wake);
  const head = mixP([-84, -74], [-48, -150], wake);
  const sleeper = item.sleeper !== false;
  return (
    <g>
      <rect x={-118} y={-100} width={11} height={100} rx={5} fill={W} />
      <rect x={104} y={-58} width={11} height={58} rx={5} fill={W} />
      <rect x={-112} y={-50} width={222} height={16} rx={7} fill={W} />
      <rect x={-112} y={-34} width={9} height={34} rx={4} fill={W} />
      <rect x={101} y={-34} width={9} height={34} rx={4} fill={W} />
      {sleeper && (
        <>
          <ellipse cx={-88} cy={-60} rx={22} ry={8} fill="#cfcfcf" />
          <circle cx={head[0]} cy={head[1]} r={17} fill={W} />
          <Cap a={shoulder} b={hip} w={28} c={W} />
          <Cap a={hip} b={[96, -68]} w={34} c={W} />
          <Cap a={[-20, -74]} b={[96, -74]} w={4} c={INK} o={0.85} />
        </>
      )}
    </g>
  );
};
