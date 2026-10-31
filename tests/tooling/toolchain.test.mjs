import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {skillRoot, json, writeJson, digest, inside, context, run} from '../../scripts/lib/core.mjs';
import {approved, validatePlan, typographyAsset, checkSchema, checkEffects} from '../../scripts/lib/validation.mjs';
import {renderReview, ensureReview, patchPlan, parseReview} from '../../scripts/lib/review.mjs';
import {exportScenes, generatedFiles, generatedWrite, verifyScenes, transaction} from '../../scripts/lib/production.mjs';
import {audioPipeline, assertBatchResults, measuredScene, checkMeasuredSpeeds, pythonInvocation, ttsInvocation} from '../../scripts/lib/audio.mjs';
import {scriptStats, statsMarkdown} from '../../scripts/script-stats.mjs';
import {approveCover} from '../../scripts/render-cover.mjs';

const asset = typographyAsset();
function plan() {
  const scene = (id, purpose = 'explain') => ({id, title: '理解机制', purpose, knowledgeIds: ['K01'], claimIds: ['C01'], sourceIds: ['SRC01'], narration: '看清原因机制结果', subtitle: '看清原因机制结果', subtitleSegments: [{text: '看清原因', narration: '看清原因', estimatedStartSec: 0}, {text: '机制结果', narration: '机制结果', estimatedStartSec: 1}], estimatedDurationSec: purpose === 'outro' ? 6.2 : 4, tailSec: purpose === 'outro' ? 2.2 : 0, shot_type: 'effect', shotLang: 'I1', visualGrammar: '因果关系', visualElements: [{id: 'node', type: 'node', content: '机制', textRole: 'nodeLabel', fontRole: 'sans', colorRole: 'ink', claimIds: ['C01'], position: {x: 0, y: 0, width: 300, height: 200}}], motionPlan: {knowledgeGoal: '解释', knowledgeRelation: 'cause_effect', primaryPattern: 'CAUSE_EFFECT', secondaryPattern: null, selectionReason: '机制', camera: 'hold', intensity: 'low', continuityFrom: null, allowedMotion: [], forbiddenMotion: [], evidenceRisk: 'low'}, component: {name: `${id}-Mechanism`, params: {layout: 'vertical'}}, componentLookup: {status: 'pending'}, continuity: '承接', emotion: '理解', audioNotes: '无'});
  return structuredClone({schemaVersion: '1.0', planVersion: 1, slug: 'test-project', title: '为什么', coreQuestion: '为什么', coreAnswer: '机制', audience: '大众', scope: '限定', video: {width: 1080, height: 1920, fps: 25}, styleMode: 'vox-light', paletteName: 'paper', palette: {bg: '#F3EDE2', surface: '#FBF8F2', ink: '#1B1A17', sub: '#6B655B', accent: '#C8402F', accent2: '#2F5D62'}, typography: {version: asset.version, tokens: asset.tokens, emphasisOffset: asset.emphasisOffset, fontFamily: asset.fontRoles.sans, fontRoles: asset.fontRoles, roles: asset.roles}, themeOverride: null, narrative: {outline: ['机制', '回顾'], coverage: [{knowledgeId: 'K01', status: 'retained'}], emotionRhythm: '理解', outro: {sceneId: 'S02', kind: 'recap', fadeOutFrames: 32}}, audioPlan: {engine: 'chattts', defaultStyle: 'gentle_female', alignmentMode: 'single-scene-proportional', speedSpread: 0, timingBasis: 'estimated', loudnessLUFS: -16.6, openingTempo: 0.9, PAD: 0}, review: {status: 'approved', reviewedVersion: 1, approvedBy: 'tester', approvedAt: '2026-10-31T12:00:00Z', approvalEvidence: '明确批准版本1'}, evaluation: {planVersion: 1, status: 'pass', weightedScore: 9, dimensions: [9, 9, 9, 9, 9, 9, 9]}, scenes: [scene('S01'), scene('S02', 'outro')]});
}
function fixture(t, production = true) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vsv tooling-'));
  t.after(() => fs.rmSync(projectRoot, {recursive: true, force: true}));
  const p = plan();
  writeJson(path.join(projectRoot, '制作过程/视频制作方案.json'), p);
  const ctx = context({'project-root': projectRoot});
  renderReview(ctx);
  if (production) {
    fs.mkdirSync(ctx.engineRoot, {recursive: true});
    writeJson(path.join(ctx.engineRoot, 'project.config.json'), {projectRoot, skillRoot, slug: p.slug, compositionId: 'Main'});
    generatedWrite(ctx, generatedFiles(p, asset, exportScenes(p)));
    writeJson(path.join(ctx.engineRoot, 'package.json'), {type: 'module'});
    for (const scene of p.scenes) fs.writeFileSync(path.join(ctx.engineRoot, `src/effects/${scene.component.name}.tsx`), 'export default function Effect() { return null; }\n');
  }
  return ctx;
}
function cli(name, ctx, extras = []) {
  return spawnSync(process.execPath, [path.join(skillRoot, `scripts/${name}.mjs`), '--project-root', ctx.projectRoot, ...extras], {encoding: 'utf8', timeout: 20000});
}
function mockAudio(failure = '') {
  let batchCalls = 0, ffmpegCalls = 0;
  const calls = [];
  const run = (command, argv, options) => {
    calls.push({command, argv, options});
    if (command === '/mock/probe') {
      if (failure === 'probe' && argv.at(-1).includes('S02')) throw new Error('partial audio probe failure');
      return '4\n';
    }
    if (command === '/mock/ffmpeg') {
      ffmpegCalls++;
      if (failure === 'ffmpeg' && argv.at(-1).includes('S02')) throw new Error('partial ffmpeg failure');
      fs.writeFileSync(argv.at(-1), 'processed-mp3');
      return '';
    }
    batchCalls++;
    const jobsFile = argv.at(-1), jobs = json(jobsFile);
    for (const job of jobs) fs.writeFileSync(job.output, 'raw-mp3');
    writeJson(`${jobsFile}.result.json`, jobs.map((job, i) => ({i, output: job.output, ok: !(failure === 'batch' && i === 1)})));
    return '';
  };
  return {dependencies: {run, ffprobe: '/mock/probe', ffmpeg: '/mock/ffmpeg'}, calls, counts: () => ({batchCalls, ffmpegCalls})};
}
const generateOptions = {generate: true, 'tts-command': process.execPath};

