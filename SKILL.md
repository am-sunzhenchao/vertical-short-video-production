---
name: vertical-short-video-production
description: Use when producing a Chinese vertical (1080×1920) narrated short video for 抖音 / 微信视频号 — including "做竖版短视频"、"抖音/视频号视频"、知识口播/科普/观点解释视频、Kurzgesagt/Vox 风格解释片，或只是"写脚本/做封面/配音"其中一环时。也用于此类项目的分镜、字幕、TTS、封面、Remotion 实现。
---

# 竖版中文短视频制作

## 项目规格与入口

- 平台：微信视频号 + 抖音；视频 1080×1920、25fps；封面 1080×1440。
- 栈：Remotion 4.x + ChatTTS / edge-tts + @resvg/resvg-js。
- 新项目默认 `paper` 暖浅底 + `styleMode: "vox-light"`，不先询问风格；仅操作者明确要求才覆盖。
- 默认配音锁定 ChatTTS `gentle_female`，不按题材擅自更换、不询问全局音色。Edge-TTS 备用为 `zh-CN-YunxiNeural`。
- `<skill-root>` 指本次加载的 Skill 实际根目录，不是固定安装路径；ChatTTS 根从 `<skill-root>/chattts/config.json` 的 `chatts_root` 读取。
- 输入、研究、方案阶段不依赖 ChatTTS 配置。配置引导移至第 8 步前，见 `references/production-workflow.md`。

## 主流程内路径约定

所有新项目产物集中在项目根下的约定目录：研究与方案记录放 `制作过程/`，项目级统计输入与统计工具放 `制作过程/临时文件/`，人工 QA 关键帧、短片段与检查记录放 `制作过程/渲染质检/`，封面与发布文案放 `发布素材/`；生产工程保持下方交付树结构。`sourcePath / researchPath / draftPath` 都相对于项目根解析，不相对于方案所在目录。镜头正文直接合并到 `制作过程/视频方案审阅稿.md`，不另建额外草稿视图。系统 `tmpdir()`、进程间任务文件及一次性环境测试等 OS 临时机制保留，它们不属于需保留的制作记录。

旧项目尊重实际记录路径，不自动搬迁，也不同时维护两套权威文件。操作者明确要求迁移时，须同步方案路径字段、命令和脚本中的引用，再复查路径解析与文件一致性；不能只改文件名或文档示例。

## 十步制作流程

### Step 1 · 接收与保存输入

读取 `references/research-workflow.md` 第 1 步。完整读取材料，保留原文、链接、来源标识与图片/视频附件路径，保存到 `{项目}/制作过程/原始知识材料.md`。不静默改写源材料，不因音频环境未配置而阻塞输入。

### Step 2 · 研究与知识提取

按 `references/research-workflow.md` 第 2 步主动核查，保存 `{项目}/制作过程/知识解析与证据.md`：核心问题、知识点 ID、主张 ID、因果/比较/流程关系、来源 ID、证据范围、不确定性与风险。科普、科技、历史、数据内容同时读 `references/scientific-review.md`。科学审查表写入同一 `制作过程/知识解析与证据.md`，第 5 步汇入审阅稿，不另建审查文件。`source_fact` 只是材料所述，不等于已核验事实。研究放行不要求逐镜组件。

### Step 3 · 自动叙事设计

读 `references/narrative-design.md`。按理解顺序组织钩子、背景、机制/证据、边界、收束，不机械照搬原文；补充解释有依据、核心知识不丢、不无谓重复、不为钩子注水。规划知识覆盖、情绪节奏、相邻镜承接与独立 Outro。时长由完整性决定，不设总时长或压缩比上限。

### Step 4 · 逐知识点视觉规划

先只读取 `references/visual-planning-workflow.md`，按下列顺序执行；其余规范按该入口的具体问题查阅，不一次全文加载五份文件。

#### 4A · 明确知识目标与关系

从研究与叙事提取每镜必须看懂的主体、关系、证据边界；此时不选配色或动效。

#### 4B · 选择表达与主动作

