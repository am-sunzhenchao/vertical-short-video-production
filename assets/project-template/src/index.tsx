import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Video, productionData, sceneFrames } from './Video';
import config from '../project.config.json';

export const Root: React.FC = () => {
  const fps = productionData.fps ?? 25;
  const durationInFrames = productionData.scenes.reduce((sum, scene) => sum + sceneFrames(scene.durationSec, fps), 0);
  if (!durationInFrames) throw new Error('Production scenes must not be empty');
  return <Composition id={config.compositionId} component={Video} width={1080} height={1920} fps={fps} durationInFrames={durationInFrames} />;
};
registerRoot(Root);
