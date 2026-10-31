# 可复用代码模板

> 新建项目先完成下列必读与全局 token 初始化，再复制模板并替换 `<slug>`、`<CompositionName>`、Effect 列表。本文节号不是制作步骤编号。
>
> 必读顺序：`色板.md` → `typography.md` → `visual-system.md` → `video-plan.md`（结构化方案契约）→ 本文。默认 `paper`、兼容字段 `styleMode: "vox-light"`；十步流程中 Step5 锁定方案，Step7 实现，Step8 音频与时序校准，Step9 静态交付检查，Step10 由人工启动、检查并渲染视频。模板命令仅供对应步骤使用，不自动执行视频渲染。
>
> 从 `色板.md` 的批准色板与语义映射创建 `src/effects/palette.ts`，导出 `palette`、`semanticColors`；从 `typography.md` 创建 `src/effects/typography.ts`，导出 `typography`，并将方案中确认且已安装的中文字体栈导出为 `fontFamily`。Scene、Effect、共用文字组件都引用这两份文件，本文不重复维护颜色或字号表。示例的角色值为 title 52、body 42、chartLabel 38；实际代码只取 token。字体与版本记录同步到方案和 scenes.json，不能只声明“规范覆盖”而保留旧默认色。

## 1. StarfieldDrift `src/effects/StarfieldDrift.tsx`（仅旧项目兼容，新项目不复制）

> 完整保留已批准旧深空项目的实现；新项目即使选择 tech-mint 也不复制或挂载本组件。

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

const STAR_COUNT = 80;
const STARS = Array.from({ length: STAR_COUNT }, (_, i) => {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  const s2 = Math.sin(i * 78.233) * 12345.6789;
  const s3 = Math.sin(i * 37.719) * 9876.543;
  return {
    x: (s - Math.floor(s)) * 100,
    y: (s2 - Math.floor(s2)) * 100,
    size: 0.8 + (s3 - Math.floor(s3)) * 2.4,
    speed: 0.3 + ((s + s2 - Math.floor(s + s2)) * 0.7),
  };
});