test('child timeout terminates process and argv is never interpreted by shell', () => {
  assert.throws(() => run(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {timeout: 40}), /ETIMEDOUT/);
  assert.equal(run(process.execPath, ['-e', 'process.stdout.write(process.argv[1])', 'literal;$(touch should-not-exist)']), 'literal;$(touch should-not-exist)');
});
test('approval requires current reviewed and evaluation versions and real evidence', () => {
  approved(plan());
  for (const mutate of [p => p.review.reviewedVersion++, p => p.evaluation.planVersion++, p => p.review.status = 'pending', p => p.review.approvalEvidence = '', p => p.evaluation.status = 'needs-optimization', p => p.evaluation.dimensions[0] = 5]) {
    const p = plan(); mutate(p); assert.throws(() => approved(p));
  }
});
test('finite schema executes required/type/ref/pattern/bounds and rejects unsupported keywords', () => {
  const p = plan(); validatePlan(p);
  p.scenes[0].estimatedDurationSec = 0;
  assert.throws(() => validatePlan(p), /exclusiveMinimum/);
  assert.throws(() => checkSchema({}, {type: 'object', required: ['x']}), /missing x/);
  assert.throws(() => checkSchema({}, {oneOf: []}), /Unsupported/);
});
test('paths reject traversal, absolute escape, unsafe slug and symlink', t => {
  const ctx = fixture(t, false);
  assert.throws(() => inside(ctx.projectRoot, '../escape'), /Unsafe path/);
  assert.throws(() => inside(ctx.projectRoot, '/etc/passwd'), /outside/);
  fs.symlinkSync(os.tmpdir(), path.join(ctx.projectRoot, 'link'));
  assert.throws(() => inside(ctx.projectRoot, 'link/x'), /Symlink/);
  ctx.plan.engineDir = '../escape'; writeJson(ctx.planFile, ctx.plan);
  assert.throws(() => context({'project-root': ctx.projectRoot}), /Unsafe/);
  ctx.plan.engineDir = '/tmp/escape'; writeJson(ctx.planFile, ctx.plan);
  assert.throws(() => context({'project-root': ctx.projectRoot}), /relative/);
});
test('canonical review preserves all extra global, evaluation and scene fields; user edits fail closed', t => {
  const ctx = fixture(t, false);
  assert.deepEqual(parseReview(fs.readFileSync(ctx.draftFile, 'utf8')), ctx.plan);
  ensureReview(ctx);
  fs.appendFileSync(ctx.draftFile, '\n用户补充\n');
  assert.throws(() => ensureReview(ctx), /changed/);
  assert.throws(() => renderReview(ctx), /protected/);
  assert.throws(() => renderReview(ctx, {refresh: true, 'expected-version': 1, 'confirmed-digest': 'wrong'}), /protected/);
  assert.throws(() => renderReview(ctx, {refresh: true, 'expected-version': 1, 'confirmed-digest': digest(ctx.plan)}), /incremented pending/);
  ctx.plan.planVersion = 2;
  ctx.plan.review = {status: 'pending', reviewedVersion: null, approvedBy: null, approvedAt: null, approvalEvidence: null};
  ctx.plan.evaluation = {planVersion: 2, status: 'not-evaluated', weightedScore: null};
  renderReview(ctx, {refresh: true, 'expected-version': 2, 'confirmed-digest': digest(ctx.plan)});
  ensureReview(ctx);
});
test('patch increments once, resets approvals and evaluation, prevents stale expected-version and approval injection', t => {
  const ctx = fixture(t, false);
  writeJson(path.join(ctx.projectRoot, 'patch.json'), {coreAnswer: '新答案'});
  const next = patchPlan(ctx, {'apply-patch': 'patch.json', 'expected-version': '1'});
  assert.equal(next.planVersion, 2);
  assert.equal(next.review.status, 'pending');
  assert.equal(next.review.reviewedVersion, null);
  assert.equal(next.evaluation.status, 'not-evaluated');
  assert.throws(() => patchPlan(ctx, {'apply-patch': 'patch.json', 'expected-version': '0'}), /conflict/);
  writeJson(path.join(ctx.projectRoot, 'patch.json'), {review: {status: 'approved'}});
  assert.throws(() => patchPlan(ctx, {'apply-patch': 'patch.json', 'expected-version': '1'}), /may not/);
});
test('same-version direct JSON mutation cannot refresh old approvals', t => {
  const ctx = fixture(t, false);
  ctx.plan.scenes[0].component.params.layout = 'horizontal';
  assert.throws(() => renderReview(ctx), /incrementing/);
});
test('repeated export retains actual measured times and starts; parameter change retains audio', () => {
  const p = plan();
  const old = exportScenes(p);
  old.scenes = old.scenes.map(s => measuredScene(s, p, 4.123));
  old.audioPlan.timingBasis = 'measured';
  p.scenes[0].component.params.layout = 'horizontal';
  p.planVersion = 2; p.review.reviewedVersion = 2;
  const next = exportScenes(p, old);
  assert.equal(next.scenes[0].audioDurationSec, 4.123);
  assert.equal(next.scenes[1].durationSec, 6.323);
  assert.equal(next.scenes[0].subtitleSegments[1].proportionalStartSec, 2.0615);
  assert.equal(next.scenes[0].subtitleSegments[1].startSec, undefined);
  assert.equal(next.scenes[0].component.params.layout, 'horizontal');
  assert.deepEqual(exportScenes(p, next), next);
});
test('narration/subtitle/segmentation/engine/style mutation invalidates measurement, never carries starts', () => {
  for (const mutate of [p => p.scenes[0].narration += '新', p => p.scenes[0].subtitle += '新', p => p.scenes[0].subtitleSegments[0].text += '新', p => p.audioPlan.engine = 'edge', p => p.audioPlan.defaultStyle = 'new', p => p.audioPlan.scenesTempoById = {S01: 0.95}]) {
    const p = plan(), old = exportScenes(p);
    old.scenes[0] = measuredScene(old.scenes[0], p, 4);
    mutate(p);
    const next = exportScenes(p, old).scenes[0];
    assert.equal(next.audioState, 'invalid'); assert.equal(next.timingBasis, 'estimated');
    assert.equal(next.audioDurationSec, undefined); assert.equal(next.subtitleSegments[0].startSec, undefined);
  }
});
test('fixed typography values, full roles and title/subtitle fonts are enforced', () => {
  for (const mutate of [p => p.typography.tokens.body++, p => p.typography.fontRoles.sans = 'bad', p => p.scenes[0].visualElements[0].textRole = 'missing', p => p.scenes[0].visualElements[0].fontRole = 'missing', p => p.scenes[0].visualElements[0].textRole = 'title']) {
    const p = plan(); mutate(p);
    if (p.scenes[0].visualElements[0].textRole === 'title') p.scenes[0].visualElements[0].fontRole = 'handwritten';
    assert.throws(() => validatePlan(p));
  }
  const p = plan();
  p.scenes[0].visualElements[0].textRole = 'subtitle';
  assert.throws(() => validatePlan(p), /handwritten/);
});
test('chapter-title nodes require sans and unique IDs, bounds include stroke', () => {
  const p = plan();
  p.scenes[0].visualElements[0].type = 'chapterTitle';
  p.scenes[0].visualElements[0].fontRole = 'handwritten';
  assert.throws(() => validatePlan(p), /title node/);
  p.scenes[0].visualElements[0].fontRole = 'sans';
  p.scenes[0].visualElements.push(structuredClone(p.scenes[0].visualElements[0]));
  assert.throws(() => validatePlan(p), /duplicate text ID/);
  p.scenes[0].visualElements.pop();
  p.scenes[0].visualElements[0].strokeWidth = 4;
  assert.throws(() => validatePlan(p), /include stroke/);
  p.scenes[0].visualElements[0].boundsIncludeStroke = true;
  validatePlan(p);
  p.scenes[0].visualElements[0].position.x = 999;
  assert.throws(() => validatePlan(p), /outside/);
});
test('generated sync protects edited user files and never writes Effect source', t => {
  const ctx = fixture(t);
  const file = path.join(ctx.engineRoot, `src/effects/${ctx.plan.scenes[0].component.name}.tsx`);
  const effect = fs.readFileSync(file, 'utf8');
  generatedWrite(ctx, generatedFiles(ctx.plan, asset, exportScenes(ctx.plan)));
  assert.equal(fs.readFileSync(file, 'utf8'), effect);
  fs.appendFileSync(path.join(ctx.engineRoot, 'src/data.ts'), 'user edit');
  assert.throws(() => generatedWrite(ctx, generatedFiles(ctx.plan, asset, exportScenes(ctx.plan))), /protected/);
});
test('init uses approved template, executable browser, no install, rejects overwrite, reports missing effects', t => {
  const ctx = fixture(t, false);
  const result = cli('init-project', ctx, ['--browser', process.execPath]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.pendingEffects.length, 2);
  assert.equal(fs.existsSync(path.join(ctx.engineRoot, 'node_modules')), false);
  assert.equal(json(path.join(ctx.engineRoot, 'project.config.json')).projectRoot, ctx.projectRoot);
  assert.match(fs.readFileSync(path.join(ctx.engineRoot, 'remotion.config.ts'), 'utf8'), /setBrowserExecutable/);
  assert.notEqual(cli('init-project', ctx, ['--browser', process.execPath]).status, 0);
  assert.notEqual(cli('export-plan', ctx).status, 0);
});
test('init rejects stale approval and nonexecutable browser before creating production root', t => {
  const ctx = fixture(t, false);
  const file = path.join(ctx.projectRoot, 'browser'); fs.writeFileSync(file, 'not executable');
  assert.notEqual(cli('init-project', ctx, ['--browser', file]).status, 0);
  assert.equal(fs.existsSync(ctx.engineRoot), false);
  ctx.plan.review.reviewedVersion = 0; writeJson(ctx.planFile, ctx.plan);
  assert.notEqual(cli('init-project', ctx, ['--browser', process.execPath]).status, 0);
  assert.equal(fs.existsSync(ctx.engineRoot), false);
});
test('metadata-only validation has no dependencies and does not claim visual approval', t => {
  const ctx = fixture(t);
  const result = cli('validate-project', ctx, ['--metadata-only']);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.ast, 'not-run'); assert.equal(report.visual, 'pending-human-review');
  assert.throws(() => checkEffects(ctx, false), /AST unavailable/);
  ctx.plan.scenes[0].component.params.newField = true;
  assert.throws(() => verifyScenes(ctx, json(ctx.scenesFile)), /differ/);
});
test('real TypeScript AST rejects inline typography and missing default exports', {skip: !process.env.TOOLING_TYPESCRIPT_PATH}, t => {
  const ctx = fixture(t);
  const moduleRoot = path.join(ctx.engineRoot, 'node_modules/typescript');
  fs.mkdirSync(moduleRoot, {recursive: true});
  writeJson(path.join(moduleRoot, 'package.json'), {main: 'index.cjs'});
  fs.writeFileSync(path.join(moduleRoot, 'index.cjs'), `module.exports = require(${JSON.stringify(process.env.TOOLING_TYPESCRIPT_PATH)});`);
  assert.equal(checkEffects(ctx).ast, 'passed');
  const file = path.join(ctx.engineRoot, `src/effects/${ctx.plan.scenes[0].component.name}.tsx`);
  for (const source of ["export default () => <div style={{fontSize: 42}} />;", "export default () => <div style={{['fontWeight']: 700}} />;", 'export default () => <div fontFamily="x" />;']) {
    fs.writeFileSync(file, source);
    assert.throws(() => checkEffects(ctx), /TypeScript AST/);
  }
  fs.writeFileSync(file, 'export const Effect = () => null;');
  assert.throws(() => checkEffects(ctx), /default export/);
});
test('batch validates every ok, index and exact output, including missing file', t => {
  const ctx = fixture(t, false);
  const output = path.join(ctx.projectRoot, 'raw.mp3'); fs.writeFileSync(output, 'mp3');
  const jobs = [{output}];
  assertBatchResults(jobs, [{i: 0, output, ok: true}]);
  for (const results of [[], [{i: 0, output, ok: false}], [{i: 0, output: 'elsewhere', ok: true}], [{i: 1, output, ok: true}]]) assert.throws(() => assertBatchResults(jobs, results));
  fs.unlinkSync(output); assert.throws(() => assertBatchResults(jobs, [{i: 0, output, ok: true}]), /Missing/);
});
test('partial batch/ffmpeg/probe failure makes no audio, manifest or measurement commit', t => {
  for (const failure of ['batch', 'ffmpeg', 'probe']) {
    const ctx = fixture(t), old = fs.readFileSync(ctx.scenesFile, 'utf8');
    const mock = mockAudio(failure);
    assert.throws(() => audioPipeline(ctx, generateOptions, mock.dependencies));
    assert.equal(fs.readFileSync(ctx.scenesFile, 'utf8'), old);
    assert.equal(fs.existsSync(path.join(ctx.engineRoot, `public/scenes/${ctx.plan.slug}/audio/audio.state.json`)), false);
    assert.equal(fs.existsSync(path.join(ctx.engineRoot, `public/scenes/${ctx.plan.slug}/audio/S01.mp3`)), false);
    assert.equal(fs.existsSync(path.join(ctx.engineRoot, '.audio-pipeline.lock')), false);
  }
});
test('audio generation stages all, keeps raw, opening tempo once, sync and repeated generate are idempotent', t => {
  const ctx = fixture(t), mock = mockAudio();
  const first = audioPipeline(ctx, generateOptions, mock.dependencies);
  assert.equal(first.timingBasis, 'measured');
  assert.deepEqual(mock.counts(), {batchCalls: 1, ffmpegCalls: 2});
  const initial = fs.readFileSync(ctx.scenesFile, 'utf8');
  const audio = path.join(ctx.engineRoot, `public/scenes/${ctx.plan.slug}/audio`);
  assert.equal(fs.readFileSync(path.join(audio, 'raw/S01.mp3'), 'utf8'), 'raw-mp3');
  assert.equal(json(ctx.scenesFile).scenes[1].durationSec, 6.2);
  assert.match(mock.calls.find(c => c.command === '/mock/ffmpeg').argv.join(' '), /atempo=0.9,loudnorm=I=-16.60:TP=-3.59:LRA=1.20/);
  assert.equal(mock.calls.find(c => c.command === process.execPath).options.timeout, 1200000);
  audioPipeline(ctx, {'sync-only': true}, mock.dependencies);
  audioPipeline(ctx, generateOptions, mock.dependencies);
  assert.equal(fs.readFileSync(ctx.scenesFile, 'utf8'), initial);
  assert.deepEqual(mock.counts(), {batchCalls: 1, ffmpegCalls: 2});
  assert.equal(cli('validate-project', ctx, ['--metadata-only']).status, 0);
});
test('sync-only missing final audio fails without partially marking another measured', t => {
  const ctx = fixture(t), mock = mockAudio();
  audioPipeline(ctx, generateOptions, mock.dependencies);
  const old = fs.readFileSync(ctx.scenesFile, 'utf8');
  fs.unlinkSync(path.join(ctx.engineRoot, `public/scenes/${ctx.plan.slug}/audio/S02.mp3`));
  assert.throws(() => audioPipeline(ctx, {'sync-only': true}, mock.dependencies), /refuses partial/);
  assert.equal(fs.readFileSync(ctx.scenesFile, 'utf8'), old);
});
test('single-scene generation never marks whole production measured', t => {
  const ctx = fixture(t), mock = mockAudio();
  const result = audioPipeline(ctx, {...generateOptions, scene: 'S01'}, mock.dependencies);
  assert.equal(result.timingBasis, 'estimated');
  assert.equal(json(ctx.scenesFile).scenes[1].timingBasis, 'estimated');
  assert.equal(mock.counts().ffmpegCalls, 1);
});
test('multi-segment measured starts are cumulative after final tempo and range mismatch requires reapproval', () => {
  const p = plan(); p.audioPlan.alignmentMode = 'multi-segment-measured';
  const s = measuredScene(exportScenes(p).scenes[0], p, 4.4, [1.7, 2.7]);
  assert.equal(s.subtitleSegments[1].startSec, 1.7);
  assert.throws(() => measuredScene(s, p, 9, [1.7, 2.7]), /differ/);
  const measured = exportScenes(p).scenes.map(s => measuredScene(s, p, 4, [2, 2]));
  assert.throws(() => checkMeasuredSpeeds(measured, p), /reapprove/);
  measured[0].narration = '汉'.repeat(30);
  assert.throws(() => checkMeasuredSpeeds(measured, p), /5.8/);
});
test('multi-segment pipeline uses final processed parts and concat before atomic measured commit', t => {
  const ctx = fixture(t);
  ctx.plan.audioPlan.alignmentMode = 'multi-segment-measured';
  ctx.plan.audioPlan.speedSpread = 1.2;
  writeJson(ctx.planFile, ctx.plan);
  ctx.plan.planVersion = 2; ctx.plan.review.status = 'pending';
  renderReview(ctx);
  ctx.plan.review.status = 'approved'; ctx.plan.review.reviewedVersion = 2; ctx.plan.evaluation.planVersion = 2;
  writeJson(ctx.planFile, ctx.plan); renderReview(ctx);
  generatedWrite(ctx, generatedFiles(ctx.plan, asset, exportScenes(ctx.plan)));
  const calls = [];
  const runner = (command, argv) => {
    calls.push({command, argv});
    if (command === '/mock/probe') return argv.at(-1).includes('.final.mp3') ? '4' : argv.at(-1).includes('S02.part') ? '1' : '2';
    if (command === '/mock/ffmpeg') { fs.writeFileSync(argv.at(-1), 'processed'); return ''; }
    const jobsFile = argv.at(-1), jobs = json(jobsFile);
    jobs.forEach(job => fs.writeFileSync(job.output, 'raw'));
    writeJson(`${jobsFile}.result.json`, jobs.map((job, i) => ({i, output: job.output, ok: true})));
    return '';
  };
  assert.throws(() => audioPipeline(ctx, generateOptions, {run: runner, ffmpeg: '/mock/ffmpeg', ffprobe: '/mock/probe'}), /differ/);
  assert.equal(json(ctx.scenesFile).audioPlan.timingBasis, 'estimated');
  const corrected = (command, argv) => {
    if (command === '/mock/probe') return argv.at(-1).includes('S02') ? argv.at(-1).includes('.final.mp3') ? '2' : '1' : argv.at(-1).includes('.final.mp3') ? '4' : '2';
    return runner(command, argv);
  };
  const result = audioPipeline(ctx, generateOptions, {run: corrected, ffmpeg: '/mock/ffmpeg', ffprobe: '/mock/probe'});
  assert.equal(result.timingBasis, 'measured');
  assert.equal(json(ctx.scenesFile).scenes[0].subtitleSegments[1].startSec, 2);
  assert.equal(json(ctx.scenesFile).scenes[1].subtitleSegments[1].startSec, 1);
  assert.equal(calls.filter(c => c.command === '/mock/ffmpeg' && c.argv.includes('concat')).length, 4);
});
test('untracked user audio cannot be overwritten by generate', t => {
  const ctx = fixture(t), mock = mockAudio();
  const audio = path.join(ctx.engineRoot, `public/scenes/${ctx.plan.slug}/audio`);
  fs.mkdirSync(audio, {recursive: true}); fs.writeFileSync(path.join(audio, 'S01.mp3'), 'user audio');
  assert.throws(() => audioPipeline(ctx, generateOptions, mock.dependencies), /protected/);
  assert.equal(fs.readFileSync(path.join(audio, 'S01.mp3'), 'utf8'), 'user audio');
});
test('Python architecture and explicit TTS argv preserve literal strings without shell parsing', () => {
  assert.deepEqual(pythonInvocation('/python', '/batch.py', '/jobs', 'linux', 'arm64'), {command: '/python', args: ['/batch.py', '--jobs', '/jobs']});
  const apple = pythonInvocation('/python', '/batch.py', '/jobs', 'darwin', 'arm64', process.execPath);
  assert.deepEqual(apple.args, ['-arm64', '/python', '/batch.py', '--jobs', '/jobs']);
  const invocation = ttsInvocation({'tts-command': process.execPath, 'tts-args': '["literal;touch /tmp/no"]'}, '/jobs', plan(), {PATH: '/path'});
  assert.deepEqual(invocation.args, ['literal;touch /tmp/no', '--jobs', '/jobs']);
  assert.equal(invocation.env.PATH, '/path');
});
test('transaction stages all before commit; invalid destination preserves existing files', t => {
  const ctx = fixture(t, false);
  fs.writeFileSync(path.join(ctx.projectRoot, 'keep'), 'original');
  assert.throws(() => transaction(ctx.projectRoot, {keep: 'changed', '../escape': 'bad'}));
  assert.equal(fs.readFileSync(path.join(ctx.projectRoot, 'keep'), 'utf8'), 'original');
});
test('cover approval is bound to current SVG digest, not video approval', () => {
  const bytes = Buffer.from('<svg/>'), hash = digest(bytes);
  assert.throws(() => approveCover(bytes, {}, '发布素材/v1.svg'), /not explicitly approved/);
  assert.equal(approveCover(bytes, {'approved-digest': hash}, '发布素材/v1.svg'), hash);
  assert.throws(() => approveCover(Buffer.from('<svg>changed</svg>'), {'approved-digest': hash}, '发布素材/v1.svg'));
  assert.equal(approveCover(bytes, {}, '发布素材/v1.svg', {covers: [{path: '发布素材/v1.svg', digest: hash, status: 'approved', approvedBy: 'tester', approvalEvidence: '明确确认'}]}), hash);
});
test('zero raw yields N/A not Infinity and estimated speech excludes tail', () => {
  const p = plan(), stats = scriptStats('# 标题\n> 引用\n| 表格 |\n```\n代码\n```\n', p, true);
  assert.equal(stats.R, 0); assert.equal(stats.compressionRatio, null);
  assert.equal(stats.speechDurationSec, 8);
  assert.match(statsMarkdown(stats), /N\/A/);
  assert.doesNotMatch(statsMarkdown(stats), /Infinity|NaN/);
});
