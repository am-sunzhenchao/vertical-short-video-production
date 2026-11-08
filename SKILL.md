---
name: vertical-short-video-production
description: Use when producing a Chinese vertical (1080×1920) narrated short video for 抖音 / 微信视频号 — including "做竖版短视频"、"抖音/视频号视频"、知识口播/科普/观点解释视频、Kurzgesagt/Vox 风格解释片，或只是"写脚本/做封面/配音"其中一环时。也用于此类项目的分镜、字幕、TTS、封面、Remotion 实现。
---

# 竖版中文短视频制作

> **参考文件按阶段读取，不要提前全量加载**：
> - Step2 定风格 → `references/visual-system.md`（风格选择 / 决策树 / 版面 / 字幕结构）
> - Step2 定色板、Step4 上色 → `references/color-palette.md`（色值 / 各模式专属色板 / 默认色板 `paper`）
> - Step2 逐镜选 Effect、Step3 路由 → `references/effect-selection.md`（7 类组件 / 决策树 / 三型规则）
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

### Step 2 · 草稿生成 + 评测优化闭环 + Review（强制卡点）

- [ ] **按 references/visual-system.md「风格选择决策树」四问判定 `styleMode`**，把逐问结论写进样式确认表（操作者已给参考片则风格由参考片决定，只判定可行性）
- [ ] 写全片逐句旁白，切 N 个 scene；每 scene 标注 `shot_type`，走 `effect` 的镜按 references/effect-selection.md §3 决策树选定 `effectName`
- [ ] **旁白与字幕以中文叙述为主，保留英文术语、命令、文件名、数字和版本号原文，不默认翻译、音译或改写**；英文术语混排不等于双语字幕，不产出中英对照（除操作者明确要求双语）
- [ ] **以 markdown 呈现草稿**
- [ ] **草稿内容要尽量完整，保证内容正确、内容连贯、逻辑清晰**
- [ ] **过「三条改编硬规则」**（见下方）：扩写上限 / 禁概览+细讲 / 钩子数量自检。任一不过，先改到过，再评测
- [ ] 草稿写完后立即执行「7维度量化评测」（见下方），按评测结果自动优化迭代
- [ ] **执行「衔接连贯性检查」**（见下方），逐相邻镜核对叙事过渡与画面延续，缺过渡处补过渡镜
- [ ] 评测通过（总分≥8且核心维度1-5无≤5）后，呈现最终草稿 + 评测表 + 优化摘要 + **样式确认表**，**停下来等 review**
- [ ] **草稿落盘**：将最终草稿（含场景表、样式确认表、评测结果、**文稿压缩比统计**、**衔接连贯性检查表**）写入项目目录下 `draft-review.md` 文件，方便用户直接在文件中修改草稿和样式，减少交互轮次
- [ ] 用户修改完成后，**必须重新 read `draft-review.md` 文件**以获取最新草稿，再进入 Step 3。**禁止依赖会话上下文中的草稿记忆**——用户随时可能直接改文件，上下文里的版本随时过期。进入 Step3/4/5 任何一步前，先跑 `node scripts/check-draft-sync.mjs`（模板见 references/code-templates.md §20），不一致则同步后再继续
- [ ] 3轮迭代仍未通过时，呈现最优版本 + 剩余问题清单，让用户决定是否继续
- [ ] 操作者明确说"通过/OK/开始"前，**不写一行代码**
- [ ] **样式确认表须与草稿一起呈现**，不得在草稿通过后才单独询问

#### 7维度量化评测（草稿生成后必须执行）

基于原始素材与草稿逐条对照，按以下7个维度打分（1-10），计算加权总分。

