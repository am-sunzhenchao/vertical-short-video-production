# vertical-short-video-production

竖版中文知识短视频制作 skill：输入文章、资料摘要或少量知识笔记，先核查事实并补充研究，再组织叙事、自动规划逐镜视觉表达，输出可在 Remotion Studio 预览的项目。

---

## 适用场景

- 知识科普 / 观点解释 / 技术口播
- 抖音 / 微信视频号竖屏（1080×1920）
- 支持对输入的原始内容进行核查优化调整，先保证内容准确无误再进行制作
- 在制作视频后，会同时制作用于短视频发布时需要的封面、标题、描述

---

## 文件结构

```
vertical-short-video-production/
├── SKILL.md              # 主流程（Step1–6）+ 否定项约束
├── references/           # 按需查阅的规范文档（SKILL.md 内引用 references/xxx.md）
│   ├── visual-system.md      # 视觉规范：版面安全区、自动视觉规划、主题规范与 Effect 规范
│   ├── motion-system.md      # 标准动效模式、镜头语言、motionPlan 与视觉验收
│   ├── scientific-review.md  # 科学事实与表述风险审查
│   ├── research-workflow.md  # 输入材料→研究核查→叙事→视觉规划的工作流
│   ├── code-templates.md     # 可复制代码模板（Effects、scenes.json、脚本等）
│   ├── 色板.md                # Huashu 色板参考
│   └── 镜头语言.md            # 单镜镜头语言参考（十种单镜语法）
├── chattts/
│   ├── chattts_batch.py   # ChatTTS 批处理脚本（模型只加载一次）
│   ├── config.json        # ChatTTS 本地安装路径配置
│   └── voice_presets.json # 音色参数预设（embedding 唯一存放于 ChatTTS/speakers/）
└── scripts/
    ├── check-draft-sync.mjs  # 草稿与 scenes.json 一致性检查（Step3/5 门禁）
    ├── svg2png.mjs           # SVG 单文件转 PNG
    └── package.json
```

---

## 前置依赖

| 依赖 | 说明 |
|------|------|
| Node.js ≥ 18 | Remotion 运行环境 |
| ChatTTS | 本地 TTS 引擎，需配置 `chattts/config.json` |
| ffmpeg | 音频处理（归一化、降速） |
| ffprobe | 音频时长读取 |

首次使用时 skill 会引导配置 ChatTTS 路径，写入 `chattts/config.json`。

---

## 核心流程（6 步）

```
Step 1  研究核查         阅读输入材料，核查主张、补充必要研究，落盘 source.md / 研究记录
Step 2  叙事与视觉规划   组织完整叙事，自动选择 visualGrammar + motionPlan，评测后落盘 draft-review.md
                         ↓ 用户 Review 通过后继续
Step 3  视觉素材         按 shot_type 路由（Effect / 信息图 / 生图）
Step 4  Remotion 实现    先映射现有动效组件，再写 Effect TSX；编译 + 关键帧/短片段验收
Step 5  TTS 配音         批量生成 → 归一化 → sync-durations
                         开场 S01 额外 atempo=0.9 降速
Step 6  封面 + 发布文案  V1+V2 封面 SVG/PNG，标题.txt，描述.txt
```

---

## 视觉规划（默认自动，不必先选风格）

系统先按知识点选择逐镜表达方法（科学示意图、图表、时间线、对照、结构拆解、动态文字等），再选择标准动效与已有组件；整片沿用统一视觉主题。`tech-mint`、`kurzgesagt`、`vox`、`vox-light`、`doodle-note` 保留为兼容主题/可选覆盖，不再是必选入口。

---

## 关键约束（高频违规项）

- **顶部留白**：Effect 内容元素 `top ≥ 150px`，背景装饰层不限
- **TTS 中文化**：narration 不得含英文字母数字混排（`36G` → `三十六G`）
- **编译与视觉验收分开**：用 `npx tsc --noEmit` 检查类型；关键帧/短片段输出到 `/tmp/` 或 `qa/`，禁止污染 `out/`；默认不自动渲染最终 MP4
- **Outro 三件套**：OutroRecap scene + tailSec 静场 + 整片渐隐，缺一不可
- **容器 opacity**：背景色块与子内容共用同一 opacity 变量，不得容器先于内容出现

完整约束见 `SKILL.md` 否定项。

---

## 常用命令

```bash
# 开发预览
npm start

# 出片
npm run render

# 单场景重新生成 TTS（含归一化 + sync）
node scripts/tts-single.mjs --scene S03

# 开场镜头 TTS（降速 0.9）
node scripts/tts-single.mjs --scene S01 --slow

# 草稿一致性检查
node scripts/check-draft-sync.mjs

# 封面渲染
node scripts/render-cover.mjs

# 编译验证（不产生输出文件）
npx tsc --noEmit
```

---

## 更新记录

| 日期 | 变更 |
|------|------|
| 2026-08-16 | 初始创建竖版中文短视频制作 skill 文档体系 |
| 2026-08-28 | 新增 ChatTTS 批量合成集成（模型只加载一次）；Effect 文件名规范改为 sceneId 前置（`{sceneId}-{EffectName}.tsx`） |
| 2026-09-05 | 工作流与约束优化：新增 `tts-single.mjs` 单场景重生成；TTS 中文化扩展至数字+单位+专有名词；顶部留白 120px→150px；新增「容器与内容共用 opacity」规范；编译验证改 `npx tsc --noEmit`；开场 S01 音频强制 atempo=0.9 降速 |
| 2026-09-20 | 锁定默认音色为 `gentle_female`，补充相关约束与新增脚本 |
| 2026-10-18 | 新增 `vox-light` 浅底风格模式，强制复用全局 Chrome Headless Shell，ffprobe 改绝对路径 |
| 2026-10-29 | 重构视觉系统（色板体系融合与样式预览卡点）；融入镜头语言体系（十种单镜语法 + 运镜参数 + styleMode 兼容矩阵）；默认流程改为先研究核查，再组织叙事并自动规划逐镜视觉表达，风格选择改为可选覆盖 |
