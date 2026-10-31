import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
try {
  if (process.argv.length > 2) throw new Error('Render settings are configured by project.config.json and remotion.config.ts');
  const config = JSON.parse(readFileSync(resolve(root, 'project.config.json'), 'utf8'));
  if (!/^[A-Za-z0-9_-]+$/.test(config.slug ?? '') || !/^[A-Za-z0-9_-]+$/.test(config.compositionId ?? '')) throw new Error('Invalid slug or compositionId');
  mkdirSync(resolve(root, 'out'), { recursive: true });
  const result = spawnSync(resolve(root, 'node_modules/.bin/remotion'), ['render', 'src/index.tsx', config.compositionId, `out/${config.slug}.mp4`], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