| # | 维度 | 权重 | 评判要点 |
|---|------|------|---------|
| 1 | 内容忠实度 | 15% | 草稿是否完整传达素材核心观点与关键信息？有无遗漏、扭曲或过度发挥？ |
| 2 | 开场钩子 | 20% | 前3-5秒能否瞬间抓住注意力？钩子是否有悬念/冲突/情绪冲击？是否避免平淡叙述式开场？ |
| 3 | 叙事结构 | 15% | 是否有清晰的"钩子→展开→高潮→收束"节奏？信息密度是否适配短视频消费节奏？转场逻辑是否自然？ |
| 4 | 视听可执行性 | 15% | 画面描述是否具体到可直接指导拍摄/剪辑？旁白/字幕是否口语化、节奏感强？BGM/音效提示是否合理？ |
| 5 | 情绪曲线 | 15% | 是否设计了明确的情绪走向？中段是否有情绪转折/喘息点？结尾是否有记忆点或行动引导？ |
| 6 | 平台适配度 | 10% | 是否适配微信视频号/抖音（竖屏9:16、社交传播）？语速与单镜信息密度是否合理？**不因总时长长而扣分** |
| 7 | 制作可行性 | 10% | 画面/特效/素材需求在现有条件下是否可实现？是否有过度依赖高成本制作的段落？ |

**评分输出格式**：

```
| 维度 | 得分(1-10) | 简评 |
|------|-----------|------|
| 内容忠实度 | | |
| 开场钩子 | | |
| 叙事结构 | | |
| 视听可执行性 | | |
| 情绪曲线 | | |
| 平台适配度 | | |
| 制作可行性 | | |

**加权总分**：XX/10

**最终判定**：
- ✅ 可呈现用户 — 总分≥8且维度1-5无单项≤5
- ⚠️ 需优化后重评 — 总分6-7.9，或维度1-5任一≤5
- ❌ 需重写 — 总分<6

**修改建议**（如适用）：
按优先级P0-P5列出具体修改点，每条含：问题→建议改法→预期效果
```

#### 衔接连贯性检查（草稿落盘前必须执行 · 强制卡点）

跳变是长知识向片子最常见的硬伤：上一镜还在讲"怎么跑"，下一镜突然开始讲"怎么判分"，观众掉线。**逐相邻镜对（S(n) → S(n+1)）过一遍三问**，把结论写成表格。

**三问**

| # | 检查项 | 判断方法 | 不通过的处理 |
|---|---|---|---|
| ① | **叙事是否承接** | 上一镜的落点（结论/动作）能不能直接接住下一镜的开头？两镜是否属同一话题层级？跨章节（原素材换大节）尤其高发 | 补一条**过渡镜**：用「上一镜的结果 + 一个设问」引出下一镜（例：「逐条判完，单个用例的好坏有了。要看这个 skill 到底值不值，还得把结果聚起来看。」） |
| ② | **画面是否延续** | 下一镜的 Effect 是否复用/演化上一镜的视觉元素（同一图形被放大、缩小、拆开、汇总），还是完全另起一套？ | 让相邻 Effect 共享一个视觉锚点：元素承接（上镜的卡片缩小成下镜的一行）、位置承接（同位置生长）、色彩承接（强调色延续） |
| ③ | **口播是否有连接词/钩子** | 下一镜首句是否有承接语（「但」「所以」「到这一步」「那么」）或回指上一镜的名词？还是硬起一个新概念？ | 首句加承接语或回指；概念型新话题必须先给一句"为什么现在讲它" |

**过渡镜的三种写法（按跳变类型选）**

| 跳变类型 | 过渡镜写法 | 示例 |
|---|---|---|
| 换章节（流程 → 判定 / 判定 → 统计） | **结果 + 设问**：先收上一段的产物，再问"然后呢" | 「第一轮跑完，你手里只有一堆输出。它到底算合格，还是不合格？」 |
| 换视角（逐条 → 整体 / 整体 → 逐条） | **缩放隐喻**：画面 zoom out / zoom in，旁白点明视角切换 | 「但平均值会掩盖细节，真正有用的信息藏在逐条断言里。」 |
| 换主体（机器 → 人 / 断言 → 人工） | **边界声明**：说清前一手段的盲区，引出新主体 | 「但断言只能覆盖你预想到的东西，想不到的问题还得靠人看。」 |

