import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { registry } from './effects/registry';
import { palette } from './effects/palette';
import { fontSans } from './effects/typography';
import { Subtitle } from './ui';
import { audibleFrames, buildSceneLines, subtitleOpacity } from './subtitles';
import type { AlignmentMode, EffectProps, SceneData, TimingBasis } from './types';

export const Scene: React.FC<{ scene: SceneData; durationInFrames: number; alignmentMode?: AlignmentMode; timingBasis?: TimingBasis }> = ({ scene, durationInFrames, alignmentMode, timingBasis }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const effects: Record<string, React.ComponentType<EffectProps>> = registry;
  const Effect = effects[scene.component.name];
  if (!Effect) throw new Error(`Unregistered effect: ${scene.component.name}`);
  const lines = buildSceneLines(scene, fps, audibleFrames(scene, fps, durationInFrames), alignmentMode, timingBasis);
  const current = lines.find(line => frame >= line.startFrame && frame < line.endFrame);
  return <AbsoluteFill style={{ background: palette.bg, fontFamily: fontSans }}>
    <Effect frame={frame} fps={fps} durationInFrames={durationInFrames} scene={scene} />
    {current && <Subtitle text={current.text} opacity={subtitleOpacity(current, frame)} />}
  </AbsoluteFill>;
};
