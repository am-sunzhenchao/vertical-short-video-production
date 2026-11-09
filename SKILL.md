---
name: vertical-short-video-production
description: Use when producing a Chinese vertical (1080×1920) narrated short video for 抖音 / 微信视频号 — including "做竖版短视频"、"抖音/视频号视频"、知识口播/科普/观点解释视频、Kurzgesagt/Vox 风格解释片，或只是"写脚本/做封面/配音"其中一环时。也用于此类项目的分镜、字幕、TTS、封面、Remotion 实现。
---

# 竖版中文短视频制作

> **参考文件按阶段读取，不要提前全量加载**：
> - Step2 定风格 → `references/visual-system.md`（风格选择 / 决策树 / 版面 / 字幕结构）
> - Step2 定色板、Step4 上色 → `references/color-palette.md`（色值 / 各模式专属色板 / 默认色板 `paper`）
> - **Step2 写旁白与评测时才读** `references/draft-review-rubric.md`（改编硬规则 / 六类口播杀手 / **讲解者人格与表达规范 §0.2** / 镜头合并决策 / 七维评测 / 衔接检查 / 语速判定 / 样式确认表）
> - Step3 逐镜选 Effect → `references/effect-selection.md`（7 类组件 / 决策树 / 三型规则）
> - Step4 写字幕与画面文字 → `references/short-video-typography.md`（字体角色 / 字号 / 字幕条规则）
> - **Step4 写 Remotion 代码时才读** `references/code-templates.md`（46KB，早期阶段勿加载）

---

## 启动检查（首次验证，成功后复用）

ChatTTS 加载模型并试读耗时较长。已经成功使用过的语音环境复用验证记录，不在每次激活 skill、每个项目或每次生成前重复检查。

### 1. 读取配置与验证记录

使用本次加载的 skill 目录中的 `chattts/config.json`，不要同时检查 `~/.claude/skills` 和 `~/.codeflicker/skills` 两套路径；软链接指向同一目录时共用记录。

- 读取配置中的 `chatts_root` 和可选的 `validation` 对象。
- `validation.status` 为 `passed`，且记录中的 `chatts_root`、`python_command`、`tts_style` 与本次实际使用配置相同 → 直接进入正式流程；不重复探测目录、音色、依赖，不运行测试 TTS，也不要求用户再次确认环境。
- 验证记录跨会话、跨项目复用，不因时间流逝自动过期。每次仅比较配置值，不为判断缓存有效性加载模型、导入 PyTorch 或扫描环境。
- 只有配置不存在、记录缺失或损坏、相关配置变更、用户明确要求重验/告知环境变更，或实际 ChatTTS 生成出现环境故障时，才进入首次检查或恢复流程。
- `validation` 只缓存语音环境，不豁免草稿同步、字幕对齐、音量归一化或全局浏览器检查。混排文本的发音质量属于内容试读，不是环境复验；需要时仍按 Step5 检查。

### 2. 首次检查与配置引导

没有有效记录时，检查 `chatts_root` 是否包含 `ChatTTS/`、`speakers/` 和 `speakers/3_gentle_female_v2.txt`。配置缺失或路径无效时，再请用户提供安装目录，并说明具体缺失项。

配置写入时保留其他字段。仅检查目录/音色存在不能将环境标记为 `passed`；草稿阶段可以继续，不为建立缓存提前加载模型。

首次配置或音色发生变更时，按需检查 `speakers/04_jsjs_male_seed222.txt`；缺失时使用当前 skill 目录下的 `chattts/sync_speakers.py` 同步。缓存命中时不重复检查 Demo 音色。

### 3. 保存成功记录与异常恢复

在 Step5 首次单句试读成功，或已有一次同配置的真实 ChatTTS 生成成功后，确认进程退出码为 0、结果报告成功，且输出音频非空、可被 ffprobe 解析为时长大于 0 的音轨，再将记录合并写入同一 `chattts/config.json`：

```json
{
  "validation": {
    "status": "passed",
    "chatts_root": "/实际/ChatTTS/绝对路径",
    "python_command": "arch -arm64 python3",
    "tts_style": "gentle_female",
    "verified_at": "ISO-8601 时间",
    "verified_by": "single-test 或 successful-generation"
  }
}
```

- 保留配置中的 `chatts_root` 和其他字段，采用临时文件替换的原子写入方式；不保存音频内容、密钥或环境变量全集。
- 历史成功仅在存在可核对的同配置成功记录与有效音频时可迁移；用户说曾用过、或目录存在，本身不等于验证成功。没有证据时留待首次实际配音建立记录，不反复追问。
- 模块/模型加载、音色读取、解释器或架构错误等语音环境故障发生时，先使对应记录失效，再诊断并重新验证；不要无条件循环重试。
- 草稿不同步、文本发音不佳、输出目录权限或后续渲染失败，不自动归为语音环境故障。先处理实际原因，避免无关地重复加载模型。
- 缓存无法写入时明确说明后续无法跨会话复用；本会话已验证的结果仍可复用，不因写入失败再次试读。

