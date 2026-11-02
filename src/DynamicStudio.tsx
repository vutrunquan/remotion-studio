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

import currentScenario from './generated/current_scenario.json';

// --- TYPES ---
export type StudioMode = 'creepy_rules' | 'story_studio';

export type CharacterPose = 'stand' | 'sit' | 'talk' | 'walk' | 'hold_phone' | 'panic' | 'slump';
export type CharacterEmote = 'neutral' | 'worried' | 'shocked' | 'dread' | 'happy' | 'sad' | 'sleepy';
export type SetLocation = 'living_room' | 'bedroom_night' | 'street_night' | 'corridor_spooky';
export type CameraShot = 'wide' | 'medium' | 'close';

export type StudioScene = {
  id: string;
  duration: number; // in seconds
  subtitle?: string;
  hudTime?: string;
  ruleNumber?: number | null;

  // --- CREEPY RULES MODE PROPS ---
  type?: 'vector_scene' | 'warning_card' | 'rule_card' | 'exhibit' | 'cctv_live' | 'glitch';
  vectorPreset?: 'dog_standing' | 'dog_fridge' | 'dog_bed' | 'robot_hallway' | 'uncanny_eyes' | 'shadow_figure';
  warningText?: string;
  ruleTitle?: string;
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

  // --- STORY STUDIO MODE PROPS ---
  set?: SetLocation;
  camera?: {
    shot: CameraShot;
    roll?: number;
  };
  character?: {
    preset: 'boy' | 'girl' | 'detective' | 'hoodie';
    pose: CharacterPose;
    emote: CharacterEmote;
    x?: number; // percentage
  };
  titleCard?: {
    text: string;
    arrow?: 'left' | 'right' | 'none';
  };
  badgeTime?: string; // e.g. "11:42 P.M."
  counterBadge?: string; // e.g. "9,311"
};

export type StudioScenario = {
  id: string;
  mode: StudioMode;
  title: string;
  fileCode?: string;
  totalRules?: number;
  fps: number;
  width: number;
  height: number;
  audioSrc?: string;
  aspect?: '16:9' | '9:16';
  effects?: {
    scanlines?: boolean;
    grain?: boolean;
    vignette?: boolean;
  };
  scenes: StudioScene[];
};

// --- STYLES ---
const GLOW_WHITE = { filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.45))' } as const;
const GLOW_RED = { filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.7))' } as const;

// --- COMMON ATMOSPHERE OVERLAY ---
export const AtmosphereOverlay: React.FC<{
  scanlines?: boolean;
  grain?: boolean;
  vignette?: boolean;
}> = ({ scanlines = true, grain = true, vignette = true }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 40 }}>
      {scanlines && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15) 0px, rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 3px)',
            opacity: 0.75,
          }}
        />
      )}
      {grain && (
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.025 }}>
          <filter id="studio-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed={frame % 40} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#studio-grain)" />
        </svg>
      )}
      {vignette && (
        <AbsoluteFill
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.75) 100%)',
          }}
        />
      )}
    </AbsoluteFill>
  );
};

// ==========================================
// 1. STORY STUDIO COMPONENT RIGS
// ==========================================

