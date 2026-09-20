#!/usr/bin/env node
// check-draft-sync.mjs — 草稿与 scenes.json 一致性强制门禁
// 用法: node scripts/check-draft-sync.mjs [--draft <path>] [--scenes <path>]
// 逻辑：从 draft-review.md 提取每个 scene 的旁白（**S{id}｜标题** 下首个 `> ` 引用行），
//       与 scenes.json 的 narration/subtitle 逐镜比对；任一不一致 → 打印差异并 exit 1。
// 目的：防止"操作者已修改草稿、但 scenes.json 仍是旧版"的静默漂移。
//       生成任何产物（Effect / TTS / 封面）前必须先跑本脚本通过。
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };

const DRAFT = arg("--draft") ?? resolve(__dirname, "../draft-review.md");
const SCENES = arg("--scenes") ?? resolve(__dirname, "../public/scenes");

if (!existsSync(DRAFT)) { console.log(`[check-draft-sync] 未找到 ${DRAFT}，跳过（无草稿可校验）`); process.exit(0); }

let scenesPath = SCENES;
if (!existsSync(scenesPath)) { console.log(`[check-draft-sync] 未找到 scenes 目录，跳过`); process.exit(0); }
// scenes.json 可能在公共目录下的子目录
import { readdirSync } from "fs";
if (readdirSync(scenesPath).every(f => !f.endsWith(".json"))) {
  const sub = readdirSync(scenesPath).find(d => existsSync(resolve(scenesPath, d, "scenes.json")));
  if (sub) scenesPath = resolve(scenesPath, sub, "scenes.json"); else { console.log("[check-draft-sync] 未找到 scenes.json，跳过"); process.exit(0); }
} else {
  const jsonFile = readdirSync(scenesPath).find(f => f.endsWith(".json"));
  scenesPath = resolve(scenesPath, jsonFile);
}

const review = readFileSync(DRAFT, "utf8");
const data = JSON.parse(readFileSync(scenesPath, "utf8"));

const blocks = review.split(/\*\*S(\d+)｜/);
const draftMap = {};
for (let i = 1; i < blocks.length; i += 2) {
  const sid = "S" + blocks[i].padStart(2, "0");
  const m = blocks[i + 1].match(/^> (.+)$/m);
  if (m) draftMap[sid] = m[1].trim();
}

const diffs = [];
for (const scene of data.scenes) {
  const draft = draftMap[scene.id];
  if (!draft) continue;
  if (draft !== scene.subtitle && draft !== scene.narration) diffs.push(scene.id);
}

if (diffs.length) {
  console.error(`[check-draft-sync] ❌ ${diffs.length} 个场景与 draft-review.md 不一致：${diffs.join(", ")}`);
  console.error(`[check-draft-sync] draft-review.md 已被修改。请重新读取最新草稿并同步 scenes.json 后再继续。`);
  for (const id of diffs) {
    const scene = data.scenes.find(s => s.id === id);
    console.error(`  ${id}\n    draft : ${draftMap[id]}\n    当前  : ${scene.subtitle}`);
  }
  process.exit(1);
}
console.log(`[check-draft-sync] ✅ ${data.scenes.length} 镜全部与 draft-review.md 一致`);