---

## 项目规格

- 平台：微信视频号 + 抖音
- 视频：1080×1920，25fps；封面：1080×1440
- 栈：Remotion 4.x + ChatTTS / edge-tts + @resvg/resvg-js
- **视觉风格模式**：`kurzgesagt`（默认.扁平矢量科普）/ `tech-mint`（·深空薄荷）/ `vox`（图表驱动解释）/ `vox-light`（图表驱动·清爽浅底）/ `doodle-note`（手绘读书笔记），Step2 按**决策树**锁定，详见 references/visual-system.md
- TTS 引擎：ChatTTS
- 默认配音： `gentle_female`

## 交付物清单

```
项目根/
├── <project>-video/
│   ├── public/scenes/<slug>/scenes.json
│   ├── public/scenes/<slug>/audio/*.mp3
│   ├── src/<Composition>/Scene.tsx
│   ├── src/effects/*.tsx          ← Effect 命名：{sceneId}-{EffectName}.tsx，例：S04-Sandwich.tsx
│   │                                 **每个 scene 对应一个独立 tsx，禁止多 scene 共用同一 Effect 组件**
│   └── scripts/tts.mjs, sync-durations.mjs, render-cover.mjs
└── cover/标题.txt, 描述.txt, 封面v1.svg/png, 封面v2.svg/png
```

---

## 制作流程（强约束：Step1/2 未通过不得进入 Step3）

### Step 1 · 素材盘点（只读）

- [ ] ls 列出所有图片/视频/文档，逐一阅读,对于图片/视频，只需要理解文件名的含义即可，不需要读取文件内容
- [ ] **如果提供的是链接、用户粘贴的文本，需要落盘 `source.md`**，如果提供的是本机的文件名，则不需要落盘（作为 Step2 压缩比统计与忠实度核对的基准）
- [ ] 输出《素材盘点》：已有素材列表 + 缺口 + 核心论点

### Step 2 · 内容策划 → 草稿生成 → 结构审查 → 表达打磨 → 评测 → Review（强制卡点）

> **四段顺序不可调换**。最常见的失败是直接从 Step1 跳到写逐句旁白：一旦开始写逐镜文字，注意力就锁在局部表达上，每个知识点都想给一个镜头，镜数必然膨胀，之后再砍会被"怕丢信息"抵消。
> **先把讲什么、讲多少、为什么这个顺序定下来，再动笔。**
>
> 本文只保留流程与门禁；评测表、衔接检查表、合并决策表、改编硬规则、讲解者人格与表达规范全部在 `references/draft-review-rubric.md`，按 2C 的指引查阅。

#### 2A · 内容策划（动笔前必须完成）

> 这一段的产出是一张"内容设计卡"，写进 `draft-review.md`。**不写任何逐镜旁白。**
> 判定 `styleMode` 也在这一步做（走 references/visual-system.md 四问决策树），因为风格决定了内容能被怎么表达。

- [ ] **核心认知设计**（四问逐条填，写进 draft-review.md）

| # | 问题 | 约束 |
|---|---|---|
| ① | **核心问题**：观众看完能回答什么问题？ | 一个问题，不能是并列的多个 |
| ② | **核心结论**：全片最重要的一个判断是什么？ | **只能有一个**。超过一个说明这片子还没想清楚 |
| ③ | **记忆锚点**：观众应该记住的 2～3 个关键认知？ | **2～3 个，不得增加**。每个锚点后面要能说出落在哪些镜。若设了具象比喻（工作台/交接单/档案柜），须额外写明它**贯穿哪几镜、在哪一镜主动收束** |
| ④ | **认知变化**：看完之前 vs 看完之后，观众的理解差在哪？ | 用一句话写出"从 X 到 Y"，写不出说明选题没有增量 |

- [ ] **叙事骨架设计**（按素材勾选适用段，不适用直接标"跳过"）

技术解释类默认骨架，**这是可选段清单不是必填章节**：

| 段 | 叙事任务 | 观众获得 | 本片是否用 |
|---|---|---|---|
| 1 提出问题 | 悬念 / 冲突 / 认知误区 | 为什么我要看 | |
| 2 建立背景 | 问题发生的场景 | 我遇到的是什么情况 | |
| 3 解释原理 | 拆解核心机制 | 它到底怎么运作 | |
| 4 展示证据 | 案例 / 数据 / 实测 | 这个解释可信吗 | |
| 5 分析边界 | 代价 / 风险 / 限制 | 它有什么不足 | |
| 6 给出建议 | 操作策略 / 适用场景 | 我该怎么做 | |
| 7 总结认知 | 提炼核心结论 | 我该记住什么 | |

> 不允许机械套满七段。可以从案例直接进原理、可以把边界提前、可以没有实测；**但选了的段必须说清它承接哪一段、为什么顺序是这样。**

- [ ] **信息分层**（决定哪些内容进旁白、哪些只进画面、哪些直接删）