// --- CHARACTER FACE WITH 7 EXPRESSIONS ---
const CharacterFace: React.FC<{ emote: CharacterEmote }> = ({ emote }) => {
  return (
    <g>
      {/* Eyes */}
      {emote === 'sleepy' ? (
        <g stroke="#000" strokeWidth="4" strokeLinecap="round">
          <line x1="85" y1="90" x2="105" y2="90" />
          <line x1="125" y1="90" x2="145" y2="90" />
        </g>
      ) : emote === 'shocked' || emote === 'dread' ? (
        <g>
          <circle cx="95" cy="88" r="9" fill="#000" />
          <circle cx="135" cy="88" r="9" fill="#000" />
          <circle cx="97" cy="86" r="3" fill="#fff" />
          <circle cx="137" cy="86" r="3" fill="#fff" />
        </g>
      ) : (
        <g>
          <circle cx="95" cy="88" r="6" fill="#000" />
          <circle cx="135" cy="88" r="6" fill="#000" />
        </g>
      )}

      {/* Eyebrows */}
      {emote === 'worried' || emote === 'dread' ? (
        <g stroke="#000" strokeWidth="4" strokeLinecap="round">
          <line x1="85" y1="74" x2="105" y2="70" />
          <line x1="125" y1="70" x2="145" y2="74" />
        </g>
      ) : emote === 'shocked' ? (
        <g stroke="#000" strokeWidth="4" strokeLinecap="round">
          <line x1="85" y1="68" x2="105" y2="68" />
          <line x1="125" y1="68" x2="145" y2="68" />
        </g>
      ) : (
        <g stroke="#000" strokeWidth="3" strokeLinecap="round">
          <line x1="85" y1="75" x2="105" y2="75" />
          <line x1="125" y1="75" x2="145" y2="75" />
        </g>
      )}

      {/* Mouth */}
      {emote === 'happy' ? (
        <path d="M 100 112 Q 115 128 130 112" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
      ) : emote === 'shocked' || emote === 'dread' ? (
        <ellipse cx="115" cy="116" rx="10" ry="14" fill="#000" />
      ) : emote === 'worried' || emote === 'sad' ? (
        <path d="M 102 118 Q 115 106 128 118" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
      ) : (
        <line x1="105" y1="114" x2="125" y2="114" stroke="#000" strokeWidth="4" strokeLinecap="round" />
      )}
    </g>
  );
};

