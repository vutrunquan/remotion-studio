import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// Import default scenario JSON
import defaultScenario from './generated/current_scenario.json';

export type SceneConfig = {
  id: string;
  type: 'vector_scene' | 'warning_card' | 'rule_card' | 'exhibit' | 'cctv_live' | 'glitch';
  vectorPreset?: 'dog_standing' | 'dog_fridge' | 'dog_bed' | 'robot_hallway' | 'uncanny_eyes' | 'shadow_figure';
  duration: number; // in seconds
  ruleNumber?: number | null;
  warningText?: string;
  ruleTitle?: string;
  subtitle?: string;
  hudTime?: string;
  exhibit?: {
    code: string;
    title: string;
    note: string;
    image: string;
  };
  cctv?: {
    views: string;
    label: string;
  };
  glitchText?: string;
};

export type ScenarioConfig = {
  id: string;
  title: string;
  fileCode: string;
  totalRules: number;
  fps: number;
  width: number;
  height: number;
  audioSrc?: string;
  scenes: SceneConfig[];
};

const GLOW_STYLE = { filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.45))' } as const;
const RED_GLOW = { filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.7))' } as const;

// --- ATMOSPHERE & CRT GRAIN ---
export const AtmosphereOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const specks = Array.from({ length: 5 }, (_, i) => ({
    l: random(`sp-l-${frame}-${i}`) * 1920,
    t: random(`sp-t-${frame}-${i}`) * 1080,
    o: random(`sp-o-${frame}-${i}`),
    s: 1.5 + random(`sp-s-${frame}-${i}`) * 2,
  }));

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Scanlines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15) 0px, rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 3px)',
          opacity: 0.75,
        }}
      />
      {/* SVG Grain */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.025 }}>
        <filter id="horror-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed={frame % 40} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#horror-grain)" />
      </svg>
      {/* Floating Dust Specks */}
      {specks.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: s.l,
            top: s.t,
            width: s.s,
            height: s.s,
            borderRadius: '50%',
            background: '#ffffff',
            opacity: s.o * 0.6,
          }}
        />
      ))}
      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.75) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