| 层 | 定义 | 处理 |
|---|---|---|
| 必须理解 | 核心概念、核心机制、关键结论 | 必须有旁白 + 主画面。缺一个就是结构缺口 |
| 帮助理解 | 案例、数据、类比、必要的技术细节 | 按时长与理解难度选择保留；可只进画面不进旁白 |
| 深入了解 | 产品实现细节、边缘情况、额外参数 | 默认省略，或压缩成一句限定 + 来源标注 |

> 分层在写旁白**之前**做。写完再删会痛，因为已经为它设计过画面。

- [ ] **镜头预算估算**（给出目标镜数与时长区间）

| 内容类型 | 建议单镜时长 |
|---|---|
| 简短钩子、转场 | 3～8 秒 |
| 单一观点、简单解释 | 8～15 秒 |
| 技术原理、机制说明 | 15～25 秒 |
| 复杂案例、数据分析 | 20～35 秒 |
| 结尾总结 | 10～18 秒 |

- 用户指定了时长 → 以目标时长为硬约束，反推镜数与每镜信息量。
- 用户未指定 → 按内容量估算区间（知识向 5～10 分钟常见区间为 **20～28 镜**，仅作初值，不是标准）。
- **写下一个目标镜数上限**，2C 结构审查按它收敛。没有数字时"考虑合并"必然被忽略。
- 超出预算时的处理顺序：合并重复解释 → 压缩"帮助理解"层 → 删除"深入了解"层 → **最后**才考虑延长视频或拆分系列。**不得删核心论点。**

**2A 放行门禁**：核心认知四问全填、叙事骨架勾选完成、信息分层有结论、目标镜数与时长写下来。四条不全不进 2B。

#### 2B · 逐镜旁白

- [ ] **动笔前先读 `references/draft-review-rubric.md` §0.2.0 讲解者人格**（三行生成先验，整体语气靠它偏移；写完再查规则表只能救局部）
- [ ] 按 2A 的叙事骨架与信息分层写旁白，**每个骨架段落下切几个 scene 由内容决定，不按知识点数量切**
- [ ] 每 scene 只标注 `shot_type`；**`effectName` 此阶段不填**，留到 Step3 视觉设计（见下方"为什么后置"）
- [ ] **过「三条改编硬规则」**（references/draft-review-rubric.md §0）：扩写上限 / 禁概览+细讲 / 钩子数量自检。任一不过先改到过，再进 2C
- [ ] **守单镜密度上限**（rubric §5.1）：单镜汉字 ÷ 预算秒数 ≤ 3.5 为舒适，> 4.5 字/秒为硬上限。超限先压旁白，不要指望配音念完
- [ ] **过口播质地快扫**（rubric §0.1）：跑 `node scripts/script-stats.mjs` 看「限定/免责句」和「讲座连接词」两项质地指标；再逐类过六类口播杀手。**类 5（比喻断层）和类 6（结尾清单化）为硬卡点，不过不进 2C**
- [ ] **旁白与字幕以中文叙述为主，保留英文术语、命令、文件名、数字和版本号原文**，不默认翻译、音译或改写；英文术语混排不等于双语字幕，不产出中英对照（除操作者明确要求双语）
- [ ] 以 markdown 呈现草稿，保证内容正确、连贯、逻辑清晰
- [ ] 跑 `node scripts/script-stats.mjs` 出压缩比与语速读数，**禁止口算**（模板见 references/code-templates.md §16）

**为什么 `effectName` 后置**：先选组件会让模型"手里有锤子看什么都像钉子"，反过来把内容裁剪成适合已有 Effect 的形状。例如"148,879 → 45,687"这一镜，先要定的是"这个数字怎么帮观众理解效果"，至于用 `BeforeAfterEffect` 还是别的，是视觉阶段的事。

#### 2C · 结构审查 → 表达打磨 → 评测 → 优化（必做，且顺序固定）

> **两轮分工**：① 先定"讲什么、逻辑对不对、事实准不准"；①.5 再管"怎么讲、听起来自不自然"。
> 顺序不能反——①会大改镜数，在即将被合并的镜头上润色语气是纯浪费。

- [ ] **① 镜头合并与删除审查**（rubric §1）：逐镜做"删除测试"，按合并/保留条件表过一遍，按 1.5 格式输出。
  - **目标是让镜数收敛到 2A 定的预算上限内**。超预算必须合并或删除，不许直接上调预算。
  - 禁止为每个知识点给独立镜头；也禁止为命中镜数而合并本应独立的内容。
- [ ] **①.5 表达层打磨**（rubric §0.2）：镜数锁定后做一轮"怎么讲"。跑 `node scripts/script-stats.mjs` 填 §0.2.5 自检表。
  - **先读 §0.2.1 预算约束**：人情味靠替换不靠增量，打磨后压缩比与密度**不得上升**
  - 五项原则 + §0.2.3 认知负载上限（单镜新概念 ≤2、连续抽象镜 ≤3）
  - **脚本出数的 9 项全部达标才进 ②**；「居高临下表达」命中即为硬错，必须改写
