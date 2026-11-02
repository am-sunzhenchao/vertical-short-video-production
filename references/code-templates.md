# 可复用代码模板

> 新建项目时直接复制粘贴，只需替换 `<slug>`、`<CompositionName>`、Effect 列表。

## 1. StarfieldDrift `src/effects/StarfieldDrift.tsx`

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
import { useCurrentFrame, AbsoluteFill } from "remotion";
import { easeOutCubic, progressAt, fadeInUp } from "./easing";

const clipTitle = (s: string, max = 16) => s.length > max ? s.slice(0, max) : s;

interface MyEffectProps { frame: number; fps: number; durationInFrames: number; scene: Record<string, unknown>; }

export const MyEffect: React.FC<MyEffectProps> = ({ frame }) => {
  const f = frame ?? useCurrentFrame();
  // const p = easeOutCubic(progressAt(f, 0, 20));
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0d0d1a 0%, #1a1a3a 100%)" }}>
      <div style={{ position: "absolute", top: 150, left: 40, width: 1000, height: 1210 }}>
        {/* 内容区从 top:150 开始（顶部留白 0–150px 为平台安全区，禁止内容元素入侵） */}
        {/* <span style={{ fontSize: 70, whiteSpace: "nowrap" }}>{clipTitle("标题")}</span> */}
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
// import { MyEffect } from "../effects/MyEffect";
const EFFECT_MAP: Record<string, React.FC<any>> = { /* MyEffect, */ };

const visualLen = (s: string) => [...s].reduce((n, c) => n + (/[一-鿿　-〿＀-￯]/.test(c) ? 1 : 0.55), 0);
interface SubtitleLine { text: string; startFrame: number; fadeOutStartFrame: number; endFrame: number; }
const FADE_IN = 10, FADE_OUT = 10, GAP = 8;

function splitToLines(text: string, segStart: number, segEnd: number): SubtitleLine[] {
  const sentences = (text.match(/[^。？！；…]+[。？！；…]?\s*/g) ?? [text]).map(m => m.trim()).filter(Boolean);
  if (sentences.length <= 1) return [{ text: text.trim(), startFrame: segStart, fadeOutStartFrame: segEnd - FADE_OUT, endFrame: segEnd }];
  const totalW = sentences.reduce((s, t) => s + visualLen(t), 0);
  const budget = Math.max(segEnd - segStart - sentences.length * (FADE_IN + FADE_OUT + GAP), sentences.length * 15);
  let cursor = segStart;
  return sentences.map((text) => {
    const display = Math.round(visualLen(text) / totalW * budget);
    const lineStart = cursor;
    const fadeOutStart = lineStart + FADE_IN + display;
    const lineEnd = fadeOutStart + FADE_OUT + GAP;
    cursor = lineEnd;
    return { text, startFrame: lineStart, fadeOutStartFrame: fadeOutStart, endFrame: lineEnd };
  });
}

function collectAllLines(segments: { text: string; startSec: number }[], fps: number, endFrame: number): SubtitleLine[] {
  const all: SubtitleLine[] = [];
  segments.forEach((seg, i) => {
    const segStart = Math.round(seg.startSec * fps);
    const segEnd = i + 1 < segments.length ? Math.round(segments[i + 1].startSec * fps) : endFrame;
    all.push(...splitToLines(seg.text, segStart, segEnd));
  });
  return all;
}

export const Scene: React.FC<{ scene: any; styleMode?: string }> = ({ scene, styleMode = "tech-mint" }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const Effect = EFFECT_MAP[scene.effect];
  const segs = scene.subtitleSegments;
  const allLines = segs?.length > 0
    ? collectAllLines(segs, fps, durationInFrames)
    : splitToLines(scene.subtitle ?? scene.narration ?? "", 0, durationInFrames);
  const cur = [...allLines].reverse().find(l => frame >= l.startFrame && frame < l.endFrame) ?? null;
  const fadeIn = cur ? Math.min(1, (frame - cur.startFrame) / FADE_IN) : 0;
  const fadeOut = cur ? (cur.fadeOutStartFrame - frame < FADE_OUT ? Math.max(0, (cur.fadeOutStartFrame - frame) / FADE_OUT) : 1) : 0;
  const subColor = { "tech-mint": "#e8fff3", "kurzgesagt": "#ffffff", "vox": "#ffffff" }[styleMode] ?? "#e8fff3";
  const subShadow = styleMode === "tech-mint"
    ? "0 0 20px rgba(75,230,155,0.3), 0 2px 8px rgba(0,0,0,0.6)"
    : "0 2px 10px rgba(0,0,0,0.85)";
  return (
    <AbsoluteFill>
      {Effect && <Effect frame={frame} fps={fps} durationInFrames={durationInFrames} scene={scene} styleMode={styleMode} />}
      <div style={{ position: "absolute", top: 1440, left: 56, right: 56, bottom: 220, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "12px 0" }}>
        {cur && <div style={{ fontSize: 70, fontWeight: 600, color: subColor, textAlign: "center", lineHeight: 1.6, opacity: fadeIn * fadeOut, transform: `translateY(${(1 - fadeIn) * 10}px)`, textShadow: subShadow, whiteSpace: "nowrap" }}>{cur.text}</div>}
      </div>
    </AbsoluteFill>
  );
};
```

## 5. Composition 入口 `src/<Name>/index.tsx`

```tsx
import React from "react";
import { AbsoluteFill, Sequence, Audio, useVideoConfig, staticFile } from "remotion";
import { StarfieldDrift } from "../effects/StarfieldDrift";
import { Scene } from "./Scene";
import scenesData from "../../public/scenes/<slug>/scenes.json";

const SCENES = scenesData.scenes;
const STYLE_MODE = scenesData.styleMode ?? "tech-mint";

const MODE_BG: Record<string, string> = {
  "tech-mint": "#0a0818",
  "kurzgesagt": "#1a2b4a",
  "vox": "#0b0b0d",
};

export const MyComposition: React.FC = () => {
  const { fps } = useVideoConfig();
  let offset = 0;
  const sequences = SCENES.map((scene) => {
    const from = Math.round(offset * fps);
    const dur = Math.round(scene.durationSec * fps);
    offset += scene.durationSec;
    return (
      <Sequence key={scene.id} from={from} durationInFrames={dur}>
        <Scene scene={scene} styleMode={STYLE_MODE} />
        <Audio src={staticFile(`scenes/<slug>/audio/${scene.id}.mp3`)} volume={1} />
      </Sequence>
    );
  });
  return (
    <AbsoluteFill style={{ background: MODE_BG[STYLE_MODE] }}>
      {/* StarfieldDrift 仅 tech-mint 挂载；kurzgesagt/vox 用纯色底，禁止星空/渐变/粒子 */}
      {STYLE_MODE === "tech-mint" && <StarfieldDrift />}
      {sequences}
    </AbsoluteFill>
  );
};
```

## 6. scenes.json 示例

```json
{
  "slug": "my-video",
  "styleMode": "tech-mint",
  "scenes": [
    {
      "id": "S01",
      "title": "场景标题（人读，不渲染）",
      "subtitle": "画面字幕，含英文原词",
      "narration": "TTS朗读稿，英文术语替换中文，内容与subtitle完全一致",
      "durationSec": 12.5,
      "shot_type": "effect",
      "effect": "MyEffect"
    },
    {
      "id": "S02",
      "title": "多段场景",
      "subtitle": "完整字幕全文",
      "narration": "TTS朗读稿",
      "shot_type": "infographic",
      "asset": "scenes/my-video/shots/S02.png",
      "subtitleSegments": [
        { "text": "第一句话。", "startSec": 0 },
        { "text": "第二句话，TTS后回写真实startSec。", "startSec": 5.2 }
      ],
      "durationSec": 15.0,
      "effect": "ImageShot"
    }
  ]
}
```

> `styleMode`（顶层，全片统一）：`tech-mint` | `kurzgesagt` | `vox`
> `shot_type`（每镜）：`effect` | `infographic` | `chart` | `process` | `flat` | `atmosphere`
> `asset`：外部生图/信息图产物（PNG）路径，`shot_type` 非 `effect` 时用 `ImageShot` 组件（objectFit: contain）承载

## 7. scripts/tts.mjs

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
    scene.durationSec = Number((a + PAD).toFixed(2));
    total += scene.durationSec;
    console.log(`${scene.id}: ${a.toFixed(2)}s → ${scene.durationSec}s`);
  } catch { console.warn(`${scene.id}: no audio, keeping ${scene.durationSec}s`); total += scene.durationSec; }
}
writeFileSync(SCENES_PATH, JSON.stringify(data, null, 2), "utf8");
console.log(`\nTotal: ${total.toFixed(2)}s (${Math.round(total * 25)} frames)`);
```

## 9. scripts/render-cover.mjs

```js
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const jobs = [
  { src: "../cover/封面v1.svg", out: "../cover/封面v1.png", width: 1080 },
  { src: "../cover/封面v2.svg", out: "../cover/封面v2.png", width: 1080 },
];

for (const j of jobs) {
  const resvg = new Resvg(readFileSync(resolve(j.src), "utf8"), {
    fitTo: { mode: "width", value: j.width },
    font: { loadSystemFonts: true, defaultFontFamily: "PingFang SC" },
  });
  writeFileSync(resolve(j.out), resvg.render().asPng());
  console.log(`Rendered ${j.src} → ${j.out}`);
}
```

## 10. `scripts/tts.mjs`（ChatTTS 批处理版，推荐）

> 核心改进：所有 scene 的 TTS 任务收集后**一次性**传给 `chattts_batch.py`，模型只加载一次，避免超时。

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
const CHATTTS_BATCH = "/Users/sunzhenchao/.claude/skills/vertical-short-video-production/chattts/chattts_batch.py";
const CHATTTS_STYLE = process.env.CHATTTS_STYLE ?? "gentle_female";
const CHATTTS_PYTHON = process.env.CHATTTS_PYTHON ?? "arch -arm64 python3";
const PYTHONPATH = JSON.parse(readFileSync("/Users/sunzhenchao/.claude/skills/vertical-short-video-production/chattts/config.json","utf8")).chatts_root;

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
    if (segs && segs.length > 1) {
      segs.forEach((s, i) => jobs.push({ text: s.text, output: resolve(AUDIO_DIR, `${scene.id}_p${i}.mp3`), style }));
    } else {
      jobs.push({ text: scene.narration ?? scene.subtitle ?? "", output: resolve(AUDIO_DIR, `${scene.id}.mp3`), style });
    }
  }
  runChatTTSBatch(jobs);
  for (const scene of data.scenes) {
    const segs = scene.subtitleSegments;
    if (segs && segs.length > 1) {
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
    if (segs && segs.length > 1) {
      const parts = segs.map((s,i)=>{const f=resolve(AUDIO_DIR,`${scene.id}_p${i}.mp3`);ttsEdge(s.text,f);return f;});
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
  const f = frame ?? useCurrentFrame();
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

> 扁平矢量、纯色块、**一镜一概念**。无渐变/无阴影/无发光/无粒子。元素依次弹入（easeOutBack 轻回弹）。全片色板 ≤ 5~6 高饱和色压深底。

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeOutBack, progressAt } from "./easing";

const PALETTE = { orange: "#ff8c42", teal: "#2ec4b6", magenta: "#e94f9c", yellow: "#ffd23f", blue: "#4cc9f0" };
const clip = (s: string, m = 16) => (s.length > m ? s.slice(0, m) : s);

export const KurzOneConcept: React.FC<{ frame?: number; scene: any }> = ({ frame, scene }) => {
  const f = frame ?? useCurrentFrame();
  const inP = easeOutBack(progressAt(f, 8, 22));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {/* 唯一核心图形：纯色圆/方块 + 拟物化图标，不堆叠 */}
      <div style={{ width: 460, height: 460, borderRadius: "50%", background: PALETTE.teal, transform: `scale(${inP})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 200, lineHeight: 1 }}>▲</span>
      </div>
      <div style={{ marginTop: 80, fontSize: 88, fontWeight: 800, color: PALETTE.yellow, whiteSpace: "nowrap", opacity: progressAt(f, 20, 16) }}>
        {clip(scene.title ?? "一个概念")}
      </div>
    </AbsoluteFill>
  );
};
export default KurzOneConcept;
```

## 14. Vox 模式模板 `src/effects/S<id>-VoxChart.tsx`

> 图表即主体，口播驱动逐帧点亮。黄/白标注线、箭头、圈红划重点。近黑纯底。**图表用代码精绘，禁止生图模型画**（数字会糊）。

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { progressAt } from "./easing";

const VOX_YELLOW = "#ffd400";
const clip = (s: string, m = 16) => (s.length > m ? s.slice(0, m) : s);

export const VoxChart: React.FC<{ frame?: number; scene: any }> = ({ frame, scene }) => {
  const f = frame ?? useCurrentFrame();
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
      <div style={{ position: "absolute", top: 150, left: 90, fontSize: 84, fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>
        {clip(scene.title ?? "标题")}
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={x0} y1={y0} x2={x0 + W} y2={y0} stroke="#555" strokeWidth={2} />
        <line x1={x0} y1={y0} x2={x0} y2={y0 - H} stroke="#555" strokeWidth={2} />
        <path d={path} fill="none" stroke={VOX_YELLOW} strokeWidth={8} strokeLinecap="round" />
        {shown >= pts.length && (
          <>
            <circle cx={last.x} cy={last.y} r={26} fill="none" stroke="#ff3b30" strokeWidth={6} opacity={progressAt(f, 58, 12)} />
            <text x={last.x - 40} y={last.y - 44} fill={VOX_YELLOW} fontSize={44} fontWeight={700} opacity={progressAt(f, 62, 12)}>看这里</text>
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

## 16. `scripts/script-stats.mjs`（文稿压缩比统计 · Step2 强制执行）

> 计算原始素材 → 讲解稿的压缩比、语速、每镜语速极差，并给出健康区间判定。
> **Step2 必跑**，结果写入 `draft-review.md`；禁止手工口算总时长与字数。
>
> 用法（两种数据源任选，可组合）：
> ```bash
> # Step2：narration 还在草稿里 → 先把各镜 narration 逐行存成 narration.txt
> node scripts/script-stats.mjs --raw source.md --narration narration.txt
>
> # Step4 之后：直接读 scenes.json（推荐，能算每镜语速）
> node scripts/script-stats.mjs --raw source.md --scenes public/scenes/<slug>/scenes.json
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
  console.error("用法: --raw <source.md> (--scenes <scenes.json> | --narration <narration.txt>)");
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

> **package.json 加一条**：`"stats": "node scripts/script-stats.mjs"`

## 17. Outro 收束 `src/effects/S{last}-OutroRecap.tsx`（Step 5.5 强制）

> 片尾三步回顾 + 金句 + 出处行。**时间轴必须收在音频帧内**，静场（`tailSec`）只留给呼吸和渐隐。
> 呼吸公式 `1 + 0.012 * Math.sin(f * 0.09)`，防静场段完全冻结。

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { P } from "./palette";
import { easeOutBack, easeOutCubic, progressAt } from "./easing";
import { Title } from "./shared";

const STEPS = [
  { n: "1", text: "第一步", color: P.teal,   t: 14 },
  { n: "2", text: "第二步", color: P.yellow, t: 42 },
  { n: "3", text: "第三步", color: P.orange, t: 70 },
];

export const OutroRecapEffect: React.FC<{ frame?: number }> = ({ frame }) => {
  const f = frame ?? useCurrentFrame();
  const lineP = easeOutCubic(progressAt(f, 98, 20));
  const breathe = 1 + 0.012 * Math.sin(f * 0.09);
  return (
    <AbsoluteFill>
      <Title frame={f} text="三步回顾" />
      {STEPS.map((s, i) => {
        const p = easeOutBack(progressAt(f, s.t, 20));
        return (
          <div key={s.n} style={{ position: "absolute", left: 100, top: 440 + i * 170, width: 880, height: 140,
            background: s.color, borderRadius: 70, transform: `scale(${p * (i === 2 ? breathe : 1)})`,
            display: "flex", alignItems: "center", paddingLeft: 40, boxSizing: "border-box" }}>
            <div style={{ width: 84, height: 84, borderRadius: 42, background: P.bg, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 46, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.n}</span>
            </div>
            <span style={{ marginLeft: 36, fontSize: 58, fontWeight: 900, color: P.bg, whiteSpace: "nowrap" }}>{s.text}</span>
          </div>
        );
      })}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={300} y1={1010} x2={300 + 480 * lineP} y2={1010} stroke={P.blue} strokeWidth={8} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: 0, top: 1080, width: 1080, textAlign: "center", fontSize: 62,
        fontWeight: 900, color: P.white, whiteSpace: "nowrap", transform: `scale(${breathe})`,
        opacity: easeOutCubic(progressAt(f, 112, 22)) }}>
        金句收尾
      </div>
      <div style={{ position: "absolute", left: 0, top: 1210, width: 1080, textAlign: "center", fontSize: 42,
        fontWeight: 700, color: P.dimText, whiteSpace: "nowrap", opacity: easeOutCubic(progressAt(f, 146, 24)) }}>
        出处 / 署名
      </div>
    </AbsoluteFill>
  );
};
export default OutroRecapEffect;
```

## 18. 整片渐隐（Composition 入口，Step 5.5 强制）

```tsx
const FADE_OUT_FRAMES = 32;

export const MyComposition: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const totalFrames = Math.round(TOTAL_SEC * fps);
  /* …sequences… */
  const fade = Math.max(0, Math.min(1, (frame - (totalFrames - FADE_OUT_FRAMES)) / FADE_OUT_FRAMES));
  return (
    <AbsoluteFill style={{ background: MODE_BG[STYLE_MODE] }}>
      {sequences}
      {fade > 0 && <AbsoluteFill style={{ background: MODE_BG[STYLE_MODE], opacity: fade, pointerEvents: "none" }} />}
    </AbsoluteFill>
  );
};
```

## 19. `tailSec` 静场留白：两处必改

**① `scripts/sync-durations.mjs`** — 否则重跑 TTS 会冲掉留白：

```js
const a = dur(resolve(AUDIO_DIR, `${scene.id}.mp3`));
const tail = Number(scene.tailSec ?? 0);
scene.durationSec = Number((a + PAD + tail).toFixed(2));
```

**② `src/<Name>/Scene.tsx`** — 字幕只在有声区间内分配，否则字幕被摊进静场、比人声慢 30~40%：

```tsx
const tailFrames = Math.round(Number(scene.tailSec ?? 0) * fps);
const subtitleFrames = Math.max(1, durationInFrames - tailFrames);
const lines = React.useMemo(
  () => buildLines(scene.subtitle ?? scene.narration ?? "", subtitleFrames),
  [scene.subtitle, scene.narration, subtitleFrames]
);
```

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
## 20. `scripts/check-draft-sync.mjs`（草稿一致性机械门禁 · Step3/5 开工前必跑）

> 防止"用户已修改 `draft-review.md`，但 scenes.json/配音仍是旧版"的静默漂移。
> 逐镜比对草稿引用行与 scenes.json，不一致 → 打印差异并 `exit 1`，阻塞后续制作。

```js
#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };

const DRAFT = arg("--draft") ?? resolve(__dirname, "../draft-review.md");
let scenesPath = arg("--scenes") ?? resolve(__dirname, "../public/scenes");

if (!existsSync(DRAFT)) { console.log(`[check-draft-sync] 未找到 ${DRAFT}，跳过（无草稿可校验）`); process.exit(0); }
if (!existsSync(scenesPath)) { console.log(`[check-draft-sync] 未找到 scenes 目录，跳过`); process.exit(0); }
if (readdirSync(scenesPath).every(f => !f.endsWith(".json"))) {
  const sub = readdirSync(scenesPath).find(d => existsSync(resolve(scenesPath, d, "scenes.json")));
  if (sub) scenesPath = resolve(scenesPath, sub, "scenes.json"); else { console.log("[check-draft-sync] 未找到 scenes.json，跳过"); process.exit(0); }
} else {
  scenesPath = resolve(scenesPath, readdirSync(scenesPath).find(f => f.endsWith(".json")));
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
```

> **用法**：每个新项目把它拷进 `scripts/`；Step3/Step5 开工前先跑 `node scripts/check-draft-sync.mjs`。
> **设计要点**：
> - 草稿不存在（Step2 前）或 scenes.json 未生成时静默跳过，不阻塞早期流程
> - 比对的是草稿中每个 `**S{nn}｜标题**` 块下的第一条 `> ` 引用行（即该镜旁白全文）
> - 只要不一致就 `exit 1`，把"忘记重读草稿"从静默错误变成显式失败

## 21. `scripts/tts-single.mjs`（单场景重新生成 · Step5 旁白修改后使用）

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

const CHATTTS_BATCH  = "/Users/sunzhenchao/.claude/skills/vertical-short-video-production/chattts/chattts_batch.py";
const CHATTTS_STYLE  = process.env.CHATTTS_STYLE ?? "gentle_female";
const CHATTTS_PYTHON = process.env.CHATTTS_PYTHON ?? "arch -arm64 python3";
const PYTHONPATH     = JSON.parse(readFileSync(
  "/Users/sunzhenchao/.claude/skills/vertical-short-video-production/chattts/config.json", "utf8"
)).chatts_root;

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

