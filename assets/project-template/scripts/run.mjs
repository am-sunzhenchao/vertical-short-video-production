import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
try {
  const config = JSON.parse(readFileSync(resolve(root, 'project.config.json'), 'utf8'));
  if (!isAbsolute(config.projectRoot ?? '') || !isAbsolute(config.skillRoot ?? '') || typeof config.slug !== 'string' || !config.slug || typeof config.compositionId !== 'string' || !config.compositionId) throw new Error('Invalid project.config.json');
  const [command, ...args] = process.argv.slice(2);
  const commands = new Set(['export-plan', 'audio-pipeline', 'render-cover', 'validate-project']);
  if (!commands.has(command)) throw new Error(`Unsupported skill command: ${command}`);
  const result = spawnSync(process.execPath, [resolve(config.skillRoot, `scripts/${command}.mjs`), '--project-root', config.projectRoot, ...args], { stdio: 'inherit', timeout: command === 'audio-pipeline' ? 1200000 : 120000 });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
