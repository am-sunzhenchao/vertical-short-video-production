#!/usr/bin/env node
// 草稿与 scenes.json 一致性门禁。
// 正式制作默认 fail-closed：缺草稿、缺 scenes.json、JSON 错误或场景未映射都失败。
// 仅在明确的探索性工作流中可传 --allow-missing 跳过缺文件检查；不应用于交付。
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const allowMissing = args.includes("--allow-missing");
const explicitDraft = arg("--draft");
const draftCandidates = [
  resolve(__dirname, "../../制作过程/视频方案审阅稿.md"),
  resolve(__dirname, "../../draft-review.md"),
  resolve(__dirname, "../draft-review.md"),
];
const existingDrafts = draftCandidates.filter(p => existsSync(p));
const DRAFT = explicitDraft ?? existingDrafts[0] ?? draftCandidates[0];
const SCENES = arg("--scenes") ?? resolve(__dirname, "../public/scenes");

function fail(message) {
  console.error(`[check-draft-sync] ❌ ${message}`);
  process.exit(1);
}
function missing(message) {
  if (allowMissing) {
    console.warn(`[check-draft-sync] ⚠️ ${message}；因显式传入 --allow-missing，本次跳过（不可作为交付门禁）`);
    process.exit(0);
  }
  fail(`${message}。正式制作默认不允许跳过；若仅探索性工作请显式传入 --allow-missing`);
}

if (!explicitDraft && existingDrafts.length > 1) fail(`找到多个审阅稿文件，请通过 --draft 指定唯一文件：${existingDrafts.join(", ")}`);
if (!existsSync(DRAFT)) missing(`未找到草稿文件 ${DRAFT}`);
if (!existsSync(SCENES)) missing(`未找到 scenes 路径 ${SCENES}`);

let scenesFile = SCENES;
if (!/\.json$/i.test(scenesFile)) {
  let entries;
  try { entries = readdirSync(scenesFile, { withFileTypes: true }); }
  catch { fail(`无法读取 scenes 路径 ${scenesFile}`); }
  const directJson = entries.filter(e => e.isFile() && e.name.endsWith(".json"));
  if (directJson.length === 1) {
    scenesFile = resolve(scenesFile, directJson[0].name);
  } else if (directJson.length > 1) {
    fail(`目录 ${scenesFile} 下有多个 JSON 文件，请通过 --scenes 指定准确的 scenes.json`);
  } else {
    const nested = entries.filter(e => e.isDirectory()).map(e => resolve(scenesFile, e.name, "scenes.json")).filter(p => existsSync(p));
    if (nested.length === 1) scenesFile = nested[0];
    else if (nested.length > 1) fail(`在 ${scenesFile} 下找到多个 scenes.json，请通过 --scenes 指定准确文件`);
    else missing(`未找到 scenes.json（搜索路径：${scenesFile}）`);
  }
}
if (!existsSync(scenesFile)) missing(`未找到 scenes.json ${scenesFile}`);

let review, data;
try {
  review = readFileSync(DRAFT, "utf8");
  data = JSON.parse(readFileSync(scenesFile, "utf8"));
} catch (err) {
  fail(`读取草稿或解析 scenes.json 失败：${err.message}`);
}
if (!Array.isArray(data?.scenes) || data.scenes.length === 0) fail(`scenes.json 缺少非空 scenes 数组：${scenesFile}`);

// 兼容格式：**S01｜标题** 后第一条 > 旁白行。也接受 **S01 | 标题**。
const blocks = review.split(/\*\*S(\d+)\s*[｜|]/);
const draftMap = {};
for (let i = 1; i < blocks.length; i += 2) {
  const sid = "S" + blocks[i].padStart(2, "0");
  const m = blocks[i + 1].match(/^>\s+(.+)$/m);
  if (m) draftMap[sid] = m[1].trim();
}
if (Object.keys(draftMap).length === 0) fail(`未能从 ${DRAFT} 提取场景旁白；请检查 **S01｜标题** + > 旁白格式`);

const diffs = [];
const missingScenes = [];
for (const scene of data.scenes) {
  if (!scene?.id) { missingScenes.push("(scene 缺少 id)"); continue; }
  const draft = draftMap[scene.id];
  if (!draft) { missingScenes.push(scene.id); continue; }
  if (draft !== scene.subtitle && draft !== scene.narration) {
    diffs.push({ id: scene.id, draft, current: scene.subtitle ?? scene.narration ?? "(缺少 subtitle/narration)" });
  }
}
if (missingScenes.length) fail(`以下场景未能在草稿中一一匹配：${missingScenes.join(", ")}。请补齐草稿或修正 scenes.json，不能静默跳过。`);
if (diffs.length) {
  console.error(`[check-draft-sync] ❌ ${diffs.length} 个场景与 ${DRAFT} 不一致：${diffs.map(d => d.id).join(", ")}`);
  console.error(`[check-draft-sync] 请重新读取最新草稿并同步 scenes.json 后再继续。`);
  for (const d of diffs) console.error(`  ${d.id}\n    draft : ${d.draft}\n    当前  : ${d.current}`);
  process.exit(1);
}
console.log(`[check-draft-sync] ✅ ${data.scenes.length} 镜全部与 ${DRAFT} 一致（${scenesFile}）`);