// --- GLOBAL HUD (HEADS-UP DISPLAY) ---
export const HUDOverlay: React.FC<{
  fileCode: string;
  totalRules: number;
  currentRule?: number | null;
  hudTime: string;
}> = ({ fileCode, totalRules, currentRule, hudTime }) => {
  const frame = useCurrentFrame();
  const recBlink = Math.floor(frame / 15) % 2 === 0 ? 1 : 0.2;

  const rulesList = Array.from({ length: totalRules }, (_, i) => i + 1);

  return (
    <div
      style={{
        position: 'absolute',
        top: 45,
        left: 70,
        right: 70,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#8e9297',
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: 3,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 50,
      }}
    >
      {/* Left: Case / File Code */}
      <div style={{ textTransform: 'uppercase', color: '#9ca3af' }}>{fileCode}</div>

      {/* Center: Rule Tracker Badges */}
      <div style={{ display: 'flex', gap: 10 }}>
        {rulesList.map((r) => {
          const isActive = currentRule === r;
          return (
            <div
              key={r}
              style={{
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
                borderRadius: 4,
                border: isActive ? '1px solid #ffffff' : '1px solid #4b5563',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#000000' : '#6b7280',
                boxShadow: isActive ? '0 0 10px rgba(255, 255, 255, 0.8)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {r}
            </div>
          );
        })}
      </div>

      {/* Right: REC + Timecode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#ef4444',
            opacity: recBlink,
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
          }}
        />
        <span style={{ color: '#d1d5db', fontVariantNumeric: 'tabular-nums' }}>{hudTime}</span>
      </div>
    </div>
  );
};

// --- SUBTITLE LAYER ---
export const SubtitleOverlay: React.FC<{ text?: string }> = ({ text }) => {
  if (!text) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 75,
        left: 60,
        right: 60,
        textAlign: 'center',
        color: '#ffffff',
        fontSize: 36,
        fontWeight: 800,
        letterSpacing: 2.2,
        lineHeight: 1.4,
        textTransform: 'uppercase',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.9))',
        whiteSpace: 'pre-line',
        zIndex: 50,
      }}
    >
      {text}
    </div>
  );
};

// --- SCENE 1: WARNING CARD ---
export const WarningCardScene: React.FC<{ warningText?: string }> = ({ warningText }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 45], [0.95, 1.05], { extrapolateRight: 'clamp' });
  const flash = frame < 4 ? 0.3 : 1;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000',
        transform: `scale(${scale})`,
        opacity: flash,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" style={RED_GLOW}>
          <path d="M12 2L1 21h22L12 2z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <circle cx="12" cy="17" r="1" fill="#ef4444" />
        </svg>
        <div
          style={{
            fontSize: 54,
            fontWeight: 900,
            letterSpacing: 4,
            color: '#ef4444',
            textAlign: 'center',
            textTransform: 'uppercase',
            ...RED_GLOW,
          }}
        >
          {warningText || 'DO NOT ACT'}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- SCENE 2: RULE CARD ---
export const RuleCardScene: React.FC<{ ruleNumber?: number | null; ruleTitle?: string }> = ({
  ruleNumber,
  ruleTitle,
}) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 60], [0.9, 1.04], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000',
        transform: `scale(${zoom})`,
      }}
    >
      {ruleNumber && (
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: 18,
            border: '4px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64,
            fontWeight: 900,
            color: '#ffffff',
            marginBottom: 36,
            ...GLOW_STYLE,
          }}
        >
          {ruleNumber}
        </div>
      )}
      <div
        style={{
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: 3,
          color: '#ffffff',
          textAlign: 'center',
          textTransform: 'uppercase',
          maxWidth: 1200,
          lineHeight: 1.35,
          ...GLOW_STYLE,
        }}
      >
        {ruleTitle || 'SEVEN RULES'}
      </div>
    </AbsoluteFill>
  );
};

// --- SCENE 3: VECTOR PRESETS ---
export const VectorSceneRenderer: React.FC<{ preset?: string }> = ({ preset }) => {
  const frame = useCurrentFrame();

  if (preset === 'dog_standing') {
    // Stickman in chair + Window with moon + Ticking clock + Bipedal Dog Standing
    const clockRot = (frame * 6) % 360;
    const dogBob = Math.sin(frame * 0.1) * 3;
    const humanBreathing = Math.sin(frame * 0.08) * 2;

    return (
      <AbsoluteFill style={{ ...GLOW_STYLE }}>
        {/* Floor Line */}
        <line x1="150" y1="780" x2="1770" y2="780" stroke="#ffffff" strokeWidth="4" />
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
          {/* Floor Line */}
          <line x1="150" y1="780" x2="1770" y2="780" stroke="#ffffff" strokeWidth="4" />

          {/* Window with Crescent Moon */}
          <g transform="translate(760, 240)">
            <rect x="0" y="0" width="180" height="200" fill="none" stroke="#ffffff" strokeWidth="8" rx="8" />
            <line x1="90" y1="0" x2="90" y2="200" stroke="#ffffff" strokeWidth="6" />
            <line x1="0" y1="100" x2="180" y2="100" stroke="#ffffff" strokeWidth="6" />
            {/* Crescent Moon */}
            <path
              d="M 125 45 A 35 35 0 1 0 155 85 A 25 25 0 1 1 125 45 Z"
              fill="#f6c445"
              style={{ filter: 'drop-shadow(0 0 10px rgba(246, 196, 69, 0.7))' }}
            />
          </g>

          {/* Wall Clock */}
          <g transform="translate(1180, 290)">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#ffffff" strokeWidth="6" />
            <circle cx="50" cy="50" r="4" fill="#ffffff" />
            <line x1="50" y1="50" x2="50" y2="20" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="15"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${clockRot} 50 50)`}
            />
          </g>

          {/* Person Sitting in Armchair */}
          <g transform={`translate(430, ${470 + humanBreathing})`}>
            {/* Chair */}
            <path
              d="M 40 40 L 40 220 L 220 220 L 220 270 L 250 270 L 250 180 L 80 180 L 80 40 Z"
              fill="#ffffff"
            />
            {/* Chair Legs */}
            <rect x="50" y="270" width="18" height="40" fill="#ffffff" />
            <rect x="220" y="270" width="18" height="40" fill="#ffffff" />
            {/* Human Head */}
            <circle cx="120" cy="20" r="32" fill="#ffffff" />
            {/* Human Torso & Arms */}
            <path
              d="M 100 60 L 140 60 L 190 190 L 160 200 L 120 95 L 90 95 Z"
              fill="#ffffff"
            />
            {/* Legs */}
            <path
              d="M 180 190 L 230 190 L 260 290 L 225 295 L 200 220 L 175 220 Z"
              fill="#ffffff"
            />
          </g>

          {/* Bipedal Dog Standing on Two Legs */}
          <g transform={`translate(920, ${390 + dogBob})`}>
            {/* Head & Snout */}
            <path
              d="M 60 40 L 80 0 L 105 35 L 150 45 L 150 75 L 115 80 L 105 130 L 50 130 L 45 60 Z"
              fill="#ffffff"
            />
            {/* Pointy Ear 2 */}
            <polygon points="45,45 60,10 70,45" fill="#ffffff" />
            {/* Eye */}
            <circle cx="100" cy="55" r="4" fill="#000000" />
            {/* Torso */}
            <path d="M 50 130 L 105 130 L 95 310 L 45 310 Z" fill="#ffffff" />
            {/* Long Front Paw / Arm */}
            <path d="M 75 145 L 95 145 L 105 260 L 90 265 L 75 160 Z" fill="#ffffff" />
            {/* Rear Hind Legs (bipedal stance) */}
            <path
              d="M 50 310 L 85 310 L 95 385 L 120 385 L 120 400 L 75 400 L 65 340 L 45 340 Z"
              fill="#ffffff"
            />
            {/* Tail */}
            <path d="M 45 280 Q 10 320 15 365 L 28 360 Q 25 325 50 295 Z" fill="#ffffff" />
          </g>
        </svg>
      </AbsoluteFill>
    );
  }

  if (preset === 'dog_fridge') {
    // Kitchen Table + Fridge + Bipedal Dog Reaching
    const fridgeShake = Math.sin(frame * 0.3) * 1.5;
    return (
      <AbsoluteFill style={{ ...GLOW_STYLE }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
          {/* Floor */}
          <line x1="200" y1="800" x2="1720" y2="800" stroke="#ffffff" strokeWidth="4" />
          {/* Table */}
          <rect x="360" y="580" width="340" height="24" fill="#ffffff" rx="6" />
          <rect x="400" y="604" width="20" height="196" fill="#ffffff" />
          <rect x="640" y="604" width="20" height="196" fill="#ffffff" />

          {/* Refrigerator */}
          <g transform={`translate(${1150 + fridgeShake}, 320)`}>
            <rect x="0" y="0" width="220" height="480" rx="16" fill="none" stroke="#ffffff" strokeWidth="8" />
            {/* Top Freezer divider */}
            <line x1="0" y1="180" x2="220" y2="180" stroke="#ffffff" strokeWidth="6" />
            {/* Handles */}
            <rect x="25" y="100" width="10" height="55" rx="5" fill="#ffffff" />
            <rect x="25" y="210" width="10" height="80" rx="5" fill="#ffffff" />
          </g>

          {/* Dog Reaching Fridge */}
          <g transform="translate(860, 420)">
            <path
              d="M 60 40 L 80 0 L 105 35 L 150 45 L 150 75 L 115 80 L 105 130 L 50 130 L 45 60 Z"
              fill="#ffffff"
            />
            {/* Outstretched Front Paws */}
            <path d="M 90 140 L 175 160 L 170 185 L 85 160 Z" fill="#ffffff" />
            {/* Torso */}
            <path d="M 50 130 L 105 130 L 95 300 L 45 300 Z" fill="#ffffff" />
            {/* Legs */}
            <path d="M 50 300 L 85 300 L 95 375 L 120 375 L 120 385 L 75 385 L 65 330 L 45 330 Z" fill="#ffffff" />
            {/* Tail */}
            <path d="M 45 270 Q 10 310 15 355 L 28 350 Q 25 315 50 285 Z" fill="#ffffff" />
          </g>
        </svg>
      </AbsoluteFill>
    );
  }

  if (preset === 'dog_bed') {
    // Dog lying strangely like a human
    return (
      <AbsoluteFill style={{ ...GLOW_STYLE }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
          {/* Window */}
          <g transform="translate(860, 180)">
            <rect x="0" y="0" width="200" height="200" fill="none" stroke="#ffffff" strokeWidth="8" rx="8" />
            <line x1="100" y1="0" x2="100" y2="200" stroke="#ffffff" strokeWidth="6" />
            <line x1="0" y1="100" x2="200" y2="100" stroke="#ffffff" strokeWidth="6" />
            <circle cx="150" cy="50" r="24" fill="#f6c445" style={{ filter: 'drop-shadow(0 0 12px #f6c445)' }} />
          </g>

          {/* Dog Bed Base */}
          <g transform="translate(620, 520)">
            <rect x="0" y="160" width="680" height="90" rx="30" fill="none" stroke="#ffffff" strokeWidth="12" />
            {/* Bizarre Humanoid Lying Dog */}
            {/* Head */}
            <path d="M 50 110 L 80 70 L 110 105 L 40 135 Z" fill="#ffffff" />
            {/* Pointy Ears */}
            <polygon points="75,80 85,40 100,75" fill="#ffffff" />
            {/* Horizontal Spine */}
            <rect x="90" y="125" width="340" height="42" rx="15" fill="#ffffff" />
            {/* Human-like elbows resting up */}
            <path d="M 160 125 L 250 85 L 265 110 L 190 145 Z" fill="#ffffff" />
            {/* Legs bent backward */}
            <path d="M 400 130 L 490 120 L 520 160 L 480 165 L 450 145 Z" fill="#ffffff" />
          </g>
        </svg>
      </AbsoluteFill>
    );
  }

  if (preset === 'robot_hallway') {
    // Robot Vacuum at Doorway + Prohibition Mark
    const robotX = interpolate(frame, [0, 80], [600, 880], { extrapolateRight: 'clamp' });
    const blink = Math.sin(frame * 0.25) > 0 ? 1 : 0.2;
    const crossProgress = interpolate(frame, [40, 70], [0, 1], { extrapolateRight: 'clamp' });

    return (
      <AbsoluteFill style={{ ...GLOW_STYLE }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
          {/* Baseboard Line */}
          <line x1="200" y1="780" x2="1720" y2="780" stroke="#666666" strokeWidth="3" />

          {/* Bedroom Door */}
          <g transform="translate(1050, 240)">
            {/* Outer Door Frame */}
            <rect x="0" y="0" width="280" height="540" fill="none" stroke="#ffffff" strokeWidth="10" />
            {/* Inner Paneling */}
            <rect x="25" y="30" width="230" height="210" fill="none" stroke="#ffffff" strokeWidth="6" />
            <rect x="25" y="280" width="230" height="230" fill="none" stroke="#ffffff" strokeWidth="6" />
            {/* Doorknob */}
            <circle cx="235" cy="270" r="12" fill="#ffffff" />
            {/* Golden light slit under door */}
            <rect x="10" y="535" width="260" height="12" fill="#f6c445" opacity={0.8} style={{ filter: 'blur(4px)' }} />
          </g>

          {/* Picture Frame on Wall */}
          <g transform="translate(420, 380)">
            <rect x="0" y="0" width="180" height="130" rx="8" fill="none" stroke="#555555" strokeWidth="4" />
            <polyline points="20,105 70,55 110,90 140,65 165,105" fill="none" stroke="#555555" strokeWidth="4" />
            <circle cx="140" cy="40" r="10" fill="none" stroke="#555555" strokeWidth="4" />
          </g>

          {/* Robot Vacuum */}
          <g transform={`translate(${robotX}, 740)`}>
            {/* Radar Sensor Glow */}
            <circle cx="70" cy="20" r="40" fill="rgba(34, 197, 94, 0.35)" opacity={blink} style={{ filter: 'blur(8px)' }} />
            {/* Disc Body */}
            <ellipse cx="70" cy="35" rx="70" ry="16" fill="#000000" stroke="#ffffff" strokeWidth="4" />
            <ellipse cx="70" cy="22" rx="70" ry="16" fill="#000000" stroke="#ffffff" strokeWidth="4" />
            {/* Sensor Dot */}
            <circle cx="70" cy="22" r="6" fill="#22c55e" opacity={blink} />
          </g>

          {/* Red Prohibition Cross */}
          {crossProgress > 0 && (
            <g transform="translate(1190, 480)" style={RED_GLOW}>
              <line
                x1="-60"
                y1="-60"
                x2={-60 + 120 * Math.min(1, crossProgress * 2)}
                y2={-60 + 120 * Math.min(1, crossProgress * 2)}
                stroke="#ef4444"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {crossProgress > 0.5 && (
                <line
                  x1="60"
                  y1="-60"
                  x2={60 - 120 * ((crossProgress - 0.5) * 2)}
                  y2={-60 + 120 * ((crossProgress - 0.5) * 2)}
                  stroke="#ef4444"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
              )}
            </g>
          )}
        </svg>
      </AbsoluteFill>
    );
  }

  // Fallback: Default eerie stickman scene
  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...GLOW_STYLE }}>
      <svg width="400" height="400" viewBox="0 0 100 100">
        <circle cx="50" cy="25" r="14" fill="#ffffff" />
        <line x1="50" y1="40" x2="50" y2="75" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="50" x2="25" y2="65" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="50" x2="75" y2="65" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="75" x2="35" y2="98" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="75" x2="65" y2="98" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
      </svg>
    </AbsoluteFill>
  );
};

// --- SCENE 4: POLAROID EXHIBIT EVIDENCE ---
export const ExhibitScene: React.FC<{
  exhibit?: {
    code: string;
    title: string;
    note: string;
    image: string;
  };
}> = ({ exhibit }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 90], [1, 1.15], { extrapolateRight: 'clamp' });
  const panX = interpolate(frame, [0, 90], [0, 15], { extrapolateRight: 'clamp' });

  const code = exhibit?.code || 'EXHIBIT A';
  const title = exhibit?.title || 'ITEM: UNKNOWN EVIDENCE';
  const note = exhibit?.note || 'PURCHASED BY: YOU';
  const image = exhibit?.image || 'exhibit-a.jpg';

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 70,
          transform: `translate(${panX}px, 0px) scale(${zoom})`,
          ...GLOW_STYLE,
        }}
      >
        {/* Photo Container with Polaroid Viewfinder Brackets */}
        <div style={{ position: 'relative', padding: 20 }}>
          {/* 4 Viewfinder Corner Brackets */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 28, height: 28, borderTop: '4px solid #ffffff', borderLeft: '4px solid #ffffff' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: 28, height: 28, borderTop: '4px solid #ffffff', borderRight: '4px solid #ffffff' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 28, height: 28, borderBottom: '4px solid #ffffff', borderLeft: '4px solid #ffffff' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderBottom: '4px solid #ffffff', borderRight: '4px solid #ffffff' }} />

          {/* Polaroid Frame */}
          <div
            style={{
              width: 520,
              height: 480,
              background: '#ffffff',
              padding: 16,
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ flex: 1, overflow: 'hidden', background: '#000000', position: 'relative' }}>
              <Img
                src={staticFile(image)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'contrast(1.1) brightness(0.95)',
                }}
              />
            </div>
            <div style={{ height: 20 }} />
          </div>
        </div>

        {/* Metadata Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 6, height: 40, background: '#ef4444', ...RED_GLOW }} />
            <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: 3, color: '#ffffff' }}>{code}</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#d1d5db', letterSpacing: 2 }}>{title}</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#9ca3af', letterSpacing: 1.5 }}>{note}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- SCENE 5: CCTV LIVESTREAM ---
export const CCTVScene: React.FC<{
  cctv?: { views: string; label: string };
}> = ({ cctv }) => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 15) % 2 === 0 ? 1 : 0.3;
  const views = cctv?.views || '2,417,903';

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000',
        ...GLOW_STYLE,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 80 }}>
        {/* CCTV Viewport */}
        <div
          style={{
            width: 700,
            height: 480,
            border: '4px solid #ffffff',
            borderRadius: 20,
            position: 'relative',
            overflow: 'hidden',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Top Bar inside Camera */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ef4444', opacity: blink }} />
              <span style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', letterSpacing: 2 }}>REC</span>
            </div>
            <span style={{ fontSize: 16, color: '#9ca3af', letterSpacing: 2 }}>CAM_01 // IR_NIGHT</span>
          </div>

          {/* Center Graphic: Dog in front of fridge */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 260 }}>
            <svg width="400" height="240" viewBox="0 0 400 240">
              <rect x="250" y="30" width="100" height="200" rx="8" fill="none" stroke="#ffffff" strokeWidth="4" />
              <line x1="250" y1="100" x2="350" y2="100" stroke="#ffffff" strokeWidth="3" />
              {/* Dog Silhouette */}
              <g transform="translate(130, 60)">
                <path d="M 40 20 L 55 0 L 70 20 L 95 30 L 95 50 L 75 55 L 70 90 L 35 90 Z" fill="#ffffff" />
                <rect x="35" y="90" width="35" height="110" fill="#ffffff" />
                <path d="M 35 200 L 60 200 L 70 240 L 45 240 Z" fill="#ffffff" />
              </g>
            </svg>
          </div>

          {/* Bottom Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: 18, fontWeight: 700 }}>
            <span>LIVE</span>
            <span>00:00:06</span>
          </div>
        </div>

        {/* Social Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#9ca3af', letterSpacing: 3 }}>VIEWS</div>
          <div style={{ fontSize: 56, fontWeight: 900, color: '#ffffff', letterSpacing: 2, ...GLOW_STYLE }}>{views}</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
            <span style={{ color: '#ef4444', fontSize: 28, ...RED_GLOW }}>❤️</span>
            <span style={{ color: '#ef4444', fontSize: 28, ...RED_GLOW }}>❤️</span>
            <span style={{ color: '#ef4444', fontSize: 28, ...RED_GLOW }}>❤️</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- SCENE 6: GLITCH CLIMAX ---
export const GlitchScene: React.FC<{ glitchText?: string }> = ({ glitchText }) => {
  const frame = useCurrentFrame();
  const jitterX = (random(`gx-${frame}`) - 0.5) * 18;
  const jitterY = (random(`gy-${frame}`) - 0.5) * 8;
  const isFlash = frame % 6 === 0;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: isFlash ? '#111118' : '#000000',
        overflow: 'hidden',
      }}
    >
      {/* Glitch Tracking Horizontal Bars */}
      <div
        style={{
          position: 'absolute',
          top: (frame * 37) % 1080,
          left: 0,
          right: 0,
          height: 24,
          background: 'rgba(255, 255, 255, 0.4)',
          mixBlendMode: 'difference',
        }}
      />

      {/* Uncanny Entity Silhouette with RGB Split */}
      <div style={{ position: 'relative', transform: `translate(${jitterX}px, ${jitterY}px)` }}>
        {/* Red Channel */}
        <div style={{ position: 'absolute', left: -8, top: 0, filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.9))' }}>
          <svg width="280" height="280" viewBox="0 0 200 200">
            <circle cx="100" cy="70" r="45" fill="#ef4444" />
            <path d="M 40 170 C 40 120 70 115 100 115 C 130 115 160 120 160 170 Z" fill="#ef4444" />
          </svg>
        </div>

        {/* Cyan Channel */}
        <div style={{ position: 'absolute', left: 8, top: 0, filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.9))' }}>
          <svg width="280" height="280" viewBox="0 0 200 200">
            <circle cx="100" cy="70" r="45" fill="#06b6d4" />
            <path d="M 40 170 C 40 120 70 115 100 115 C 130 115 160 120 160 170 Z" fill="#06b6d4" />
          </svg>
        </div>

        {/* Main Figure */}
        <svg width="280" height="280" viewBox="0 0 200 200" style={{ position: 'relative', zIndex: 2 }}>
          {/* Head & Sunglasses */}
          <circle cx="100" cy="70" r="45" fill="#ffffff" />
          <rect x="70" y="60" width="24" height="14" rx="4" fill="#000000" />
          <rect x="106" y="60" width="24" height="14" rx="4" fill="#000000" />
          <line x1="94" y1="67" x2="106" y2="67" stroke="#000000" strokeWidth="3" />
          {/* Suit Collar & Tie */}
          <path d="M 40 170 C 40 120 70 115 100 115 C 130 115 160 120 160 170 Z" fill="#ffffff" />
          <polygon points="100,125 92,150 100,170 108,150" fill="#000000" />
        </svg>
      </div>

      {/* Climax Warning Subtitle with RGB Split */}
      <div
        style={{
          marginTop: 60,
          fontSize: 48,
          fontWeight: 900,
          letterSpacing: 4,
          color: '#ffffff',
          textAlign: 'center',
          textTransform: 'uppercase',
          textShadow: '-4px 0 #ef4444, 4px 0 #06b6d4',
          zIndex: 5,
        }}
      >
        {glitchText || "DO NOT ASK IT WHO'S A GOOD BOY."}
      </div>
    </AbsoluteFill>
  );
};

// --- MASTER DYNAMIC RULES COMPONENT ---
export const DynamicRules: React.FC<{ scenario?: ScenarioConfig }> = ({
  scenario = defaultScenario as unknown as ScenarioConfig,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Compute timing for all scenes
  let currentStartFrame = 0;
  const scheduledScenes = scenario.scenes.map((scene) => {
    const sceneDurationInFrames = Math.round((scene.duration || 3) * fps);
    const start = currentStartFrame;
    const end = start + sceneDurationInFrames;
    currentStartFrame = end;
    return {
      ...scene,
      startFrame: start,
      endFrame: end,
      durationInFrames: sceneDurationInFrames,
    };
  });

  // Find currently active scene
  const activeScene =
    scheduledScenes.find((s) => frame >= s.startFrame && frame < s.endFrame) ||
    scheduledScenes[scheduledScenes.length - 1];

  return (
    <AbsoluteFill style={{ background: '#000000', overflow: 'hidden' }}>
      {/* Background Audio */}
      {scenario.audioSrc && <Audio src={staticFile(scenario.audioSrc)} />}

      {/* Render Current Active Scene */}
      {scheduledScenes.map((s) => (
        <Sequence key={s.id} from={s.startFrame} durationInFrames={s.durationInFrames}>
          {s.type === 'warning_card' && <WarningCardScene warningText={s.warningText} />}
          {s.type === 'rule_card' && (
            <RuleCardScene ruleNumber={s.ruleNumber} ruleTitle={s.ruleTitle} />
          )}
          {s.type === 'vector_scene' && <VectorSceneRenderer preset={s.vectorPreset} />}
          {s.type === 'exhibit' && <ExhibitScene exhibit={s.exhibit} />}
          {s.type === 'cctv_live' && <CCTVScene cctv={s.cctv} />}
          {s.type === 'glitch' && <GlitchScene glitchText={s.glitchText} />}
        </Sequence>
      ))}

      {/* HUD (Heads-Up Display) */}
      <HUDOverlay
        fileCode={scenario.fileCode}
        totalRules={scenario.totalRules}
        currentRule={activeScene?.ruleNumber}
        hudTime={activeScene?.hudTime || '00:00:10'}
      />

      {/* Subtitle Caption */}
      <SubtitleOverlay text={activeScene?.subtitle} />

      {/* CRT Scanlines, Film Grain, Vignette & Specks */}
      <AtmosphereOverlay />
    </AbsoluteFill>
  );
};