- [ ] **② 七维量化评测**（rubric §2）：总分≥8 且维度 1-5 无单项≤5 为通过。
- [ ] **③ 衔接连贯性检查**（rubric §3）：逐相邻镜过三问。**跳变处理按 3.2 优先序：改上一镜结尾 → 改下一镜开头 → 调顺序 → 复用画面 → 合并 → 最后才新增过渡镜**。
- [ ] **④ 核心论点保留清单**（rubric §4.1）：逐条映射到具体镜号。出现 ❌ 丢失必须补镜，不得放行；⚠️ 弱化须写明理由。
- [ ] 未通过则按 rubric §2.1 的 P0→P5 优先级优化，回到②重评，**最多 3 轮**

#### 2D · 呈现与落盘

- [ ] 通过后呈现：最终草稿 + 结构审查表 + **表达层自检表** + 评测表 + 衔接检查表 + 优化摘要 + **样式确认表**（rubric §6），**停下来等 review**
- [ ] **草稿落盘**到项目目录 `draft-review.md`：内容设计卡、场景表、结构审查表、表达层自检表、样式确认表、评测结果、文稿压缩比统计、语速核对、衔接连贯性检查表、核心论点保留清单
- [ ] **镜号必须全局一致**：合并/删除后重新编号，且同步更新所有引用旧镜号的表格（结构审查表、衔接检查表、保留清单、时间轴）。**落盘前跑一次 `node scripts/check-draft-sync.mjs` 校验镜数与引用一致性**
- [ ] 用户修改后**必须重新 read `draft-review.md`** 取最新草稿，禁止依赖会话记忆。进入 Step3/4/5 前先跑 `node scripts/check-draft-sync.mjs`，不一致先同步
- [ ] 3 轮迭代仍未通过时，呈现最优版本 + 剩余问题清单，让用户决定
- [ ] 操作者明确说"通过/OK/开始"前，**不写一行代码**
- [ ] **样式确认表须与草稿一起呈现**，不得在草稿通过后才单独询问


### Step 3 · 视觉素材

- [ ] **开工前先跑 `node scripts/check-draft-sync.mjs`**：确认 scenes.json 与最新 `draft-review.md` 一致，不一致先同步（机械门禁，防止草稿已被用户修改而沿用旧版）
- [ ] **此阶段才选 `effectName`**：逐镜按 references/effect-selection.md §3 决策树定组件。选型依据是"这一镜要用什么画面兑现旁白"，不是"手上有哪些组件可以派上用场"。
  - 若发现某个 Effect 用起来顺手，但需要改动旁白内容去配合它 → **改画面，不改旁白**。旁白内容在 2C 已经锁定
- [ ] **每个 scene 在 scenes.json 标注 `shot_type`，Step3 按标签路由素材来源**（见下表），标签在 Step2 编剧时确定
- [ ] 按 scene 类型决定素材来源（algorithmic-art / frontend-design / canvas-design / 手写SVG）
- [ ] **要制造视觉爽感的镜**（猎奇/反差/爆发点）：配高饱和撞色 + 节奏快切；Effect 选型走 `references/effect-selection.md §2.6`（场景与故事类），**不是**纯装饰动画
- [ ] **有知识点要讲的镜**：画面必须有视觉锚点，Effect 选型走 `references/effect-selection.md §2.2–2.5`（结构机制 / 对比权衡 / 数据趋势 / 时间过程）
- [ ] **情绪共鸣镜**：色调偏暖（金色/琥珀），人物/手写/温柔光晕元素，避免冷色硬朗风格
- [ ] SVG 内 emoji 全替换成 Unicode 符号
- [ ] 走 render-cover.mjs 输出 PNG，目检无豆腐方块；单张/任意 SVG 用 `node <skill>/scripts/svg2png.mjs <file.svg> [宽度]`（输出同名 .png，默认宽1080，可任意目录执行）

#### shot_type 分镜路由表（每镜打标签，决定素材来源）

| shot_type | 语义 | 素材来源（推荐 skill） | 产物 | 对应范式 |
|---|---|---|---|---|
| `effect` | 抽象概念/对比/枚举，用 Remotion 组件表达（默认） | **effect-selection.md** 选型 + code-templates 实现 | tsx 组件 | tech-mint |
| `infographic` | 讲清一组数据/结构/多项对比 | **designai-infographic-image**（9:16，理解结构，数字不糊） | PNG（首帧） | vox |
| `chart` | 单一图表铺满屏、旁白带读 | Remotion 精绘 或 designai-infographic-image | tsx / PNG | vox |
| `process` | 流程/步骤/关系/状态机 | **designai-process-map**（mermaid flowchart/mindmap） | PNG | kurzgesagt/vox |
| `flat` | 扁平矢量图标/拟物化概念，一镜一概念 | **designai-generate-image** + **prompt-generator**（负向：no gradient/glow/particles） | PNG | kurzgesagt |
| `atmosphere` | 氛围镜、隐喻镜、封面、转场 | **designai-generate-image**（图生图/风格参考） | PNG | 通用 |
| `doodle` | 概念隐喻手绘线稿，一镜一隐喻 | **代码手绘 SVG**（本 skill 手绘库，非生图；逐笔绘制动效） | tsx 组件 | doodle-note |

