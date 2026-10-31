import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

export const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export const stable = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
export const digest = value => crypto.createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : stable(value)).digest('hex');
export const clone = value => structuredClone(value);
export function args(argv = process.argv.slice(2)) {
  const out = {};
  const flags = new Set(['install', 'refresh', 'metadata-only', 'sync-only', 'generate']);
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) throw new Error(`Unexpected argument ${argv[i]}`);
    const key = argv[i].slice(2);
    if (Object.hasOwn(out, key)) throw new Error(`Duplicate option --${key}`);
    if (flags.has(key)) out[key] = true;
    else {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`Missing value --${key}`);
      out[key] = argv[++i];
    }
  }
  return out;
}
export function inside(root, input) {
  if (typeof input !== 'string' || !input || input.includes('\0') || input.includes('\\') || input.split('/').includes('..')) throw new Error(`Unsafe path: ${input}`);
  root = path.resolve(root);
  const target = path.resolve(root, input);
  const rel = path.relative(root, target);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) throw new Error(`Path outside root: ${input}`);
  const pieces = rel.split(path.sep).filter(Boolean);
  let cursor = root;
  for (const piece of ['', ...pieces]) {
    if (piece) cursor = path.join(cursor, piece);
    let stat;
    try { stat = fs.lstatSync(cursor); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (stat?.isSymbolicLink()) throw new Error(`Symlink path forbidden: ${cursor}`);
  }
  return target;
}
export function relativePath(root, input) {
  if (path.isAbsolute(input)) throw new Error(`Must be relative to project root: ${input}`);
  return inside(root, input);
}
export function atomic(file, content) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const tmp = `${file}.${crypto.randomUUID()}.tmp`;
  try { fs.writeFileSync(tmp, content, {flag: 'wx'}); fs.renameSync(tmp, file); }
  finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
}
export const writeJson = (file, value) => atomic(file, `${JSON.stringify(value, null, 2)}\n`);
export function executable(input, fallback) {
  const name = input || fallback;
  const target = path.isAbsolute(name) ? name : execFileSync('/usr/bin/which', [name], {encoding: 'utf8'}).trim();
  if (!path.isAbsolute(target) || !fs.statSync(target).isFile()) throw new Error(`Executable missing: ${name}`);
  fs.accessSync(target, fs.constants.X_OK);
  return target;
}
export function run(command, argv, options = {}) {
  return execFileSync(command, argv, {encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024, ...options, shell: false});
}
export function main(fn, url) {
  if (url && path.resolve(process.argv[1] || '') !== fileURLToPath(url)) return;
  if (process.argv.slice(2).includes('--help')) {
    const name = path.basename(fileURLToPath(url || import.meta.url));
    const help = {
      'init-project.mjs': '--project-root <绝对路径> [--plan <项目内路径>] [--browser <可执行路径>] [--install]',
      'export-plan.mjs': '--project-root <绝对路径> [--plan <项目内路径>]',
      'render-review.mjs': '--project-root <绝对路径> [--apply-patch <项目内JSON> --expected-version <版本>]；刷新前先读取差异，勿覆盖人工修改',
      'validate-project.mjs': '--project-root <绝对路径> [--metadata-only]；默认需要生产工程typescript依赖',
      'audio-pipeline.mjs': '--project-root <绝对路径> [--generate --tts-batch chattts] [--scene S01] [--sync-only]；自定义TTS可用--tts-command/--tts-args <JSON数组>',
      'render-cover.mjs': '--project-root <绝对路径> --svg <项目内SVG> --approved-digest <获批SHA256>；或--cover-review-manifest <项目内JSON>',
      'script-stats.mjs': '--raw <路径> (--plan <路径> | --scenes <路径>) [--json]'
    };
    console.log(`${name}: ${help[name] || '--project-root <绝对路径>'}`);
    return;
  }
  try { const result = fn(args()); if (result?.then) result.catch(e => { console.error(e.message); process.exitCode = 1; }); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}
export function context(options) {
  if (!options['project-root']) throw new Error('--project-root required');
  const projectRoot = path.resolve(options['project-root']);
  if (!fs.statSync(projectRoot).isDirectory()) throw new Error('Project root must exist');
  inside(projectRoot, '.');
  const planFile = inside(projectRoot, options.plan || '制作过程/视频制作方案.json');
  const plan = json(planFile);
  for (const key of ['sourcePath', 'researchPath', 'draftPath', 'engineDir', 'publishDir']) if (plan[key]) relativePath(projectRoot, plan[key]);
  if (plan.compositionId !== undefined && !/^[A-Za-z][A-Za-z0-9_-]*$/.test(plan.compositionId)) throw new Error('Unsafe compositionId');
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(plan.slug || '')) throw new Error('Unsafe slug');
  const engineRoot = relativePath(projectRoot, plan.engineDir || `${plan.slug}-video`);
  if (engineRoot === projectRoot) throw new Error('Production root must be a project subdirectory');
  const draftFile = relativePath(projectRoot, plan.draftPath || '制作过程/视频方案审阅稿.md');
  return {projectRoot, planFile, plan, engineRoot, draftFile, scenesFile: inside(engineRoot, `public/scenes/${plan.slug}/scenes.json`), skillRoot};
}
export const browserDefault = () => path.join(os.homedir(), '.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell');
export function checkConfig(ctx) {
  const config = json(inside(ctx.engineRoot, 'project.config.json'));
  for (const [k, expected] of Object.entries({projectRoot: ctx.projectRoot, skillRoot: ctx.skillRoot, slug: ctx.plan.slug, compositionId: ctx.plan.compositionId || 'Main'})) if (config[k] !== expected) throw new Error(`project.config.json mismatch: ${k}`);
  return config;
}
