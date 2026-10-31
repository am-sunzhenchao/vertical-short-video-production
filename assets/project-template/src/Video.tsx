import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Scene } from './Scene';
import { scenesData } from './data';
import { palette } from './effects/palette';
import { fontSans } from './effects/typography';
import type { ScenesData } from './types';

export const productionData = scenesData as unknown as ScenesData;
export function sceneFrames(seconds: number, fps: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0 || !Number.isFinite(fps) || fps <= 0) throw new Error('Invalid scene duration or fps');
  return Math.max(1, Math.round(seconds * fps));
}
export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  let offset = 0;
  const sequences = productionData.scenes.map(scene => {
    const from = offset;
    const duration = sceneFrames(scene.durationSec, fps);
    offset += duration;
    return <Sequence key={scene.id} from={from} durationInFrames={duration}>
      <Scene scene={scene} durationInFrames={duration} alignmentMode={productionData.audioPlan?.alignmentMode} timingBasis={productionData.timingBasis ?? productionData.audioPlan?.timingBasis} />
      {scene.audio && <Audio src={staticFile(scene.audio)} />}
    </Sequence>;
  });
  const last = productionData.scenes[productionData.scenes.length - 1];
  const fadeFrames = Math.min(35, Math.round((last?.tailSec ?? 0) * fps), durationInFrames);
  const fade = fadeFrames > 1 ? Math.min(1, Math.max(0, (frame - (durationInFrames - fadeFrames)) / (fadeFrames - 1))) : 0;
  return <AbsoluteFill style={{ background: palette.bg, fontFamily: fontSans }}>{sequences}<AbsoluteFill style={{ background: palette.bg, opacity: fade, pointerEvents: 'none' }} /></AbsoluteFill>;
};
