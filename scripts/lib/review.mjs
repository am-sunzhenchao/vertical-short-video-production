import fs from 'node:fs';
import path from 'node:path';
import {transaction} from './production.mjs';
import {clone, digest, inside, json, stable, relativePath} from './core.mjs';

export function reviewMarkdown(plan) {
  const blocks = plan.scenes.map(scene => `**${scene.id}｜${scene.title.replaceAll('\n', ' ')}**\n\n> ${scene.subtitle.replaceAll('\n', ' ')}\n\n旁白发音稿：${scene.narration}\n`).join('\n');
  return `# 视频方案审阅稿\n\nschemaVersion=${plan.schemaVersion} · planVersion=${plan.planVersion}\n\nreview=${plan.review.status} · reviewedVersion=${plan.review.reviewedVersion} · evaluation=${plan.evaluation.status} · evaluation.planVersion=${plan.evaluation.planVersion}\n\n${blocks}\n## Canonical 全字段方案\n\n此 JSON 为全字段视图；正文或字段修改均须回写方案、增加版本、重评重审。\n\n<!-- canonical-plan -->\n\`\`\`json\n${JSON.stringify(plan, null, 2)}\n\`\`\`\n<!-- /canonical-plan -->\n`;
}
export function parseReview(text) {
  const match = text.match(/<!-- canonical-plan -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- \/canonical-plan -->/);
  if (!match) throw new Error('Review lacks canonical full-field JSON');
  return JSON.parse(match[1]);
}
export const reviewManifestFile = ctx => inside(ctx.projectRoot, `${ctx.plan.draftPath || '制作过程/视频方案审阅稿.md'}.sync.json`);
export function ensureReview(ctx) {
  const md = fs.readFileSync(ctx.draftFile, 'utf8');
  const manifest = json(reviewManifestFile(ctx));
  if (manifest.markdownDigest !== digest(md)) throw new Error('Review markdown changed; synchronize all changes and re-review');
  if (stable(parseReview(md)) !== stable(ctx.plan) || manifest.planDigest !== digest(ctx.plan) || manifest.planVersion !== ctx.plan.planVersion) throw new Error('Plan/review full-field conflict');
  return manifest;
}
export function renderReview(ctx, options = {}) {
  const manifestFile = reviewManifestFile(ctx);
  const existing = fs.existsSync(ctx.draftFile) ? fs.readFileSync(ctx.draftFile, 'utf8') : null;
  const manifest = fs.existsSync(manifestFile) ? json(manifestFile) : null;
  const confirmed = options.refresh && Number(options['expected-version']) === ctx.plan.planVersion && options['confirmed-digest'] === digest(ctx.plan);
  if (existing !== null && confirmed && manifest && digest(existing) !== manifest.markdownDigest && (ctx.plan.planVersion <= manifest.planVersion || ctx.plan.review.status !== 'pending')) throw new Error('Edited review refresh requires incremented pending plan; reset approvals and re-evaluate');
  if (existing !== null && (!manifest || digest(existing) !== manifest.markdownDigest) && !confirmed) throw new Error('User-edited markdown protected; --refresh --expected-version --confirmed-digest of complete plan required');
  if (manifest && manifest.planDigest !== digest(ctx.plan)) {
    const old = parseReview(existing);
    if (old.draftPath !== ctx.plan.draftPath) throw new Error('Review destination migration requires explicit external synchronization');
    const intent = p => { const v = clone(p); delete v.review; delete v.evaluation; return v; };
    if (stable(intent(old)) !== stable(intent(ctx.plan)) && ctx.plan.planVersion <= manifest.planVersion) throw new Error('Content changed without incrementing planVersion; use --apply-patch');
    if (stable(intent(old)) !== stable(intent(ctx.plan)) && ctx.plan.review.status === 'approved') throw new Error('Changed plan must reset approval before review sync');
  }
  const content = reviewMarkdown(ctx.plan);
  const draftRel = path.relative(ctx.projectRoot, ctx.draftFile);
  const manifestRel = path.relative(ctx.projectRoot, manifestFile);
  transaction(ctx.projectRoot, {[draftRel]: content, [manifestRel]: `${JSON.stringify({planVersion: ctx.plan.planVersion, planDigest: digest(ctx.plan), markdownDigest: digest(content)}, null, 2)}\n`}, existing === null ? {} : {[draftRel]: digest(existing)});
  return {draft: ctx.draftFile, planVersion: ctx.plan.planVersion, digest: digest(ctx.plan)};
}
function merge(target, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return clone(patch);
  const out = target && typeof target === 'object' && !Array.isArray(target) ? clone(target) : {};
  for (const [k, v] of Object.entries(patch)) {
    if (['__proto__', 'constructor', 'prototype'].includes(k)) throw new Error(`Unsafe patch key ${k}`);
    if (v === null) delete out[k]; else out[k] = merge(out[k], v);
  }
  return out;
}
export function patchPlan(ctx, options) {
  if (Number(options['expected-version']) !== ctx.plan.planVersion) throw new Error('Patch expected-version conflict');
  ensureReview(ctx);
  const patch = json(inside(ctx.projectRoot, options['apply-patch']));
  if (['planVersion', 'schemaVersion', 'review', 'evaluation', 'draftPath'].some(k => Object.hasOwn(patch, k))) throw new Error('Patch may not set versions/approval/evaluation or migrate draftPath');
  const next = merge(ctx.plan, patch);
  for (const key of ['sourcePath', 'researchPath', 'draftPath', 'engineDir', 'publishDir']) if (next[key]) relativePath(ctx.projectRoot, next[key]);
  next.planVersion++;
  next.review = {status: 'pending', reviewedVersion: null, approvedBy: null, approvedAt: null, approvalEvidence: null};
  next.evaluation = {planVersion: next.planVersion, round: 0, weightedScore: null, status: 'not-evaluated'};
  return next;
}