> **路由原则**：**有字有数走 `infographic`/`chart`（信息图/精绘图表，数字精确）；没字看气氛走 `flat`/`atmosphere`（生图）。** 混用会翻车：用生图画数据→数字乱码；用信息图画氛围→像 PPT 模板。
> **静帧即首帧**：所有 PNG 产物都可作为后续图生视频（万象/即梦）的首帧输入，链路互通。
> **提示词规范**：`flat`/`atmosphere` 生图前先用 prompt-generator 生成规范提示词，必须带 AI slop 负向约束。

### Step 4 · Remotion 实现

- [ ] **新项目统一复用全局 Chrome Headless Shell（强制）**：浏览器固定存放在 `~/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell`，新建项目的 `remotion.config.ts` 必须调用 `Config.setBrowserExecutable()` 指向该路径，禁止让每个项目在 `node_modules/.remotion` 重复下载 175MB 浏览器文件
  - 开工前验证：`test -x "$HOME/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell"`
  - 若全局浏览器不存在，先提示操作者安装/复制，不得直接触发项目级下载
  - 已有项目不主动修改；本规则只作用于本 Skill 后续创建的新 Remotion 项目
  - Remotion 升级后若提示浏览器版本不兼容，才更新全局文件；不要删除项目 `node_modules` 后重新下载一份
- [ ] 复制 references/code-templates.md 的模板：remotion.config.ts、StarfieldDrift、Scene.tsx、index.tsx、effects 骨架
- [ ] 生成 scenes.json（含顶层 `styleMode`、每镜 `shot_type`、`subtitle`；仅需要不同读法时提供可选 `narration`，仅多段对齐时提供 `subtitleSegments`）
  - `subtitle` 为正文，字幕与朗读相同则省略 `narration`，不写空字符串或复制正文；单段 TTS 使用 `narration ?? subtitle`。
  - `subtitleSegments` 至少包含两段，只有一段时省略并使用整镜 `narration` 处理特殊读法。`subtitleSegments[].text` 从正文切分，保留英文原词；分段 TTS 使用 `segment.narration ?? segment.text`，朗读覆盖仅保存在有差异的分段，不重复保存整镜 `narration`。字幕只显示 `text`。
  - 统计、Effect 时间轴和单场景重生成均须支持省略 `narration`；取值规则见 references/code-templates.md §6。已有项目不主动迁移。
- [ ] **底色按 styleMode**：`tech-mint` → Effect 用所选背景色方案渐变（不用实色/transparent 走星空）；`kurzgesagt` → 单一深色块纯底、无渐变无星空；`vox` → 近黑纯底、图表铺满；`vox-light` → 所选浅底方案纯色实底（默认 `#F4F8F7`），色板集中到 `src/effects/palette.ts`，字幕转深色、渐隐遮罩同底色、禁用发光
- [ ] **画面兑现检查（强制卡点·纯代码审查）**：逐 scene 对照 subtitle，把其中的**可视化素材**落到 Effect 画面上，不得只显示标题。**通过阅读 Effect 代码核对，不通过渲染关键帧验证**
  - 检查方法：把 subtitle 拆成「关键名词 / 数据 / 对比 / 流程 / 枚举」5类元素，逐个确认在 Effect 里有对应视觉呈现
  - 例：subtitle 含「单线程 vs 多线程」→ 画面必须有左右对比；含「内存飙升」→ 必须有增长可视化；含「版本混乱」→ 必须有多元素散布；含「①②③④」→ 必须逐项展开
- [ ] **编译验证用 `npx tsc --noEmit`**（每批 Effect 写完后执行一次）：只做类型检查，不产生任何输出文件，不污染 `out/` 目录
  - **知识场景且 durationSec > 8s**：禁止只用锚点型 Effect，必须配内容型 Effect（类型定义见 references/effect-selection.md §4）