**输出格式（写入 draft-review.md）**

```
## 衔接连贯性检查

| 相邻镜对 | ①叙事承接 | ②画面延续 | ③口播钩子 | 结论 / 处理 |
|---|---|---|---|---|
| S01 → S02 | ✅ | ✅ | ✅「所以」 | 通过 |
| S08 → S09 | ❌ 跨章节 | ⚠️ 元素另起 | ❌ 硬起概念 | 补过渡镜 S08C（结果+设问），并让 S09 复用 S08C 的尺子图形 |

- 相邻镜对总数：N｜通过：N1｜补过渡镜：N2｜调整画面承接：N3
- 新增过渡镜清单：S08C / S13C / S15 / S17 …
```

> **放行条件**：所有 ❌ 项都必须有处理结论（补过渡镜 / 改画面承接 / 改首句），不允许留"已知跳变但不处理"。
> 过渡镜属于**结构必需件**，不受时长与压缩比影响，不得为了缩短片长删掉。

> **总时长不设上限**：镜数与总时长由内容完整性决定。长知识向题材做到 5~10 分钟也合法，不得为了压时长删减论点或砍过渡镜。

> **关键副产物 · 决定字幕对齐方案**：统计每镜语速的极差 `max − min`。
> - **极差 ≤ 1.0 字/秒**（语速均匀）→ 可用「**单段 TTS + 字幕按字数比例分配时间**」，韵律自然且误差极小
> - **极差 > 1.0 字/秒**（语速不均）→ 必须走「**多段 TTS + `startSec` 回写**」，否则字幕会漂
> 这一判定要写进 draft-review.md，Step5 按它选路。含英文术语或数字时，汉字计数不能代表实际朗读量，须结合混排句试读时长核对语速；不能只凭汉字极差选择字幕对齐路线。

**精简内容归纳（固定 6 类，逐类给例子 + 字数量级）**

| # | 类型 | 典型特征 |
|---|---|---|
| 1 | 重复表述 | 原文同一观点换句话说了两遍 |
| 2 | 书面语连接词 | "在此之上，再去追求第三点" → "第三层" |
| 3 | 同类枚举收敛 | 5 个并列例子砍到 4 个代表项 |
| 4 | 解释性从句 | "拥有一份可以支撑家庭日常开销的收入，保证一家老小衣食无忧" → "先守住基本盘" |
| 5 | 限定/让步语 | "只是这件事可遇而不可求，不能强求一蹴而就" |
| 6 | 段落复述合并 | 原文结尾复述前文路径，与某一镜重合 → 合并 |

> 归纳的目的是**证明砍掉的是冗余而非信息**。若某类砍掉的字数占比 > 40%，说明改编偏向单一手法，需检查是否误删论点。

**输出格式（写入 draft-review.md）**

```

### 核心论点保留清单

| # | 原始论点 | 落在哪一镜 | 状态 |
|---|---|---|---|
| 1 | … | S0X | ✅ 保留 / ⚠️ 弱化 / ❌ 丢失 |

> 出现任何 ❌ 丢失 → 回到草稿补镜，不得放行

### 语速核对

| 项目 | 值 | 判定 |
|---|---|---|
| 总时长 | XXX.Xs | — |
| 全片语速 | X.XX 字/秒（XXX 字/分） | ✅ |
| 每镜语速极差 | X.X 字/秒 | ✅ 均匀 → 单段 TTS + 比例分配字幕 |
```

#### 自动优化迭代规则


1. 评测后若判定为⚠️或❌，按修改建议P0→P5优先级自动优化草稿
2. 优化后重新执行7维度评测
3. **最多3轮迭代**：
   - 第1-2轮：自动优化+重评
   - 第3轮仍未通过：呈现最优版本 + 剩余问题清单，让用户决定是否继续修改或接受当前版本
