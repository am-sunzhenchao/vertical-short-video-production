import React from 'react';
import type { EffectProps, VisualElement } from '../types';
import { SceneCanvas, Text, Quote } from '../ui';
import { palette } from './palette';
import { audibleFrames } from '../subtitles';
import { stringsParam, stringParam, revealSchedule, progressAt, easeOutCubic } from '../motion';

const OutroRecap: React.FC<EffectProps> = ({ frame, fps, durationInFrames, scene }) => {
  const params = scene.component.params;
  const steps = stringsParam(params.steps, 'steps');
  if (steps.length > 5) throw new Error('OutroRecap supports at most five steps; split longer recaps');
  const quote = stringParam(params.quote, 'quote');
  const credit = stringParam(params.credit, 'credit');
  const heading = typeof params.heading === 'string' ? params.heading : '回顾';
  const audible = audibleFrames(scene, fps, durationInFrames);
  const schedule = revealSchedule(steps.length + 3, audible, fps);
  const breathing = frame >= audible ? Math.sin((frame - audible) / fps * 1.4) * 2 : 0;
  const motion = (index: number) => {
    const progress = easeOutCubic(progressAt(frame, schedule.triggers[index], schedule.entranceFrames));
    return { opacity: progress, transform: `translateY(${(1 - progress) * 18 + breathing}px)` };
  };
  const element = (id: string, content: string, y: number, height: number, textRole: VisualElement['textRole']): VisualElement => {
    const configured = scene.visualElements.find(item => item.id === id);
    if (!configured || configured.content !== content || configured.textRole !== textRole) throw new Error(`Outro元素与方案不一致: ${id}`);
    return { ...configured, position: { x: 40, y, width: 920, height } };
  };
  const quoteY = 140 + steps.length * 130;
  return <SceneCanvas>
    <Text element={element('recap-heading', heading, 0, 90, 'recapHeading')} motion={motion(0)} />
    {steps.map((step, index) => <div key={index} style={{ position: 'absolute', left: 40, top: 130 + index * 130, width: 920, height: 100, borderRadius: 50, border: `2px solid ${palette.accent2}`, background: palette.surface, ...motion(index + 1) }}>
      <Text element={{ ...element(`recap-index-${index}`, String(index + 1), 20, 60, 'index'), position: { x: 24, y: 20, width: 60, height: 60 } }} />
      <Text element={{ ...element(`recap-step-${index}`, step, 18, 64, 'body'), position: { x: 110, y: 18, width: 780, height: 64 } }} />
    </div>)}
    <Quote element={element('recap-quote', quote, quoteY, 180, 'quote')} motion={motion(steps.length + 1)} />
    <Text element={element('recap-credit', credit, quoteY + 210, 90, 'note')} motion={motion(steps.length + 2)} />
  </SceneCanvas>;
};
export default OutroRecap;
