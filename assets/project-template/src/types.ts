export type FontRole = 'sans' | 'handwritten';
export type TextRole = 'title' | 'sceneHeading' | 'knowledgeChip' | 'nodeLabel' | 'conclusion' | 'diagramLabel' | 'chartLabel' | 'body' | 'note' | 'term' | 'quote' | 'recapHeading' | 'subtitle' | 'heroTitle' | 'heroSymbol' | 'subheading' | 'recapTitle' | 'warning' | 'section' | 'series' | 'secondary' | 'badge' | 'index' | 'arrow' | 'heroArrow';
export type ColorRole = 'bg' | 'surface' | 'ink' | 'sub' | 'accent' | 'accent2' | 'warning';
export interface Position { x: number; y: number; width: number; height: number; }
export interface VisualElement {
  id: string;
  content: string;
  textRole: TextRole;
  fontRole?: FontRole;
  colorRole?: ColorRole;
  position: Position;
}
export type AlignmentMode = 'single-scene-proportional' | 'multi-segment-measured';
export type TimingBasis = 'estimated' | 'measured';
export interface SubtitleSegment { text: string; startSec?: number; estimatedStartSec?: number; }
export interface MotionPlan {
  primaryPattern: string;
  knowledgeGoal?: string;
  knowledgeRelation?: string;
  secondaryPattern?: string | null;
  camera?: string;
  intensity?: string;
  allowedMotion?: string[];
  forbiddenMotion?: string[];
  [key: string]: unknown;
}
export interface SceneData {
  id: string;
  title?: string;
  subtitle?: string;
  narration?: string;
  subtitleSegments?: SubtitleSegment[];
  visualElements: VisualElement[];
  component: { name: string; params: Record<string, unknown> };
  motionPlan: MotionPlan;
  durationSec: number;
  audioDurationSec?: number;
  tailSec?: number;
  audio?: string;
  alignmentMode?: AlignmentMode;
  timingBasis?: TimingBasis;
  [key: string]: unknown;
}
export interface ScenesData {
  slug: string;
  compositionId?: string;
  fps?: number;
  timingBasis?: TimingBasis;
  audioPlan?: { alignmentMode?: AlignmentMode; timingBasis?: TimingBasis };
  scenes: SceneData[];
  [key: string]: unknown;
}
export interface EffectProps { frame: number; fps: number; durationInFrames: number; scene: SceneData; }