4. 优化重点优先级：
   - **P0**：情绪曲线断裂（中段连续密集输出、无喘息点）
   - **P1**：信息过载（单场景塞入过多知识点、语速>350字/分钟）
   - **P2**：内容遗漏（素材核心论点未覆盖）
   - **P3**：节奏拖沓（可压缩的冗余段落）
   - **P4**：视听描述不具体（缺少画面/音效指引）
   - **P5**：过渡生硬（场景间缺少衔接）

#### 最终呈现格式（呈现给用户时）

```
## 草稿评测结果（第N轮）

[7维度评分表]

**最终判定**：✅ 可呈现用户 / ⚠️ 部分问题残留

### 优化摘要
| 轮次 | 优化前总分 | 优化后总分 | 关键改动 |
|------|-----------|-----------|---------| 
| 1 | X.X | X.X | ... |
| 2 | X.X | X.X | ... |

[如有残留问题] **待用户决策项**：...
```

**样式确认表（草稿通过后必须一并输出，等用户确认后再写代码）：**

```
## 样式确认

### 视觉风格模式（styleMode，全片统一，先选这个）
- [ ] `kurzgesagt`·扁平矢量科普（默认，纯色块+高饱和撞色+一镜一概念，适合科普/原理/抽象概念）
- [ ] `vox-light`·图表驱动解释·浅底变体（同 `vox` 叙事，换清爽浅底色板，适合微信视频号白色信息流）
- [ ] `tech-mint`·深空薄荷（适合 AI/技术/工程题材）
- [ ] `vox`·图表驱动解释（口播驱动+图表即主体+标注线圈红，适合分析/观点/数据/复盘）
- [ ] `doodle-note`·手绘读书笔记（浅纸底+纯黑单线+逐笔绘制+常驻栏目标题，适合读书解说/成长/价值观）

**决策树判定留痕（必填，四问逐条给结论）**

| # | 问题 | 本片结论 | 排除了谁 |
|---|---|---|---|
| ① | 有精确的字和数吗 | | |
| ② | 讲机制还是讲观点 | | |
| ③ | 技术感还是人味 | | |
| ④ | 素材形态 / 一致性风险 | | |

> 详见 references/visual-system.md「风格选择决策树」。不回复默认 tech-mint。
> 操作者已给参考片 → 风格由参考片决定，跳过①~③，只填④可行性判定。
> 选 kurzgesagt/vox/doodle-note 时，全片禁用 StarfieldDrift/渐变/粒子，避免 AI slop。



### 语音风格
全片统一 `gentle_female` 

### 字幕样式
| 项目 | 当前默认 | 是否修改 |
|------|---------|---------|
| 语言 | **中文为主，保留英文技术术语**（不做中英对照） | |
| 字号 | 70px（`doodle-note` 浅底模式用 64px 深色字），见 references/short-video-typography.md §4 | |
| 颜色 | #e8fff3（浅薄荷白）；`doodle-note` 用 #1a1a1a | |
| 动效 | 逐行串行淡入淡出 | |
> 不回复保持默认。**双语字幕不是默认能力**，需要操作者明确提出才做（双行行组会顶掉"任何时刻只有一行"的门禁，须同步放宽）。
```

### Step 3 · 视觉素材