// --- 2D CHARACTER RIG WITH 7 POSES ---
export const CharacterRig: React.FC<{
  preset?: 'boy' | 'girl' | 'detective' | 'hoodie';
  pose?: CharacterPose;
  emote?: CharacterEmote;
  scale?: number;
}> = ({ preset = 'boy', pose = 'stand', emote = 'neutral', scale = 1 }) => {
  const frame = useCurrentFrame();
  const breathing = Math.sin(frame * 0.1) * 2;
  const walkSwing = Math.sin(frame * 0.25) * 18;

  // Outfit colors based on preset
  const skinColor = '#fed7aa';
  const hairColor = preset === 'girl' ? '#92400e' : preset === 'detective' ? '#1f2937' : '#451a03';
  const shirtColor = preset === 'hoodie' ? '#4b5563' : preset === 'detective' ? '#d97706' : '#2563eb';
  const pantsColor = '#1e293b';

  return (
    <svg width={230 * scale} height={380 * scale} viewBox="0 0 230 380" style={{ overflow: 'visible' }}>
      <g transform={`scale(${scale})`}>
        {/* Torso & Limbs */}
        <g transform={`translate(0, ${breathing})`}>
          {/* Legs */}
          {pose === 'sit' ? (
            <g stroke="#000" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="95,240 95,290 145,290 145,340" stroke={pantsColor} />
              <polyline points="135,240 135,290 185,290 185,340" stroke={pantsColor} />
            </g>
          ) : pose === 'walk' ? (
            <g stroke="#000" strokeWidth="12" strokeLinecap="round">
              <line x1="100" y1="240" x2={100 + walkSwing} y2="350" stroke={pantsColor} />
              <line x1="130" y1="240" x2={130 - walkSwing} y2="350" stroke={pantsColor} />
            </g>
          ) : (
            <g stroke="#000" strokeWidth="12" strokeLinecap="round">
              <line x1="100" y1="240" x2="100" y2="350" stroke={pantsColor} />
              <line x1="130" y1="240" x2="130" y2="350" stroke={pantsColor} />
            </g>
          )}

          {/* Shoes */}
          <ellipse cx={pose === 'walk' ? 100 + walkSwing : 100} cy="355" rx="14" ry="6" fill="#ffffff" stroke="#000" strokeWidth="3" />
          <ellipse cx={pose === 'walk' ? 130 - walkSwing : 130} cy="355" rx="14" ry="6" fill="#ffffff" stroke="#000" strokeWidth="3" />

          {/* Torso Body */}
          <rect x="75" y="145" width="80" height="100" rx="20" fill={shirtColor} stroke="#000" strokeWidth="7" />

          {/* Arms according to pose */}
          {pose === 'hold_phone' ? (
            <g stroke="#000" strokeWidth="10" strokeLinecap="round">
              <line x1="80" y1="165" x2="55" y2="210" stroke={shirtColor} />
              <line x1="55" y1="210" x2="110" y2="190" stroke={shirtColor} />
              {/* Phone */}
              <rect x="110" y="175" width="18" height="30" rx="3" fill="#111" stroke="#fff" strokeWidth="2" />
            </g>
          ) : pose === 'panic' ? (
            <g stroke="#000" strokeWidth="10" strokeLinecap="round">
              <line x1="80" y1="165" x2="50" y2="110" stroke={shirtColor} />
              <line x1="50" y1="110" x2="80" y2="90" stroke={shirtColor} />
              <line x1="150" y1="165" x2="180" y2="110" stroke={shirtColor} />
              <line x1="180" y1="110" x2="150" y2="90" stroke={shirtColor} />
            </g>
          ) : pose === 'talk' ? (
            <g stroke="#000" strokeWidth="10" strokeLinecap="round">
              <line x1="80" y1="165" x2="70" y2="220" stroke={shirtColor} />
              <line x1="150" y1="165" x2="185" y2="200" stroke={shirtColor} />
              <line x1="185" y1="200" x2="175" y2="170" stroke={shirtColor} />
            </g>
          ) : (
            <g stroke="#000" strokeWidth="10" strokeLinecap="round">
              <line x1="80" y1="165" x2="70" y2="230" stroke={shirtColor} />
              <line x1="150" y1="165" x2="160" y2="230" stroke={shirtColor} />
            </g>
          )}
        </g>

        {/* Head & Hair */}
        <g transform={`translate(0, ${breathing * 1.2})`}>
          {/* Head */}
          <circle cx="115" cy="95" r="45" fill={skinColor} stroke="#000" strokeWidth="7" />
          {/* Hair */}
          {preset === 'girl' ? (
            <g fill={hairColor} stroke="#000" strokeWidth="5">
              <path d="M 68 95 C 65 40 165 40 162 95 C 160 50 70 50 68 95 Z" />
              <rect x="62" y="90" width="16" height="60" rx="8" />
              <rect x="152" y="90" width="16" height="60" rx="8" />
            </g>
          ) : preset === 'detective' ? (
            <g>
              <path d="M 70 80 Q 115 40 160 80 Z" fill={hairColor} stroke="#000" strokeWidth="5" />
              {/* Fedora Hat */}
              <ellipse cx="115" cy="55" rx="58" ry="12" fill="#374151" stroke="#000" strokeWidth="5" />
              <path d="M 85 55 L 90 28 Q 115 22 140 28 L 145 55 Z" fill="#4b5563" stroke="#000" strokeWidth="5" />
            </g>
          ) : (
            <path d="M 70 85 C 65 45 165 45 160 85 C 150 55 80 55 70 85 Z" fill={hairColor} stroke="#000" strokeWidth="5" />
          )}

          {/* Face Facial Expression */}
          <CharacterFace emote={emote} />
        </g>
      </g>
    </svg>
  );
};