- [ ] **画面连贯性检查（强制卡点·纯代码审查）**：逐相邻 Effect 对照，确认三点——① 视觉锚点承接（元素/位置/强调色至少一项延续，不得每镜另起一套视觉语言）；② 入场方向与上镜出场不冲突（避免相邻镜反向滑动打架）；③ 过渡镜 Effect 必须"承上启下"（画面同时出现上镜元素的收束形态与下镜元素的雏形），不能只放一句标题
- [ ] 字幕：固定70px，每次只显示一行（≤13视觉字符），串行逐行，三级切割（强标点→逗号→机械截断），禁 nowrap
- [ ] **字幕分片去尾标点**：每个分片展示时，去掉末尾的标点符号（，,。.；;、！!？?：:… 等），只保留正文；标点仅用于切割断句，不参与显示
- [ ] 标题文字：不超过16个字符，超出部分截断，加 `whiteSpace: "nowrap"`
- [ ] **节奏规则**：
  - 前3秒 scene：必须用冲突/悬念/反转开头，禁止平铺直叙（❌"今天我们来讲…"）
  - **节奏检查而非节奏强制**：每隔一段时间检查"这十几秒有没有信息进展或视觉变化"。变化可以是新信息、新案例、新对比、画面演进、重点标注或有意设计的停顿——**不要求每 15 秒必须抛新知识点**。复杂机制允许连续 20～30 秒讲完，此时靠画面分层演进维持注意力，不要为了凑看点而中断解释换概念。
  - 快切 scene 与慢叙事 scene 保持节奏区分（快镜短、叙事镜长）
  - **超长镜处理顺序**：先判断"是这一镜内容真的多，还是一镜承载了多个独立任务"。
    - 内容真的多（一个概念需要完整讲透）→ **保留长镜**，用画面分阶段演进 + 字幕分段维持节奏，不拆
    - 一镜承载多个独立任务 → **拆镜**，每镜只留一个任务
    - 密度超标（> 4.5 字/秒）→ **先压旁白**，压不下来再拆
    - ❌ 禁止仅因"时长超过某阈值"就拆镜；拆出来的短镜若没有独立信息价值，等于注水
  - 结尾倒数2个 scene：节奏放慢 + 情感升华，配合卡点配乐（durationSec ≥ 8s）
  - **总时长**：内容完整性优先，但需兼顾注意力与视频定位。用户指定时长时以目标为约束；未指定时按 2A 估算的区间执行。超预算按 2A 处理顺序压缩，**不得直接删核心论点**。

### Step 5 · 音频

- [ ] **跑 TTS 前先跑 `node scripts/check-draft-sync.mjs`**：草稿可能已在用户侧二次修改，必须校验 `subtitle` 与草稿、分段 `text` 与正文一致；有朗读覆盖时另外核对含义，避免配音与字幕错位
- [ ] **按 Step2「语速极差」判定选路**（见文稿压缩比统计）：
  - 极差 ≤ 1.0 字/秒 → **单段 TTS**（每 scene 整段一次调用，韵律自然）+ 字幕按汉字数比例分配时间
  - 极差 > 1.0 字/秒 → **多段 TTS**（按 `subtitleSegments` 逐句生成）+ ffmpeg concat + `startSec` 回写
- [ ] **按启动检查的验证记录决定是否试读**：同配置 `validation.status = passed` 时直接批量生成，不重复运行测试 TTS。只有首次无有效记录或环境恢复时，在此阶段执行单句试读：使用配置中的实际 `chatts_root`、解释器和音色，输出到唯一临时音频路径；确认退出码为 0、结果成功且 ffprobe 检测到有效音轨后保存验证记录。真实生成成功也可建立记录；环境故障使记录失效，诊断后再验证。缓存命中不免除混排术语的按需发音试读。
- [ ] **ChatTTS 批处理模式**（默认）：`node scripts/tts.mjs`
  - 内部调用 `chattts_batch.py`，**模型只加载一次**，所有 scene 顺序生成，避免 CLI 模式每次重新加载导致超时
  - 每个 scene 可在 `scenes.json` 中设置 `ttsStyle` 字段指定独立风格；不设则使用默认风格
  - 超时上限设为 20 分钟（`1200_000ms`），足够 30+ 个任务完成
- [ ] **切 Edge-TTS**（备用）：`TTS_ENGINE=edge node scripts/tts.mjs`
- [ ] **换全局风格**：`CHATTTS_STYLE=calm_male node scripts/tts.mjs`（优先级低于 scene 级别的 ttsStyle）
- [ ] `node scripts/sync-durations.mjs`（PAD=0，精对齐）
- [ ] subtitleSegments 多段：批处理生成各 part → ffmpeg concat → 回写真实 startSec
- [ ] **音量归一化**：所有 MP3 统一归一化到 **-16.60 LUFS**（以首个制作项目的 S09 为基准测量值）
  ```bash
  for f in public/scenes/<slug>/audio/S*.mp3; do
    ffmpeg -y -i "$f" -af "loudnorm=I=-16.60:TP=-3.59:LRA=1.20" -ar 44100 "${f%.mp3}_norm.mp3" && mv "${f%.mp3}_norm.mp3" "$f"
  done
  ```
- [ ] **第一个 scene 音频降速 0.9**（强制）：开场语速过快观众无缓冲直接跳出。全量 TTS 生成并归一化后，对 S01 单独执行降速 + 重新归一化 + sync：
  ```bash
  f="public/scenes/<slug>/audio/S01"
  ffmpeg -y -i "$f.mp3" -af "atempo=0.9,loudnorm=I=-16.60:TP=-3.59:LRA=1.20" -ar 44100 "${f}_norm.mp3" -loglevel error
  mv "${f}_norm.mp3" "$f.mp3"
  node scripts/sync-durations.mjs
  ```
  > ChatTTS `InferCodeParams` 不支持 `speed` 参数，语速调整只能走 ffmpeg `atempo`（建议 0.85~0.95，超出范围音质明显损失）。
