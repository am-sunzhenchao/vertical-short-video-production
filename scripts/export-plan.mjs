import fs from 'node:fs';
import {main, context, json, checkConfig} from './lib/core.mjs';
import {approved, validatePlan, checkEffects} from './lib/validation.mjs';
import {ensureReview} from './lib/review.mjs';
import {exportScenes, generatedFiles, generatedWrite} from './lib/production.mjs';

main(options => {
  const ctx = context(options);
  const asset = validatePlan(ctx.plan);
  approved(ctx.plan);
  ensureReview(ctx);
  checkConfig(ctx);
  checkEffects(ctx, true);
  const previous = fs.existsSync(ctx.scenesFile) ? json(ctx.scenesFile) : null;
  const scenes = exportScenes(ctx.plan, previous);
  generatedWrite(ctx, generatedFiles(ctx.plan, asset, scenes));
  console.log(JSON.stringify({scenes: ctx.scenesFile, measured: scenes.scenes.filter(s => s.timingBasis === 'measured').length, invalidAudio: scenes.scenes.filter(s => s.audioState === 'invalid').map(s => s.id)}, null, 2));
});
