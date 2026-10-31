import fs from 'node:fs';
import {createRequire} from 'node:module';
import {main, context, relativePath, inside, digest, json, atomic, checkConfig} from './lib/core.mjs';
import {approved, validatePlan} from './lib/validation.mjs';
import {ensureReview} from './lib/review.mjs';

export function approveCover(bytes, options, file, manifest) {
  const hash = digest(bytes);
  if (options['approved-digest'] === hash) return hash;
  const record = manifest?.covers?.find(c => c.path === file && c.digest === hash && c.status === 'approved' && c.approvedBy && c.approvalEvidence);
  if (!record) throw new Error(`SVG not explicitly approved at current digest: ${hash}`);
  return hash;
}
main(options => {
  const ctx = context(options);
  validatePlan(ctx.plan);
  approved(ctx.plan);
  ensureReview(ctx);
  checkConfig(ctx);
  if (!options.svg) throw new Error('--svg project-relative path required');
  const publishRoot = relativePath(ctx.projectRoot, ctx.plan.publishDir || '发布素材');
  const file = relativePath(ctx.projectRoot, options.svg);
  inside(publishRoot, file);
  if (!/\.svg$/i.test(file)) throw new Error('Input must be SVG');
  const bytes = fs.readFileSync(file);
  const manifest = options['cover-review-manifest'] ? json(relativePath(ctx.projectRoot, options['cover-review-manifest'])) : null;
  const hash = approveCover(bytes, options, options.svg, manifest);
  const require = createRequire(inside(ctx.engineRoot, 'package.json'));
  let Resvg;
  try { ({Resvg} = require('@resvg/resvg-js')); } catch { throw new Error('Production-root @resvg/resvg-js not installed'); }
  const output = file.replace(/\.svg$/i, '.png');
  inside(publishRoot, output);
  const image = new Resvg(bytes.toString('utf8'), {fitTo: {mode: 'width', value: 1080}, font: {loadSystemFonts: true, defaultFontFamily: ctx.plan.typography.fontFamily.split(',')[0].trim()}}).render().asPng();
  if (image.readUInt32BE(16) !== 1080 || image.readUInt32BE(20) !== 1440) throw new Error('Approved cover must render as 1080x1440');
  if (digest(fs.readFileSync(file)) !== hash) throw new Error('SVG changed during conversion');
  const outputManifest = inside(publishRoot, '.cover-generated.json');
  const owned = fs.existsSync(outputManifest) ? json(outputManifest) : {};
  if (fs.existsSync(output) && owned[options.svg]?.pngDigest !== digest(fs.readFileSync(output))) throw new Error('User PNG protected');
  atomic(output, image);
  atomic(outputManifest, `${JSON.stringify({...owned, [options.svg]: {svgDigest: hash, pngDigest: digest(image)}}, null, 2)}\n`);
  console.log(JSON.stringify({output, approvedDigest: hash, visual: 'pending-human-inspection'}, null, 2));
}, import.meta.url);