export const StarfieldDrift: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #1e1a40 0%, #100e28 50%, #0a0818 100%)", overflow: "hidden" }}>
      {STARS.map((s, i) => {
        const drift = (frame * s.speed * 0.4) % 110;
        const y = (s.y + drift) % 100;
        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin((frame + i * 7) * 0.05));
        const isGold = i % 11 === 0;
        return (
          <div key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${y}%`, width: s.size, height: s.size, borderRadius: "50%", background: isGold ? "#eabf5e" : "#d7e3ff", opacity: twinkle * 0.9, boxShadow: isGold ? "0 0 6px 1px rgba(234,191,94,0.9)" : "0 0 4px rgba(215,227,255,0.6)" }} />
        );
      })}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b4a7a" stopOpacity={0} />
            <stop offset="40%" stopColor="#3b4a7a" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#3b4a7a" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        {Array.from({ length: 12 }).map((_, i) => {
          const t = i / 11;
          const y = height * 0.55 + Math.pow(t, 1.8) * height * 0.45;
          return <line key={`h-${i}`} x1={0} y1={y} x2={width} y2={y} stroke={`rgba(107,136,200,${0.08 + t * 0.18})`} strokeWidth={1} />;
        })}
        {Array.from({ length: 21 }).map((_, i) => (
          <line key={`v-${i}`} x1={width / 2} y1={height * 0.55} x2={(width / 20) * i} y2={height} stroke="url(#gridFade)" strokeWidth={1} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: "50%", top: "48%", transform: "translate(-50%,-50%)", width: 620, height: 620, borderRadius: "50%", background: "radial-gradient(circle, rgba(120,80,255,0.12) 0%, rgba(80,60,200,0.06) 40%, rgba(80,60,200,0) 70%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
```

## 2. 共享 easing `src/effects/easing.ts`

```ts
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
export const easeInOutCubic = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
export const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const progressAt = (frame: number, trigger: number, duration = 20) => {
  if (frame < trigger) return 0;
  return Math.min((frame - trigger) / duration, 1);
};
export const fadeInUp = (frame: number, trigger: number, duration = 18) => {
  const e = easeOutCubic(progressAt(frame, trigger, duration));
  return { opacity: e, translateY: 24 - 24 * e };
};
```

## 3. Effect 组件骨架 `src/effects/MyEffect.tsx`

```tsx
import React from "react";
import { AbsoluteFill } from "remotion";
import { fadeInUp } from "./easing";
import { palette } from "./palette";
import { typography, fontFamily } from "./typography";

const clipTitle = (s: string, max = 16) => [...s].slice(0, max).join("");

interface MyEffectProps { frame: number; fps: number; durationInFrames: number; scene: Record<string, unknown>; }

export const MyEffect: React.FC<MyEffectProps> = ({ frame, fps, durationInFrames, scene }) => {
  const f = Math.min(frame, Math.max(0, durationInFrames - 1));
  const entrance = fadeInUp(f, 0, Math.max(1, Math.round(fps * 0.72)));
  return (
    <AbsoluteFill style={{ background: palette.bg, fontFamily }}>
      <div style={{ position: "absolute", top: 150, left: 40, width: 1000, height: 1210, opacity: entrance.opacity, transform: `translateY(${entrance.translateY}px)` }}>
        {/* 内容区从 top:150 开始（顶部留白 0–150px 为平台安全区，禁止内容元素入侵） */}
        <div style={{ fontSize: typography.title, fontWeight: 800, color: palette.ink, whiteSpace: "nowrap" }}>{clipTitle(String(scene.title ?? "标题"))}</div>
        <div style={{ marginTop: 40, fontSize: typography.body, fontWeight: 700, color: palette.ink, lineHeight: 1.5 }}>{String(scene.body ?? "正文与关键知识内容")}</div>
      </div>
    </AbsoluteFill>
  );
};
export default MyEffect;
```

## 4. Scene.tsx 完整字幕系统

```tsx
import React from "react";
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";
import { MyEffect } from "../effects/MyEffect";
import { palette } from "../effects/palette";
import { typography, fontFamily } from "../effects/typography";
const EFFECT_MAP: Record<string, React.FC<any>> = { MyEffect };

const visualLen = (s: string) => [...s].reduce((n, c) => n + (/[一-鿿　-〿＀-￯]/.test(c) ? 1 : 0.55), 0);
const displayText = (s: string) => s.trim().replace(/[\p{P}\s]+$/gu, "");
const hasContent = (s: string) => /[\p{L}\p{N}]/u.test(s);
const hanWeight = (s: string) => (s.match(/[一-鿿]/g) ?? []).length || Math.max(1, [...s].filter(c => /[\p{L}\p{N}]/u.test(c)).length);
interface SubtitleLine { text: string; startFrame: number; fadeOutStartFrame: number; endFrame: number; fadeInFrames: number; }
const FADE_IN = 10, FADE_OUT = 10, GAP = 8, MAX_VISUAL = 13;

function cutVisual(text: string): string[] {
  const result: string[] = [];
  let current = "";
  for (const c of text) {
    if (current && visualLen(current + c) > MAX_VISUAL) {
      result.push(current);
      current = "";
    }
    current += c;
  }
  if (current) result.push(current);
  return result;
}

function subtitleChunks(text: string): string[] {
  const strong = text.match(/[^。？！；…!?;]+[。？！；…!?;]*/gu) ?? [text];
  return strong.flatMap(sentence => {
    if (visualLen(sentence.trim()) <= MAX_VISUAL) return [sentence];
    const clauses = sentence.match(/[^，、,]+[，、,]*/gu) ?? [sentence];
    return clauses.flatMap(clause => cutVisual(clause.trim()));
  }).map(displayText).filter(hasContent);
}

function splitToLines(text: string, segStart: number, segEnd: number): SubtitleLine[] {
  const chunks = subtitleChunks(text);
  if (!chunks.length || segEnd <= segStart) return [];
  const span = segEnd - segStart;
  if (span < chunks.length) throw new Error("字幕区间不足：请在 Step8 调整分段或音频时长");
  const gap = chunks.length > 1 ? Math.min(GAP, Math.max(0, Math.floor((span - chunks.length) / (chunks.length - 1)))) : 0;
  const available = span - gap * (chunks.length - 1);
  const extra = available - chunks.length;
  const totalW = chunks.reduce((sum, t) => sum + hanWeight(t), 0);
  let cursor = segStart, weight = 0, allocated = 0;
  return chunks.map((text, i) => {
    weight += hanWeight(text);
    const cumulative = i === chunks.length - 1 ? extra : Math.floor(extra * weight / totalW);
    const length = 1 + cumulative - allocated;
    allocated = cumulative;
    const startFrame = cursor;
    const endFrame = startFrame + length;
    const fadeInFrames = Math.min(FADE_IN, Math.floor(length / 3));
    const fadeOutFrames = Math.min(FADE_OUT, Math.floor(length / 3));
    cursor = endFrame + gap;
    return { text, startFrame, fadeInFrames, fadeOutStartFrame: endFrame - fadeOutFrames, endFrame };
  });
}

function collectAllLines(segments: { text: string; startSec: number }[], fps: number, endFrame: number): SubtitleLine[] {
  const starts = segments.map(seg => Math.round(seg.startSec * fps));
  if (!segments.length || segments.some((seg, i) => !Number.isFinite(seg.startSec) || (i === 0 && seg.startSec !== 0) || seg.startSec < 0 || seg.startSec * fps >= endFrame || starts[i] >= endFrame || (i > 0 && (seg.startSec <= segments[i - 1].startSec || starts[i] <= starts[i - 1])))) {
    throw new Error("实测分段 startSec 必须从 0 起、严格递增且早于有声结束帧；禁止缺失、占位或帧舍入重叠");
  }
  return segments.flatMap((seg, i) => splitToLines(seg.text, starts[i], starts[i + 1] ?? endFrame));
}

function buildSceneLines(scene: any, fps: number, endFrame: number, alignmentMode?: string, timingBasis?: string): SubtitleLine[] {
  const mode = scene.alignmentMode ?? alignmentMode ?? "single-scene-proportional";
  const basis = scene.timingBasis ?? timingBasis ?? "estimated";
  if (!["single-scene-proportional", "multi-segment-measured"].includes(mode)) throw new Error("未知 alignmentMode");
  if (mode === "multi-segment-measured" && basis === "measured") {
    return collectAllLines(scene.subtitleSegments ?? [], fps, endFrame);
  }
  const fullText = scene.subtitle ?? scene.narration ?? (scene.subtitleSegments ?? []).map((seg: { text: string }) => seg.text).join("");
  return splitToLines(fullText, 0, endFrame);
}

export const Scene: React.FC<{ scene: any; sceneDurationFrames: number; styleMode?: string; alignmentMode?: string; timingBasis?: string }> = ({ scene, sceneDurationFrames, styleMode = "vox-light", alignmentMode, timingBasis }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const Effect = EFFECT_MAP[scene.effect];
  const tailFrames = Math.min(sceneDurationFrames, Math.max(0, Math.round(Number(scene.tailSec ?? 0) * fps)));
  const subtitleFrames = Math.max(0, sceneDurationFrames - tailFrames);
  const allLines = buildSceneLines(scene, fps, subtitleFrames, alignmentMode, timingBasis);
  const cur = allLines.find(l => frame >= l.startFrame && frame < l.endFrame) ?? null;
  const fadeIn = cur ? (cur.fadeInFrames > 0 ? Math.min(1, (frame - cur.startFrame) / cur.fadeInFrames) : 1) : 0;
  const fadeOut = cur ? (cur.endFrame > cur.fadeOutStartFrame ? Math.min(1, Math.max(0, (cur.endFrame - frame) / (cur.endFrame - cur.fadeOutStartFrame))) : 1) : 0;
  return (
    <AbsoluteFill style={{ background: palette.bg, fontFamily }}>
      {Effect && <Effect frame={frame} fps={fps} durationInFrames={sceneDurationFrames} scene={scene} styleMode={styleMode} />}
      <div style={{ position: "absolute", top: 1440, left: 56, right: 56, bottom: 250, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "12px 0" }}>
        {cur && <div style={{ fontSize: typography.subtitle, fontWeight: 600, color: palette.ink, textAlign: "center", lineHeight: 1.6, opacity: fadeIn * fadeOut, transform: `translateY(${(1 - fadeIn) * 10}px)` }}>{cur.text}</div>}
      </div>
    </AbsoluteFill>
  );
};
```

> 此处是新项目字幕完整实现，后文历史补丁不得替换它。alignmentMode 优先取每镜字段，再取入口传入的 audioPlan.alignmentMode，缺省为 single-scene-proportional；timingBasis 同样每镜优先，缺省为 estimated。single 模式保留字幕全文并按汉字数分配（无汉字时以字母/数字兜底），不因计划 subtitleSegments 数量切换模式。multi-segment-measured 仅在 timingBasis=measured 时读取真实 startSec；未实测时，无论多少 estimatedStartSec 片段，均按全文比例预览。实测分段必须从 0 起、秒数与舍入帧均严格递增且早于有声结束，不静默裁掉晚分段。长句按强标点、逗号/顿号、13 视觉字符三级切割，过滤纯标点，显示去尾标点。所有区间收在 segEnd 内，短区间缩短淡入淡出与间隙而非缩字号；极短区间仍须 Step8 校准并在 Step10 人工确认可读。tailSec 不参与字幕分配，当前镜帧数由入口传入，不能取全 Composition 时长。

## 5. Composition 入口 `src/<Name>/index.tsx`

```tsx
import React from "react";
import { AbsoluteFill, Sequence, Audio, useVideoConfig, staticFile } from "remotion";
import { palette } from "../effects/palette";
import { Scene } from "./Scene";
import scenesData from "../../public/scenes/<slug>/scenes.json";

const SCENES = scenesData.scenes;
const STYLE_MODE = scenesData.styleMode ?? "vox-light";

export const MyComposition: React.FC = () => {
  const { fps } = useVideoConfig();
  let offsetFrames = 0;
  const sequences = SCENES.map((scene) => {
    const from = offsetFrames;
    const sceneDurationFrames = Math.max(1, Math.round(scene.durationSec * fps));
    offsetFrames += sceneDurationFrames;
    return (
      <Sequence key={scene.id} from={from} durationInFrames={sceneDurationFrames}>
        <Scene scene={scene} sceneDurationFrames={sceneDurationFrames} styleMode={STYLE_MODE} alignmentMode={scenesData.audioPlan?.alignmentMode} timingBasis={scenesData.timingBasis ?? scenesData.audioPlan?.timingBasis} />
        <Audio src={staticFile(scene.audio ?? `scenes/<slug>/audio/${scene.id}.mp3`)} volume={1} />
      </Sequence>
    );
  });
  return (
    <AbsoluteFill style={{ background: palette.bg }}>
      {sequences}
    </AbsoluteFill>
  );
};
```

> 注册 Composition 时，durationInFrames 同样使用各镜 `Math.max(1, Math.round(durationSec * fps))` 的整数帧总和，不能对全片秒数只做一次四舍五入。最终渐隐按 §18 叠加 palette.bg 遮罩，不额外添加转场。

## 6. scenes.json 示例

```json
{
  "slug": "my-video",
  "schemaVersion": "1.0",
  "planVersion": 1,
  "reviewedVersion": 1,
  "timingBasis": "measured",
  "audioPlan": { "alignmentMode": "single-scene-proportional", "timingBasis": "measured" },
  "styleMode": "vox-light",
  "paletteName": "paper",
  "palette": {
    "bg": "#F3EDE2",
    "surface": "#FBF8F2",
    "ink": "#1B1A17",
    "sub": "#6B655B",
    "accent": "#C8402F",
    "accent2": "#2F5D62"
  },
  "visualTheme": {
    "paletteName": "paper",
    "paletteHex": ["#F3EDE2", "#FBF8F2", "#1B1A17", "#6B655B", "#C8402F", "#2F5D62"],
    "source": "色板.md"
  },
  "typography": {
    "version": "ep5-v2-fixed",
    "source": "typography.md",
    "emphasisOffset": 8,
    "fontFamily": "PingFang SC, sans-serif"
  },
  "scenes": [
    {
      "id": "S01",
      "title": "场景标题（人读，不渲染）",
      "subtitle": "原因经过机制，才会产生结果。",
      "narration": "原因经过机制，才会产生结果。",
      "alignmentMode": "single-scene-proportional",
      "timingBasis": "measured",
      "subtitleSegments": [
        { "text": "原因经过机制，", "estimatedStartSec": 0 },
        { "text": "才会产生结果。", "estimatedStartSec": 5.0 }
      ],
      "durationSec": 12.5,
      "audio": "scenes/my-video/audio/S01.mp3",
      "shot_type": "effect",
      "shotLang": "I1",
      "visualGrammar": "因果示意图",
      "motionPlan": {
        "knowledgeGoal": "本镜观众应理解的内容",
        "knowledgeRelation": "cause_effect",
        "primaryPattern": "CAUSE_EFFECT",
        "secondaryPattern": null,
        "camera": "hold",
        "intensity": "low",
        "continuityFrom": null,
        "allowedMotion": ["reveal-link"],
        "forbiddenMotion": ["random-spin"]
      },
      "effect": "MyEffect"
    },
    {
      "id": "S02",
      "title": "多段场景",
      "subtitle": "第一句话。第二句话解释机制。",
      "narration": "第一句话。第二句话解释机制。",
      "alignmentMode": "multi-segment-measured",
      "timingBasis": "measured",
      "shot_type": "infographic",
      "shotLang": "H1",
      "visualGrammar": "机制信息图",
      "asset": "scenes/my-video/shots/S02.png",
      "subtitleSegments": [
        { "text": "第一句话。", "startSec": 0 },
        { "text": "第二句话解释机制。", "startSec": 5.2 }
      ],
      "durationSec": 15.0,
      "audio": "scenes/my-video/audio/S02.mp3",
      "effect": "ImageShot"
    }
  ]
}
```

> 此示例是 Step8 后的生产 scenes.json 字段摘录，不是完整 制作过程/视频制作方案.json，也不代表人工已批准示例。planVersion / reviewedVersion 必须从实际批准方案复制，不能自动写成 1；palette 六键与 typography.version 对齐 `video-plan.md`。生产导出还须从同版方案完整复制 typography.tokens（由 typography.md 生成）、文字角色、知识映射和全部表达字段，不能把本文简化摘录当作另一个字号表。保留 visualTheme.paletteHex 仅为旧管线兼容，并从 palette 六键派生；fontFamily 是已确认字体栈记录。S01 展示单段音频保留多项计划片段但不读取 estimatedStartSec 的正确格式；S02 的 startSec 是实测格式示例，初建方案使用 estimatedStartSec，未实测时不能生成全零 startSec 多段数组。
> `styleMode`（顶层，全片统一）定义整体叙事/视觉范式；`visualTheme` 与每镜 `motionPlan` 是新增元数据，旧渲染代码尚未读取时也可先作为分镜契约保存。
> `styleMode`（顶层，全片统一）：`vox-light`（默认） | `tech-mint` | `kurzgesagt` | `vox` | `doodle-note`
> `shot_type`（每镜）：`effect` | `infographic` | `chart` | `process` | `flat` | `atmosphere` | `doodle`
> `asset`：外部生图/信息图产物（PNG）路径，`shot_type` 非 `effect` 时用 `ImageShot` 组件（objectFit: contain）承载

## 7. scripts/tts.mjs（历史逐次 CLI 模板，新项目禁止复制）

> 新项目默认复制实际 §10 的 scripts/tts.mjs 批处理入口，调用安装根 chattts/chattts_batch.py；§11 是历史 Python 批处理脚本示意，不是 JS 入口，不覆盖当前安装脚本。下方 CLI 与旧用户名路径只保留供旧项目兼容。

```js
import { execFileSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SLUG = "my-video"; // ← 改这里
const SCENES_PATH = resolve(__dirname, `../public/scenes/${SLUG}/scenes.json`);
const AUDIO_DIR = resolve(__dirname, `../public/scenes/${SLUG}/audio`);

// ── TTS Engine Config ──
// Set TTS_ENGINE="chattts" or "edge" (default: "chattts")
const TTS_ENGINE = process.env.TTS_ENGINE ?? "chattts";
const VOICE = "zh-CN-YunxiNeural";
const RATE = "+0%";
const CHATTTS_CLI = "/Users/sunzhenchao/ChatTTS/chattts_cli.py";
const CHATTTS_STYLE = process.env.CHATTTS_STYLE ?? "gentle_female";
const CHATTTS_PYTHON = process.env.CHATTTS_PYTHON ?? "arch -arm64 python3";
// ChatTTS per-scene generation is slow (~8s audio per 50s), so use longer timeout
const CHATTTS_TIMEOUT = 180_000;

if (!existsSync(AUDIO_DIR)) mkdirSync(AUDIO_DIR, { recursive: true });
const data = JSON.parse(readFileSync(SCENES_PATH, "utf8"));

const ttsEdge = (text, out) => execFileSync("python3", ["-m", "edge_tts", "--voice", VOICE, "--rate", RATE, "--text", text, "--write-media", out], { timeout: 30000 });

const ttsChatTTS = (text, out) => {
  const pyArgs = CHATTTS_PYTHON.split(" ");
  const cliArgs = [CHATTTS_CLI, "--text", text, "--output", out, "--style", CHATTTS_STYLE, "--skip-refine", "--json-output"];
  const raw = execFileSync(pyArgs[0], [...pyArgs.slice(1), ...cliArgs], { timeout: CHATTTS_TIMEOUT, encoding: "utf8" });
  try {
    const res = JSON.parse(raw.trim());
    return res;
  } catch {
    return { output: out, duration: 0 };
  }
};

const tts = TTS_ENGINE === "chattts" ? ttsChatTTS : ttsEdge;
const FFPROBE = "/opt/homebrew/bin/ffprobe";
const dur = (f) => Number(execFileSync(FFPROBE, ["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1", f], { encoding: "utf8" }).trim());
const concat = (files, out) => execFileSync("ffmpeg", ["-y", "-i", `concat:${files.join("|")}`, "-acodec", "copy", out], { timeout: 10000 });

for (const scene of data.scenes) {
  const segs = scene.subtitleSegments;
  if (segs && segs.length > 1) {
    const parts = segs.map((s, i) => { const f = resolve(AUDIO_DIR, `${scene.id}_p${i}.mp3`); tts(s.text, f); return f; });
    const final = resolve(AUDIO_DIR, `${scene.id}.mp3`);
    concat(parts, final);
    let offset = 0;
    parts.forEach((f, i) => { segs[i].startSec = Number(offset.toFixed(2)); offset += dur(f); });
    console.log(`${scene.id}: ${dur(final).toFixed(2)}s (${segs.length} parts)`);
  } else {
    const out = resolve(AUDIO_DIR, `${scene.id}.mp3`);
    tts(scene.narration ?? scene.subtitle ?? "", out);
    console.log(`${scene.id}: ${dur(out).toFixed(2)}s`);
  }
}
writeFileSync(SCENES_PATH, JSON.stringify(data, null, 2), "utf8");
console.log(`TTS done (engine: ${TTS_ENGINE}). startSec updated.`);
```

## 8. scripts/sync-durations.mjs

```js
import { execFileSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SLUG = "my-video"; // ← 改这里
const SCENES_PATH = resolve(__dirname, `../public/scenes/${SLUG}/scenes.json`);
const AUDIO_DIR = resolve(__dirname, `../public/scenes/${SLUG}/audio`);
const PAD = Number(process.env.PAD ?? 0);

const data = JSON.parse(readFileSync(SCENES_PATH, "utf8"));
const FFPROBE = "/opt/homebrew/bin/ffprobe";
const dur = (f) => Number(execFileSync(FFPROBE, ["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1", f], { encoding: "utf8" }).trim());

let total = 0;
for (const scene of data.scenes) {
  try {
    const a = dur(resolve(AUDIO_DIR, `${scene.id}.mp3`));
    scene.durationSec = Number((a + PAD + Number(scene.tailSec ?? 0)).toFixed(2));
    total += scene.durationSec;
    console.log(`${scene.id}: ${a.toFixed(2)}s → ${scene.durationSec}s`);
  } catch { console.warn(`${scene.id}: no audio, keeping ${scene.durationSec}s`); total += scene.durationSec; }
}
writeFileSync(SCENES_PATH, JSON.stringify(data, null, 2), "utf8");
console.log(`\nTotal: ${total.toFixed(2)}s (${data.scenes.reduce((sum, scene) => sum + Math.max(1, Math.round(scene.durationSec * 25)), 0)} frames at 25fps)`);
```

## 9. scripts/render-cover.mjs

> 脚本位于 `<project>/<project>-video/scripts/`；从脚本目录向上两级定位项目根，封面读写统一指向项目根 `发布素材/`，不依赖运行时工作目录。第 9 步先只交付 SVG；封面 Review 明确确认当前文件并核对内容 SHA-256 后，才运行 `node scripts/render-cover.mjs --approved v1`（或 `v2` / `v1,v2`）。无参数不生成 PNG，参数仅防误执行，不是审批证明；确认流程见 `production-workflow.md`。

```js
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const args = process.argv.slice(2);
const approved = args.length === 2 && args[0] === "--approved" ? args[1].split(",") : [];
if (approved.length === 0 || approved.some(v => !["v1", "v2"].includes(v)) || new Set(approved).size !== approved.length) {
  console.error("先交付 SVG 并等待封面 Review；确认当前文件后用 --approved v1、v2 或 v1,v2 转换 PNG。");
  process.exit(1);
}

const { Resvg } = await import("@resvg/resvg-js");
const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLISH_DIR = resolve(__dirname, "../../发布素材");

const jobs = approved.map(v => ({ src: `封面${v}.svg`, out: `封面${v}.png`, width: 1080 }));

for (const j of jobs) {
  const resvg = new Resvg(readFileSync(resolve(PUBLISH_DIR, j.src), "utf8"), {
    fitTo: { mode: "width", value: j.width },
    font: { loadSystemFonts: true, defaultFontFamily: "PingFang SC" },
  });
  writeFileSync(resolve(PUBLISH_DIR, j.out), resvg.render().asPng());
  console.log(`Rendered ${j.src} → ${j.out}`);
}
```

## 10. `scripts/tts.mjs`（ChatTTS 批处理版，新项目默认）

> 批处理分支同样按每镜 alignmentMode（回退 audioPlan.alignmentMode）选择，不能按计划片段数量决定生成方式。Step8 完成最终音频测量、durationSec/startSec 回写并核对后，必须将对应每镜 timingBasis 标为 measured；未测量保持 estimated，仅可比例预览。单段生成读取完整 narration，不删计划 subtitleSegments；multi 模式按分段 narration（回退 text）生成。
> 核心改进：所有 scene 的 TTS 任务收集后**一次性**传给 `chattts_batch.py`，模型只加载一次，避免超时。
> 新项目必须设置 VERTICAL_VIDEO_SKILL_ROOT 为当前实际安装的 `<skill-root>` 绝对路径，不复制用户名或假定 .claude/.codeflicker 目录。批处理脚本与 config.json 从该根目录解析；CHATTTS_CONFIG、CHATTTS_BATCH、CHATTTS_ROOT 可显式覆盖对应实际路径。配置中的 chatts_root 必须是本机真实 ChatTTS 安装目录。§7、§11 的旧 /Users/sunzhenchao 路径仅历史示例，迁移时逐一替换为上述实际根目录或环境变量，不能原样用于新项目。

```js
import { execFileSync, spawnSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SLUG = "my-video"; // ← 改这里
const SCENES_PATH = resolve(__dirname, `../public/scenes/${SLUG}/scenes.json`);
const AUDIO_DIR = resolve(__dirname, `../public/scenes/${SLUG}/audio`);

const TTS_ENGINE = process.env.TTS_ENGINE ?? "chattts";
const VOICE = "zh-CN-YunxiNeural";
const RATE = "+0%";
const SKILL_ROOT = process.env.VERTICAL_VIDEO_SKILL_ROOT;
if (!SKILL_ROOT) throw new Error("请设置 VERTICAL_VIDEO_SKILL_ROOT 为实际 <skill-root> 绝对路径");
const CHATTTS_BATCH = process.env.CHATTTS_BATCH ?? resolve(SKILL_ROOT, "chattts/chattts_batch.py");
const CHATTTS_STYLE = process.env.CHATTTS_STYLE ?? "gentle_female";
const CHATTTS_PYTHON = process.env.CHATTTS_PYTHON ?? "arch -arm64 python3";
const CHATTTS_CONFIG = process.env.CHATTTS_CONFIG ?? resolve(SKILL_ROOT, "chattts/config.json");
const PYTHONPATH = process.env.CHATTTS_ROOT ?? JSON.parse(readFileSync(CHATTTS_CONFIG, "utf8")).chatts_root;

if (!existsSync(AUDIO_DIR)) mkdirSync(AUDIO_DIR, { recursive: true });
const data = JSON.parse(readFileSync(SCENES_PATH, "utf8"));

const dur = (f) => Number(execFileSync("/opt/homebrew/bin/ffprobe", ["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",f],{encoding:"utf8"}).trim());
const concat = (files, out) => execFileSync("ffmpeg",["-y","-i",`concat:${files.join("|")}`,"-acodec","copy",out],{timeout:10000});
const ttsEdge = (text, out) => execFileSync("python3",["-m","edge_tts","--voice",VOICE,"--rate",RATE,"--text",text,"--write-media",out],{timeout:30000});

function runChatTTSBatch(jobs) {
  const jobsFile = resolve(tmpdir(), `chattts_jobs_${Date.now()}.json`);
  writeFileSync(jobsFile, JSON.stringify(jobs));
  const pyArgs = CHATTTS_PYTHON.split(" ");
  console.log(`[chattts-batch] 启动 Python，共 ${jobs.length} 条任务...`);
  const result = spawnSync(pyArgs[0],[...pyArgs.slice(1), CHATTTS_BATCH,"--jobs",jobsFile],
    { encoding:"utf8", timeout:1200_000, env:{ ...process.env, PYTHONPATH } });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.error) throw result.error;
  return jobsFile + ".result.json";
}

if (TTS_ENGINE === "chattts") {
  const jobs = [];
  for (const scene of data.scenes) {
    const style = scene.ttsStyle ?? CHATTTS_STYLE;
    const segs = scene.subtitleSegments;
    if ((scene.alignmentMode ?? data.audioPlan?.alignmentMode) === "multi-segment-measured" && !segs?.length) throw new Error(`${scene.id}: 缺少分段朗读稿`);
    if ((scene.alignmentMode ?? data.audioPlan?.alignmentMode ?? "single-scene-proportional") === "multi-segment-measured") {
      segs.forEach((s, i) => jobs.push({ text: s.narration ?? s.text, output: resolve(AUDIO_DIR, `${scene.id}_p${i}.mp3`), style }));
    } else {
      jobs.push({ text: scene.narration ?? scene.subtitle ?? "", output: resolve(AUDIO_DIR, `${scene.id}.mp3`), style });
    }
  }
  runChatTTSBatch(jobs);
  for (const scene of data.scenes) {
    const segs = scene.subtitleSegments;
    if ((scene.alignmentMode ?? data.audioPlan?.alignmentMode) === "multi-segment-measured" && !segs?.length) throw new Error(`${scene.id}: 缺少分段朗读稿`);
    if ((scene.alignmentMode ?? data.audioPlan?.alignmentMode ?? "single-scene-proportional") === "multi-segment-measured") {
      const parts = segs.map((_, i) => resolve(AUDIO_DIR, `${scene.id}_p${i}.mp3`));
      const final = resolve(AUDIO_DIR, `${scene.id}.mp3`);
      concat(parts, final);
      let offset = 0;
      parts.forEach((f, i) => { segs[i].startSec = Number(offset.toFixed(2)); offset += dur(f); });
      console.log(`${scene.id} [${scene.ttsStyle}]: ${dur(final).toFixed(2)}s`);
    } else {
      console.log(`${scene.id} [${scene.ttsStyle}]: ${dur(resolve(AUDIO_DIR,`${scene.id}.mp3`)).toFixed(2)}s`);
    }
  }
} else {
  for (const scene of data.scenes) {
    const segs = scene.subtitleSegments;
    if ((scene.alignmentMode ?? data.audioPlan?.alignmentMode) === "multi-segment-measured" && !segs?.length) throw new Error(`${scene.id}: 缺少分段朗读稿`);
    if ((scene.alignmentMode ?? data.audioPlan?.alignmentMode ?? "single-scene-proportional") === "multi-segment-measured") {
      const parts = segs.map((s,i)=>{const f=resolve(AUDIO_DIR,`${scene.id}_p${i}.mp3`);ttsEdge(s.narration ?? s.text,f);return f;});
      const final = resolve(AUDIO_DIR,`${scene.id}.mp3`);
      concat(parts,final);
      let offset=0;
      parts.forEach((f,i)=>{segs[i].startSec=Number(offset.toFixed(2));offset+=dur(f);});
      console.log(`${scene.id}: ${dur(final).toFixed(2)}s`);
    } else {
      const out=resolve(AUDIO_DIR,`${scene.id}.mp3`);
      ttsEdge(scene.narration??scene.subtitle??"",out);
      console.log(`${scene.id}: ${dur(out).toFixed(2)}s`);
    }
  }
}
writeFileSync(SCENES_PATH, JSON.stringify(data,null,2),"utf8");
console.log(`\nTTS done (engine: ${TTS_ENGINE}).`);
```

## 11. `/Users/sunzhenchao/ChatTTS/chattts_batch.py`（一次性批处理脚本）

> 放在 ChatTTS 根目录，由 `tts.mjs` 调用。接受 JSON 任务列表，模型加载一次，逐条生成。

```python
#!/usr/bin/env python3
import os, sys, json, argparse
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
CHATTS_ROOT = os.path.dirname(os.path.abspath(__file__))
SPEAKERS_DIR = os.path.join(CHATTS_ROOT, "speakers")
sys.path.insert(0, CHATTS_ROOT)
os.chdir(CHATTS_ROOT)
import ChatTTS
from tools.audio import pcm_arr_to_mp3_view

STYLE_PRESETS = {
    "calm_male":            {"speaker_file":"1_calm_male_v2.txt",           "temperature":0.1,"top_P":0.3,"top_K":5, "repetition_penalty":1.1},
    "energetic_male":       {"speaker_file":"2_energetic_male_v2.txt",      "temperature":0.5,"top_P":0.7,"top_K":20,"repetition_penalty":1.05},
    "gentle_female":        {"speaker_file":"3_gentle_female_v2.txt",       "temperature":0.3,"top_P":0.5,"top_K":10,"repetition_penalty":1.05},
    "gentle_male":          {"speaker_file":"3_gentle_male_v2.txt",         "temperature":0.3,"top_P":0.5,"top_K":10,"repetition_penalty":1.05},
    "deep_voice":           {"speaker_file":"4_deep_voice_v2.txt",          "temperature":0.1,"top_P":0.3,"top_K":5, "repetition_penalty":1.3},
    "deep_male":            {"speaker_file":"4_deep_male_v2.txt",           "temperature":0.1,"top_P":0.3,"top_K":5, "repetition_penalty":1.3},
    "natural_conversational":{"speaker_file":"5_natural_conversational_v2.txt","temperature":0.3,"top_P":0.5,"top_K":10,"repetition_penalty":1.05},
}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--jobs", required=True)
    args = parser.parse_args()
    with open(args.jobs) as f: jobs = json.load(f)
    print(f"[batch] Loading ChatTTS model...", flush=True)
    chat = ChatTTS.Chat()
    chat.load(source="local", compile=False)
    print(f"[batch] Model loaded. Processing {len(jobs)} jobs.", flush=True)
    results = []
    for i, job in enumerate(jobs):
        preset = STYLE_PRESETS.get(job.get("style","gentle_female"), STYLE_PRESETS["gentle_female"])
        with open(os.path.join(SPEAKERS_DIR, preset["speaker_file"])) as f: spk_emb = f.read().strip()
        try:
            wavs = chat.infer([job["text"]], skip_refine_text=True,
                params_infer_code=ChatTTS.Chat.InferCodeParams(spk_emb=spk_emb,
                    temperature=preset["temperature"],top_P=preset["top_P"],top_K=preset["top_K"],
                    repetition_penalty=preset["repetition_penalty"]))
            os.makedirs(os.path.dirname(job["output"]), exist_ok=True)
            with open(job["output"],"wb") as f: f.write(pcm_arr_to_mp3_view(wavs[0]))
            print(json.dumps({"i":i,"output":job["output"],"style":job.get("style"),"ok":True}),flush=True)
            results.append({"i":i,"ok":True})
        except Exception as e:
            print(json.dumps({"i":i,"error":str(e)}),flush=True)
            results.append({"i":i,"ok":False})
    print(f"[batch] Done. {sum(r['ok'] for r in results)}/{len(results)} succeeded.",flush=True)

if __name__ == "__main__": main()
```

## 12. ImageShot `src/effects/ImageShot.tsx`（承载外部生图/信息图产物）

> `shot_type` 为 `infographic`/`chart`/`process`/`flat`/`atmosphere` 时，用它把 designai-* 产出的 PNG 落到画面上。**objectFit 用 contain，禁止 cover**（否则裁切数据）。首帧淡入 + 极缓 Ken Burns 推拉，避免呆板。

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame, staticFile, Img } from "remotion";
import { easeOutCubic, progressAt } from "./easing";

interface ImageShotProps { frame?: number; scene: Record<string, any>; }

export const ImageShot: React.FC<ImageShotProps> = ({ frame, scene }) => {
  const localFrame = useCurrentFrame();
  const f = frame ?? localFrame;
  const p = easeOutCubic(progressAt(f, 0, 18));
  const scale = 1.0 + Math.min(f, 300) * 0.00035;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Img
        src={staticFile(scene.asset)}
        style={{
          position: "absolute", top: 120, left: 40, width: 1000, height: 1240,
          objectFit: "contain", opacity: p, transform: `scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
};
export default ImageShot;
```

## 13. Kurzgesagt 模式模板 `src/effects/S<id>-KurzOneConcept.tsx`

> 扁平矢量、纯色块、**一镜一概念**。无渐变/无阴影/无发光/无装饰粒子。示例使用轻回弹，实际动作服从 motionPlan；颜色统一取批准 palette，可浅可深，不另设高饱和深底色板。

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeOutBack, progressAt } from "./easing";
import { palette } from "./palette";
import { typography, fontFamily } from "./typography";
const clip = (s: string, m = 16) => (s.length > m ? s.slice(0, m) : s);

export const KurzOneConcept: React.FC<{ frame?: number; scene: any }> = ({ frame, scene }) => {
  const localFrame = useCurrentFrame();
  const f = frame ?? localFrame;
  const inP = easeOutBack(progressAt(f, 8, 22));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {/* 唯一核心图形：纯色圆/方块 + 拟物化图标，不堆叠 */}
      <div style={{ width: 460, height: 460, borderRadius: "50%", background: palette.surface, transform: `scale(${inP})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 200, lineHeight: 1, color: palette.accent2 }}>▲</span>
      </div>
      <div style={{ marginTop: 80, fontSize: typography.title, fontWeight: 800, fontFamily, color: palette.ink, whiteSpace: "nowrap", opacity: progressAt(f, 20, 16) }}>
        {clip(scene.title ?? "一个概念")}
      </div>
    </AbsoluteFill>
  );
};
export default KurzOneConcept;
```

## 14. Vox 模式模板 `src/effects/S<id>-VoxChart.tsx`

> 图表即主体，口播驱动逐帧点亮。标注、箭头与圈重点取统一语义色；默认 paper 暖浅底，深底仅在批准主题覆盖后使用。**图表用代码精绘，禁止生图模型画**（数字会糊）。

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { progressAt } from "./easing";
import { palette, semanticColors } from "./palette";
import { typography, fontFamily } from "./typography";
const clip = (s: string, m = 16) => (s.length > m ? s.slice(0, m) : s);

export const VoxChart: React.FC<{ frame?: number; scene: any }> = ({ frame, scene }) => {
  const localFrame = useCurrentFrame();
  const f = frame ?? localFrame;
  const pts = (scene.points ?? [20, 35, 30, 55, 48, 80, 72]) as number[];
  const draw = progressAt(f, 15, 40);
  const W = 900, H = 560, x0 = 90, y0 = 1160;
  const stepX = W / (pts.length - 1);
  const maxV = Math.max(...pts);
  const coord = (v: number, i: number) => ({ x: x0 + i * stepX, y: y0 - (v / maxV) * H });
  const shown = Math.ceil(pts.length * draw);
  const path = pts.slice(0, Math.max(2, shown)).map((v, i) => { const c = coord(v, i); return `${i === 0 ? "M" : "L"}${c.x},${c.y}`; }).join(" ");
  const last = coord(pts[Math.max(0, shown - 1)], Math.max(0, shown - 1));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 150, left: 90, fontSize: typography.title, fontWeight: 800, fontFamily, color: palette.ink, whiteSpace: "nowrap" }}>
        {clip(scene.title ?? "标题")}
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={x0} y1={y0} x2={x0 + W} y2={y0} stroke={semanticColors.border} strokeWidth={2} />
        <line x1={x0} y1={y0} x2={x0} y2={y0 - H} stroke={semanticColors.border} strokeWidth={2} />
        <path d={path} fill="none" stroke={semanticColors.chartPrimary} strokeWidth={8} strokeLinecap="round" />
        {shown >= pts.length && (
          <>
            <circle cx={last.x} cy={last.y} r={26} fill="none" stroke={palette.accent2} strokeWidth={6} opacity={progressAt(f, 58, 12)} />
            <text x={last.x - 40} y={last.y - 44} fill={palette.ink} fontFamily={fontFamily} fontSize={typography.chartLabel} fontWeight={700} opacity={progressAt(f, 62, 12)}>看这里</text>
          </>
        )}
      </svg>
    </AbsoluteFill>
  );
};
export default VoxChart;
```

> **EFFECT_MAP 注册**：在 Scene.tsx 顶部把 `ImageShot`、`KurzOneConcept`、`VoxChart` 及各 `{sceneId}-{Effect}` 加入 `EFFECT_MAP`。`shot_type != "effect"` 的 scene，`effect` 字段填 `"ImageShot"` 并配 `asset` 路径。

## 15A. `remotion.config.ts`（新项目强制复用全局 Chrome）

> Chrome Headless Shell 统一安装一次到 `~/.remotion/chrome-headless-shell/`。所有后续新项目通过 `Config.setBrowserExecutable()` 指向全局可执行文件，避免每个项目在 `node_modules/.remotion` 重复下载约 175MB。已有项目不主动修改。

```ts
import { homedir } from "node:os";
import { join } from "node:path";
import { Config } from "@remotion/cli/config";

const GLOBAL_CHROME = join(
  homedir(),
  ".remotion",
  "chrome-headless-shell",
  "mac-arm64",
  "chrome-headless-shell-mac-arm64",
  "chrome-headless-shell"
);

Config.setBrowserExecutable(GLOBAL_CHROME);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCodec("h264");
```

**创建项目后的机械检查**：

```bash
test -x "$HOME/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell" \
  && "$HOME/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell" --version
```

> 当前目录结构针对 Apple Silicon（mac-arm64）。如果平台变化，按 `process.platform` / `process.arch` 维护对应的全局子目录；不要退回项目级重复下载。

## 15. package.json（项目根，`<Name>` 替换为 Composition 名）

> `start` 与 `dev` 都指向 `remotion studio`：`start` 可用 `npm start` 直接跑，`dev` 兼容多数前端项目 `npm run dev` 的肌肉记忆，二者等价。

```json
{
  "name": "<slug>-video",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "remotion studio",
    "dev": "remotion studio",
    "render": "remotion render <Name> out/<slug>.mp4",
    "tts": "node scripts/tts.mjs",
    "sync": "node scripts/sync-durations.mjs",
    "cover": "node scripts/render-cover.mjs"
  },
  "dependencies": {
    "@remotion/cli": "4.0.290",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "remotion": "4.0.290"
  },
  "devDependencies": {
    "@resvg/resvg-js": "^2.6.2",
    "@types/react": "19.0.0",
    "typescript": "^5.5.4"
  }
}
```

## 16. `制作过程/临时文件/文稿统计.mjs`（文稿压缩比统计 · Step5 强制执行）

> 计算原始素材 → 讲解稿的压缩比、语速、每镜语速极差，并给出健康区间判定。
> **Step5 必跑**，结果写入 `制作过程/视频方案审阅稿.md`；禁止手工口算总时长与字数。
> 第 5 步将本模板保存为 `<project>/制作过程/临时文件/文稿统计.mjs`，项目级统计输入同目录保留；不提前建立生产脚本。现有 `script-stats.mjs` 如确实存在，可核对接口后复用。系统 `tmpdir()` 等 OS 临时机制不属于需保留的制作记录，保持原机制。
> 下列 `<project>` 与 `<video-project>` 须替换为实际绝对路径；`--raw` 不相对于方案目录解析。Step5 必须按 `draft-review-workflow.md` 导出兼容的有声 `durationSec`，不能直接读取方案的 estimatedDurationSec。
>
> ```bash
> node "<project>/制作过程/临时文件/文稿统计.mjs" --raw "<project>/制作过程/原始知识材料.md" --scenes "<project>/制作过程/临时文件/<slug>-方案v<V>-统计输入.json"
>
> node "<project>/制作过程/临时文件/文稿统计.mjs" --raw "<project>/制作过程/原始知识材料.md" --scenes "<video-project>/public/scenes/<slug>/scenes.json"
> ```

```js
#!/usr/bin/env node
import { readFileSync } from "fs";

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const RAW = arg("--raw");
const SCENES = arg("--scenes");
const NARR = arg("--narration");
if (!RAW || (!SCENES && !NARR)) {
  console.error("用法: --raw <项目根绝对路径/制作过程/原始知识材料.md> (--scenes <scenes.json> | --narration <narration.txt>)");
  process.exit(1);
}

const cn = (s) => (s.match(/[\u4e00-\u9fff]/g) ?? []).length;
const eff = (s) => s.replace(/\s/g, "").length;

// ── 原始文稿：剔除 markdown 标记与引用行 ──
let raw = readFileSync(RAW, "utf8")
  .replace(/^>.*$/gm, "")          // 引用行（说明性文字）
  .replace(/^#{1,6}\s.*$/gm, "")   // 标题行
  .replace(/^\|.*$/gm, "")         // 表格
  .replace(/```[\s\S]*?```/g, "")  // 代码块
  .replace(/\*\*/g, "")
  .replace(/——/g, "");

// ── 讲解文稿 ──
let scenes = null, narr = "";
if (SCENES) {
  scenes = JSON.parse(readFileSync(SCENES, "utf8")).scenes;
  narr = scenes.map((s) => s.narration ?? s.subtitle ?? "").join("");
} else {
  narr = readFileSync(NARR, "utf8");
}

const R = cn(raw), N = cn(narr);
const ratio = (N / R) * 100;

// 压缩比只报读数，不设阈值门禁（内容完整性优先，见 SKILL.md）
const ratioVerdict =
  ratio > 100 ? "口播扩写（讲解稿比原文长：逐条展开+过渡镜，确认无注水复述）"
  : ratio > 75 ? "改编幅度小（书面语可能残留，按 6 类扫一遍句式）"
  : ratio >= 45 ? "常规改编幅度"
  : "改编幅度大（务必逐条核对核心论点保留清单）";

console.log("## 文稿压缩比统计\n");
console.log("| | 汉字数 | 有效字符（含标点） |");
console.log("|---|---|---|");
console.log(`| 原始文稿 | ${R} | ${eff(raw)} |`);
console.log(`| 讲解文稿 | ${N} | ${eff(narr)} |`);
console.log(`\n- **压缩比：${ratio.toFixed(1)}%**（仅读数，不作门禁）→ ${ratioVerdict}`);
console.log(`- **${R - N >= 0 ? "精简" : "净增"} ${Math.abs(R - N)} 字（${Math.abs(100 - ratio).toFixed(1)}%）**`);

if (scenes) {
  const rows = scenes.map((s) => {
    const c = cn(s.narration ?? "");
    const d = Number(s.durationSec ?? 0);
    return { id: s.id, title: s.title ?? "", c, d, sp: d > 0 ? c / d : 0 };
  });
  const total = rows.reduce((a, r) => a + r.d, 0);
  const speed = N / total;
  const sps = rows.filter((r) => r.d > 0).map((r) => r.sp);
  const spread = Math.max(...sps) - Math.min(...sps);

  const speedVerdict =
    speed < 3.0 ? "⚠️ 拖沓，考虑拆句或合镜"
    : speed <= 4.5 ? "✅ 健康"
    : speed <= 5.8 ? "⚠️ 偏快，长镜需拆句"
    : "❌ 超过 350 字/分门禁，必须放慢（拆句，不是删论点）";
  const alignPath =
    spread <= 1.0
      ? "✅ 均匀 → 单段 TTS + 字幕按字数比例分配"
      : "⚠️ 不均 → 必须多段 TTS + startSec 回写";

  console.log("\n### 语速核对\n");
  console.log("| 项目 | 值 | 判定 |");
  console.log("|---|---|---|");
  console.log(`| 总时长 | ${total.toFixed(1)}s | — |`);
  console.log(`| 全片语速 | ${speed.toFixed(2)} 字/秒（${Math.round(speed * 60)} 字/分） | ${speedVerdict} |`);
  console.log(`| 每镜语速极差 | ${spread.toFixed(1)} 字/秒 | ${alignPath} |`);

  console.log("\n<details><summary>逐镜明细</summary>\n");
  console.log("| # | 汉字 | 时长 | 字/秒 | 场景 |");
  console.log("|---|---|---|---|---|");
  rows.forEach((r) => console.log(`| ${r.id} | ${r.c} | ${r.d.toFixed(1)}s | ${r.sp.toFixed(1)} | ${r.title} |`));
  console.log("\n</details>");
}

console.log("\n> 精简内容 6 类归纳、核心论点保留清单、衔接连贯性检查表需人工填写，见 SKILL.md");
```

> 统计工具保存在项目根 `制作过程/临时文件/文稿统计.mjs`，按上方绝对路径命令调用；第 5 步不为统计新增生产工程 package.json 或脚本。

## 17. Outro 收束 `src/effects/S{last}-OutroRecap.tsx`（Step5 规划 / Step7 实现 / Step8 校准）

> 片尾三步回顾 + 金句 + 出处行。**时间轴必须收在音频帧内**，静场（`tailSec`）只留给呼吸和渐隐。
> 呼吸公式 `1 + 0.012 * Math.sin(f * 0.09)`，防静场段完全冻结。

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { palette } from "./palette";
import { typography, fontFamily } from "./typography";
import { easeOutBack, easeOutCubic, progressAt } from "./easing";

const STEPS = [
  { n: "1", text: "第一步", color: palette.accent2,   t: 14 },
  { n: "2", text: "第二步", color: palette.accent, t: 42 },
  { n: "3", text: "第三步", color: palette.accent2, t: 70 },
];

export const OutroRecapEffect: React.FC<{ frame?: number }> = ({ frame }) => {
  const localFrame = useCurrentFrame();
  const f = frame ?? localFrame;
  const lineP = easeOutCubic(progressAt(f, 98, 20));
  const breathe = 1 + 0.012 * Math.sin(f * 0.09);
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <div style={{ position: "absolute", top: 150, left: 100, fontSize: typography.recapTitle, fontWeight: 800, color: palette.ink, opacity: progressAt(f, 0, 18) }}>三步回顾</div>
      {STEPS.map((s, i) => {
        const p = easeOutBack(progressAt(f, s.t, 20));
        return (
          <div key={s.n} style={{ position: "absolute", left: 100, top: 440 + i * 170, width: 880, height: 140,
            background: palette.surface, border: `2px solid ${s.color}`, borderRadius: 70, transform: `scale(${p * (i === 2 ? breathe : 1)})`,
            display: "flex", alignItems: "center", paddingLeft: 40, boxSizing: "border-box" }}>
            <div style={{ width: 84, height: 84, borderRadius: 42, background: palette.bg, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: typography.index, fontWeight: 900, color: palette.ink, lineHeight: 1 }}>{s.n}</span>
            </div>
            <span style={{ marginLeft: 36, fontSize: typography.body, fontWeight: 700, color: palette.ink, whiteSpace: "nowrap" }}>{s.text}</span>
          </div>
        );
      })}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={300} y1={1010} x2={300 + 480 * lineP} y2={1010} stroke={palette.accent2} strokeWidth={8} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: 0, top: 1080, width: 1080, textAlign: "center", fontSize: typography.quote,
        fontWeight: 900, color: palette.ink, whiteSpace: "nowrap", transform: `scale(${breathe})`,
        opacity: easeOutCubic(progressAt(f, 112, 22)) }}>
        金句收尾
      </div>
      <div style={{ position: "absolute", left: 0, top: 1210, width: 1080, textAlign: "center", fontSize: typography.note,
        fontWeight: 600, color: palette.sub, whiteSpace: "nowrap", opacity: easeOutCubic(progressAt(f, 146, 24)) }}>
        出处 / 署名
      </div>
    </AbsoluteFill>
  );
};
export default OutroRecapEffect;
```

## 18. 整片渐隐（Composition 入口，Step5 规划 / Step7 实现 / Step8 校准）

> 合并到 §5 入口，并为其 remotion import 补充 useCurrentFrame；沿用该入口的 sequences 与 palette import。以下是局部补丁，不另建入口，人工 Step10 才启动视频渲染。

```tsx
const FADE_OUT_FRAMES = 32;

export const MyComposition: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const totalFrames = SCENES.reduce((sum, scene) => sum + Math.max(1, Math.round(scene.durationSec * fps)), 0);
  /* …sequences… */
  const fade = Math.max(0, Math.min(1, (frame - (totalFrames - FADE_OUT_FRAMES)) / FADE_OUT_FRAMES));
  return (
    <AbsoluteFill style={{ background: palette.bg }}>
      {sequences}
      {fade > 0 && <AbsoluteFill style={{ background: palette.bg, opacity: fade, pointerEvents: "none" }} />}
    </AbsoluteFill>
  );
};
```

## 19. `tailSec` 静场留白：与 §4 / §8 完整模板一致

**① `scripts/sync-durations.mjs`** — §8 已包含以下逻辑，旧项目迁移时保持一致，避免重跑同步冲掉留白：

```js
const a = dur(resolve(AUDIO_DIR, `${scene.id}.mp3`));
const tail = Number(scene.tailSec ?? 0);
scene.durationSec = Number((a + PAD + tail).toFixed(2));
```

**② `src/<Name>/Scene.tsx`** — §4 完整模板已从当前镜 `sceneDurationFrames` 扣除 tailSec，仅在有声区间分配单段和多段字幕。新项目直接使用 §4，不再叠加旧 buildLines/useMemo 补丁，也不能从全 Composition durationInFrames 扣尾帧。

**scenes.json 里的 Outro 镜**：

```json
{
  "id": "S20",
  "title": "三步回顾",
  "shot_type": "effect",
  "effect": "OutroRecapEffect",
  "tailSec": 2.2,
  "durationSec": 7.87,
  "subtitle": "回顾一下：第一步、第二步、第三步。金句收尾。",
  "narration": "回顾一下：第一步、第二步、第三步。金句收尾。"
}
```
## 20. `scripts/check-draft-sync.mjs`（草稿一致性机械门禁 · Step7/8/9 必跑）

> 唯一维护版本位于 `scripts/check-draft-sync.mjs`。新项目直接复制脚本文件，不要从本文旧代码块手工重建，以免版本漂移。

- 默认 **fail-closed**：草稿缺失、`scenes.json` 缺失、JSON 无效、草稿场景无法一一匹配、旁白不一致，均以非零退出码阻塞正式制作。
- 支持 `--draft <path>` 和 `--scenes <file-or-directory>` 指定路径。
- 仅探索性工作流可显式使用 `--allow-missing` 跳过缺文件；该模式不能作为交付门禁，也不能把结果记录为 QA 通过。
- 脚本按 `制作过程/视频方案审阅稿.md` 中 `**S01｜标题**` 标题下第一条 `> 旁白全文` 与 `scenes.json` 的 `subtitle` 或 `narration` 比对。若项目使用不同的草稿格式，应先更新解析器与测试，不要通过放宽门禁掩盖格式漂移。

用法（`<project>` 与 `<video-project>` 替换为实际绝对路径，正式制作显式指定 `--draft`，不依赖旧路径默认探测）：

```bash
node "<video-project>/scripts/check-draft-sync.mjs" --draft "<project>/制作过程/视频方案审阅稿.md" --scenes "<video-project>/public/scenes/<slug>/scenes.json"
# 仅探索性工作流（正式制作禁止）
node scripts/check-draft-sync.mjs --allow-missing
```

## 21. `scripts/tts-single.mjs`（单场景重新生成 · Step8 旁白修改后使用）

> 旁白局部修改时用此脚本，避免全量重跑浪费时间。内置绝对路径处理（防 `chattts_batch.py` 的 `os.chdir` 副作用）、归一化、sync-durations 三步合一。

```js
#!/usr/bin/env node
/**
 * 用法：node scripts/tts-single.mjs --scene S03
 *       node scripts/tts-single.mjs --scene S01 --slow   # 额外降速 0.9（开场镜头专用）
 */
import { execFileSync, spawnSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SLUG = "my-video"; // ← 改这里
const SCENES_PATH = resolve(__dirname, `../public/scenes/${SLUG}/scenes.json`);
const AUDIO_DIR   = resolve(__dirname, `../public/scenes/${SLUG}/audio`);

const SKILL_ROOT = process.env.VERTICAL_VIDEO_SKILL_ROOT;
if (!SKILL_ROOT) throw new Error("请设置 VERTICAL_VIDEO_SKILL_ROOT 为实际 <skill-root> 绝对路径");
const CHATTTS_BATCH = process.env.CHATTTS_BATCH ?? resolve(SKILL_ROOT, "chattts/chattts_batch.py");
const CHATTTS_STYLE  = process.env.CHATTTS_STYLE ?? "gentle_female";
const CHATTTS_PYTHON = process.env.CHATTTS_PYTHON ?? "arch -arm64 python3";
const CHATTTS_CONFIG = process.env.CHATTTS_CONFIG ?? resolve(SKILL_ROOT, "chattts/config.json");
const PYTHONPATH = process.env.CHATTTS_ROOT ?? JSON.parse(readFileSync(CHATTTS_CONFIG, "utf8")).chatts_root;

const args = process.argv.slice(2);
const argVal = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const sceneId = argVal("--scene");
const doSlow  = args.includes("--slow");

if (!sceneId) { console.error("用法: node scripts/tts-single.mjs --scene <id> [--slow]"); process.exit(1); }

const data  = JSON.parse(readFileSync(SCENES_PATH, "utf8"));
const scene = data.scenes.find(s => s.id === sceneId);
if (!scene) { console.error(`未找到 scene: ${sceneId}`); process.exit(1); }

if (!existsSync(AUDIO_DIR)) mkdirSync(AUDIO_DIR, { recursive: true });

// ── 1. TTS 生成（绝对路径，防 os.chdir 副作用）──
const outAbs  = resolve(AUDIO_DIR, `${sceneId}.mp3`);
const jobs    = [{ text: scene.narration ?? scene.subtitle ?? "", output: outAbs, style: scene.ttsStyle ?? CHATTTS_STYLE }];
const jobFile = resolve(tmpdir(), `tts_single_${Date.now()}.json`);
writeFileSync(jobFile, JSON.stringify(jobs));

const pyArgs = CHATTTS_PYTHON.split(" ");
console.log(`[tts-single] 生成 ${sceneId} (style: ${jobs[0].style})...`);
const r = spawnSync(pyArgs[0], [...pyArgs.slice(1), CHATTTS_BATCH, "--jobs", jobFile],
  { encoding: "utf8", timeout: 300_000, env: { ...process.env, PYTHONPATH } });
if (r.stdout) process.stdout.write(r.stdout);
if (r.error || r.status !== 0) { console.error("TTS 失败:", r.stderr); process.exit(1); }

// ── 2. 可选降速（--slow，atempo=0.9，开场镜头专用）──
if (doSlow) {
  const tmp = outAbs.replace(".mp3", "_slow.mp3");
  execFileSync("ffmpeg", ["-y", "-i", outAbs, "-af", "atempo=0.9", "-ar", "44100", tmp, "-loglevel", "error"]);
  execFileSync("mv", [tmp, outAbs]);
  console.log(`[tts-single] 已降速 0.9x`);
}

// ── 3. 音量归一化 ──
const norm = outAbs.replace(".mp3", "_norm.mp3");
execFileSync("ffmpeg", ["-y", "-i", outAbs, "-af", "loudnorm=I=-16.60:TP=-3.59:LRA=1.20", "-ar", "44100", norm, "-loglevel", "error"]);
execFileSync("mv", [norm, outAbs]);
console.log(`[tts-single] 已归一化 -16.60 LUFS`);

// ── 4. 同步时长 ──
const dur = (f) => Number(execFileSync("/opt/homebrew/bin/ffprobe", ["-v","error","-show_entries","format=duration",
  "-of","default=noprint_wrappers=1:nokey=1", f], { encoding: "utf8" }).trim());
const audio = dur(outAbs);
const tail  = Number(scene.tailSec ?? 0);
scene.durationSec = Number((audio + tail).toFixed(2));
writeFileSync(SCENES_PATH, JSON.stringify(data, null, 2), "utf8");
console.log(`[tts-single] ${sceneId}: ${audio.toFixed(2)}s → durationSec=${scene.durationSec}s ✅`);
```

> **package.json 加一条**：`"tts-single": "node scripts/tts-single.mjs"`
> **S01 开场标准操作**：`node scripts/tts-single.mjs --scene S01 --slow`（生成 + 降速 + 归一化 + sync 一步完成）

