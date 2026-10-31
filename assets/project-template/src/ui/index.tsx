import React from 'react';
import { fontSans, fontWenkai, typographyRoles } from '../effects/typography';
import { palette } from '../effects/palette';
import type { FontRole, TextRole, VisualElement } from '../types';

type MotionStyle = Pick<React.CSSProperties, 'opacity' | 'transform' | 'textAlign'>;
export function textStyle(role: TextRole, requestedFont?: FontRole): React.CSSProperties {
  const token = typographyRoles[role];
  const fontRole = role === 'subtitle' ? 'handwritten' : ['title', 'sceneHeading', 'nodeLabel', 'subheading', 'recapHeading', 'recapTitle', 'heroTitle'].includes(role) ? 'sans' : requestedFont ?? token.fontRole;
  return { fontSize: token.fontSize, fontWeight: token.fontWeight, lineHeight: token.lineHeight, fontFamily: fontRole === 'handwritten' ? fontWenkai : fontSans };
}
const color = (role: VisualElement['colorRole']) => role === 'warning' ? palette.accent : palette[role ?? 'ink'];
export const SceneCanvas: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ position: 'absolute', top: 150, left: 40, width: 1000, height: 1210, fontFamily: fontSans }}>{children}</div>;
export interface TextProps { element: VisualElement; motion?: MotionStyle; }
export const Text: React.FC<TextProps> = ({ element, motion }) => {
  const { x, y, width, height } = element.position;
  return <div data-element-id={element.id} style={{ position: 'absolute', left: x, top: y, width, height, color: color(element.colorRole), overflowWrap: 'break-word', whiteSpace: ['title', 'sceneHeading', 'nodeLabel', 'term', 'recapHeading', 'recapTitle'].includes(element.textRole) ? 'nowrap' : 'normal', ...motion, ...textStyle(element.textRole, element.fontRole) }}>{element.content}</div>;
};
export const DiagramText: React.FC<TextProps> = ({ element, motion }) => {
  const { x, y, width, height } = element.position;
  return <foreignObject x={x} y={y} width={width} height={height}><div data-element-id={element.id} style={{ width: '100%', height: '100%', color: color(element.colorRole), overflowWrap: 'break-word', ...motion, ...textStyle(element.textRole, element.fontRole) }}>{element.content}</div></foreignObject>;
};
export const SceneHeading: React.FC<TextProps> = ({ element, motion }) => <Text element={{ ...element, content: [...element.content].slice(0, 16).join(''), textRole: 'title', fontRole: 'sans' }} motion={motion} />;
const RoleText = ({ element, motion, role }: TextProps & { role: TextRole }) => <Text element={{ ...element, textRole: role }} motion={motion} />;
export const KnowledgeChip: React.FC<TextProps> = ({ element, motion }) => {
  const { x, y, width, height } = element.position;
  return <div style={{ position: 'absolute', left: x, top: y, width, height, boxSizing: 'border-box', background: palette.surface, border: `3px solid ${palette.accent}`, borderRadius: 999, padding: '12px 20px', ...motion }}><div data-element-id={element.id} style={{ ...textStyle('knowledgeChip', element.fontRole), color: color(element.colorRole), whiteSpace: 'nowrap' }}>{element.content}</div></div>;
};
export const ChipGroup: React.FC<{ elements: VisualElement[]; frame: number; triggers: number[]; entranceFrames: number }> = ({ elements, frame, triggers, entranceFrames }) => <>{elements.map((element, index) => {
  const progress = Math.min(1, Math.max(0, (frame - triggers[index]) / Math.max(1, entranceFrames)));
  return <KnowledgeChip key={element.id} element={element} motion={{ opacity: progress, transform: `translateY(${(1 - progress) * 18}px)` }} />;
})}</>;
export const NodeLabel: React.FC<TextProps> = props => <RoleText {...props} role="nodeLabel" />;
export const Conclusion: React.FC<TextProps> = props => <RoleText {...props} role="conclusion" />;
export const Quote: React.FC<TextProps> = props => <RoleText {...props} role="quote" />;
export const Subtitle: React.FC<{ text: string; opacity: number }> = ({ text, opacity }) => <div style={{ position: 'absolute', top: 1440, left: 56, right: 56, bottom: 250, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '12px 0' }}><div style={{ ...textStyle('subtitle', 'handwritten'), color: palette.ink, textAlign: 'center', opacity }}>{text}</div></div>;