- [ ] **单场景重新生成**（旁白修改后）：全量重跑浪费时间，用 `scripts/tts-single.mjs` 只重新生成指定 scene（模板见 references/code-templates.md §21）：
  ```bash
  node scripts/tts-single.mjs --scene S03   # 生成 + 归一化 + sync-durations 一步完成
  ```
  > ⚠️ `chattts_batch.py` 内部执行 `os.chdir(CHATTS_ROOT)`，output 路径**必须是绝对路径**（用 `os.path.abspath()`），否则文件写到 ChatTTS 目录而非项目目录，难以排查。`tts-single.mjs` 模板已内置此处理。

#### ⚠️ ChatTTS 环境故障

四类必踩的坑（CLI 模式超时 / `PYTHONPATH` 未设 / `arch -arm64` 前缀 / 相对路径失效）的根因与处理见 `references/code-templates.md` §22。**只在真实报错时查，不要提前探测环境。**

### Step 5.5 · 片尾收束（强制，防「话说完就黑」）

内容讲完直接切黑是最常见的生硬收尾。**每部片必须有一个独立的 Outro scene + 整片渐隐**，三件套缺一不可：

| # | 要件 | 做法 | 参数基准 |
|---|---|---|---|
| 1 | **Outro scene** | 全片最后追加一镜（`S{last}-OutroRecap.tsx`），内容为「N 步回顾」或「一句金句 + 出处/署名」。**禁止**把它写成新知识点 | 旁白 20–30 汉字，约 5–6s |
| 2 | **静场留白（`tailSec`）** | Outro 的 `durationSec = 音频时长 + PAD + tailSec`；静场内画面继续呼吸（极缓 scale/translate），不静止 | `tailSec` = 2.0~2.5s |
| 3 | **整片渐隐** | Composition 入口叠一层与底色同色的 `AbsoluteFill`，最后 N 帧 opacity 0→1 | `FADE_OUT_FRAMES` = 30~35 |

**Outro 版式模板（三步回顾）**：三条编号胶囊错峰弹入 → 一条横线收口 → 大字金句（带呼吸）→ 底部出处行淡入。最后一条胶囊与金句加 `1 + 0.012 * Math.sin(f * 0.09)` 呼吸，避免静场段完全冻结。

**配套的两处必改（漏掉必翻车）**：

- **`sync-durations.mjs` 必须支持 `tailSec`**（`durationSec = 音频 + PAD + tailSec`），否则每次重跑 TTS 都会把静场留白冲掉
- **`Scene.tsx` 字幕只在有声区间内分配**（用 `durationInFrames - tailFrames` 而非 `durationInFrames`），否则字幕会被摊到静场里、比人声慢 30~40%

> 完整实现见 `references/code-templates.md`：§17 Outro 组件、§18 整片渐隐、§19 `tailSec` 两处必改。

**Outro Effect 的时间轴必须收在音频帧内**：最后一个元素的 `trigger + duration` ≤ `音频秒数 × fps`，静场只留给呼吸和渐隐。写完用「最后触发帧 vs 音频帧数」核对一次。

### Step 6 · 发布物

- [ ] V1+V2 封面：问句 + 格式化核心内容，V2 背景与视频首帧一致，只生成svg文件，不生产png
- [ ] 标题.txt（问句≤16字符）+ 描述.txt（≤1000字符，结尾#标签）

---

## 交付边界（默认收尾，不主动越界）

- **默认交付物 = Step4 项目代码 + Step5 TTS 配音 + Step6 封面/文案**。三者产出后即视为完成，向用户交付并结束。
- **不做关键帧渲染自检**：画面正确性靠 Step4「画面兑现检查（纯代码审查）」保证；不主动 `remotion still` 渲染帧来目视验证。
- **编译验证用 `tsc --noEmit`，不用 `remotion still`**：每次写完 Effect 代码需确认编译通过时，使用 `npx tsc --noEmit` 做类型检查，不得以「验证编译」为由触发 `remotion still`——后者会在 `out/` 目录生成大量无用 PNG 文件，且违反上一条规则。
  ```bash
  npx tsc --noEmit   # ← 编译验证的正确方式，不产生任何输出文件
  ```
- **`out/` 目录只用于最终出片**：`out/` 目录仅供 `remotion render`（`npm run render`）输出 mp4 使用，不得写入任何 PNG 或中间文件。若操作者要求渲染关键帧，输出到 `/tmp/` 而非项目 `out/` 目录。
- **不渲染 mp4**：默认不跑 `remotion render`。用户可自行 `npm run dev` 预览、`npm run render` 出片。
- 仅当**操作者明确要求**「渲染看看 / 出 mp4 / 帮我核对某镜画面」时，才渲染关键帧或成片。

---

## 否定项（直接绕开，按类分组）

**说明**：本节只列各 Step 章节没有展开的红线。流程类约束（跳过 Step1/2、不跑 `check-draft-sync`、口算时长、`remotion still` 自检、styleMode 未确认就写码、未经授意渲染 mp4、项目级 Chrome 下载等）已在对应 Step 写明，不在此重复。

