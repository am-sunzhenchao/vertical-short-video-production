import React from 'react';
import type { EffectProps } from '../types';
import { SceneCanvas, SceneHeading, KnowledgeChip, Conclusion } from '../ui';
import { audibleFrames } from '../subtitles';
import { elementById, stringsParam, stringParam, revealSchedule, progressAt, easeOutCubic } from '../motion';

const SequentialReveal: React.FC<EffectProps> = ({ frame, fps, durationInFrames, scene }) => {
  const params = scene.component.params;
  const heading = elementById(scene.visualElements, stringParam(params.headingId, 'headingId'));
  const steps = stringsParam(params.stepIds, 'stepIds');
  const conclusion = elementById(scene.visualElements, stringParam(params.conclusionId, 'conclusionId'));
  const ids = [...steps, conclusion.id];
  const schedule = revealSchedule(ids.length, audibleFrames(scene, fps, durationInFrames), fps);
  return <SceneCanvas><SceneHeading element={heading} />{ids.map((id, index) => {
    const element = elementById(scene.visualElements, id);
    const progress = easeOutCubic(progressAt(frame, schedule.triggers[index], schedule.entranceFrames));
    const motion = { opacity: progress, transform: `translateY(${(1 - progress) * 18}px)` };
    return index === ids.length - 1 ? <Conclusion key={id} element={element} motion={motion} /> : <KnowledgeChip key={id} element={element} motion={motion} />;
  })}</SceneCanvas>;
};
export default SequentialReveal;
