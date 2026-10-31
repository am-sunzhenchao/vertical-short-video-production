import {main, context, checkConfig} from './lib/core.mjs';
import {approved, validatePlan, checkEffects} from './lib/validation.mjs';
import {ensureReview} from './lib/review.mjs';
import {audioPipeline} from './lib/audio.mjs';

main(options => {
  const ctx = context(options);
  validatePlan(ctx.plan);
  approved(ctx.plan);
  ensureReview(ctx);
  checkConfig(ctx);
  checkEffects(ctx, true);
  console.log(JSON.stringify(audioPipeline(ctx, options), null, 2));
});
