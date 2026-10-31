import fs from 'node:fs';
import path from 'node:path';
import {main, context, executable, browserDefault, inside, skillRoot, atomic, writeJson, run, json} from './lib/core.mjs';
import {approved, validatePlan} from './lib/validation.mjs';
import {ensureReview} from './lib/review.mjs';
import {exportScenes, generatedFiles, generatedWrite} from './lib/production.mjs';

export function initProject(options) {
  const ctx = context(options);
  const asset = validatePlan(ctx.plan);
  approved(ctx.plan);
  ensureReview(ctx);
  const browser = executable(options.browser || browserDefault());
  if (fs.existsSync(ctx.engineRoot)) throw new Error(`Existing production root protected: ${ctx.engineRoot}`);
  const template = inside(skillRoot, 'assets/project-template');
  if (!fs.existsSync(template)) throw new Error(`Project template missing: ${template}`);
  const packageFile = inside(template, 'package.json');
  const pkg = json(packageFile);
  if (!pkg.devDependencies?.typescript && !pkg.dependencies?.typescript) throw new Error('Template must declare typescript for later AST validation');
  const compositionId = ctx.plan.compositionId || 'Main';
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(compositionId)) throw new Error('Unsafe compositionId');
  const stage = inside(ctx.projectRoot, `.init-${ctx.plan.slug}-${process.pid}`);
  if (fs.existsSync(stage)) throw new Error('Initialization staging directory already exists');
  try {
    const copy = (source, destination) => {
      fs.mkdirSync(destination, {recursive: true});
      for (const entry of fs.readdirSync(source, {withFileTypes: true})) {
        if (['node_modules', '.git'].includes(entry.name)) continue;
        if (entry.isSymbolicLink()) throw new Error(`Template symlink forbidden: ${entry.name}`);
        const from = path.join(source, entry.name), to = path.join(destination, entry.name);
        if (entry.isDirectory()) copy(from, to);
        else if (entry.isFile()) fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL);
        else throw new Error(`Unsupported template entry ${entry.name}`);
      }
    };
    copy(template, stage);
    const staged = {...ctx, engineRoot: stage};
    const files = generatedFiles(ctx.plan, asset, exportScenes(ctx.plan));
    for (const rel of Object.keys(files)) {
      const target = inside(stage, rel);
      if (fs.existsSync(target)) throw new Error(`Template conflicts with generated file: ${rel}`);
    }
    const remotionFile = inside(stage, 'remotion.config.ts');
    atomic(remotionFile, `import {Config} from '@remotion/cli/config';\nimport {accessSync, constants} from 'node:fs';\nconst browser = ${JSON.stringify(browser)};\naccessSync(browser, constants.X_OK);\nConfig.setBrowserExecutable(browser);\nConfig.setCodec('h264');\nConfig.setOverwriteOutput(true);\n`);
    writeJson(inside(stage, 'project.config.json'), {projectRoot: ctx.projectRoot, skillRoot, slug: ctx.plan.slug, compositionId});
    const rootSource = inside(stage, 'src/Root.tsx');
    if (fs.existsSync(rootSource)) atomic(rootSource, fs.readFileSync(rootSource, 'utf8').replaceAll('{{COMPOSITION_ID}}', compositionId));
    const sync = inside(stage, 'scripts/check-draft-sync.mjs');
    if (!fs.existsSync(sync)) { fs.mkdirSync(path.dirname(sync), {recursive: true}); fs.copyFileSync(inside(skillRoot, 'scripts/check-draft-sync.mjs'), sync); }
    generatedWrite(staged, files);
    fs.mkdirSync(path.dirname(ctx.engineRoot), {recursive: true});
    if (fs.existsSync(ctx.engineRoot)) throw new Error('Production root created concurrently');
    fs.renameSync(stage, ctx.engineRoot);
  } finally { if (fs.existsSync(stage)) fs.rmSync(stage, {recursive: true, force: true}); }
  if (options.install) run(executable(null, 'npm'), ['install'], {cwd: ctx.engineRoot, timeout: 600000});
  const pending = ctx.plan.scenes.filter(s => !fs.existsSync(inside(ctx.engineRoot, `src/effects/${s.component.name}.tsx`))).map(s => s.component.name);
  return {engineRoot: ctx.engineRoot, pendingEffects: pending, dependencies: options.install ? 'installed' : 'not-installed', visual: 'pending-human-review'};
}
main(options => console.log(JSON.stringify(initProject(options), null, 2)), import.meta.url);