按入口映射表选择 visualGrammar、shotLang 与主模式，只查对应模式/语法条目；默认停镜、低强度、无辅助模式，先确保画面表达知识。

#### 4C · 绑定组件与全局配置

先查真实组件再写参数；全片一次读取色板实际六键和固定字号角色，逐镜继承，不重选颜色/字号。记录 shot_type、visualElements 和组件复用/新建依据，不制作素材或生产代码。

#### 4D · 小批次兑现与衔接检查

按叙事段落约 3–5 镜一批，逐镜核对主张→画面关系、token 与可执行性，再核对跨批承接。结果写入同一 制作过程/视频方案审阅稿.md 的待整合规划区，Step 5 统一生成正式方案；不得为形式多样强行插氛围镜。

### Step 5 · 结构化方案与评测迭代

读 `references/video-plan.md`、`references/draft-review-workflow.md`。落盘同一 `planVersion` 的 `制作过程/视频制作方案.json` 与 `制作过程/视频方案审阅稿.md`，覆盖完整旁白、字幕、来源/主张映射、逐镜画面、组件参数、动效、时长估计、Outro、色板和字号。

执行 HKRR、7 维度评测、压缩比统计、知识覆盖与相邻镜衔接检查；按结果最多自动优化 3 轮。加权总分 ≥8 且维度 1–5 无单项 ≤5 才可正常呈现审批；3 轮仍未通过，呈现最优版与剩余问题，由操作者决定。

此阶段直接用Skill维护的 `scripts/script-stats.mjs --raw <实际源材料路径> --plan <实际方案路径>`统计预估有声字数/时长，不重新写统计脚本、不提前生成生产scenes.json。用render-review.mjs生成同版完整视图；人改稿后先处理差异，不覆盖用户修改。

### Step 6 · 人工 Review 卡点

呈现研究摘要与来源、完整方案、评测表、优化摘要、待决策项，停止等待操作者明确批准当前版本。批准前不写生产代码、不生成素材、不配音；评分通过不等于人工批准。

重新读取文件，不依赖会话记忆。人工改草稿须回写计划、递增版本、重新评测；任何计划变更立即令批准失效，设 `review.status: "pending"`、`review.reviewedVersion: null` 并清空 approvedBy、approvedAt、approvalEvidence。批准时设 `review.status: "approved"`，记录操作者、时间、明确批准依据与相同 reviewedVersion；不把旧版本的“OK/开始”套到新版本。

### Step 7 · Remotion 实现与素材制作

读 `references/production-workflow.md` 第7步并核对有效批准计划。执行Skill `scripts/init-project.mjs --project-root <实际项目根>`复制可运行模板，不重写字幕、入口、公共UI、基础脚本。`export-plan.mjs`生成完整scenes/全局样式/注册，保持有效实测时序；模型只生成每镜独立包装和题材相关几何。

使用 `validate-project.mjs`核对全字段、字体角色、版本、路径和组件；旧check-draft-sync仅旁白兼容，不能代替上述检查。运行生成工程typecheck/lint，画面知识兑现与相邻镜关系仍需审查。

检查画面兑现、相邻镜连续性、字幕安全区、帧驱动确定性与 Outro，执行 `npx tsc --noEmit` 等非渲染检查。不自动运行关键帧、短片段或最终 MP4；不能声称视觉通过。

### Step 8 · 配音与真实时长字幕同步

读 `references/production-workflow.md` 第 8 步。先重新读取计划与草稿对全字段，再检查已生成项目脚本；完成 ChatTTS 配置与可用性确认后生成音频。

按批准alignmentMode执行 `audio-pipeline.mjs --project-root <实际项目根> --generate --tts-batch chattts`；批处理全数成功后才归一化、一次性开场降速及原子回写measured数据。raw音频/处理指纹防重复降速，缺音频或部分失败阻塞；不手工拼接长shell命令。保留-16.60LUFS、openingTempo0.9、PAD0、tailSec及真实startSec，路线或额外tempo意图变更重新批准。

### Step 9 · 封面、发布文案与自动交付停止