- [ ] **开工前先跑 `node scripts/check-draft-sync.mjs`**：确认 scenes.json 与最新 `draft-review.md` 一致，不一致先同步（机械门禁，防止草稿已被用户修改而沿用旧版）
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
- [ ] **节奏强制规则**：
  - 前3秒 scene：必须用冲突/悬念/反转开头，禁止平铺直叙（❌"今天我们来讲…"）
  - 每15秒设一个「小看点」：新信息/反转/视觉爆发点，防跳出
  - 快切 scene 与慢叙事 scene 保持节奏区分（快镜短、叙事镜长）；**单镜时长与全片总时长均不设上限**，超长镜优先拆镜而非删内容
  - 结尾倒数2个 scene：节奏放慢 + 情感升华，配合卡点配乐（durationSec ≥ 8s）

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
  ```

#### ⚠️ ChatTTS 常见问题

- **CLI 模式超时**（`ETTIMETOUT`）：每次 `execFileSync` 调用 `chattts_cli.py` 都会重新加载模型（~45s），多 scene 必定超时。**必须用批处理模式 `chattts_batch.py`**
- **PYTHONPATH 未设置**：Node.js 调用 Python 时需设置 `env: { PYTHONPATH: "/Users/sunzhenchao/ChatTTS" }`，否则 `import ChatTTS` 报 ModuleNotFoundError
- **arch -arm64 前缀**：Mac M2 必须用 `arch -arm64 python3`，否则 PyTorch arm64 模型无法加载

### Step 5.5 · 片尾收束（强制，防「话说完就黑」）

内容讲完直接切黑是最常见的生硬收尾。**每部片必须有一个独立的 Outro scene + 整片渐隐**，三件套缺一不可：

| # | 要件 | 做法 | 参数基准 |
|---|---|---|---|
| 1 | **Outro scene** | 全片最后追加一镜（`S{last}-OutroRecap.tsx`），内容为「N 步回顾」或「一句金句 + 出处/署名」。**禁止**把它写成新知识点 | 旁白 20–30 汉字，约 5–6s |
| 2 | **静场留白（`tailSec`）** | Outro 的 `durationSec = 音频时长 + PAD + tailSec`；静场内画面继续呼吸（极缓 scale/translate），不静止 | `tailSec` = 2.0~2.5s |
| 3 | **整片渐隐** | Composition 入口叠一层与底色同色的 `AbsoluteFill`，最后 N 帧 opacity 0→1 | `FADE_OUT_FRAMES` = 30~35 |

**Outro 版式模板（三步回顾）**：三条编号胶囊错峰弹入 → 一条横线收口 → 大字金句（带呼吸）→ 底部出处行淡入。最后一条胶囊与金句加 `1 + 0.012 * Math.sin(f * 0.09)` 呼吸，避免静场段完全冻结。

**配套的两处必改（漏掉必翻车）**：

- **`sync-durations.mjs` 必须支持 `tailSec`**，否则每次重跑 TTS 都会把静场留白冲掉：
  ```js
  const tail = Number(scene.tailSec ?? 0);
  scene.durationSec = Number((dur(audio) + PAD + tail).toFixed(2));
  ```
- **`Scene.tsx` 字幕只在有声区间内分配**，否则字幕会被摊到静场里、比人声慢 30~40%：
  ```js
  const tailFrames = Math.round(Number(scene.tailSec ?? 0) * fps);
  const subtitleFrames = Math.max(1, durationInFrames - tailFrames);
  buildLines(scene.subtitle, subtitleFrames);   // ← 用 subtitleFrames，不是 durationInFrames
  ```

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

**流程/门禁**
- ❌ 跳过 Step1/2 直接写代码
- ❌ Step1 未把原始素材落盘 `source.md`（后续压缩比统计与忠实度核对无基准）
- ❌ 未经7维度评测闭环直接呈现草稿（须总分≥8且维度1-5无≤5）
- ❌ `draft-review.md` 缺「衔接连贯性检查表」（相邻镜逐对核对，缺过渡处必须给处理结论）
- ❌ 为压时长/降压缩比而删论点、砍过渡镜（内容完整性优先，压缩比与总时长都不是门禁）
- ❌ 核心论点保留清单出现 ❌ 丢失项仍放行
- ❌ 手工口算总时长/字数（必须跑 `scripts/script-stats.mjs`，口算必错）
- ❌ 依赖会话上下文中的草稿内容生成产物，不重新 read `draft-review.md`（用户可能已直接改文件，上下文版本随时过期；记忆≠文件）
- ❌ Step3/5 开工前未跑 `node scripts/check-draft-sync.mjs`（草稿-scenes.json 一致性机械门禁，不一致不得继续）
- ❌ 复制其他项目的 `node_modules`（native binding 按机器架构解析，跨项目复制必缺平台二进制；一律 `npm install`，装完用 `npx tsc --noEmit` 做编译烟雾测试）
- ❌ 新项目让 Remotion 自动下载项目级 Chrome Headless Shell 到 `node_modules/.remotion`——必须通过 `Config.setBrowserExecutable()` 复用 `~/.remotion/chrome-headless-shell/` 中的全局浏览器；全局文件缺失时先提示安装，不得静默重复下载
- ❌ 未经用户确认 styleMode 直接按默认 tech-mint 写代码（样式确认表必须含 styleMode 选择项）
- ❌ 凭美学/直觉选 styleMode——必须走 references/visual-system.md「风格选择决策树」，并在样式确认表填四问判定留痕
- ❌ 未经用户要求产出中英对照字幕（默认中文叙述可混排英文技术术语；操作者明确要求双语才做）
- ❌ 未经操作者授意自动渲染 mp4
- ❌ 以「验证编译」为由运行 `remotion still`——编译验证只用 `npx tsc --noEmit`；`remotion still` 会在 `out/` 目录堆积无用 PNG，且属于被禁止的视觉自检行为
- ❌ 代码生成后主动渲染关键帧（`remotion still`）做视觉自检——画面兑现只在代码层面审查，视觉核对由操作者主动发起
- ❌ 完成 Step6 后不收尾、继续渲染成片或反复自检（默认交付 = 代码+配音+封面，见「交付边界」）
- ❌ 修改后默认渲染验证（仅按需验证）

**视觉/风格/底色**
- ❌ 视频底部进度条；顶部 eyebrow / 底部品牌带
- ❌ 英文 chip/pill 短标（如 `[BUG]`）
- ❌ scenes.json 缺 `styleMode`（顶层）或 `shot_type`（每镜）字段——Step3 无法路由
- ❌ 生图（`flat`/`atmosphere`）提示词不带 AI slop 负向串（定义见 references/visual-system.md）
- ❌ 用生图模型画数据图表/信息图（数字必糊）——有字有数走 designai-infographic-image 或 Remotion 精绘
- ❌ Effect 内时间用百分比（用绝对帧数）
- ❌ Effect 内 3D rotateY 翻页（竖屏变形）
- ❌ Effect 字号过小（说明文字≥40px，中文标题≥80px，Badge≥26px；完整角色字号见 references/short-video-typography.md）
- ❌ Effect 内容元素 `top` 值小于 150px——顶部 0–150px 为平台留白区，内容从 `top: 150` 起；背景装饰层（全幅散点/粒子/纹理，无文字无图形）不受此限制
- ❌ Effect 内短标签/短词（版本号、语言名、卡片标题、Badge）未加 `whiteSpace: "nowrap"` 导致换行
- ❌ 配图 objectFit: cover（用 contain）
- ❌ SVG 内彩色 emoji（走 resvg 渲染的一律替换成 Unicode 符号）

**Effect/画面兑现**
- ❌ subtitle 含可视化素材（对比/数据/流程/枚举）却未在 Effect 中呈现（须逐 scene 过「画面兑现检查」）
- ❌ 总览 scene 后分项无视觉锚点（用 `WallHeaderEffect` 挂顶）
- ❌ 长知识场景（>8s）复用纯锚点型 Effect，画面信息量远低于旁白
- ❌ 多个 scene 共用同一 Effect 组件（每 scene 必须独立 tsx `{sceneId}-{EffectName}.tsx`）
- ❌ Effect 文件名把 sceneId 放在后面（如 `LoopEffect-S19.tsx`）——查找键必须在最前，否则 `ls` 与编辑器模糊搜索按语义名排序，和片子时间轴无关，改某一镜要先全目录 grep 才能定位
- ❌ 相邻 Effect 视觉语言完全另起（无元素/位置/强调色任一承接），整片像 N 张互不相干的图轮播
- ❌ 过渡镜只放一句标题（过渡镜必须画出"上镜收束 + 下镜雏形"两个形态）
- ❌ 相邻镜入场/出场方向互相打架（上镜右滑出、下镜右滑入）

**字幕**
- ❌ 字幕单行超过13视觉字符（中文计1，英文计0.55）导致折行
- ❌ 字幕多行堆叠（串行：旧行消失→间隙→新行出现，任何时刻只有一行）
- ❌ 无操作者要求就加英文副行/中英对照（中文叙述可保留英文术语；双语副行会破坏单行门禁与字号体系）
- ❌ 字幕 bottom < 250px（平台安全区锁定）
- ❌ 标题超过16个字符（超出截断，加 nowrap 确保不换行）
- ❌ splitToLines 时序溢出 segEnd（chunks 过多导致后半段字幕不显示）
- ❌ chunkText 产生纯标点片段（切割后无汉字/字母/数字的 chunk 须过滤）
- ❌ 字幕分片末尾保留标点（，,。；;、等）——标点仅用于切割，展示时去掉分片末尾标点

**音频/TTS**
- 不默认将英文术语、命令、文件名、数字或版本号转换为中文或音译；ChatTTS 对混排文本的发音质量用实际试读判断，异常时先向用户确认特殊读法或切换引擎，不静默改稿。
- `narration` 仅作为用户确认的发音覆盖，不改变 `subtitle` 的含义；两者相同则省略 `narration`，不写空字符串。分段同样使用 `text` 与可选 `narration`，字幕不得被朗读替代文本覆盖。
- ❌ ChatTTS 用 CLI 模式（`chattts_cli.py`）批量生成——重复加载模型必超时，必须用 `chattts_batch.py`
- ❌ Node.js 调用 Python 时未设 `PYTHONPATH: "/Users/sunzhenchao/ChatTTS"`（否则 ModuleNotFoundError）
- 未命中有效验证记录时，不得跳过首次 ChatTTS 可用性验证；缓存命中时不重复单句环境试读，按需检查混排文本发音。
- ❌ TTS 重新生成后未同步更新 scenes.json：① `sync-durations.mjs` 更新 durationSec；② ffprobe 重算各 part 时长回写 startSec（两步缺一不可）
- ❌ TTS 后未做音量归一化（全部 MP3 用 ffmpeg loudnorm 归一化到 -16.60 LUFS）
- ❌ 第一个 scene 音频未做降速处理（全量 TTS 完成后必须对 S01 执行 `atempo=0.9` 降速 + 重新归一化 + sync-durations）
- ❌ 单场景重新生成时 output 路径使用相对路径——`chattts_batch.py` 内部 `os.chdir(CHATTS_ROOT)` 会使相对路径失效，必须用 `os.path.abspath()` 生成绝对路径
- ❌ 在语速均匀（极差 ≤1.0 字/秒）时仍对 ≤13 字短句逐句单独 TTS——短句单独合成韵律必断裂，应走单段 TTS + 字幕比例分配

**封面/发布**
- ❌ 封面省略格式化核心内容（编号/色块/对比，禁纯文字段落）
- ❌ V2 封面背景与视频首帧不一致

**叙事结构**
- ❌ 连续叙述拆成两个 scene（用 subtitleSegments 合并）
- ❌ 跨章节直接硬切（上一镜讲流程、下一镜讲判定），中间不给过渡镜
- ❌ 新概念镜首句无承接语也无回指（「但/所以/到这一步/那么」或回指上镜名词，至少有一样）
- ❌ 衔接检查表里留下未处理的 ❌ 项就进入 Step3
- ❌ 内容讲完直接切黑，没有 Outro scene / 没有静场留白 / 没有整片渐隐（见 Step 5.5，三件套缺一不可）
- ❌ Outro 里塞新知识点（Outro 只做回顾/金句/署名，出现新信息等于又开了一个话头，更生硬）
- ❌ 有 `tailSec` 却没同步改 `sync-durations.mjs`（重跑 TTS 会冲掉留白）或没同步改 `Scene.tsx` 字幕区间（字幕被摊进静场，比人声慢 30~40%）
- ❌ Outro Effect 的最后触发帧超出音频帧数（静场段还在弹元素，等于没有留白）

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
