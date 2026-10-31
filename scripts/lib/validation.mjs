import fs from 'node:fs';
import {createRequire} from 'node:module';
import {inside, json, stable, skillRoot} from './core.mjs';

const supported = new Set(['$schema', '$id', '$defs', '$ref', 'type', 'required', 'properties', 'additionalProperties', 'items', 'minItems', 'maxItems', 'minProperties', 'minLength', 'maxLength', 'pattern', 'enum', 'const', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum']);
export function checkSchema(value, schema, root = schema, location = '$') {
  for (const key of Object.keys(schema)) if (!supported.has(key)) throw new Error(`Unsupported schema keyword ${key}`);
  if (schema.$ref) {
    if (!schema.$ref.startsWith('#/')) throw new Error('Only local schema refs supported');
    const ref = schema.$ref.slice(2).split('/').reduce((node, k) => node?.[k.replaceAll('~1', '/').replaceAll('~0', '~')], root);
    if (!ref) throw new Error(`Unresolved schema ${schema.$ref}`);
    checkSchema(value, ref, root, location);
  }
  const fail = message => { throw new Error(`${location}: ${message}`); };
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  if (schema.type && ![].concat(schema.type).some(t => t === type || t === 'integer' && Number.isInteger(value))) fail(`expected ${schema.type}`);
  if (Object.hasOwn(schema, 'const') && stable(value) !== stable(schema.const)) fail('wrong constant');
  if (schema.enum && !schema.enum.some(v => stable(v) === stable(value))) fail('invalid enum');
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail('non-finite number');
    for (const [key, check] of [['minimum', n => value >= n], ['maximum', n => value <= n], ['exclusiveMinimum', n => value > n], ['exclusiveMaximum', n => value < n]]) if (Object.hasOwn(schema, key) && !check(schema[key])) fail(key);
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && [...value].length < schema.minLength) fail('too short');
    if (schema.maxLength !== undefined && [...value].length > schema.maxLength) fail('too long');
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) fail('pattern mismatch');
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) fail('too few items');
    if (schema.maxItems !== undefined && value.length > schema.maxItems) fail('too many items');
    if (schema.items) value.forEach((v, i) => checkSchema(v, schema.items, root, `${location}[${i}]`));
  } else if (value && typeof value === 'object') {
    for (const key of schema.required || []) if (!Object.hasOwn(value, key)) fail(`missing ${key}`);
    if (schema.minProperties !== undefined && Object.keys(value).length < schema.minProperties) fail('too few properties');
    for (const [key, v] of Object.entries(value)) {
      if (schema.properties?.[key]) checkSchema(v, schema.properties[key], root, `${location}.${key}`);
      else if (schema.additionalProperties === false) fail(`unknown ${key}`);
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') checkSchema(v, schema.additionalProperties, root, `${location}.${key}`);
    }
  }
}
export function approved(plan) {
  if (plan.review?.status !== 'approved' || plan.review.reviewedVersion !== plan.planVersion) throw new Error('Approval missing or stale');
  for (const k of ['approvedBy', 'approvedAt', 'approvalEvidence']) if (typeof plan.review[k] !== 'string' || !plan.review[k].trim()) throw new Error(`Approval missing ${k}`);
  if (!Number.isFinite(Date.parse(plan.review.approvedAt))) throw new Error('Invalid approvedAt');
  if (plan.evaluation?.status !== 'pass' || plan.evaluation.planVersion !== plan.planVersion || !(plan.evaluation.weightedScore >= 8)) throw new Error('Evaluation missing, failed or stale');
  if (plan.evaluation.dimensions) {
    if (!Array.isArray(plan.evaluation.dimensions) || plan.evaluation.dimensions.length !== 7) throw new Error('Evaluation dimensions must contain seven scores');
    const scores = plan.evaluation.dimensions.map(v => typeof v === 'number' ? v : v.score);
    if (scores.some(v => !Number.isFinite(v) || v < 1 || v > 10) || scores.slice(0, 5).some(v => v <= 5)) throw new Error('Core evaluation dimension failed');
    const weighted = scores.reduce((sum, v, i) => sum + v * [0.15, 0.2, 0.15, 0.15, 0.15, 0.1, 0.1][i], 0);
    if (Math.abs(weighted - plan.evaluation.weightedScore) > 0.011) throw new Error('Evaluation weighted score mismatch');
  }
}
export function typographyAsset(root = skillRoot) {
  const asset = json(inside(root, 'assets/typography.json'));
  if (!asset.version || !asset.roles || !asset.fonts?.sans || !asset.fonts?.handwritten) throw new Error('Typography asset requires version/roles/fonts.sans/handwritten');
  for (const [name, role] of Object.entries(asset.roles)) if (!Number.isFinite(role.fontSize) || role.fontSize <= 0 || !Number.isFinite(role.fontWeight) || !Number.isFinite(role.lineHeight) || !Object.hasOwn(asset.fonts, role.fontRole)) throw new Error(`Invalid typography asset role ${name}`);
  return {...asset, tokens: Object.fromEntries(Object.entries(asset.roles).map(([k, v]) => [k, v.fontSize])), fontRoles: asset.fonts, emphasisOffset: asset.emphasisOffset ?? 8};
}
export function validatePlan(plan, root = skillRoot) {
  checkSchema(plan, json(inside(skillRoot, 'scripts/plan.schema.json')));
  const asset = typographyAsset(root);
  if (stable(plan.typography.tokens) !== stable(asset.tokens) || plan.typography.emphasisOffset !== asset.emphasisOffset || plan.typography.version !== asset.version) throw new Error('Typography fixed values differ from asset');
  if (stable(plan.typography.fontRoles) !== stable(asset.fontRoles) || plan.typography.fontFamily !== asset.fontRoles.sans) throw new Error('Font role mapping/fontFamily differs from typography asset');
  if (stable(plan.typography.roles) !== stable(asset.roles)) throw new Error('Typography full role values differ from asset');
  const ids = new Set(), names = new Set();
  const roles = new Set(Object.keys(asset.tokens).concat('emphasis'));
  const walk = (value, location) => {
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (['fontSize', 'fontWeight', 'fontFamily'].includes(key)) throw new Error(`${location}: inline ${key} forbidden`);
      if (/textRole$/i.test(key) && item !== null && !roles.has(item)) throw new Error(`${location}: unknown textRole ${item}`);
      if (/fontRole$/i.test(key) && item !== null && !Object.hasOwn(asset.fontRoles, item)) throw new Error(`${location}: unknown fontRole ${item}`);
      if (key === 'position' && item && typeof item === 'object') {
        const {x, y, width, height} = item;
        if (![x, y, width, height].every(Number.isFinite) || width < 0 || height < 0) throw new Error(`${location}: invalid bounds`);
        const stroke = value.strokeWidth ?? 0;
        if (!Number.isFinite(stroke) || stroke < 0) throw new Error(`${location}: invalid strokeWidth`);
        if (value.boundsIncludeStroke !== true && stroke > 0) throw new Error(`${location}: drawing bounds must include stroke`);
        if (x < 0 || y < 0 || x + width > 1000 || y + height > 1210) throw new Error(`${location}: bounds outside 1000x1210`);
      }
      walk(item, `${location}.${key}`);
    }
  };
  for (const scene of plan.scenes) {
    if (ids.has(scene.id)) throw new Error(`Duplicate scene ${scene.id}`);
    ids.add(scene.id);
    if (!scene.component.name.startsWith(`${scene.id}-`) || names.has(scene.component.name)) throw new Error(`Effect must be unique and scene-prefixed: ${scene.component.name}`);
    names.add(scene.component.name);
    if (scene.estimatedDurationSec - scene.tailSec - plan.audioPlan.PAD <= 0) throw new Error(`${scene.id}: estimated speech duration must be positive`);
    const elements = new Set();
    const scan = (value, location) => {
      if (!value || typeof value !== 'object') return;
      if (Array.isArray(value)) { value.forEach((v, i) => scan(v, `${location}[${i}]`)); return; }
      const text = value.text !== undefined || typeof value.content === 'string' && value.content.length > 0 || ['text', 'title', 'subtitle', 'chapterTitle', 'node'].includes(value.type);
      if (text) {
        if (typeof value.id !== 'string' || !value.id || elements.has(value.id)) throw new Error(`${scene.id}: missing/duplicate text ID at ${location}`);
        elements.add(value.id);
        if (!roles.has(value.textRole) || !Object.hasOwn(asset.fontRoles, value.fontRole)) throw new Error(`${scene.id}: textRole/fontRole required at ${location}`);
        if ((['title', 'sceneHeading', 'nodeLabel', 'subheading', 'recapHeading', 'recapTitle', 'heroTitle'].includes(value.textRole) || ['title', 'chapterTitle'].includes(value.type)) && value.fontRole !== 'sans') throw new Error(`${scene.id}: title node must use sans`);
        if ((value.textRole === 'subtitle' || value.type === 'subtitle') && value.fontRole !== 'handwritten') throw new Error(`${scene.id}: subtitle must use handwritten`);
      }
      Object.entries(value).forEach(([k, v]) => scan(v, `${location}.${k}`));
    };
    scan(scene.visualElements, 'visualElements');
    scan(scene.component.params, 'component.params');
    walk(scene.visualElements, scene.id);
    walk(scene.component.params, scene.id);
  }
  if (plan.audioPlan.scenesTempoById) for (const id of Object.keys(plan.audioPlan.scenesTempoById)) if (!ids.has(id)) throw new Error(`Tempo config unknown scene ${id}`);
  const last = plan.scenes.at(-1);
  if (plan.narrative.outro.sceneId !== last.id || last.purpose !== 'outro' || last.tailSec < 2 || last.tailSec > 2.5) throw new Error('Independent final Outro/tail required');
  if (plan.narrative.coverage.some(v => ['lost', 'missing'].includes(v.status))) throw new Error('Knowledge coverage missing');
  if (plan.audioPlan.alignmentMode === 'single-scene-proportional' && plan.audioPlan.speedSpread > 1 || plan.audioPlan.alignmentMode === 'multi-segment-measured' && plan.audioPlan.speedSpread <= 1) throw new Error('Approved alignmentMode conflicts with speedSpread');
  return asset;
}
export function checkEffects(ctx, metadataOnly = false) {
  const files = ctx.plan.scenes.map(s => inside(ctx.engineRoot, `src/effects/${s.component.name}.tsx`));
  for (const file of files) if (!fs.existsSync(file)) throw new Error(`Missing effect (pending): ${file}`);
  if (metadataOnly) return {ast: 'not-run', visual: 'pending-human-review'};
  const require = createRequire(inside(ctx.engineRoot, 'package.json'));
  let ts;
  try { ts = require('typescript'); } catch { throw new Error('TypeScript AST unavailable; install production dependencies or explicitly use --metadata-only'); }
  for (const file of files) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    if (source.parseDiagnostics.length) throw new Error(`Effect syntax error: ${file}`);
    let defaultExport = false;
    const visit = node => {
      if (ts.isExportAssignment(node) && !node.isExportEquals || node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)) defaultExport = true;
      if ((ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node) || ts.isJsxAttribute(node) || ts.isMethodDeclaration(node) || ts.isPropertyDeclaration(node)) && node.name) {
        const name = ts.isComputedPropertyName(node.name) ? node.name.expression : node.name;
        if (['fontSize', 'fontWeight', 'fontFamily'].includes(name.text)) throw new Error(`Inline typography forbidden via TypeScript AST: ${file}:${source.getLineAndCharacterOfPosition(node.pos).line + 1}`);
      }
      if (ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression) && ['fontSize', 'fontWeight', 'fontFamily'].includes(node.argumentExpression.text) || ts.isPropertyAccessExpression(node) && ['fontSize', 'fontWeight', 'fontFamily'].includes(node.name.text)) throw new Error(`Inline typography access forbidden: ${file}`);
      ts.forEachChild(node, visit);
    };
    visit(source);
    if (!defaultExport) throw new Error(`Effect lacks default export: ${file}`);
  }
  return {ast: 'passed', limits: 'Direct unique Effect syntax only; computed dynamic keys, external helpers, rendered knowledge relationships and font availability are not proven.', visual: 'pending-human-review'};
}
