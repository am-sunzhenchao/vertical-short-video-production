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
├── SKILL.md              # 十步主流程与人工门禁
├── references/           # 按需查阅的规范文档（SKILL.md 内引用 references/xxx.md）
│   ├── visual-system.md      # 视觉规范：版面安全区、自动视觉规划、主题规范与 Effect 规范
│   ├── motion-system.md      # 标准动效模式、镜头语言、motionPlan 与视觉验收
│   ├── scientific-review.md  # 科学事实与表述风险审查
│   ├── research-workflow.md  # 输入与知识解析、证据核验
│   ├── narrative-design.md   # 自动叙事与重点解释
│   ├── video-plan.md         # 结构化视频方案与版本契约
│   ├── draft-review-workflow.md # 评测、压缩比、衔接与人工 Review
│   ├── production-workflow.md # Remotion 实现、音频与发布物
│   ├── render-quality-check.md # 人工启动渲染与质量检查
│   ├── typography.md         # review-v1-fixed完整排版合同
│   ├── code-templates.md     # 可执行工程资产与工具接口索引
│   ├── 色板.md                # 全局颜色唯一来源，默认 paper
│   └── 镜头语言.md            # 单镜镜头语言参考（十种单镜语法）
├── chattts/
│   ├── chattts_batch.py   # ChatTTS 批处理脚本（模型只加载一次）
│   ├── config.json        # ChatTTS 本地安装路径配置
│   └── voice_presets.json # 音色参数预设（embedding 唯一存放于 ChatTTS/speakers/）
├── assets/
│   ├── typography.json      # 字号、字重、行高与字体角色唯一执行来源
│   └── project-template/    # 可复制Remotion工程、共享UI、字幕与运行时
├── tests/                   # 工具与模板的非渲染回归测试
└── scripts/
    ├── init-project.mjs      # 批准后安全复制工程模板
    ├── export-plan.mjs       # 导出完整场景表达与注册，保留有效实测时序
    ├── render-review.mjs     # 同版方案生成人读视图，保护用户修改
    ├── validate-project.mjs  # 版本、数据、排版、注册与静态检查
    ├── audio-pipeline.mjs    # 全数TTS结果验证、幂等后处理与原子同步
    ├── render-cover.mjs      # 仅转换摘要匹配的获批SVG
    ├── script-stats.mjs      # 计划/实测有声统计，不重复生成脚本
    ├── check-draft-sync.mjs  # 旧稿旁白兼容检查，不代替全字段检查
    ├── svg2png.mjs           # 仅获批SVG单文件转换
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

首次需要配音时引导配置 ChatTTS 路径，写入 `chattts/config.json`；知识输入、解析和 Review 不受 TTS 配置阻塞。

---

## 核心流程（10 步）

| 步骤 | 职责 |
|---|---|
| 1 | 输入知识材料，保存原文 制作过程/原始知识材料.md |
| 2 | 知识解析，保存 制作过程/知识解析与证据.md，含问题、知识点、因果、证据、不确定性与科学审查表 |
| 3 | 自动设计叙事，确定顺序与重点解释 |
| 4 | 自动规划逐镜视觉表达，锁定色板与固定字号 |
| 5 | 生成 制作过程/视频制作方案.json 与 制作过程/视频方案审阅稿.md，汇入科学审查表并完成评测优化 |
| 6 | 人工 Review，明确通过后才能制作 |
| 7 | Remotion 实现与素材制作，执行非渲染检查 |
| 8 | TTS 配音、归一化与真实时长校准 |
| 9 | 两版封面 SVG 与发布文案保存到 发布素材/，停止等待封面 Review；确认后才转换获批版本为 PNG |
| 10 | 人工启动 Remotion 渲染与正常速度质量检查 |

---

## 视觉规划（默认自动，不必先选风格）

系统先按知识点选择逐镜表达与动作。新项目默认paper/vox-light；基础工程复制assets模板，完整排版使用review-v1-fixed：顶部标题52/800/PingFang、知识胶囊44/900、节点/结论44/800、字幕70/600/文楷；heroTitle96和heroSymbol140为明确规划的重音角色。颜色和字体由唯一配置与共用组件绑定，不逐镜重写inline字号/字重。操作者明确要求才覆盖，旧项目保持原批准设置。

---

## 关键约束（高频违规项）

- **顶部留白**：Effect 内容元素 `top ≥ 150px`，背景装饰层不限
- **TTS 中文化**：narration不得含英文术语或数字单位混排（`36G` → `三十六吉字节`）
- **编译与视觉验收分开**：第 7 步用 `npx tsc --noEmit` 检查类型；第 10 步由人工启动关键帧、短片段及最终 MP4 渲染，人工 QA 关键帧、短片段与检查记录输出到 `制作过程/渲染质检/`，禁止污染 `out/`；静态检查不代表视觉通过
- **Outro 三件套**：OutroRecap scene + tailSec 静场 + 整片渐隐，缺一不可
- **容器 opacity**：背景色块与子内容共用同一 opacity 变量，不得容器先于内容出现

完整约束见 `SKILL.md` 的阶段入口与对应 references 文档。

以下命令仅用于生成的视频项目；预览与出片由人工启动，先确认该项目 package.json 中实际存在对应 script，本 Skill 仓库不是 Remotion 视频项目。

---

## 常用命令

```bash
npm run dev
npm run render
npm run typecheck
npm run lint
npm run tts -- --generate --tts-batch chattts
npm run audio -- --scene S03 --generate --tts-batch chattts
npm run sync
```

以上只在已生成生产工程运行；预览/出片仍由人工启动。方案统计、初始化、审阅稿生成与封面转换使用Skill `scripts/*.mjs --project-root <实际项目根>`，接口见code-templates.md和各脚本--help。封面需明确批准当前SVG摘要后才转换PNG，不能以生成方案批准替代封面确认。

---

## 更新记录

| 月份 | 变更 |
|------|------|
| 2026-10 | 重构十步制作流程与按需视觉规划，默认 `paper/vox-light`，统一镜头动效、色板及 `review-v1-fixed` 排版规范 |
| | 新增可复制 Remotion 工程、共享 UI、方案同步校验与统一音频工具，复用全局 Chrome；保留方案审批与人工视觉验收 |
| | 制作记录集中到 `制作过程/`，封面与文案集中到 `发布素材/`；封面 SVG 经 Review 确认后再转 PNG |
| 2026-09 | 新增 `tts-single.mjs` 单场景重生成；TTS 中文化扩展至数字、单位及专有名词；顶部留白由 120px 调整为 150px，容器与内容共用 opacity；编译验证改为 `npx tsc --noEmit`，开场 S01 音频强制 `atempo=0.9` 降速；锁定默认音色为 `gentle_female`，补充相关约束与脚本 |
| 2026-08 | 初始创建竖版中文短视频制作 Skill 文档体系；新增 ChatTTS 批量合成集成，模型只加载一次；Effect 文件名规范改为 sceneId 前置（`{sceneId}-{EffectName}.tsx`） |
