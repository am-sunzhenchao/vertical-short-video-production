import type { AlignmentMode, SceneData, SubtitleSegment, TimingBasis } from './types';

export interface SubtitleLine {
  text: string;
  startFrame: number;
  endFrame: number;
  fadeInFrames: number;
  fadeOutFrames: number;
  fadeOutStartFrame: number;
}
export const MAX_VISUAL = 13;
const integer = (value: number, name: string, min = 0) => {
  if (!Number.isSafeInteger(value) || value < min) throw new Error(`${name} must be an integer >= ${min}`);
};
const positive = (value: number, name: string) => {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be finite and positive`);
};
export const visualLen = (text: string) => [...text].reduce((sum, char) => sum + (/[\p{Script=Han}\u3000-\u303f\uff00-\uffef]/u.test(char) ? 1 : 0.55), 0);
export const displayText = (text: string) => text.trim().replace(/[\p{P}\s]+$/gu, '');
const hasContent = (text: string) => /[\p{L}\p{N}]/u.test(text);
const weight = (text: string) => (text.match(/\p{Script=Han}/gu) ?? []).length || Math.max(1, [...text].filter(char => /[\p{L}\p{N}]/u.test(char)).length);
export function cutVisual(text: string): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const char of text) {
    if (current && visualLen(current + char) > MAX_VISUAL) {
      chunks.push(current);
      current = '';
    }
    current += char;
  }
  if (current) chunks.push(current);
  return chunks;
}
export function subtitleChunks(text: string): string[] {
  if (typeof text !== 'string') throw new Error('subtitle text must be a string');
  const sentences = text.match(/[^。？！；…!?;]+[。？！；…!?;]*/gu) ?? [text];
  return sentences.flatMap(sentence => {
    if (visualLen(sentence.trim()) <= MAX_VISUAL) return [sentence];
    const clauses = sentence.match(/[^，、,]+[，、,]*/gu) ?? [sentence];
    return clauses.flatMap(clause => cutVisual(clause.trim()));
  }).map(displayText).filter(hasContent);
}
export function splitToLines(text: string, segStart: number, segEnd: number): SubtitleLine[] {
  integer(segStart, 'segStart');
  integer(segEnd, 'segEnd');
  if (segEnd < segStart) throw new Error('segEnd must not precede segStart');
  const chunks = subtitleChunks(text);
  if (!chunks.length) return [];
  const span = segEnd - segStart;
  if (span < chunks.length) throw new Error('字幕有声帧预算不足，请调整分段或音频时长');
  const gap = chunks.length > 1 ? Math.min(8, Math.floor((span - chunks.length) / (chunks.length - 1))) : 0;
  const extra = span - gap * (chunks.length - 1) - chunks.length;
  const totalWeight = chunks.reduce((sum, chunk) => sum + weight(chunk), 0);
  let cursor = segStart;
  let accumulatedWeight = 0;
  let allocated = 0;
  return chunks.map((chunk, index) => {
    accumulatedWeight += weight(chunk);
    const cumulative = index === chunks.length - 1 ? extra : Math.floor(extra * accumulatedWeight / totalWeight);
    const length = 1 + cumulative - allocated;
    allocated = cumulative;
    const startFrame = cursor;
    const endFrame = startFrame + length;
    const fadeInFrames = Math.min(10, Math.floor((length - 1) / 3));
    const fadeOutFrames = Math.min(10, Math.floor((length - 1) / 3));
    cursor = endFrame + gap;
    return { text: chunk, startFrame, endFrame, fadeInFrames, fadeOutFrames, fadeOutStartFrame: endFrame - 1 - fadeOutFrames };
  });
}
export function subtitleOpacity(line: SubtitleLine, frame: number): number {
  integer(frame, 'frame');
  if (frame < line.startFrame || frame >= line.endFrame) return 0;
  const fadeIn = line.fadeInFrames === 0 ? 1 : Math.min(1, (frame - line.startFrame) / line.fadeInFrames);
  const fadeOut = line.fadeOutFrames === 0 ? 1 : Math.min(1, Math.max(0, (line.endFrame - 1 - frame) / line.fadeOutFrames));
  return fadeIn * fadeOut;
}
export function collectAllLines(segments: SubtitleSegment[], fps: number, endFrame: number): SubtitleLine[] {
  positive(fps, 'fps');
  integer(endFrame, 'endFrame', 1);
  if (!segments.length) throw new Error('实测字幕分段不能为空');
  const starts = segments.map((segment, index) => {
    const seconds = segment.startSec;
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0 || seconds * fps >= endFrame || (index === 0 && seconds !== 0)) throw new Error('实测 startSec 必须从零起且位于有声区间内');
    return Math.round(seconds * fps);
  });
  if (starts.some((start, index) => start >= endFrame || (index > 0 && (start <= starts[index - 1] || (segments[index].startSec as number) <= (segments[index - 1].startSec as number))))) throw new Error('实测 startSec 秒数及舍入帧必须严格递增');
  return segments.flatMap((segment, index) => splitToLines(segment.text, starts[index], starts[index + 1] ?? endFrame));
}
export function audibleFrames(scene: Pick<SceneData, 'audioDurationSec' | 'tailSec'>, fps: number, durationInFrames: number): number {
  positive(fps, 'fps');
  integer(durationInFrames, 'durationInFrames', 1);
  const tail = scene.tailSec ?? 0;
  if (!Number.isFinite(tail) || tail < 0 || tail * fps > durationInFrames) throw new Error('tailSec exceeds scene duration or is invalid');
  const budget = durationInFrames - Math.round(tail * fps);
  if (scene.audioDurationSec === undefined) return budget;
  positive(scene.audioDurationSec, 'audioDurationSec');
  const measured = Math.round(scene.audioDurationSec * fps);
  if (measured > budget + 1) throw new Error('audioDurationSec exceeds audible frame budget');
  return Math.min(budget, measured);
}
export function buildSceneLines(scene: Pick<SceneData, 'subtitle' | 'narration' | 'subtitleSegments' | 'alignmentMode' | 'timingBasis'>, fps: number, endFrame: number, alignmentMode: AlignmentMode = 'single-scene-proportional', timingBasis: TimingBasis = 'estimated'): SubtitleLine[] {
  positive(fps, 'fps');
  integer(endFrame, 'endFrame');
  const mode = scene.alignmentMode ?? alignmentMode;
  const basis = scene.timingBasis ?? timingBasis;
  if (!['single-scene-proportional', 'multi-segment-measured'].includes(mode)) throw new Error('未知 alignmentMode');
  if (!['estimated', 'measured'].includes(basis)) throw new Error('未知 timingBasis');
  if (mode === 'multi-segment-measured' && basis === 'measured') return collectAllLines(scene.subtitleSegments ?? [], fps, endFrame);
  return splitToLines(scene.subtitle ?? scene.narration ?? (scene.subtitleSegments ?? []).map(segment => segment.text).join(''), 0, endFrame);
}
