import fs from 'node:fs';
import {main, context, json, inside, checkConfig, digest} from './lib/core.mjs';
import {approved, validatePlan, checkEffects} from './lib/validation.mjs';
import {ensureReview} from './lib/review.mjs';
import {verifyScenes, generatedFiles} from './lib/production.mjs';

main(options => {
  const ctx = context(options);
  const asset = validatePlan(ctx.plan);
  approved(ctx.plan);
  ensureReview(ctx);
  checkConfig(ctx);
  const scenes = json(ctx.scenesFile);
  verifyScenes(ctx, scenes);
  for (const [rel, expected] of Object.entries(generatedFiles(ctx.plan, asset, scenes))) {
    const file = inside(ctx.engineRoot, rel);
    if (!fs.existsSync(file) || digest(fs.readFileSync(file)) !== digest(expected)) throw new Error(`Generated config mismatch: ${rel}`);
  }
  const effects = checkEffects(ctx, Boolean(options['metadata-only']));
  console.log(JSON.stringify({metadata: 'passed', ...effects, audio: scenes.audioPlan.timingBasis, schema: 'Executed finite JSON Schema subset; local refs, types, constants, enums, required fields, properties, items, lengths, patterns and numeric bounds. Unspecified extension metadata is preserved, not semantically proven.'}, null, 2));
});