读 `references/production-workflow.md` 第 9 步。先读计划与草稿对全字段，再运行实际存在的项目检查脚本。先只输出两版封面 SVG、标题与描述，不生成 PNG；V2 背景与视频首帧设计一致，封面使用同一批准色板。交付 SVG 后停止等待封面 Review，操作者明确确认当前文件后才将获批版本转换为 PNG；第 6 步方案批准不替代封面确认，SVG 修改后须重新确认。

交付项目代码、素材、配音、方案与封面文案后结束。明确列出非渲染检查结果，以及“尚未人工渲染/视觉验收”的状态，不继续自动渲染或反复自检。

### Step 10 · 人工启动 Remotion 与渲染质量检查

仅操作者主动启动本步，读 `references/render-quality-check.md`。先读取目标项目 `package.json` 再给实际 npm 命令；agent 不自动运行关键帧、短片段、最终 MP4。检查人工提供的关键帧、正常速度片段和成片；未渲染只能报告未验证。

问题按研究/叙事/规划/实现/同步/封面路由返回相应步骤。修改计划须重新走第 5–6 步并重置批准；修复后等待人工重新渲染。

## 交付树

```text
项目根/
├── 制作过程/
│   ├── 原始知识材料.md
│   ├── 知识解析与证据.md
│   ├── 视频制作方案.json
│   ├── 视频方案审阅稿.md
│   ├── 临时文件/
│   └── 渲染质检/
├── <project>-video/
│   ├── public/scenes/<slug>/scenes.json
│   ├── public/scenes/<slug>/audio/*.mp3
│   ├── public/scenes/<slug>/shots/*
│   ├── src/Scene.tsx、Video.tsx、subtitles.ts、types.ts
│   ├── src/ui/index.tsx
│   ├── src/effects/palette.ts、typography.ts、registry.ts
│   ├── src/effects/{sceneId}-{EffectName}.tsx
│   ├── project.config.json
│   └── scripts/run.mjs、render.mjs（调用Skill维护工具，不重写基础脚本）
└── 发布素材/
    ├── 标题.txt, 描述.txt
    ├── 封面v1.svg, 封面v2.svg
    └── 封面v1.png, 封面v2.png（仅对应 SVG 经封面 Review 确认后生成）
```

第 1–6 步只产生研究与方案文件；项目生产文件、音频、素材与封面在批准后产生。`scenes.json` 保留实际 `durationSec` 字段，不能用预估时长冒充音频实测。项目级临时统计放 `制作过程/临时文件/`，人工 QA 放 `制作过程/渲染质检/`，`out/` 只供人工最终 MP4。

## 关键约束

- 唯一生产依据是有效批准的 `制作过程/视频制作方案.json` 与同版草稿；第 7/8/9 步先重新读两者全字段，再用项目脚本核对，文字检查通过不代表 palette、motionPlan 或版本全覆盖。
- 所有生成色值引用 `palette.ts` 的 `bg / surface / ink / sub / accent / accent2`，实际六键值来自 `references/色板.md`，片尾遮罩同 `bg`；不逐镜硬编码或额外引色。
- 新项目排版版本review-v1-fixed：数值唯一来源 `assets/typography.json`，语义规则见typography.md。顶部标题52/800/sans、知识胶囊44/900、核心节点44/800/sans、结论44/800、字幕70/600/文楷、heroTitle96/900、heroSymbol140/900；字号/字重/行高/fontRole由共享组件一起绑定，不在Effect中自由覆盖。手写镜不改变顶部标题；不强制给钩子/Outro新增章节标题。旧ep5-v2-fixed工程不主动迁移。
- 默认禁顶部 eyebrow、品牌带、视频进度条、英文 chip/pill；即使旧项目实测有这些元素，也不自动加入新项目。section/series token 的存在不意味着默认增加栏目带。
- 统一安全区：顶部 0–150px 留白，内容 top≥150、左右≥40，主视觉建议止于 y=1360；字幕 top=1440、左右≥56、bottom≥250，y=1700–1920 不放内容。
- 字幕固定70px、单行≤13视觉字符，串行逐行、去尾标点、过滤纯标点片段、禁 nowrap 和动态缩字；默认中文。旁白与字幕仅允许中文发音等价替换，不丢信息。
- 每 scene 独立 `{sceneId}-{EffectName}.tsx`，可复用底层组件；K 类且 >8s 的知识镜不能只有锚点标题。先查组件再新增，不用多个主动作堆特效。
- 默认 paper + vox-light 平涂，不启用星空/渐变/发光；旧星空实现只供已批准旧项目兼容，不复制为新项目默认。
- 新项目独立 `npm install`，不复制其他项目 node_modules；复用全局 Chrome Headless Shell，缺失先提示操作者处理，不触发项目级重复下载。
- Outro 提前规划为独立最后一镜，只回顾/金句/署名；`tailSec=2.0–2.5s`、整片渐隐30–35帧；字幕只占有声区间，静场只呼吸/渐隐。
- 不新增 emoji、不新增代码注释；素材中的彩色 emoji 不直接送 resvg，改成可用符号或矢量图形。
- 第 9 步默认完成交付并停止；第 10 步人工启动，类型/源码检查不能替代渲染视觉验收。

