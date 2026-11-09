#!/usr/bin/env node
import { readFileSync } from "fs";

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const RAW = arg("--raw");
const SCENES = arg("--scenes");
const NARR = arg("--narration");
const DRAFT = arg("--draft");

if (!RAW || (!SCENES && !NARR && !DRAFT)) {
  console.error(`用法:
  node scripts/script-stats.mjs --raw <source.md> --draft <draft-review.md>
  node scripts/script-stats.mjs --raw <source.md> --scenes <scenes.json>
  node scripts/script-stats.mjs --raw <source.md> --narration <narration.txt>

--draft  直接解析 draft-review.md 的逐镜旁白与「预算Ns」，Step2 草稿阶段用这个
--scenes 读 scenes.json（含 durationSec，能算每镜真实语速），Step4 之后用
--narration 读纯文本稿，每行一镜`);
  process.exit(1);
}

const cn = (s) => (s.match(/[\u4e00-\u9fff]/g) ?? []).length;
const eff = (s) => s.replace(/\s/g, "").length;
const spokenText = (s) => s.subtitleSegments?.length > 1
  ? s.subtitleSegments.map((seg) => seg.narration ?? seg.text).join("")
  : s.narration ?? s.subtitle ?? "";

let raw = readFileSync(RAW, "utf8")
  .replace(/^>.*$/gm, "")
  .replace(/^#{1,6}\s.*$/gm, "")
  .replace(/^\|.*$/gm, "")
  .replace(/```[\s\S]*?```/g, "")
  .replace(/\*\*/g, "")
  .replace(/——/g, "");

let scenes = null;
let narr = "";

if (SCENES) {
  scenes = JSON.parse(readFileSync(SCENES, "utf8")).scenes;
  narr = scenes.map(spokenText).join("");
} else if (DRAFT) {
  const t = readFileSync(DRAFT, "utf8");
  const blocks = t.split(/^### /m).slice(1);
  scenes = [];
  for (const b of blocks) {
    const lines = b.split("\n");
    const head = lines[0];
    const idm = head.match(/^(S\d+)/);
    if (!idm) continue;
    const titlem = head.match(/｜([^｜]+)｜/);
    const budgetm = head.match(/预算\s*(\d+)\s*s/);
    if (!budgetm) continue;

    const i = lines.findIndex((l) => /^-\s*旁白[：:]/.test(l));
    if (i < 0) continue;
    const buf = [lines[i].replace(/^-\s*旁白[：:]/, "")];
    for (let j = i + 1; j < lines.length; j++) {
      if (/^-\s*(画面|节奏|effectName)/.test(lines[j])) break;
      buf.push(lines[j]);
    }
    const text = buf.join("").trim();
    if (!text) continue;
    scenes.push({
      id: idm[1],
      title: titlem ? titlem[1].trim() : "",
      subtitle: text,
      durationSec: Number(budgetm[1]),
    });
  }
  if (!scenes.length) {
    console.error("[stats] 未能从 --draft 中解析出任何镜头，检查标题是否为 `### Sxx｜标题｜预算NNs` 且含 `- 旁白：`");
    process.exit(1);
  }
  narr = scenes.map(spokenText).join("");
} else {
  narr = readFileSync(NARR, "utf8");
}

const R = cn(raw), N = cn(narr);
if (/[A-Za-z0-9]/.test(narr)) {
  console.warn("[stats] 正文含英文或数字：汉字语速仅供参考，须结合混排句试读时长核对，不可单凭统计选择字幕对齐路线。");
}
const ratio = (N / R) * 100;

const ratioVerdict =
  ratio > 100 ? "❌ 口播扩写超出原文（触顶「扩写上限」，须核查是否注水或新增了素材外的事实）"
  : ratio > 75 ? "⚠️ 改编幅度小（书面语可能残留，按 6 类扫一遍句式）"
  : ratio >= 45 ? "✅ 常规改编幅度"
  : "⚠️ 改编幅度大（务必逐条核对核心论点保留清单）";

console.log("## 文稿压缩比统计\n");
console.log("| | 汉字数 | 有效字符（含标点） |");
console.log("|---|---|---|");
console.log(`| 原始文稿 | ${R} | ${eff(raw)} |`);
console.log(`| 讲解文稿 | ${N} | ${eff(narr)} |`);
console.log(`\n- **压缩比：${ratio.toFixed(1)}%** → ${ratioVerdict}`);
console.log(`- **${R - N >= 0 ? "精简" : "净增"} ${Math.abs(R - N)} 字（${Math.abs(100 - ratio).toFixed(1)}%）**`);

if (scenes) {
  const rows = scenes.map((s) => {
    const c = cn(spokenText(s));
    const d = Number(s.durationSec ?? 0);
    return { id: s.id, title: s.title ?? "", c, d, sp: d > 0 ? c / d : 0 };
  });
  const total = rows.reduce((a, r) => a + r.d, 0);
  const speed = total > 0 ? N / total : 0;
  const sps = rows.filter((r) => r.d > 0).map((r) => r.sp);
  const spread = sps.length ? Math.max(...sps) - Math.min(...sps) : 0;

  const speedVerdict =
    speed === 0 ? "— 无时长数据"
    : speed < 3.0 ? "⚠️ 拖沓，考虑拆句或合镜"
    : speed <= 4.5 ? "✅ 健康"
    : speed <= 5.8 ? "⚠️ 偏快，长镜需拆句"
    : "❌ 超过 350 字/分，必须放慢（拆句，不是删论点）";

  const alignPath = spread <= 1.0
    ? "✅ 均匀 → 单段 TTS + 字幕按字数比例分配"
    : "⚠️ 不均 → 必须多段 TTS + startSec 回写";

  const over = rows.filter((r) => r.sp > 4.5);
  const warn = rows.filter((r) => r.sp > 3.5 && r.sp <= 4.5);

  console.log("\n### 语速核对\n");
  console.log("| 项目 | 值 | 判定 |");
  console.log("|---|---|---|");
  console.log(`| 镜数 | ${rows.length} | ${scenes.length && DRAFT ? "与草稿标题一致" : "—"} |`);
  console.log(`| 总时长预算 | ${total.toFixed(1)}s（${Math.floor(total / 60)}分${Math.round(total % 60)}秒） | — |`);
  console.log(`| 全片语速 | ${speed.toFixed(2)} 字/秒（${Math.round(speed * 60)} 字/分） | ${speedVerdict} |`);
  console.log(`| 每镜语速极差 | ${spread.toFixed(2)} 字/秒 | ${alignPath} |`);
  console.log(`| 超密度镜(>4.5) | ${over.length ? over.map((r) => `${r.id}(${r.sp.toFixed(1)})`).join("、") : "无"} | ${over.length ? "❌ 必须压旁白或拆镜" : "✅"} |`);
  console.log(`| 偏快镜(3.5~4.5) | ${warn.length ? warn.map((r) => `${r.id}(${r.sp.toFixed(1)})`).join("、") : "无"} | ${warn.length ? "⚠️ 检查可压从句" : "✅"} |`);

  console.log("\n<details><summary>逐镜明细</summary>\n");
  console.log("| # | 汉字 | 预算时长 | 字/秒 | 状态 | 场景 |");
  console.log("|---|---|---|---|---|---|");
  rows.forEach((r) => {
    const st = r.sp > 4.5 ? "❌" : r.sp > 3.5 ? "⚠️" : "✅";
    console.log(`| ${r.id} | ${r.c} | ${r.d.toFixed(1)}s | ${r.sp.toFixed(1)} | ${st} | ${r.title} |`);
  });
  console.log("\n</details>");

  const longShot = rows.filter((r) => r.d >= 25);
  if (longShot.length) {
    console.log(`\n> **长镜提示**：${longShot.map((r) => `${r.id}(${r.d.toFixed(0)}s, ${r.sp.toFixed(1)}字/秒)`).join("、")}。`);
    console.log("> 按 SKILL.md 节奏规则判断：是内容真的多（保留，用画面分阶段演进），还是一镜承载多个独立任务（拆镜）。不要仅因时长超阈值就拆。");
  }
}

const HEDGE = /不代表|不等于|不意味着|不是所有|不是全部|并不|并非|有可能|可能|或许|也许|不一定|未必|通常|往往|一般|大致|大约|大概|基本上|取决于|要看|视情况|有限|部分|不能保证|无法保证|不承诺|不排除|尽量|约(?![0-9〇一二三四五六七八九十百千万亿kKwW])/g;
const LECTURE = /首先|其次|此外|另一方面|另外|具体来说|换句话说|简单说|值得注意|综上所述|总而言之|总的来说|注意[，,]|那么[，,]|接下来[，,]|接下来(?=[^，,])/g;
const FILLER = /其实|说白了|你知道吗|不难发现|我们可以看到|我们不难|想象一下|试想|大家都知道|众所周知|显而易见|很简单|稍微懂点|只要懂/g;
const CONDESCEND = /显而易见|很简单|不难理解|稍微懂点|只要懂|这都不懂|基本常识|当然了/g;

const hedgeHits = narr.match(HEDGE) ?? [];
const lectureHits = narr.match(LECTURE) ?? [];
const fillerHits = narr.match(FILLER) ?? [];
const condHits = narr.match(CONDESCEND) ?? [];
const per1000 = (n) => (N > 0 ? (n / N) * 1000 : 0);

const hedgeD = per1000(hedgeHits.length);
const lectureD = per1000(lectureHits.length);
const fillerD = per1000(fillerHits.length);

const hedgeVerdict =
  hedgeD === 0 ? "— 无"
  : hedgeD <= 12 ? "✅ 密度正常"
  : hedgeD <= 18 ? "⚠️ 偏高，像技术说明书的免责声明"
  : "❌ 过高，每句都在补限定条件，观众会觉得在听文档";

const lectureVerdict =
  lectureD === 0 ? "— 无"
  : lectureD <= 3.5 ? "✅ 密度正常"
  : lectureD <= 6 ? "⚠️ 讲义感，逐条核查是否可换口语承接"
  : "❌ 教材味过重，连接词通胀";

const fillerVerdict =
  fillerD === 0 ? "— 无"
  : fillerD <= 4 ? "✅ 密度正常"
  : fillerD <= 8 ? "⚠️ 口头禅偏多，挑几处删掉不影响语义"
  : "❌ 固定句式通胀，每镜都在「其实/想象一下」";

const sample = (arr, k = 4) => (arr.length ? [...new Set(arr)].slice(0, k).join("、") : "—");

console.log("\n### 口播质地扫描\n");
console.log("| 指标 | 计数 | 次/千字 | 判定 |");
console.log("|---|---|---|---|");
console.log(`| 限定/免责句 | ${hedgeHits.length} | ${hedgeD.toFixed(1)} | ${hedgeVerdict} |`);
console.log(`| 讲座连接词 | ${lectureHits.length} | ${lectureD.toFixed(1)} | ${lectureVerdict} |`);
console.log(`| 口头禅/填充句 | ${fillerHits.length} | ${fillerD.toFixed(1)} | ${fillerVerdict} |`);
console.log(`\n- 命中举例：限定「${sample(hedgeHits)}」｜连接「${sample(lectureHits)}」｜口头禅「${sample(fillerHits)}」`);
if (condHits.length) {
  console.log(`- ❌ **居高临下表达 ${condHits.length} 处：「${sample(condHits, 6)}」** → 一律改写（rubric §0.2 原则五）`);
}
console.log("> 以上指标只定位质地倾向，不替代人工判断。达标不等于旁白自然，超标的必须逐句改；改法见 references/draft-review-rubric.md §0.1 / §0.2。");

// ── 口语节奏：长句占比 ──
const sentences = narr
  .split(/[。！？；!?;\n]+/)
  .map((s) => s.trim())
  .filter((s) => cn(s) >= 2);
const longSents = sentences.filter((s) => cn(s) > 30);
const longRatio = sentences.length ? (longSents.length / sentences.length) * 100 : 0;
const maxSent = sentences.reduce((a, s) => Math.max(a, cn(s)), 0);

const longVerdict =
  longRatio <= 15 ? "✅ 适合口头朗读"
  : longRatio <= 25 ? "⚠️ 书面长句偏多，挑最长的几句拆成短句"
  : "❌ 长难句过多，朗读需要回读才能理解";

console.log("\n### 口语节奏\n");
console.log("| 指标 | 值 | 判定 |");
console.log("|---|---|---|");
console.log(`| 句数 | ${sentences.length} | — |`);
console.log(`| 长句(>30汉字)占比 | ${longRatio.toFixed(1)}%（${longSents.length} 句） | ${longVerdict} |`);
console.log(`| 最长句 | ${maxSent} 汉字 | ${maxSent > 45 ? "❌ 必须拆" : maxSent > 30 ? "⚠️ 可拆" : "✅"} |`);
if (longSents.length) {
  console.log(`\n<details><summary>长句清单（按长度降序，前 8 条）</summary>\n`);
  [...longSents].sort((a, b) => cn(b) - cn(a)).slice(0, 8)
    .forEach((s) => console.log(`- (${cn(s)}字) ${s.slice(0, 60)}${s.length > 60 ? "…" : ""}`));
  console.log("\n</details>");
}

// ── 钩子与具体性（逐镜，仅 --draft/--scenes 可用）──
if (scenes) {
  const QUESTION = /[？?]|有没有想过|是不是|难道|你猜|怎么回事/;
  const CONCRETE = /[0-9]|[A-Za-z]{2,}|比如|例如|举个例子|打开|点开|敲|跑一遍|看到|发现|报错|卡住|等了|「|"/;

  const hookShots = scenes.filter((s) => QUESTION.test(spokenText(s)));
  let runs = [], cur = [];
  scenes.forEach((s) => {
    if (CONCRETE.test(spokenText(s))) { if (cur.length) runs.push(cur); cur = []; }
    else cur.push(s.id);
  });
  if (cur.length) runs.push(cur);
  const badRuns = runs.filter((r) => r.length >= 4);

  // 连续设问镜
  let consecHook = [];
  for (let i = 1; i < scenes.length; i++) {
    if (QUESTION.test(spokenText(scenes[i])) && QUESTION.test(spokenText(scenes[i - 1])))
      consecHook.push(`${scenes[i - 1].id}→${scenes[i].id}`);
  }

  console.log("\n### 钩子与具体性\n");
  console.log("| 指标 | 值 | 判定 |");
  console.log("|---|---|---|");
  console.log(`| 含设问/悬念的镜 | ${hookShots.length}（${hookShots.map((s) => s.id).join("、") || "无"}） | ${hookShots.length <= 3 ? "✅ 在预算内" : "❌ 钩子通胀，超 3 个后全部失效（§0 规则3）"} |`);
  console.log(`| 连续两镜都设问 | ${consecHook.length ? consecHook.join("、") : "无"} | ${consecHook.length ? "❌ 禁止，改一镜为陈述开场" : "✅"} |`);
  console.log(`| 连续抽象镜(≥4镜无具体锚点) | ${badRuns.length ? badRuns.map((r) => r.join("→")).join(" ｜ ") : "无"} | ${badRuns.length ? "❌ 必须插入类比/案例/数字/具体动作" : "✅"} |`);
  console.log("> 具体锚点 = 数字 / 英文术语 / 比如例如 / 具体动作（打开、报错、卡住）/ 引述。正则只做粗筛，命中不等于讲得具体。");
}

console.log("\n> 结构审查、核心论点保留清单、衔接连贯性检查表、比喻贯穿与结尾形态需人工填写，见 references/draft-review-rubric.md");
