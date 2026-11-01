import fs from 'node:fs';
import path from 'node:path';
import {main, context, json, inside, checkConfig, run} from './lib/core.mjs';

main(options => {
  const ctx = context(options);
  checkConfig(ctx);
  if (!/^S[0-9]+[A-Za-z0-9]*$/.test(options.scene || '')) throw new Error('--scene S01 required');
  const data = json(ctx.scenesFile);
  const fps = data.fps || ctx.plan.video.fps;
  const frames = data.scenes.map(s => Math.max(1, Math.round(s.durationSec * fps)));
  const index = data.scenes.findIndex(s => s.id === options.scene);
  if (index < 0) throw new Error(`Unknown scene ${options.scene}`);
  const from = frames.slice(0, index).reduce((a, b) => a + b, 0);
  const length = frames[index];
  const at = options.at === undefined ? Math.floor(length / 2) : Math.round(Number(options.at) * fps);
  if (!Number.isFinite(at) || at < 0 || at >= length) throw new Error(`--at must be within scene (0-${((length - 1) / fps).toFixed(2)}s)`);
  const remotion = inside(ctx.engineRoot, 'node_modules/.bin/remotion');
  if (!fs.existsSync(remotion)) throw new Error('Production root dependencies not installed; run npm install first');
  const outDir = inside(ctx.projectRoot, '制作过程/渲染质检');
  fs.mkdirSync(outDir, {recursive: true});
  const base = `${options.scene}-${data.scenes[index].timingBasis}`;
  let output, argv;
  if (options.clip !== undefined) {
    const span = Math.round(Number(options.clip) * fps);
    if (!Number.isFinite(span) || span < 1) throw new Error('--clip must be positive seconds');
    const end = Math.min(length - 1, at + span - 1);
    output = path.join(outDir, `${base}-clip.mp4`);
    argv = ['render', 'src/index.tsx', data.compositionId || 'Main', output, `--frames=${from + at}-${from + end}`];
  } else {
    output = path.join(outDir, `${base}-f${at}.png`);
    argv = ['still', 'src/index.tsx', data.compositionId || 'Main', output, `--frame=${from + at}`];
  }
  run(remotion, argv, {cwd: ctx.engineRoot, stdio: 'inherit', timeout: 600000});
  console.log(JSON.stringify({output, scene: options.scene, sceneFrame: at, globalFrame: from + at, note: '人工渲染产物，需人工查看；不代表视觉验收通过'}, null, 2));
}, import.meta.url);