## Effect 库（现有清单，按语义查找）

本表不是动效模式目录。先读 `references/motion-system.md`，再查目标项目的真实实现；旧色值、旧字号与旧背景须迁移到批准 token，名称出现不代表当前项目已存在组件或已验收。

| Effect | 类型 | 适用语义 | 视觉手法 |
|---|---|---|---|
| `CognitiveTrapEffect` | 内容型 | 看似简单/实为陷阱 | 汉字裂开、警示环与符号 |
| `UserReactionsEffect` | 内容型 | 用户真实反馈 | 人物与错峰气泡 |
| `MindsetRulersEffect` | 内容型 | 二元对立 | 两条进度尺与≠ |
| `PriorityDownweightEffect` | 内容型 | 本该优先却被降权 | 卡片从顶拖底，语义强调变化 |
| `PiggyBankEffect` | 内容型 | 体验漏洞 | 投入与流失示意 |
| `GoldenQuoteEffect` | 内容型 | 金句收尾 | 卡片逐行点亮 |
| `WordArithmetic` | 内容型 | 反直觉等式 | 逐 token 浮现 |
| `ModalIslands` | 内容型 | 多模态隔阂 | 色块与断裂虚线 |
| `PunWordSplit` | 内容型 | 一词多义 | 汉字拆开 |
| `WallHeader` | 锚点型 | 跨场景锚点，仅标题 | 数字与标签挂顶 |
| `OutroRecapEffect` | 收束型 | 回顾/金句/署名 | 编号错峰、横线收口、呼吸与出处 |

锚点型只用于≤8s 的过渡/挂顶，或组合为内容型顶部标题；长知识镜必须用内容型。已有组件无法兑现信息密度时才规划专用 Effect；正式库准入所需的渲染回归样例在第 10 步人工验证，不提前宣称已通过。

## 详细规范路由

| 内容 | 何时读取 |
|---|---|
| `references/research-workflow.md`、`references/scientific-review.md` | 第 1–2 步源材料与证据核查 |
| `references/narrative-design.md` | 第 3 步叙事、覆盖、情绪、Outro |
| `references/visual-planning-workflow.md` | 第 4 步唯一执行入口，顺序完成 4A–4D |
| `references/visual-system.md`、`references/色板.md`、`references/镜头语言.md`、`references/motion-system.md`、`references/typography.md` | 第 4 步按入口查相关条目，全局 token 一次读取；第 7 步检查实际所用规范 |
| `references/video-plan.md` | 第 5 步 JSON 契约与第 6 步版本审批 |
| `references/draft-review-workflow.md` | 第 5–6 步完整评测、统计与双向同步 |
| `references/production-workflow.md`、`references/code-templates.md` | 第 7–9 步素材、实现、音频与封面 |
| `references/render-quality-check.md` | 第 10 步人工启动与返工路由 |
