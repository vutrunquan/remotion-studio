import React from 'react';
import { Composition } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Montserrat';
import { BotCase002 } from './BotCase002';
import { DynamicStudio } from './DynamicStudio';
import currentScenario from './generated/current_scenario.json';

// Exact Creepy Rules Kit
import { Rules } from './creepy_rules/Rules';
import { Sheet } from './creepy_rules/Sheet';
import { buildTimeline as buildRulesTimeline } from './creepy_rules/timeline';
import type { Script as CreepyScript } from './creepy_rules/types';
import creepyDefaultSample from './creepy_rules/sample.json';

// Exact 2D Story Studio Kit
import { Story } from './story_studio/Story';
import type { StoryProps } from './story_studio/types';
import { dims as storyDims, totalFrames as storyTotalFrames } from './story_studio/lib/timing';
import storyDefaultSample from './story_studio/story.json';

// Load Montserrat for both kits
loadFont('normal', {
  weights: ['500', '600', '700', '800'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
});

export function creepyDimsOf(meta: CreepyScript['meta']): { width: number; height: number } {
  const res = meta?.res ?? 1080;
  const k = res / 1080;
  const a = meta?.aspect ?? '16:9';
  if (a === '9:16') return { width: Math.round(1080 * k), height: Math.round(1920 * k) };
  if (a === '1:1') return { width: Math.round(1080 * k), height: Math.round(1080 * k) };
  return { width: Math.round(1920 * k), height: Math.round(1080 * k) };
}

export const RemotionRoot: React.FC = () => {
  const dynamicDurationInFrames = Math.max(
    30,
    Math.round(
      (currentScenario.scenes || []).reduce((acc: number, s: any) => acc + (s.duration || 3), 0) * (currentScenario.fps || 30)
    )
  );

  const creepyProps = creepyDefaultSample as unknown as CreepyScript;
  const storyProps = storyDefaultSample as unknown as StoryProps;

  return (
    <>
      {/* 1. EXACT CREEPY RULES STUDIO (Analog Horror, Rules, Pictograms, Glitches) */}
      <Composition
        id="CreepyRules"
        component={Rules as React.FC<any>}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={creepyProps as any}
        calculateMetadata={async ({ props }: { props: any }) => {
          const s = (props || creepyProps) as CreepyScript;
          const tl = buildRulesTimeline(s);
          return { durationInFrames: tl.total, fps: tl.fps, ...creepyDimsOf(s.meta), props: s };
        }}
      />
      <Composition
        id="CreepySheet"
        component={Sheet as React.FC<any>}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={creepyProps as any}
        calculateMetadata={async ({ props }: { props: any }) => ({
          fps: (props as CreepyScript).meta?.fps ?? 30,
          props,
        })}
      />

      {/* 2. EXACT 2D STORY STUDIO (Ball-head Characters, Poses, Facial Expressions, Sets, Camera) */}
      <Composition
        id="StoryStudio"
        component={Story as React.FC<any>}
        durationInFrames={Math.max(1, storyTotalFrames(storyProps.shots, storyProps.meta?.fps ?? 30))}
        fps={storyProps.meta?.fps ?? 30}
        width={storyDims(storyProps.meta).width}
        height={storyDims(storyProps.meta).height}
        defaultProps={storyProps as any}
        calculateMetadata={({ props }: { props: any }) => {
          const p = (props || storyProps) as unknown as StoryProps;
          const fps = p.meta?.fps ?? 30;
          const { width, height } = storyDims(p.meta);
          return { durationInFrames: Math.max(1, storyTotalFrames(p.shots, fps)), fps, width, height, props: p };
        }}
      />

      {/* Legacy Dynamic Studio */}
      <Composition
        id="DynamicStudio"
        component={DynamicStudio as any}
        durationInFrames={dynamicDurationInFrames}
        fps={currentScenario.fps || 30}
        width={currentScenario.width || 1920}
        height={currentScenario.height || 1080}
      />
      <Composition
        id="BotCase002"
        component={BotCase002}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
