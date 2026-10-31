import fs from 'node:fs';
import path from 'node:path';
import {main, context, json, inside} from './lib/core.mjs';
import {hanCount} from './lib/audio.mjs';

export function stripSource(markdown) {
  let fenced = false;
  return markdown.split(/\r?\n/).filter(line => {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; return false; }
    return !fenced && !/^\s*(#|>|\||-{3,}|\*{3,})/.test(line);
  }).join('\n').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`~]/g, '');
}
export function scriptStats(raw, input, estimated = false) {
  if (!Array.isArray(input.scenes) || !input.scenes.length) throw new Error('Nonempty scenes required');
  const R = hanCount(stripSource(raw));
  const scenes = input.scenes.map(s => {
    const seconds = estimated ? s.estimatedDurationSec - (s.tailSec || 0) - (input.audioPlan?.PAD || 0) : s.audioDurationSec ?? s.durationSec - (s.tailSec || 0) - (input.audioPlan?.PAD || 0);
    if (!Number.isFinite(seconds) || seconds <= 0) throw new Error(`${s.id}: positive speech duration required`);
    const N = hanCount(s.narration);
    return {id: s.id, N, speechDurationSec: seconds, speed: N / seconds, timingBasis: estimated ? 'estimated' : s.timingBasis || 'provided'};
  });
  const N = scenes.reduce((sum, s) => sum + s.N, 0);
  const speechDurationSec = scenes.reduce((sum, s) => sum + s.speechDurationSec, 0);
  const speedSpread = Math.max(...scenes.map(s => s.speed)) - Math.min(...scenes.map(s => s.speed));
  return {R, N, compressionRatio: R ? N / R : null, reduction: R - N, speechDurationSec, speed: N / speechDurationSec, speedSpread, suggestedAlignmentMode: speedSpread <= 1 ? 'single-scene-proportional' : 'multi-segment-measured', overSpeed: scenes.filter(s => s.speed > 5.8).map(s => s.id), scenes, limits: 'Markdown headings, quotes, table rows and fenced blocks excluded; semantic preservation and visual alignment not evaluated.'};
}
export function statsMarkdown(s) {
  return `## 文稿压缩比统计\n\n原文汉字：${s.R} · 口播汉字：${s.N}\n\n压缩比：${s.compressionRatio === null ? 'N/A' : `${(s.compressionRatio * 100).toFixed(1)}%`}（仅读数）\n\n${s.reduction >= 0 ? '精简' : '净增'}：${Math.abs(s.reduction)} 字\n\n有声时长：${s.speechDurationSec.toFixed(3)}s · 语速：${s.speed.toFixed(3)} 字/秒 · 极差：${s.speedSpread.toFixed(3)}\n\n| 镜头 | 汉字 | 有声秒数 | 字/秒 | 时间依据 |\n|---|---:|---:|---:|---|\n${s.scenes.map(v => `| ${v.id} | ${v.N} | ${v.speechDurationSec.toFixed(3)} | ${v.speed.toFixed(3)} | ${v.timingBasis} |`).join('\n')}\n\n建议路线：${s.suggestedAlignmentMode}（不自动改变批准配置）\n\n局限：${s.limits}\n`;
}
main(options => {
  let input, rawFile, estimated = false;
  if (options.scenes) {
    if (!options.raw) throw new Error('--raw required with --scenes');
    input = json(path.resolve(options.scenes));
    rawFile = path.resolve(options.raw);
  } else {
    const ctx = context(options);
    input = ctx.plan;
    rawFile = inside(ctx.projectRoot, options.raw || input.sourcePath || '制作过程/原始知识材料.md');
    estimated = true;
  }
  const result = scriptStats(fs.readFileSync(rawFile, 'utf8'), input, estimated);
  const format = options.format || 'markdown';
  if (!['json', 'markdown'].includes(format)) throw new Error('--format json|markdown');
  console.log(format === 'json' ? JSON.stringify(result, null, 2) : statsMarkdown(result));
}, import.meta.url);
