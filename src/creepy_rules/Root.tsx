import React from 'react';
import {Composition} from 'remotion';
import {Rules} from './Rules';
import {Sheet} from './Sheet';
import {buildTimeline} from './timeline';
import type {Script} from './types';
import sample from './sample.json';

export function dimsOf(meta: Script['meta']): {width: number; height: number} {
  const res = meta?.res ?? 1080;
  const k = res / 1080;
  const a = meta?.aspect ?? '16:9';
  if (a === '9:16') return {width: Math.round(1080 * k), height: Math.round(1920 * k)};
  if (a === '1:1') return {width: Math.round(1080 * k), height: Math.round(1080 * k)};
  return {width: Math.round(1920 * k), height: Math.round(1080 * k)};
}

export const RemotionRoot: React.FC = () => {
  const props = sample as unknown as Script;
  return (
    <>
      <Composition
        id="Rules"
        component={Rules as React.FC<any>}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={props as any}
        calculateMetadata={async ({props}: {props: any}) => {
          const s = props as Script;
          const tl = buildTimeline(s);
          return {durationInFrames: tl.total, fps: tl.fps, ...dimsOf(s.meta), props: s};
        }}
      />
      <Composition
        id="Sheet"
        component={Sheet as React.FC<any>}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={props as any}
        calculateMetadata={async ({props}: {props: any}) => ({fps: (props as Script).meta?.fps ?? 30, props})}
      />
    </>
  );
};