**视觉红线**

- ❌ 视频底部进度条；顶部 eyebrow / 底部品牌带
- ❌ 英文 chip/pill 短标（如 `[BUG]`）
- ❌ Effect 内时间用百分比（用绝对帧数）
- ❌ Effect 内 3D rotateY 翻页（竖屏变形）
- ❌ 配图 objectFit: cover（用 contain）

**版式硬指标**

- ❌ Effect 字号过小（说明文字≥40px，中文标题≥80px，Badge≥26px；完整角色字号见 references/short-video-typography.md）
- ❌ Effect 内容元素 `top` 小于 150px——顶部 0–150px 为平台留白区；背景装饰层（全幅散点/粒子/纹理，无文字无图形）不受限
- ❌ 短标签/短词（版本号、语言名、卡片标题、Badge）未加 `whiteSpace: "nowrap"` 导致换行
- ❌ 字幕 `bottom` < 250px（平台安全区锁定）

**Effect 结构与命名**

- ❌ 总览 scene 后分项无视觉锚点（用 `WallHeaderEffect` 挂顶）
- ❌ Effect 文件名把 sceneId 放在后面（如 `LoopEffect-S19.tsx`）——查找键必须在最前，否则 `ls` 与编辑器模糊搜索按语义名排序，和片子时间轴无关，改某一镜要先全目录 grep 才能定位

**字幕切分算法**

- ❌ splitToLines 时序溢出 segEnd（chunks 过多导致后半段字幕不显示）
- ❌ chunkText 产生纯标点片段（切割后无汉字/字母/数字的 chunk 须过滤）

**叙事**

- ❌ 连续叙述拆成两个 scene（用 subtitleSegments 合并）
- ❌ 跳过 2C①.5 表达层打磨直接评分（rubric §0.2.5 自检表前 9 行须由脚本出数并达标）
- ❌ 表达层打磨后压缩比或单镜密度上升（人情味靠替换不靠增量，见 rubric §0.2.1）
- ❌ 旁白出现居高临下表达（「显而易见」「很简单」「不难理解」「众所周知」）——`script-stats.mjs` 命中即为硬错
- ❌ 把个人判断写进正文（只允许出现在 Outro）；推测句不带软标记（「目前看」「我倾向于认为」）
- ❌ 为兑现「从人的问题出发」而虚构用户经历、对话或实验结果
- ❌ 设问超出 §0 规则3 的 3 个钩子预算（表达规范不另给额度）
- ❌ 连续 4 镜以上无具体锚点（类比/案例/数字/具体动作），全是术语对术语——`script-stats.mjs`「钩子与具体性」表直接报错
- ❌ 单镜塞 >2 个新概念（认知负载上限，见 rubric §0.2.3）

**构建**

- ❌ 复制其他项目的 `node_modules`（native binding 按机器架构解析，跨项目复制必缺平台二进制；一律 `npm install`，装完用 `npx tsc --noEmit` 做编译烟雾测试）

---

## Effect 选型

组件清单、7 大语义分类（概念认知 / 结构机制 / 对比权衡 / 数据趋势 / 时间过程 / 场景故事 / 总结结论）、
三型规则（锚点型 / 内容型 / 收束型）、逐镜决策树——**全部见 `references/effect-selection.md`**。

本文件不维护组件名清单，避免两处不同步；Step2 选型、Step3 路由、Step4 写组件前都回该文件查。

---

## 与其他 skill 协作

### 视觉素材生成 skill（已安装，接口速查；路由归属见 Step3 表，不在此重复）

| skill | 服务的 shot_type | 接口要点 |
|---|---|---|
| `designai-infographic-image` | infographic / chart | 支持 9:16；依赖 `designai-generate-image`；stdout 末行输出图片 URL |
| `designai-generate-image` | flat / atmosphere | 默认 GPT-Image-2；stdout 末行输出图片 URL，落盘 `.last_image_url` |
| `prompt-generator` | flat / atmosphere（前置） | 纯本地模板，`prompt.sh image "主题" --style ...`；必须追加 AI slop 负向串 |
| `designai-process-map` | process | 输出 mermaid → 图，默认 flowchart TD |
| `script-visual-breakdown` | S2→S3 拆解 | 输入人物小传+剧本，输出多图参考结构化表格 |

> `vox` 图表禁止用生图模型画（数字必糊），走 infographic 或 Remotion 精绘。AI slop 负向串定义见 references/visual-system.md「AI slop 红线」。

### 场景表达手法（按 scene 语义）

| scene类型 | 推荐skill |
|---|---|
| 抽象概念/数据可视化 | `algorithmic-art` |
| 仿真UI/Web截图 | `frontend-design` |
| 海报/信息图 | `canvas-design` |
| 矢量动效 | `lottie` + `@remotion/lottie` |
| 整片调性切换 | `theme-factory` |
| 流程图/架构图 | `drawio-flowchart` |
| Skill维护 | `skill-creator` |
