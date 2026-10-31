import { Config } from '@remotion/cli/config';
import { accessSync, constants } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

const browser = resolve(homedir(), '.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell');
try {
  accessSync(browser, constants.X_OK);
} catch {
  throw new Error(`Global Chrome Headless Shell is unavailable: ${browser}. Install or copy it explicitly before preview or render.`);
}
Config.setBrowserExecutable(browser);
Config.setCodec('h264');
Config.setOverwriteOutput(true);