// --- 4 STORY BACKGROUND SETS ---
const EnvironmentSet: React.FC<{ set?: SetLocation }> = ({ set = 'living_room' }) => {
  if (set === 'bedroom_night') {
    return (
      <AbsoluteFill style={{ background: '#090d16' }}>
        <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
          {/* Night Window with Stars */}
          <g transform="translate(1100, 200)">
            <rect x="0" y="0" width="360" height="380" fill="#040711" stroke="#475569" strokeWidth="12" rx="12" />
            <line x1="180" y1="0" x2="180" y2="380" stroke="#475569" strokeWidth="8" />
            <line x1="0" y1="190" x2="360" y2="190" stroke="#475569" strokeWidth="8" />
            <circle cx="280" cy="90" r="28" fill="#fef08a" style={{ filter: 'drop-shadow(0 0 15px #fef08a)' }} />
            {/* Small Stars */}
            <circle cx="60" cy="70" r="3" fill="#fff" />
            <circle cx="120" cy="140" r="2.5" fill="#fff" />
            <circle cx="220" cy="50" r="3" fill="#fff" />
          </g>
          {/* Nightstand & Lamp */}
          <rect x="350" y="580" width="140" height="200" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="6" />
          {/* Lamp with Warm Light Cone */}
          <polygon points="390,580 450,580 440,520 400,520" fill="#f59e0b" />
          <polygon points="340,780 500,780 430,580 410,580" fill="rgba(245, 158, 11, 0.15)" />
          {/* Floor Line */}
          <line x1="0" y1="780" x2="1920" y2="780" stroke="#334155" strokeWidth="6" />
        </svg>
      </AbsoluteFill>
    );
  }

  if (set === 'street_night') {
    return (
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, #090a0f 0%, #151928 65%, #1e2438 100%)' }}>
        <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
          {/* Streetlight with warm golden beam */}
          <line x1="380" y1="200" x2="380" y2="780" stroke="#475569" strokeWidth="12" />
          <path d="M 370 200 L 460 200 L 460 240" fill="none" stroke="#475569" strokeWidth="10" />
          <polygon points="260,780 660,780 470,240 450,240" fill="rgba(253, 224, 71, 0.18)" />
          {/* Pavement & Curb */}
          <line x1="0" y1="780" x2="1920" y2="780" stroke="#64748b" strokeWidth="8" />
          <rect x="0" y="784" width="1920" height="300" fill="#0f172a" />
        </svg>
      </AbsoluteFill>
    );
  }

  if (set === 'corridor_spooky') {
    return (
      <AbsoluteFill style={{ background: '#05070a' }}>
        {/* Perspective hallway lines */}
        <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
          <line x1="0" y1="0" x2="750" y2="400" stroke="#1e293b" strokeWidth="4" />
          <line x1="1920" y1="0" x2="1170" y2="400" stroke="#1e293b" strokeWidth="4" />
          <line x1="0" y1="1080" x2="750" y2="680" stroke="#334155" strokeWidth="6" />
          <line x1="1920" y1="1080" x2="1170" y2="680" stroke="#334155" strokeWidth="6" />
          <rect x="750" y="400" width="420" height="280" fill="#020408" stroke="#1e293b" strokeWidth="4" />
          {/* Distant ominous red exit sign */}
          <rect x="910" y="430" width="100" height="35" rx="4" fill="#ef4444" opacity={0.8} />
          <text x="960" y="454" fill="#fff" fontSize="16" fontWeight="bold" textAnchor="middle">EXIT</text>
        </svg>
      </AbsoluteFill>
    );
  }

  // Default Living Room
  return (
    <AbsoluteFill style={{ background: '#0f172a' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {/* Wall Picture */}
        <rect x="420" y="240" width="220" height="150" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="6" />
        {/* Sofa */}
        <rect x="720" y="560" width="480" height="220" rx="24" fill="#334155" stroke="#1e293b" strokeWidth="8" />
        {/* Wall Clock */}
        <circle cx="1400" cy="280" r="48" fill="#1e293b" stroke="#64748b" strokeWidth="6" />
        <line x1="1400" y1="280" x2="1400" y2="250" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        <line x1="1400" y1="280" x2="1425" y2="280" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        {/* Floor */}
        <line x1="0" y1="780" x2="1920" y2="780" stroke="#475569" strokeWidth="8" />
        <rect x="0" y="784" width="1920" height="300" fill="#090d16" />
      </svg>
    </AbsoluteFill>
  );
};

// --- STORY STUDIO SCENE RENDERER ---
const StoryStudioScene: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();

  // Camera framing (Wide, Medium, Close)
  const shot = scene.camera?.shot || 'medium';
  const cameraScale = shot === 'close' ? 1.55 : shot === 'wide' ? 0.95 : 1.2;
  const cameraFocusY = shot === 'close' ? 220 : 0;
  const roll = scene.camera?.roll || 0;

  // Character X position
  const charX = scene.character?.x || 50;

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {/* Camera Transformation Group */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${cameraScale}) rotate(${roll}deg) translateY(${cameraFocusY}px)`,
          transformOrigin: '50% 65%',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Background Set */}
        <EnvironmentSet set={scene.set} />

        {/* 2D Character Rig */}
        {scene.character && (
          <div
            style={{
              position: 'absolute',
              left: `${charX}%`,
              bottom: 290,
              transform: 'translateX(-50%)',
            }}
          >
            <CharacterRig
              preset={scene.character.preset}
              pose={scene.character.pose}
              emote={scene.character.emote}
              scale={1.25}
            />
          </div>
        )}
      </div>

      {/* OVERLAY: TITLE CARD WITH ARROW (e.g. "THIS DOOR ->") */}
      {scene.titleCard?.text && (
        <div
          style={{
            position: 'absolute',
            top: 140,
            left: 100,
            background: 'rgba(0, 0, 0, 0.85)',
            border: '3px solid #ffffff',
            borderRadius: 12,
            padding: '16px 28px',
            color: '#ffffff',
            fontSize: 38,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            ...GLOW_WHITE,
            zIndex: 35,
          }}
        >
          <span>{scene.titleCard.text}</span>
          {scene.titleCard.arrow === 'right' && <span>➔</span>}
          {scene.titleCard.arrow === 'left' && <span>⬅</span>}
        </div>
      )}

      {/* OVERLAY: TIME BADGE (e.g. "11:42 P.M.") */}
      {scene.badgeTime && (
        <div
          style={{
            position: 'absolute',
            top: 70,
            right: 80,
            background: '#ffffff',
            color: '#000000',
            fontWeight: 900,
            fontSize: 26,
            letterSpacing: 2,
            padding: '8px 22px',
            borderRadius: 8,
            boxShadow: '0 4px 15px rgba(255, 255, 255, 0.5)',
            zIndex: 35,
          }}
        >
          {scene.badgeTime}
        </div>
      )}

      {/* OVERLAY: RED COUNTER (e.g. "9,311") */}
      {scene.counterBadge && (
        <div
          style={{
            position: 'absolute',
            top: 140,
            right: 80,
            background: '#ef4444',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: 2,
            padding: '8px 24px',
            borderRadius: 8,
            ...GLOW_RED,
            zIndex: 35,
          }}
        >
          {scene.counterBadge}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ==========================================
// 2. CREEPY RULES COMPONENT RIGS
// ==========================================

export const CreepyHUD: React.FC<{
  fileCode?: string;
  totalRules?: number;
  currentRule?: number | null;
  hudTime?: string;
}> = ({ fileCode = 'FILE 041 // BRADIKININ', totalRules = 7, currentRule, hudTime = '00:00:10' }) => {
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
      <div style={{ textTransform: 'uppercase', color: '#9ca3af' }}>{fileCode}</div>

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
              }}
            >
              {r}
            </div>
          );
        })}
      </div>

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

// --- VECTOR PROCEDURAL DRAWINGS ---
const CreepyVectorPreset: React.FC<{ preset?: string }> = ({ preset }) => {
  const frame = useCurrentFrame();

  if (preset === 'dog_standing') {
    const clockRot = (frame * 6) % 360;
    const dogBob = Math.sin(frame * 0.1) * 3;
    return (
      <AbsoluteFill style={{ ...GLOW_WHITE }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
          <line x1="150" y1="780" x2="1770" y2="780" stroke="#ffffff" strokeWidth="4" />
          <g transform="translate(760, 240)">
            <rect x="0" y="0" width="180" height="200" fill="none" stroke="#ffffff" strokeWidth="8" rx="8" />
            <line x1="90" y1="0" x2="90" y2="200" stroke="#ffffff" strokeWidth="6" />
            <line x1="0" y1="100" x2="180" y2="100" stroke="#ffffff" strokeWidth="6" />
            <path d="M 125 45 A 35 35 0 1 0 155 85 A 25 25 0 1 1 125 45 Z" fill="#f6c445" />
          </g>
          <g transform="translate(1180, 290)">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#ffffff" strokeWidth="6" />
            <line x1="50" y1="50" x2="50" y2="20" stroke="#ffffff" strokeWidth="4" />
            <line x1="50" y1="50" x2="50" y2="15" stroke="#ffffff" strokeWidth="3" transform={`rotate(${clockRot} 50 50)`} />
          </g>
          {/* Person on armchair */}
          <g transform="translate(430, 470)">
            <path d="M 40 40 L 40 220 L 220 220 L 220 270 L 250 270 L 250 180 L 80 180 L 80 40 Z" fill="#ffffff" />
            <circle cx="120" cy="20" r="32" fill="#ffffff" />
            <path d="M 100 60 L 140 60 L 190 190 L 160 200 L 120 95 L 90 95 Z" fill="#ffffff" />
            <path d="M 180 190 L 230 190 L 260 290 L 225 295 L 200 220 L 175 220 Z" fill="#ffffff" />
          </g>
          {/* Bipedal Dog Standing */}
          <g transform={`translate(920, ${390 + dogBob})`}>
            <path d="M 60 40 L 80 0 L 105 35 L 150 45 L 150 75 L 115 80 L 105 130 L 50 130 L 45 60 Z" fill="#ffffff" />
            <polygon points="45,45 60,10 70,45" fill="#ffffff" />
            <circle cx="100" cy="55" r="4" fill="#000000" />
            <path d="M 50 130 L 105 130 L 95 310 L 45 310 Z" fill="#ffffff" />
            <path d="M 75 145 L 95 145 L 105 260 L 90 265 L 75 160 Z" fill="#ffffff" />
            <path d="M 50 310 L 85 310 L 95 385 L 120 385 L 120 400 L 75 400 L 65 340 L 45 340 Z" fill="#ffffff" />
            <path d="M 45 280 Q 10 320 15 365 L 28 360 Q 25 325 50 295 Z" fill="#ffffff" />
          </g>
        </svg>
      </AbsoluteFill>
    );
  }

  // Default Fallback
  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...GLOW_WHITE }}>
      <svg width="400" height="400" viewBox="0 0 100 100">
        <circle cx="50" cy="25" r="14" fill="#ffffff" />
        <line x1="50" y1="40" x2="50" y2="75" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="50" x2="25" y2="65" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="50" x2="75" y2="65" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
      </svg>
    </AbsoluteFill>
  );
};

// --- CREEPY RULES SCENE RENDERER ---
const CreepyRulesScene: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();

  if (scene.type === 'warning_card') {
    return (
      <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" style={GLOW_RED}>
            <path d="M12 2L1 21h22L12 2z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <circle cx="12" cy="17" r="1" fill="#ef4444" />
          </svg>
          <div style={{ fontSize: 54, fontWeight: 900, letterSpacing: 4, color: '#ef4444', textTransform: 'uppercase', ...GLOW_RED }}>
            {scene.warningText || 'DO NOT ACT'}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  if (scene.type === 'rule_card') {
    return (
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        {scene.ruleNumber && (
          <div style={{ width: 110, height: 110, borderRadius: 18, border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, fontWeight: 900, color: '#fff', marginBottom: 36, ...GLOW_WHITE }}>
            {scene.ruleNumber}
          </div>
        )}
        <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: 3, color: '#fff', textAlign: 'center', textTransform: 'uppercase', maxWidth: 1200, lineHeight: 1.35, ...GLOW_WHITE }}>
          {scene.ruleTitle || 'SEVEN RULES'}
        </div>
      </AbsoluteFill>
    );
  }

  if (scene.type === 'exhibit') {
    const zoom = interpolate(frame, [0, 90], [1, 1.15], { extrapolateRight: 'clamp' });
    return (
      <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 70, transform: `scale(${zoom})`, ...GLOW_WHITE }}>
          <div style={{ position: 'relative', padding: 20 }}>
            {/* Viewfinder brackets */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: 28, height: 28, borderTop: '4px solid #fff', borderLeft: '4px solid #fff' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: 28, height: 28, borderTop: '4px solid #fff', borderRight: '4px solid #fff' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 28, height: 28, borderBottom: '4px solid #fff', borderLeft: '4px solid #fff' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderBottom: '4px solid #fff', borderRight: '4px solid #fff' }} />
            <div style={{ width: 520, height: 480, background: '#fff', padding: 16, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflow: 'hidden', background: '#000' }}>
                <Img src={staticFile(scene.exhibit?.image || 'exhibit-a.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ height: 20 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 6, height: 40, background: '#ef4444', ...GLOW_RED }} />
              <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: 3, color: '#fff' }}>{scene.exhibit?.code || 'EXHIBIT A'}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#d1d5db', letterSpacing: 2 }}>{scene.exhibit?.title || 'ITEM: COLLAR'}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#9ca3af', letterSpacing: 1.5 }}>{scene.exhibit?.note || 'REMOVED'}</div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  if (scene.type === 'glitch') {
    const jitterX = (random(`gx-${frame}`) - 0.5) * 18;
    return (
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', overflow: 'hidden' }}>
        <div style={{ position: 'relative', transform: `translate(${jitterX}px, 0)` }}>
          <div style={{ position: 'absolute', left: -8, top: 0, filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.9))' }}>
            <circle cx="100" cy="70" r="45" fill="#ef4444" />
          </div>
          <svg width="280" height="280" viewBox="0 0 200 200" style={{ position: 'relative', zIndex: 2 }}>
            <circle cx="100" cy="70" r="45" fill="#ffffff" />
            <rect x="70" y="60" width="24" height="14" rx="4" fill="#000000" />
            <rect x="106" y="60" width="24" height="14" rx="4" fill="#000000" />
            <path d="M 40 170 C 40 120 70 115 100 115 C 130 115 160 120 160 170 Z" fill="#ffffff" />
          </svg>
        </div>
        <div style={{ marginTop: 60, fontSize: 48, fontWeight: 900, letterSpacing: 4, color: '#fff', textTransform: 'uppercase', textShadow: '-4px 0 #ef4444, 4px 0 #06b6d4' }}>
          {scene.glitchText || "DO NOT ASK IT WHO'S A GOOD BOY."}
        </div>
      </AbsoluteFill>
    );
  }

  return <CreepyVectorPreset preset={scene.vectorPreset} />;
};

// ==========================================
// 3. MASTER DYNAMIC STUDIO COMPOSITION
// ==========================================
export const DynamicStudio: React.FC<{ scenario?: StudioScenario }> = ({
  scenario = currentScenario as unknown as StudioScenario,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Mode: creepy_rules vs story_studio
  const mode = scenario.mode || 'creepy_rules';

  // Schedule frames
  let currentStartFrame = 0;
  const scheduledScenes = scenario.scenes.map((scene) => {
    const durInFrames = Math.round((scene.duration || 3) * fps);
    const start = currentStartFrame;
    const end = start + durInFrames;
    currentStartFrame = end;
    return {
      ...scene,
      startFrame: start,
      endFrame: end,
      durationInFrames: durInFrames,
    };
  });

  const activeScene =
    scheduledScenes.find((s) => frame >= s.startFrame && frame < s.endFrame) ||
    scheduledScenes[scheduledScenes.length - 1];

  return (
    <AbsoluteFill style={{ background: '#000000', overflow: 'hidden' }}>
      {/* Audio Track */}
      {scenario.audioSrc && <Audio src={staticFile(scenario.audioSrc)} />}

      {/* Render Scenes */}
      {scheduledScenes.map((s) => (
        <Sequence key={s.id} from={s.startFrame} durationInFrames={s.durationInFrames}>
          {mode === 'story_studio' ? (
            <StoryStudioScene scene={s} />
          ) : (
            <CreepyRulesScene scene={s} />
          )}
        </Sequence>
      ))}

      {/* Creepy HUD (Only in Creepy Rules Mode) */}
      {mode === 'creepy_rules' && (
        <CreepyHUD
          fileCode={scenario.fileCode}
          totalRules={scenario.totalRules}
          currentRule={activeScene?.ruleNumber}
          hudTime={activeScene?.hudTime || '00:00:10'}
        />
      )}

      {/* Subtitles Overlay */}
      {activeScene?.subtitle && (
        <div
          style={{
            position: 'absolute',
            bottom: 75,
            left: 60,
            right: 60,
            textAlign: 'center',
            color: '#ffffff',
            fontSize: mode === 'story_studio' ? 32 : 36,
            fontWeight: 800,
            letterSpacing: 2,
            lineHeight: 1.4,
            textTransform: 'uppercase',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.9))',
            whiteSpace: 'pre-line',
            zIndex: 50,
          }}
        >
          {activeScene.subtitle}
        </div>
      )}

      {/* Atmospheric Overlays */}
      <AtmosphereOverlay
        scanlines={scenario.effects?.scanlines !== false}
        grain={scenario.effects?.grain !== false}
        vignette={scenario.effects?.vignette !== false}
      />
    </AbsoluteFill>
  );
};
