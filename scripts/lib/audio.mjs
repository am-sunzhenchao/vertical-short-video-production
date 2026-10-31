import fs from 'node:fs';
import path from 'node:path';
import {audioFingerprint, exportScenes, transaction} from './production.mjs';
import {ensureReview} from './review.mjs';
import {clone, digest, inside, json, executable, run, writeJson, skillRoot} from './core.mjs';

export const hanCount = text => (String(text || '').match(/[\u4e00-\u9fff]/g) || []).length;
export function assertBatchResults(jobs, results) {
  if (!Array.isArray(results) || results.length !== jobs.length) throw new Error('Partial batch results');
  const seen = new Set();
  for (const result of results) {
    if (!Number.isInteger(result.i) || seen.has(result.i) || !jobs[result.i] || result.ok !== true || result.output !== jobs[result.i].output) throw new Error('Batch result failed or output mismatch');
    seen.add(result.i);
  }
  for (const job of jobs) if (!fs.existsSync(job.output) || !fs.statSync(job.output).isFile() || fs.statSync(job.output).size === 0) throw new Error(`Missing batch output: ${job.output}`);
}
export function measuredScene(scene, plan, duration, partDurations) {
  if (!Number.isFinite(duration) || duration <= 0) throw new Error(`${scene.id}: invalid audio duration`);
  const next = clone(scene);
  next.audioDurationSec = duration;
  next.durationSec = duration + plan.audioPlan.PAD + scene.tailSec;
  next.timingBasis = 'measured';
  next.audioState = 'measured';
  next.audio = `scenes/${plan.slug}/audio/${scene.id}.mp3`;
  const mode = scene.alignmentMode || plan.audioPlan.alignmentMode;
  let start = 0;
  if (mode === 'multi-segment-measured') {
    if (!Array.isArray(partDurations) || partDurations.length !== scene.subtitleSegments.length || partDurations.some(v => !Number.isFinite(v) || v <= 0)) throw new Error(`${scene.id}: missing measured parts`);
    const total = partDurations.reduce((a, b) => a + b, 0);
    if (Math.abs(total - duration) > Math.max(0.2, partDurations.length * 0.06)) throw new Error(`${scene.id}: final audio and segment durations differ`);
    next.subtitleSegments.forEach((seg, i) => {
      seg.startSec = start;
      seg.audioDurationSec = partDurations[i];
      if (start >= duration) throw new Error(`${scene.id}: segment boundary beyond audio`);
      start += partDurations[i];
    });
  } else {
    const counts = next.subtitleSegments.map(seg => Math.max(1, hanCount(seg.narration)));
    const total = counts.reduce((a, b) => a + b, 0);
    next.subtitleSegments.forEach((seg, i) => {
      seg.proportionalStartSec = start;
      seg.proportionalDurationSec = duration * counts[i] / total;
      delete seg.startSec;
      delete seg.audioDurationSec;
      start += seg.proportionalDurationSec;
    });
  }
  next.audioFingerprint = audioFingerprint(plan, scene);
  return next;
}
export function checkMeasuredSpeeds(scenes, plan) {
  const measured = scenes.filter(s => s.timingBasis === 'measured');
  const speeds = measured.map(s => ({id: s.id, speed: hanCount(s.narration) / s.audioDurationSec}));
  if (speeds.some(s => s.speed > 5.8)) throw new Error(`Speech speed exceeds 5.8; change approved tempo and reapprove: ${speeds.filter(s => s.speed > 5.8).map(s => s.id).join(', ')}`);
  if (measured.length === scenes.length) {
    const spread = Math.max(...speeds.map(s => s.speed)) - Math.min(...speeds.map(s => s.speed));
    const expected = spread <= 1 ? 'single-scene-proportional' : 'multi-segment-measured';
    if (scenes.some(s => (s.alignmentMode || plan.audioPlan.alignmentMode) !== expected)) throw new Error(`Measured speed spread ${spread.toFixed(3)} requires ${expected}; reapprove alignmentMode, no automatic switching`);
    return {speeds, spread};
  }
  return {speeds, spread: null};
}
export function pythonInvocation(python, batch, jobsFile, platform = process.platform, arch = process.arch, archCommand = '/usr/bin/arch') {
  return platform === 'darwin' && arch === 'arm64' ? {command: executable(archCommand), args: ['-arm64', python, batch, '--jobs', jobsFile]} : {command: python, args: [batch, '--jobs', jobsFile]};
}
export function ttsInvocation(options, jobsFile, plan, environment = process.env) {
  if (options['tts-command']) {
    const argv = options['tts-args'] ? JSON.parse(options['tts-args']) : [];
    if (!Array.isArray(argv) || argv.some(v => typeof v !== 'string')) throw new Error('--tts-args must be JSON string array');
    return {command: executable(options['tts-command']), args: [...argv, '--jobs', jobsFile], env: {...environment}};
  }
  if (plan.audioPlan.engine !== 'chattts') throw new Error('Non-ChatTTS engine requires explicit --tts-command with batch results protocol');
  const config = json(inside(skillRoot, 'chattts/config.json'));
  const root = config.chatts_root;
  if (!path.isAbsolute(root || '') || !fs.existsSync(path.join(root, 'ChatTTS')) || !fs.existsSync(path.join(root, 'speakers/3_gentle_female_v2.txt'))) throw new Error('Invalid ChatTTS config or missing default speaker; valid config is never overwritten');
  const presets = json(inside(skillRoot, 'chattts/voice_presets.json'));
  const styles = new Set(plan.scenes.map(s => s.ttsStyle || plan.audioPlan.defaultStyle));
  for (const style of styles) {
    const preset = presets[style];
    if (!preset?.speaker_file || !fs.existsSync(path.join(root, 'speakers', preset.speaker_file))) throw new Error(`Missing configured speaker for ${style}`);
  }
  const python = executable(options.python || environment.PYTHON, 'python3');
  const invocation = pythonInvocation(python, inside(skillRoot, 'chattts/chattts_batch.py'), jobsFile);
  return {...invocation, env: {...environment, PYTHONPATH: [root, environment.PYTHONPATH].filter(Boolean).join(path.delimiter)}};
}
export function audioPipeline(ctx, options, dependencies = {}) {
  if (Boolean(options.generate) === Boolean(options['sync-only'])) throw new Error('Choose exactly --sync-only or --generate');
  if (options.generate && !options['tts-command'] && !options['tts-batch']) throw new Error('--generate requires explicit --tts-command or --tts-batch chattts');
  if (options['tts-batch'] && options['tts-batch'] !== 'chattts') throw new Error('Supported built-in batch: chattts');
  const runner = dependencies.run || run;
  const probePath = dependencies.ffprobe || executable(options.ffprobe || process.env.FFPROBE_PATH || process.env.FFPROBE, 'ffprobe');
  const probe = file => {
    const duration = Number(runner(probePath, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file], {timeout: 120000}).trim());
    if (!Number.isFinite(duration) || duration <= 0) throw new Error(`ffprobe invalid duration: ${file}`);
    return duration;
  };
  const originalText = fs.readFileSync(ctx.scenesFile);
  const original = JSON.parse(originalText);
  const production = exportScenes(ctx.plan, original);
  const selected = options.scene ? production.scenes.filter(s => s.id === options.scene) : production.scenes;
  if (!selected.length) throw new Error(`Unknown --scene ${options.scene}`);
  const audioRoot = inside(ctx.engineRoot, `public/scenes/${ctx.plan.slug}/audio`);
  const manifestFile = inside(audioRoot, 'audio.state.json');
  const originalManifest = fs.existsSync(manifestFile) ? fs.readFileSync(manifestFile) : null;
  const state = originalManifest ? JSON.parse(originalManifest) : {version: 1, scenes: {}};
  const lock = inside(ctx.engineRoot, '.audio-pipeline.lock');
  const fd = fs.openSync(lock, 'wx');
  fs.closeSync(fd);
  let stage;
  try {
    stage = inside(ctx.engineRoot, `.audio-stage-${process.pid}-${Date.now()}`);
    fs.mkdirSync(stage, {recursive: false});
    const updates = {}, nextState = clone(state), jobs = [], jobsByScene = new Map();
    const validFile = (file, hash) => fs.existsSync(file) && hash && digest(fs.readFileSync(file)) === hash;
    for (const scene of selected) {
      const fingerprint = audioFingerprint(ctx.plan, scene);
      const old = state.scenes?.[scene.id];
      const final = inside(audioRoot, `${scene.id}.mp3`);
      const mode = scene.alignmentMode || ctx.plan.audioPlan.alignmentMode;
      if (fs.existsSync(final) && !validFile(final, old?.finalDigest)) throw new Error(`${scene.id}: user or untracked final audio protected`);
      const reusable = old?.fingerprint === fingerprint && validFile(final, old.finalDigest) && (mode !== 'multi-segment-measured' || old.parts?.length === scene.subtitleSegments.length && old.parts.every((p, i) => validFile(inside(audioRoot, `${scene.id}.part${i + 1}.mp3`), p.digest)));
      if (options['sync-only'] && !reusable) throw new Error(`${scene.id}: missing, stale or unverified final audio; --sync-only refuses partial measurement`);
      if (reusable) {
        const partDurations = mode === 'multi-segment-measured' ? old.parts.map((_, i) => probe(inside(audioRoot, `${scene.id}.part${i + 1}.mp3`))) : undefined;
        updates[scene.id] = measuredScene(scene, ctx.plan, probe(final), partDurations);
        continue;
      }
      const pieces = mode === 'multi-segment-measured' ? scene.subtitleSegments.map(s => s.narration) : [scene.narration];
      const sources = [];
      for (let i = 0; i < pieces.length; i++) {
        const suffix = mode === 'multi-segment-measured' ? `.part${i + 1}` : '';
        const raw = inside(audioRoot, `raw/${scene.id}${suffix}.mp3`);
        const stagedRaw = inside(stage, `${scene.id}${suffix}.raw.mp3`);
        const rawFingerprint = digest({text: pieces[i], engine: ctx.plan.audioPlan.engine, style: scene.ttsStyle || ctx.plan.audioPlan.defaultStyle});
        const rawInfo = old?.raw?.[i];
        if (fs.existsSync(raw) && !validFile(raw, rawInfo?.digest)) throw new Error(`${scene.id}: user or untracked raw audio protected`);
        const part = inside(audioRoot, `${scene.id}.part${i + 1}.mp3`);
        if (mode === 'multi-segment-measured' && fs.existsSync(part) && !validFile(part, old?.parts?.[i]?.digest)) throw new Error(`${scene.id}: user or untracked part audio protected`);
        if (rawInfo?.fingerprint === rawFingerprint && validFile(raw, rawInfo.digest)) fs.copyFileSync(raw, stagedRaw);
        else jobs.push({text: pieces[i], output: stagedRaw, style: scene.ttsStyle || ctx.plan.audioPlan.defaultStyle});
        sources.push({stagedRaw, raw, rawFingerprint, suffix});
      }
      jobsByScene.set(scene.id, sources);
    }
    if (jobs.length) {
      const jobsFile = inside(stage, 'jobs');
      writeJson(jobsFile, jobs);
      const invocation = ttsInvocation(options, jobsFile, ctx.plan);
      runner(invocation.command, invocation.args, {env: invocation.env, cwd: ctx.engineRoot, timeout: 1200000});
      assertBatchResults(jobs, json(`${jobsFile}.result.json`));
    }
    const files = {};
    if (jobsByScene.size) {
      const ffmpeg = dependencies.ffmpeg || executable(options.ffmpeg || process.env.FFMPEG_PATH || process.env.FFMPEG, 'ffmpeg');
      for (const scene of selected) {
        const sources = jobsByScene.get(scene.id);
        if (!sources) continue;
        const tempo = (scene.id === 'S01' ? ctx.plan.audioPlan.openingTempo : 1) * (ctx.plan.audioPlan.scenesTempoById?.[scene.id] ?? 1);
        if (!(tempo >= 0.5 && tempo <= 2)) throw new Error(`${scene.id}: combined tempo outside supported [0.5,2], reapprove`);
        const processed = [], rawState = [], parts = [];
        const mode = scene.alignmentMode || ctx.plan.audioPlan.alignmentMode;
        for (let i = 0; i < sources.length; i++) {
          const source = sources[i];
          probe(source.stagedRaw);
          const output = inside(stage, `${scene.id}${source.suffix}.processed.mp3`);
          runner(ffmpeg, ['-y', '-i', source.stagedRaw, '-af', `atempo=${tempo},loudnorm=I=-16.60:TP=-3.59:LRA=1.20`, '-ar', '44100', '-loglevel', 'error', output], {timeout: 120000});
          const duration = probe(output);
          const bytes = fs.readFileSync(output);
          processed.push(output);
          files[path.relative(ctx.engineRoot, source.raw)] = fs.readFileSync(source.stagedRaw);
          rawState.push({fingerprint: source.rawFingerprint, digest: digest(files[path.relative(ctx.engineRoot, source.raw)])});
          if (mode === 'multi-segment-measured') {
            files[path.relative(ctx.engineRoot, inside(audioRoot, `${scene.id}.part${i + 1}.mp3`))] = bytes;
            parts.push({digest: digest(bytes), durationSec: duration});
          }
        }
        const final = inside(stage, `${scene.id}.final.mp3`);
        if (processed.length === 1) fs.copyFileSync(processed[0], final);
        else {
          const list = inside(stage, `${scene.id}.concat.txt`);
          fs.writeFileSync(list, processed.map(file => `file '${file.replaceAll("'", "'\\''")}'`).join('\n'));
          runner(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-af', 'loudnorm=I=-16.60:TP=-3.59:LRA=1.20', '-ar', '44100', '-loglevel', 'error', final], {timeout: 120000});
        }
        const bytes = fs.readFileSync(final);
        const duration = probe(final);
        updates[scene.id] = measuredScene(scene, ctx.plan, duration, mode === 'multi-segment-measured' ? parts.map(p => p.durationSec) : undefined);
        files[path.relative(ctx.engineRoot, inside(audioRoot, `${scene.id}.mp3`))] = bytes;
        nextState.scenes[scene.id] = {fingerprint: audioFingerprint(ctx.plan, scene), finalDigest: digest(bytes), raw: rawState, parts, tempo, processing: 'atempo-from-raw;loudnorm=-16.60/-3.59/1.20;44100'};
      }
    }
    production.scenes = production.scenes.map(s => updates[s.id] || s);
    const speeds = checkMeasuredSpeeds(production.scenes, ctx.plan);
    production.audioPlan.timingBasis = production.scenes.every(s => s.timingBasis === 'measured') ? 'measured' : 'estimated';
    const scenesRel = path.relative(ctx.engineRoot, ctx.scenesFile);
    files[scenesRel] = `${JSON.stringify(exportScenes(ctx.plan, production), null, 2)}\n`;
    const manifestRel = path.relative(ctx.engineRoot, manifestFile);
    files[manifestRel] = `${JSON.stringify(nextState, null, 2)}\n`;
    const ownedFile = inside(ctx.engineRoot, '.tooling-generated.json');
    const ownedBytes = fs.readFileSync(ownedFile);
    const owned = JSON.parse(ownedBytes);
    if (owned.files[scenesRel] !== digest(originalText)) throw new Error('User-edited production scenes protected');
    owned.files[scenesRel] = digest(files[scenesRel]);
    files['.tooling-generated.json'] = `${JSON.stringify(owned, null, 2)}\n`;
    const expected = {[scenesRel]: digest(originalText), '.tooling-generated.json': digest(ownedBytes)};
    if (originalManifest) expected[manifestRel] = digest(originalManifest);
    if (digest(json(ctx.planFile)) !== digest(ctx.plan)) throw new Error('Plan changed during audio operation');
    ensureReview(ctx);
    transaction(ctx.engineRoot, files, expected);
    return {scenes: selected.map(s => s.id), timingBasis: production.audioPlan.timingBasis, ...speeds, visualAlignment: 'pending-human-listening-review'};
  } finally {
    if (stage && fs.existsSync(stage)) fs.rmSync(stage, {recursive: true, force: true});
    fs.unlinkSync(lock);
  }
}
