import React from 'react';
import type { EffectProps } from '../types';
import { SceneCanvas, SceneHeading, NodeLabel, Conclusion, Text } from '../ui';
import { audibleFrames } from '../subtitles';
import { elementById, stringsParam, stringParam, revealSchedule, progressAt, easeOutCubic } from '../motion';

const LeftRightCompare: React.FC<EffectProps> = ({ frame, fps, durationInFrames, scene }) => {
  const params = scene.component.params;
  const heading = elementById(scene.visualElements, stringParam(params.headingId, 'headingId'));
  const sides = stringsParam(params.sideIds, 'sideIds');
  if (sides.length !== 2) throw new Error('LeftRightCompare requires two sideIds');
  const details = stringsParam(params.detailIds, 'detailIds');
  const conclusion = elementById(scene.visualElements, stringParam(params.conclusionId, 'conclusionId'));
  const ids = [...sides, ...details, conclusion.id];
  const schedule = revealSchedule(ids.length, audibleFrames(scene, fps, durationInFrames), fps);
  return <SceneCanvas><SceneHeading element={heading} />{ids.map((id, index) => {
    const element = elementById(scene.visualElements, id);
    const progress = easeOutCubic(progressAt(frame, schedule.triggers[index], schedule.entranceFrames));
    const motion = { opacity: progress, transform: `translateY(${(1 - progress) * 18}px)` };
    return index < 2 ? <NodeLabel key={id} element={element} motion={motion} /> : id === conclusion.id ? <Conclusion key={id} element={element} motion={motion} /> : <Text key={id} element={element} motion={motion} />;
  })}</SceneCanvas>;
};
export default LeftRightCompare;
