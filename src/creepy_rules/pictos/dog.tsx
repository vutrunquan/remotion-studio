import React from 'react';
import {Cap, Chain, INK, P, W, mixP} from './common';
import {easeInOutCubic, kf} from '../util';

type DogPose = {
  rump: P; shoulder: P; head: P; snout: P; ear: P;
  tail: [P, P];
  hind: [P, P, P, P];
  arm: [P, P, P, P];
  bodyW: number; rumpR: number; headR: number;
};

// Toạ độ cục bộ: chân chạm đất ở y=0, x=0 là giữa thân, chó nhìn sang +x.
export const DOG_POSES: Record<string, DogPose> = {
  quad: {
    rump: [-50, -87], shoulder: [50, -88], head: [76, -126], snout: [111, -116], ear: [54, -160],
    tail: [[-72, -98], [-88, -139]],
    hind: [[-46, -72], [-48, -36], [-46, -8], [-27, -5]],
    arm: [[40, -78], [46, -40], [48, -9], [67, -5]],
    bodyW: 46, rumpR: 29, headR: 21,
  },
  rear: {
    rump: [-38, -92], shoulder: [26, -158], head: [68, -196], snout: [100, -188], ear: [60, -232],
    tail: [[-50, -98], [-112, -92]],
    hind: [[-36, -84], [-42, -46], [-38, -9], [-19, -5]],
    arm: [[28, -148], [50, -136], [70, -124], [96, -106]],
    bodyW: 44, rumpR: 20, headR: 21,
  },
  stand: {
    rump: [-3, -72], shoulder: [0, -170], head: [37, -200], snout: [64, -194], ear: [3, -243],
    tail: [[-13, -78], [-34, -22]],
    hind: [[-3, -70], [-19, -36], [-2, -14], [22, -3]],
    arm: [[9, -150], [29, -146], [49, -140], [90, -127]],
    bodyW: 44, rumpR: 0, headR: 20,
  },
};

const mixPose = (a: DogPose, b: DogPose, p: number): DogPose => {
  const m = (x: P, y: P) => mixP(x, y, p);
  const ml = <T extends P[]>(x: T, y: T) => x.map((v, i) => m(v, y[i])) as T;
  return {
    rump: m(a.rump, b.rump), shoulder: m(a.shoulder, b.shoulder), head: m(a.head, b.head),
    snout: m(a.snout, b.snout), ear: m(a.ear, b.ear),
    tail: ml(a.tail, b.tail), hind: ml(a.hind, b.hind), arm: ml(a.arm, b.arm),
    bodyW: a.bodyW + (b.bodyW - a.bodyW) * p, rumpR: a.rumpR + (b.rumpR - a.rumpR) * p,
    headR: a.headR + (b.headR - a.headR) * p,
  };
};

/** Tính tư thế chó tại thời điểm t. Hỗ trợ: pose, from+at+dur, hoặc anim: [[t,'quad'],[1,'rear'],[1.7,'stand']] */
export function dogPoseAt(item: any, t: number): {pose: DogPose; standness: number} {
  let keys: Array<[number, string]>;
  if (Array.isArray(item.anim) && item.anim.length) keys = item.anim;
  else if (item.from && item.from !== (item.pose ?? 'quad')) {
    const at = item.at ?? 0.8;
    const dur = item.dur ?? 1.2;
    const to = item.pose ?? 'stand';
    keys =
      item.from === 'quad' && to === 'stand'
        ? [[at, 'quad'], [at + dur * 0.42, 'rear'], [at + dur, 'stand']]
        : item.from === 'stand' && to === 'quad'
        ? [[at, 'stand'], [at + dur * 0.58, 'rear'], [at + dur, 'quad']]
        : [[at, item.from], [at + dur, to]];
  } else keys = [[0, item.pose ?? 'quad']];
  let a = keys[0];
  let b = keys[0];
  let p = 0;
  if (t >= keys[keys.length - 1][0]) {
    a = b = keys[keys.length - 1];
  } else if (t > keys[0][0]) {
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        a = keys[i - 1];
        b = keys[i];
        p = easeInOutCubic((t - a[0]) / (b[0] - a[0]));
        break;
      }
    }
  }
  const pa = DOG_POSES[a[1]] ?? DOG_POSES.quad;
  const pb = DOG_POSES[b[1]] ?? DOG_POSES.quad;
  const stand = (n: string) => (n === 'stand' ? 1 : n === 'rear' ? 0.5 : 0);
  return {pose: mixPose(pa, pb, p), standness: stand(a[1]) + (stand(b[1]) - stand(a[1])) * p};
}

export const dogSnout = (item: any, t: number): P => {
  const {pose} = dogPoseAt(item, t);
  const bob = item.walk && dogPoseAt(item, t).standness > 0.6 ? Math.abs(Math.sin(t * 5.2)) * -3 : 0;
  return [pose.snout[0], pose.snout[1] + bob];
};

export const Dog: React.FC<{item: any; t: number}> = ({item, t}) => {
  const {pose, standness} = dogPoseAt(item, t);
  const fill = item.shade ? 'url(#dogShade)' : W;
  // đi bộ: lắc chân sau + tay + nhún
  const walk = item.walk ? 1 : 0;
  const ph = t * (item.walkSpeed ?? 5.2);
  const sw = Math.sin(ph);
  const bob = walk * Math.abs(Math.sin(ph)) * -3 * standness;
  const hind = pose.hind.map((p, i) => (walk && i >= 2 ? [p[0] + sw * 9 * standness, p[1] - (i === 2 ? Math.max(0, sw) * 4 : 0)] : p)) as P[];
  const arm = pose.arm.map((p, i) => (walk && i >= 2 ? [p[0] - sw * 6 * standness, p[1] + sw * 3 * standness] : p)) as P[];
  const {head, snout, ear, shoulder, rump} = pose;
  const eye: P = [head[0] + 7, head[1] - 4];
  const earPts = `${ear[0]},${ear[1]} ${head[0] - 13},${head[1] - 12} ${head[0] + 8},${head[1] - 18}`;
  const neckTop: P = mixP(shoulder, head, 0.55);
  return (
    <g transform={`translate(0 ${bob})`} style={{fill, color: fill}}>
      {item.shade && (
        <defs>
          <linearGradient id="dogShade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#bcbcbc" />
          </linearGradient>
        </defs>
      )}
      {/* đuôi */}
      <Chain pts={pose.tail} w={9} c={fill} />
      {/* chân sau */}
      <Chain pts={hind} w={24} c={fill} />
      {/* thân */}
      <Cap a={rump} b={shoulder} w={pose.bodyW} c={fill} />
      {pose.rumpR > 1 && <circle cx={rump[0] - 2} cy={rump[1] + 2} r={pose.rumpR} fill={fill} />}
      {/* cổ + đầu */}
      <Cap a={shoulder} b={neckTop} w={24} c={fill} />
      <circle cx={head[0]} cy={head[1]} r={pose.headR} fill={fill} />
      <Cap a={[head[0] + 4, head[1] + 2]} b={snout} w={15} c={fill} />
      <polygon points={earPts} fill={fill} />
      <circle cx={eye[0]} cy={eye[1]} r={3.3} fill={INK} />
      {/* tay trước (viền tối để tách khỏi thân khi đứng) */}
      <Chain pts={arm} w={standness > 0.4 ? 15 : 24} c={fill} outline={2.6 * Math.min(1, standness * 1.6)} />
    </g>
  );
};
