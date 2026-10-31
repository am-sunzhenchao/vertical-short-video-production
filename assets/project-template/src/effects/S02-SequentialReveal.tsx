import React from 'react';
import SequentialReveal from './SequentialReveal';
import type { EffectProps } from '../types';

const SceneReveal: React.FC<EffectProps> = props => <SequentialReveal {...props} />;
export default SceneReveal;
