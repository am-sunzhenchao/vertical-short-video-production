import fs from 'node:fs';
import path from 'node:path';
import {transaction} from './production.mjs';
import {clone, digest, inside, json, stable, relativePath, skillRoot, writeJson} from './core.mjs';
import {validatePlan} from './validation.mjs';

const intent = p => { const v = clone(p); delete v.review; delete v.evaluation; return v; };
const oneLine = t => String(t || '').replaceAll('\n', ' ');
const hanLen = t => (String(t || '').match(/[\u4e00-\u9fff]/g) || []).length;
const firstSentence = (t, max = 22) => { const s = oneLine(t).split(/[，。,！？]/)[0]; return [...s].length > max ? `${[...s].slice(0, max).join('')}…` : s; };
const continuityText = c => { if (!c) return ''; if (typeof c === 'string') return c; const from = c.from || c.visual; const to = c.to || c.narrationCue; return from && to ? `${from} → ${to}` : (from || to || ''); };
const fmtTime = sec => `${Math.floor(sec / 60)}分${String(Math.round(sec % 60)).padStart(2, '0')}秒`;
export function loadGallery(root = skillRoot) {
  const file = path.join(root, 'assets/demo-gallery/index.json');
  return fs.existsSync(file) ? json(file) : {patterns: {}};
}
export function reviewMarkdown(plan, gallery = loadGallery()) {
  const total = plan.scenes.reduce((a, s) => a + s.estimatedDurationSec, 0);
  const used = new Map();
  const blocks = plan.scenes.map((s, i) => {
    const pattern = s.motionPlan?.primaryPattern;
    const demo = gallery.patterns?.[pattern];
    if (demo) used.set(pattern, demo);
    const narration = oneLine(s.narration).trim();
    const subtitle = oneLine(s.subtitle).trim();
    const same = subtitle === narration;
    const meta = [`约 ${s.estimatedDurationSec.toFixed(1)}s`, demo ? `${demo.label}（${pattern}）` : '专用设计，无样例', i ? `承接：${oneLine(continuityText(s.continuity))}` : '开场'];
    return `**${s.id}｜${oneLine(s.title)}**\n\n${meta.join(' · ')}\n\n> 旁白：${narration}${same ? '' : `\n>\n> 字幕：${subtitle}`}\n`;
  }).join('\n');
  const gal = used.size ? [...used].map(([k, v]) => `- **${k}**（${v.label}）：${v.note}\n  ![${k}](模板样例/${v.file})`).join('\n') : '本片无可匹配的样例模板。';
  const approval = plan.review.status === 'approved' ? `已批准 v${plan.review.reviewedVersion}` : '待审批';
  return `# 视频方案审阅稿：${plan.title}

状态：${approval} · planVersion=${plan.planVersion} · 评测=${plan.evaluation.status}${plan.evaluation.weightedScore ? `（${plan.evaluation.weightedScore}/10）` : ''}

## 一屏结论

- 共 **${plan.scenes.length} 镜**，预计 **${total.toFixed(0)} 秒（约${fmtTime(total)}）**，为估计值，非实测。
- 规格 ${plan.video.width}×${plan.video.height} / ${plan.video.fps}fps · 风格 ${plan.styleMode}/${plan.paletteName}。
- 核心问题：${plan.coreQuestion}
- 核心回答：${plan.coreAnswer}
- 受众与范围：${plan.audience}；${plan.scope}

需要你决定：确认旁白与镜头顺序是否可以开始制作；不改则回复“批准 v${plan.planVersion}”。研究底稿、主张表与证据见 \`${plan.researchPath || '制作过程/知识解析与证据.md'}\`。

## 画面模板样例

样例仅示意版式与动效语法，不是本片实际文字与几何；配色以方案色板为准。

${gal}

## 分镜与旁白（可直接修改）

每镜一行元信息 + 旁白；字幕与旁白不同才单列。只可改标题、旁白、字幕，改动在开始制作时自动回写方案（版本 +1、审批作废、需重新批准）；镜头增删、动效与组件参数请改 \`视频制作方案.json\`。

${blocks}`;
}
export function parseEditable(text) {
  const parts = text.split(/\*\*(S[0-9]+[A-Za-z0-9]*)｜([^\n*]*)\*\*/);
  const out = {};
  for (let i = 1; i < parts.length; i += 3) {
    const nar = parts[i + 2].match(/^>\s*旁白：(.*)$/m);
    const sub = parts[i + 2].match(/^>\s*字幕：(.*)$/m);
    if (!nar) throw new Error(`Review block ${parts[i]} lacks narration`);
    out[parts[i]] = {title: parts[i + 1].trim(), subtitle: (sub ? sub[1] : nar[1]).trim(), narration: nar[1].trim()};
  }
  if (!Object.keys(out).length) throw new Error('Review lacks scene blocks');
  return out;
}
export function editableOf(plan) {
  return Object.fromEntries(plan.scenes.map(s => [s.id, {title: oneLine(s.title).trim(), subtitle: oneLine(s.subtitle).trim(), narration: s.narration.trim()}]));
}
export const reviewManifestFile = ctx => inside(ctx.projectRoot, `${ctx.plan.draftPath || '制作过程/视频方案审阅稿.md'}.sync.json`);
export function ensureReview(ctx) {
  const md = fs.readFileSync(ctx.draftFile, 'utf8');
  const manifest = json(reviewManifestFile(ctx));
  if (manifest.markdownDigest !== digest(md)) {
    const synced = syncReviewEdits(ctx);
    if (synced.length) throw new Error(`Review markdown changed; edits ${synced.join(', ')} auto-synced to plan v${ctx.plan.planVersion}, approval reset; re-evaluate and obtain approval before continuing`);
    throw new Error('Review markdown changed; synchronize all changes and re-review');
  }
  if (manifest.planDigest !== digest(ctx.plan) || manifest.planVersion !== ctx.plan.planVersion || stable(parseEditable(md)) !== stable(editableOf(ctx.plan))) throw new Error('Plan/review full-field conflict');
  return manifest;
}
export function syncReviewEdits(ctx) {
  const {plan, changed} = pullReview(ctx);
  if (!changed.length) return [];
  validatePlan(plan);
  writeJson(ctx.planFile, plan);
  ctx.plan = plan;
  renderReview(ctx, {refresh: true, 'expected-version': plan.planVersion, 'confirmed-digest': digest(plan)});
  return changed;
}
export function pullReview(ctx) {
  const md = fs.readFileSync(ctx.draftFile, 'utf8');
  const edited = parseEditable(md);
  const next = clone(ctx.plan);
  const ids = new Set(next.scenes.map(s => s.id));
  for (const id of Object.keys(edited)) if (!ids.has(id)) throw new Error(`Review has unknown scene ${id}; add scenes in the plan JSON`);
  for (const id of ids) if (!edited[id]) throw new Error(`Review lost scene ${id}; remove scenes in the plan JSON`);
  const changed = [];
  for (const scene of next.scenes) {
    const e = edited[scene.id];
    for (const key of ['title', 'subtitle', 'narration']) {
      if (key === 'title' ? oneLine(scene.title).trim() !== e.title : scene[key].trim() !== e[key]) { scene[key] = e[key]; changed.push(`${scene.id}.${key}`); }
    }
    if (changed.some(c => c.startsWith(`${scene.id}.`)) && (changed.includes(`${scene.id}.narration`) || changed.includes(`${scene.id}.subtitle`))) {
      scene.subtitleSegments = [{text: scene.subtitle, narration: scene.narration, estimatedStartSec: 0}];
      scene.estimatedDurationSec = Math.max(scene.estimatedDurationSec, Math.round(hanLen(scene.narration) / 4 * 10) / 10);
    }
  }
  if (!changed.length) return {plan: ctx.plan, changed};
  next.planVersion++;
  next.review = {status: 'pending', reviewedVersion: null, approvedBy: null, approvedAt: null, approvalEvidence: null};
  next.evaluation = {planVersion: next.planVersion, round: 0, weightedScore: null, status: 'not-evaluated'};
  return {plan: next, changed};
}
export function renderReview(ctx, options = {}) {
  const manifestFile = reviewManifestFile(ctx);
  const existing = fs.existsSync(ctx.draftFile) ? fs.readFileSync(ctx.draftFile, 'utf8') : null;
  const manifest = fs.existsSync(manifestFile) ? json(manifestFile) : null;
  const confirmed = options.refresh && Number(options['expected-version']) === ctx.plan.planVersion && options['confirmed-digest'] === digest(ctx.plan);
  if (existing !== null && confirmed && manifest && digest(existing) !== manifest.markdownDigest && (ctx.plan.planVersion <= manifest.planVersion || ctx.plan.review.status !== 'pending')) throw new Error('Edited review refresh requires incremented pending plan; reset approvals and re-evaluate');
  if (existing !== null && (!manifest || digest(existing) !== manifest.markdownDigest) && !confirmed) throw new Error('User-edited markdown protected; run --pull to apply edits, or --refresh --expected-version --confirmed-digest of complete plan');
  if (manifest && manifest.planDigest !== digest(ctx.plan)) {
    if (manifest.intentDigest !== digest(intent(ctx.plan))) {
      if (ctx.plan.planVersion <= manifest.planVersion) throw new Error('Content changed without incrementing planVersion; use --apply-patch');
      if (ctx.plan.review.status === 'approved') throw new Error('Changed plan must reset approval before review sync');
    }
  }
  const gallery = loadGallery();
  const content = reviewMarkdown(ctx.plan, gallery);
  const draftRel = path.relative(ctx.projectRoot, ctx.draftFile);
  const manifestRel = path.relative(ctx.projectRoot, manifestFile);
  const files = {[draftRel]: content, [manifestRel]: `${JSON.stringify({planVersion: ctx.plan.planVersion, planDigest: digest(ctx.plan), intentDigest: digest(intent(ctx.plan)), markdownDigest: digest(content)}, null, 2)}\n`};
  const draftDir = path.dirname(draftRel);
  for (const scene of ctx.plan.scenes) {
    const demo = gallery.patterns?.[scene.motionPlan?.primaryPattern];
    if (demo) files[path.join(draftDir, '模板样例', demo.file)] = fs.readFileSync(path.join(skillRoot, 'assets/demo-gallery', demo.file));
  }
  transaction(ctx.projectRoot, files, existing === null ? {} : {[draftRel]: digest(existing)});
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
