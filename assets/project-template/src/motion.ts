import type { VisualElement } from './types';

export const progressAt = (frame: number, trigger: number, duration: number) => Math.min(1, Math.max(0, (frame - trigger) / Math.max(1, duration)));
export const easeOutCubic = (progress: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, progress)), 3);
export function revealSchedule(count: number, audible: number, fps: number): { triggers: number[]; entranceFrames: number } {
  if (!Number.isSafeInteger(count) || count < 1 || !Number.isSafeInteger(audible) || audible < 1 || !Number.isFinite(fps) || fps <= 0) throw new Error('Invalid reveal schedule');
  const entranceFrames = Math.max(1, Math.min(Math.round(fps * 0.48), Math.floor(audible / (count + 1)) || 1));
  const latest = Math.max(0, audible - 1 - entranceFrames);
  return { entranceFrames, triggers: Array.from({ length: count }, (_, index) => count === 1 ? 0 : Math.floor(latest * index / (count - 1))) };
}
export function stringsParam(value: unknown, name: string): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.some(item => typeof item !== 'string' || !item.trim())) throw new Error(`${name} must be a nonempty string array`);
  return value as string[];
}
export function stringParam(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} must be a nonempty string`);
  return value;
}
export function elementById(elements: VisualElement[], id: string): VisualElement {
  const element = elements.find(item => item.id === id);
  if (!element) throw new Error(`Missing visualElement: ${id}`);
  return element;
}
