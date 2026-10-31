import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { audibleFrames, buildSceneLines, collectAllLines, splitToLines, subtitleChunks, subtitleOpacity, visualLen } from '../../assets/project-template/src/subtitles.ts';
import { revealSchedule } from '../../assets/project-template/src/motion.ts';

const skill = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const template = resolve(skill, 'assets/project-template');
test('three-level subtitle splitting stays within thirteen visual characters', () => {
  for (const text of ['短句。下一句！', '第一部分比较长所以需要切割，第二部分也不能遗漏。', '这是没有标点的一条非常长的中文讲解句子需要机械切割', '中文 Remotion pipeline，English words retain order！', '，，。！？']) {
    const chunks = subtitleChunks(text);
    assert.ok(chunks.every(chunk => visualLen(chunk) <= 13 && !/[\p{P}\s]$/u.test(chunk)));
  }
  assert.deepEqual(subtitleChunks('，，。！？'), []);
});
test('serial allocation consumes exact budget and fits fade frames', () => {
  const text = '第一句。第二句话。第三句解释很多内容。';
  for (const span of [3, 4, 7, 30, 90, 400]) {
    const lines = splitToLines(text, 5, 5 + span);
    assert.equal(lines.at(-1).endFrame, 5 + span);
    lines.forEach((line, index) => {
      assert.ok(line.startFrame < line.endFrame);
      if (index) assert.ok(lines[index - 1].endFrame <= line.startFrame);
      assert.ok(line.startFrame + line.fadeInFrames <= line.fadeOutStartFrame);
      if (line.fadeOutFrames) assert.equal(subtitleOpacity(line, line.endFrame - 1), 0);
      assert.equal(subtitleOpacity(line, line.endFrame), 0);
    });
    for (let frame = 0; frame < span + 10; frame++) assert.ok(lines.filter(line => subtitleOpacity(line, frame) > 0).length <= 1);
  }
});
test('invalid timing and insufficient budget fail rather than drop text', () => {
  for (const range of [[0, 1], [-1, 20], [0, NaN], [0.5, 30], [10, 0]]) assert.throws(() => splitToLines('一句。两句。三句。', ...range));
  for (const starts of [[1], [0, 0], [0, 0.001], [0, 5], [0, NaN]]) assert.throws(() => collectAllLines(starts.map(startSec => ({ text: '内容', startSec })), 25, 100));
  assert.throws(() => collectAllLines([], 25, 100));
  assert.throws(() => collectAllLines([{ text: '内容', startSec: 0 }], 0, 100));
});
test('measured segments override estimates only after measurement', () => {
  const scene = { subtitle: '全部内容。', alignmentMode: 'multi-segment-measured', subtitleSegments: [{ text: '第一句', estimatedStartSec: 0 }, { text: '第二句', estimatedStartSec: 2 }] };
  assert.deepEqual(buildSceneLines(scene, 25, 100).map(line => line.text), ['全部内容']);
  assert.throws(() => buildSceneLines({ ...scene, timingBasis: 'measured' }, 25, 100));
  const measured = { ...scene, timingBasis: 'measured', subtitleSegments: [{ text: '第一句', startSec: 0 }, { text: '第二句', startSec: 2 }] };
  assert.equal(buildSceneLines(measured, 25, 100)[1].startFrame, 50);
});
test('tail is excluded and last entrance completes before audio ends', () => {
  assert.equal(audibleFrames({ tailSec: 2, audioDurationSec: 5 }, 25, 175), 125);
  assert.equal(audibleFrames({ tailSec: 2 }, 25, 175), 125);
  assert.throws(() => audibleFrames({ tailSec: -1 }, 25, 175));
  assert.throws(() => audibleFrames({ tailSec: 2, audioDurationSec: 6 }, 25, 175));
  for (const fps of [24, 25, 30, 60]) for (const audio of [1, 7, 100, 350]) {
    const schedule = revealSchedule(8, audio, fps);
    assert.ok(schedule.triggers.at(-1) + schedule.entranceFrames <= audio);
    assert.deepEqual(schedule, revealSchedule(8, audio, fps));
  }
});
test('typography contract matches approved values and retains aliases', () => {
  const asset = JSON.parse(readFileSync(resolve(skill, 'assets/typography.json'), 'utf8'));
  assert.equal(asset.version, 'review-v1-fixed');
  const expected = { title: [52, 800], sceneHeading: [52, 800], knowledgeChip: [44, 900], nodeLabel: [44, 800], conclusion: [44, 800], diagramLabel: [38, 700], chartLabel: [38, 700], body: [42, 700], note: [36, 600], term: [56, 900], quote: [58, 900], recapHeading: [50, 800], subtitle: [70, 600], heroTitle: [96, 900], heroSymbol: [140, 900] };
  for (const [role, values] of Object.entries(expected)) assert.deepEqual([asset.roles[role].fontSize, asset.roles[role].fontWeight], values);
  assert.deepEqual(asset.roles.recapTitle, asset.roles.recapHeading);
  assert.deepEqual(asset.roles.subheading, asset.roles.nodeLabel);
  assert.equal(asset.roles.subtitle.fontRole, 'handwritten');
  assert.equal(asset.roles.title.fontRole, 'sans');
  assert.equal(asset.roles.nodeLabel.fontRole, 'sans');
  assert.ok(asset.fonts.handwritten.includes('LXGW WenKai'));
});
test('template contains no arbitrary any, comments, dependencies or subject project', () => {
  const files = readdirSync(template, { recursive: true, withFileTypes: true }).filter(entry => entry.isFile());
  for (const entry of files) {
    const path = resolve(entry.parentPath, entry.name);
    assert.ok(!path.includes('node_modules'));
    if (!/\.(tsx?|mjs)$/.test(path)) continue;
    const code = readFileSync(path, 'utf8');
    assert.ok(!/\bany\b|moguyun|FLOW_FIELD|Math\.random|Date\.now|\/\*|^\s*\/\//m.test(code), path);
  }
  const pkg = JSON.parse(readFileSync(resolve(template, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.dev, 'remotion studio src/index.tsx');
  assert.equal(pkg.scripts.typecheck, 'tsc --noEmit');
  assert.equal(pkg.scripts.sync, 'node scripts/run.mjs audio-pipeline --sync-only');
  assert.equal(pkg.scripts.lint, 'node scripts/run.mjs validate-project');
  for (const dep of ['typescript', '@types/node', '@types/react', '@types/react-dom', '@resvg/resvg-js']) assert.ok(pkg.devDependencies[dep]);
});
