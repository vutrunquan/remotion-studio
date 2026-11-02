import React from 'react';
import {Composition} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Montserrat';
import {Story} from './Story';
import type {StoryProps} from './types';
import {dims, totalFrames} from './lib/timing';
import storyData from './story.json';

// Montserrat 500/700/800 incl. Vietnamese + extended Latin
loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin', 'latin-ext', 'vietnamese']});

const defaults = storyData as unknown as StoryProps;

export const Root: React.FC = () => (
  <Composition
    id="Story"
    component={Story}
    durationInFrames={Math.max(1, totalFrames(defaults.shots, defaults.meta.fps ?? 30))}
    fps={defaults.meta.fps ?? 30}
    width={dims(defaults.meta).width}
    height={dims(defaults.meta).height}
    defaultProps={defaults}
    // Any script length: duration, fps and size are derived from the props (data/story.json or --props=...)
    calculateMetadata={({props}) => {
      const p = props as unknown as StoryProps;
      const fps = p.meta.fps ?? 30;
      const {width, height} = dims(p.meta);
      return {durationInFrames: Math.max(1, totalFrames(p.shots, fps)), fps, width, height};
    }}
  />
);
