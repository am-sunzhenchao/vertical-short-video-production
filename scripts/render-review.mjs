import {main, context, writeJson} from './lib/core.mjs';
import {validatePlan} from './lib/validation.mjs';
import {patchPlan, syncReviewEdits, renderReview} from './lib/review.mjs';

main(options => {
  const ctx = context(options);
  if (options.pull) {
    const changed = syncReviewEdits(ctx);
    console.log(JSON.stringify({changed, planVersion: ctx.plan.planVersion, nextStep: changed.length ? '方案已升版并作废审批，需重新评测后再请操作者批准' : '审阅稿无改动'}, null, 2));
    return;
  } else if (options['apply-patch']) {
    const next = patchPlan(ctx, options);
    validatePlan(next);
    writeJson(ctx.planFile, next);
    ctx.plan = next;
  } else validatePlan(ctx.plan);
  const result = renderReview(ctx, options);
  console.log(JSON.stringify(result, null, 2));
}, import.meta.url);
