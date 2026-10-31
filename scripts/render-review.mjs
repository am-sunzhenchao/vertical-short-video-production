import {main, context, writeJson} from './lib/core.mjs';
import {validatePlan} from './lib/validation.mjs';
import {patchPlan, renderReview} from './lib/review.mjs';

main(options => {
  const ctx = context(options);
  if (options['apply-patch']) {
    const next = patchPlan(ctx, options);
    validatePlan(next);
    writeJson(ctx.planFile, next);
    ctx.plan = next;
  } else validatePlan(ctx.plan);
  console.log(JSON.stringify(renderReview(ctx, options), null, 2));
});
