---
name: vertical-short-video-production
description: Use when producing a Chinese vertical (1080×1920) narrated short video for 抖音 / 微信视频号 — including "做竖版短视频"、"抖音/视频号视频"、知识口播/科普/观点解释视频、Kurzgesagt/Vox 风格解释片，或只是"写脚本/做封面/配音"其中一环时。也用于此类项目的分镜、字幕、TTS、封面、Remotion 实现。
---

# 竖版中文短视频制作

> 详细视觉规范见 `visual-system.md`，代码模板见 `code-templates.md`

---

## 🔧 启动检查（每次激活 skill 时必须先执行）

在做任何事之前，执行以下检查流程：

### 1. 读取 ChatTTS 配置

读取 `~/.claude/skills/vertical-short-video-production/chattts/config.json`：

- **文件存在且 `chatts_root` 有效**（目录存在 + 包含 `ChatTTS/` 子目录）→ 直接进入正式流程
- **文件不存在或路径无效** → 执行下方「首次配置引导」

### 2. 首次配置引导

```
ChatTTS 未配置或路径无效。

请提供您本地 ChatTTS 的安装目录（即包含 ChatTTS/ 子目录和 speakers/ 目录的根目录）。
示例：/Users/yourname/ChatTTS
```

用户提供路径后，执行验证：

```python
# 验证条件（三项全过才写入）
os.path.isdir(f"{path}/ChatTTS")        # ChatTTS 模块存在
os.path.isdir(f"{path}/speakers")       # speakers 目录存在
os.path.isfile(f"{path}/speakers/3_gentle_female_v2.txt")  # 基础音色文件存在
```

- **验证通过** → 写入 `chattts/config.json`，提示「✅ ChatTTS 配置成功，路径已保存」，继续正式流程
- **验证失败** → 告知具体缺失项，请用户检查后重新提供路径

### 3. 验证通过后同步检查

config.json 写入后，还需确认 Demo 音色 speaker 文件是否已同步：

```bash
ls {chatts_root}/speakers/04_jsjs_male_seed222.txt 2>/dev/null
```

若不存在，提示：
```
⚠️  Demo 音色文件未同步到 ChatTTS/speakers/。
请运行以下命令一键同步（skill 内已内置所有 speaker 文件，无需额外下载）：

python3 ~/.claude/skills/vertical-short-video-production/chattts/sync_speakers.py
```

---

## 项目规格

- 平台：微信视频号 + 抖音
- 视频：1080×1920，25fps；封面：1080×1440
- 栈：Remotion 4.x + ChatTTS / edge-tts + @resvg/resvg-js
- **视觉风格模式**：`tech-mint`（默认·深空薄荷）/ `kurzgesagt`（扁平矢量科普）/ `vox`（图表驱动解释）/ `doodle-note`（手绘读书笔记），Step2 按**决策树**锁定，详见 visual-system.md
- TTS 引擎：ChatTTS（默认）或 Edge-TTS（通过 `TTS_ENGINE` 环境变量切换）
- 默认配音：ChatTTS `gentle_female` 风格 / Edge-TTS `zh-CN-YunxiNeural`（云希，男声）

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

- [ ] ls 列出所有图片/视频/文档，逐一阅读
- [ ] **原始素材落盘 `source.md`**（用户粘贴的文本也要落盘，作为 Step2 压缩比统计与忠实度核对的基准）
- [ ] 输出《素材盘点》：已有素材列表 + 缺口 + 核心论点

### Step 2 · 草稿生成 + 评测优化闭环 + Review（强制卡点）

- [ ] **按 visual-system.md「风格选择决策树」四问判定 `styleMode`**，把逐问结论写进样式确认表（操作者已给参考片则风格由参考片决定，只判定可行性）
- [ ] 写全片逐句旁白，切 N 个 scene，每 scene 标注 Effect/配图/纯文字
- [ ] **旁白与字幕一律纯中文**，不产出中英对照（除操作者明确要求双语）
- [ ] **草稿须覆盖 HKRR 四要素**（见下表），缺项须在草稿中注明补充方案
- [ ] **以 markdown 呈现草稿**
- [ ] **草稿内容要尽量完整，保证内容正确、内容连贯、逻辑清晰**
- [ ] 草稿写完后立即执行「7维度量化评测」（见下方），按评测结果自动优化迭代
- [ ] **执行「文稿压缩比统计」**（见下方），产出压缩比读数 + 精简内容归纳 + 核心论点保留清单 + 语速核对（压缩比只报数、不设阈值）
- [ ] **执行「衔接连贯性检查」**（见下方），逐相邻镜核对叙事过渡与画面延续，缺过渡处补过渡镜
- [ ] 评测通过（总分≥8且核心维度1-5无≤5）后，呈现最终草稿 + 评测表 + 优化摘要 + **样式确认表**，**停下来等 review**
- [ ] **草稿落盘**：将最终草稿（含场景表、样式确认表、评测结果、**文稿压缩比统计**、**衔接连贯性检查表**）写入项目目录下 `draft-review.md` 文件，方便用户直接在文件中修改草稿和样式，减少交互轮次
- [ ] 用户修改完成后，读取 `draft-review.md` 以获取最新草稿，再进入 Step 3
- [ ] 3轮迭代仍未通过时，呈现最优版本 + 剩余问题清单，让用户决定是否继续
- [ ] 操作者明确说"通过/OK/开始"前，**不写一行代码**
- [ ] **样式确认表须与草稿一起呈现**，不得在草稿通过后才单独询问

#### HKRR 草稿检查表

| 要素 | 核心目标 | 草稿中的落点 |
|---|---|---|
| **H · Happiness** 快乐 | 趣味解压、猎奇搞笑、视觉爽感 | 有无爆笑反转桥段？有无视觉冲击慢镜/爆炸拆解画面？ |
| **K · Knowledge** 知识 | 干货、避坑、科普、行业内幕 | 每个 scene 是否有明确知识点？观众学完能直接落地吗？ |
| **R · Resonance** 共鸣 | 情绪共情、经历共鸣、价值观认同 | 有无普通人代入感？有无"说出了我的心声"的场景？ |
| **R · Rhythm** 节奏 | 开篇抓眼、无废话、快慢剪辑、情绪卡点 | 前3秒是否直击痛点？每15秒是否有一个小看点？结尾有无情感升华卡点？ |

**HKRR 评分原则**：四要素都强 = 爆款潜力最大（参考何同学《5G 真实速度》、影视飓风《粉丝卫星》）；至少覆盖 2 项才具备传播基础。

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

#### 文稿压缩比统计（草稿落盘前必须执行）

把「原始素材」压成「口播讲解稿」，压缩比是**参考性观察指标**，用来看清改编幅度：偏高说明书面语残留多（读起来可能拗口），偏低说明改动大（要重点核对论点有没有丢）。用 `scripts/script-stats.mjs`（见 code-templates.md）计算，禁止手工口算字数（易错）。

> **压缩比不设上下限，不作为门禁**。唯一的硬门禁是「核心论点保留清单」——只要论点无丢失，压缩比高低都放行。内容完整性优先于篇幅控制。

**计算口径**（统一用汉字数，标点/空白不计入主指标）

| 指标 | 定义 |
|---|---|
| 原始文稿字数 `R` | `source.md` 中的汉字数（正则 `[\u4e00-\u9fff]`），剔除 markdown 标记与引用行 |
| 讲解文稿字数 `N` | 各 scene `narration` 拼接后的汉字数 |
| 压缩比 | `N / R` |
| 精简字数 | `R − N` |
| 全片语速 | `N / 总时长(秒)` |
| 每镜语速 | 各 scene `narration汉字数 / durationSec` |

**压缩比读数（只报数，不判定通过与否）**

| 压缩比 | 读数含义 | 建议动作（非门禁） |
|---|---|---|
| 偏高（书面语多） | 接近照读原文 | 按下方 6 类扫一遍，把从句/连接词改成口语句式；**不要为了降压缩比删论点** |
| 居中 | 常规改编 | — |
| 偏低（改动大） | 大量收敛与合并 | 逐条核对「核心论点保留清单」，确认无遗漏 |
| >100%（口播扩写） | 讲解稿比原文更长 | 合法情形：逐条展开原文要点、补过渡镜、补理由说明；只需确认没有注水复述 |

**语速参考区间**（对应7维度评测的 P1 信息过载检查；只约束"每秒信息量"，**不约束总时长**）

| 字/秒 | 字/分 | 判定 |
|---|---|---|
| < 3.0 | < 180 | ⚠️ 拖沓，考虑拆句或合镜 |
| 3.0 ~ 4.5 | 180 ~ 270 | ✅ 健康 |
| 4.5 ~ 5.8 | 270 ~ 350 | ⚠️ 偏快，长镜需拆句 |
| > 5.8 | > 350 | ❌ 语速门禁，必须放慢（拆句，不是删论点） |

> **总时长不设上限**：镜数与总时长由内容完整性决定。长知识向题材做到 5~10 分钟也合法，不得为了压时长删减论点或砍过渡镜。

> **关键副产物 · 决定字幕对齐方案**：统计每镜语速的极差 `max − min`。
> - **极差 ≤ 1.0 字/秒**（语速均匀）→ 可用「**单段 TTS + 字幕按字数比例分配时间**」，韵律自然且误差极小
> - **极差 > 1.0 字/秒**（语速不均）→ 必须走「**多段 TTS + `startSec` 回写**」，否则字幕会漂
> 这一判定要写进 draft-review.md，Step5 按它选路。

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
## 文稿压缩比统计

| | 汉字数 | 有效字符（含标点） |
|---|---|---|
| 原始文稿 | R | — |
| 讲解文稿 | N | — |

- **压缩比：XX.X%**（仅读数，不作门禁；解释一句改编幅度）
- **精简 XXX 字（XX.X%）**

### 精简掉的是什么

| 类型 | 例子 | 字数量级 |
|---|---|---|
| 重复表述 | … | ~XX |
| …（6 类逐条，无该类则写「无」） | | |

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
   - **P0**：情绪曲线断裂（中段无R点、连续K轰炸）
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
- [ ] `tech-mint`·深空薄荷（默认，星空+薄荷绿，适合 AI/技术/工程题材）
- [ ] `kurzgesagt`·扁平矢量科普（纯色块+高饱和撞色+一镜一概念，适合科普/原理/抽象概念）
- [ ] `vox`·图表驱动解释（口播驱动+图表即主体+标注线圈红，适合分析/观点/数据/复盘）
- [ ] `doodle-note`·手绘读书笔记（浅纸底+纯黑单线+逐笔绘制+常驻栏目标题，适合读书解说/成长/价值观）

**决策树判定留痕（必填，四问逐条给结论）**

| # | 问题 | 本片结论 | 排除了谁 |
|---|---|---|---|
| ① | 有精确的字和数吗 | | |
| ② | 讲机制还是讲观点 | | |
| ③ | 技术感还是人味 | | |
| ④ | 素材形态 / 一致性风险 | | |

> 详见 visual-system.md「风格选择决策树」。不回复默认 tech-mint。
> 操作者已给参考片 → 风格由参考片决定，跳过①~③，只填④可行性判定。
> 选 kurzgesagt/vox/doodle-note 时，全片禁用 StarfieldDrift/渐变/粒子，避免 AI slop。

### 背景色方案（Effect 底色，仅 tech-mint 模式生效）
- [ ] 方案一·深海蓝黑 `#0d0d1a → #1a1a3a`（默认，稳重科技感）
- [ ] 方案二·深紫星云 `#0e0618 → #1d0a35`（神秘感强）
- [ ] 方案三·墨绿深夜 `#050f0a → #0a1f14`（自然质感）
- [ ] 方案四·暖棕烛光 `#120a04 → #1f1008`（温暖故事感）
> 不回复默认方案一

### 语音风格
| 项目 | 选项 | 默认 |
|------|------|------|
| 全局音色 | calm_male / energetic_male / **gentle_female** / gentle_male / deep_voice / deep_male / natural_conversational | gentle_female |
| 是否 per-scene 不同风格 | 是 / 否 | 否 |
> 如需 per-scene 不同风格，请在草稿表格中为每个 scene 标注风格

### 字幕样式
| 项目 | 当前默认 | 是否修改 |
|------|---------|---------|
| 语言 | **纯中文单语**（不做中英对照） | |
| 字号 | 70px（`doodle-note` 浅底模式用 64px 深色字） | |
| 颜色 | #e8fff3（浅薄荷白）；`doodle-note` 用 #1a1a1a | |
| 动效 | 逐行串行淡入淡出 | |
> 不回复保持默认。**双语字幕不是默认能力**，需要操作者明确提出才做（双行行组会顶掉"任何时刻只有一行"的门禁，须同步放宽）。
```

### Step 3 · 视觉素材

- [ ] **每个 scene 在 scenes.json 标注 `shot_type`，Step3 按标签路由素材来源**（见下表），标签在 Step2 编剧时确定
- [ ] 按 scene 类型决定素材来源（algorithmic-art / frontend-design / canvas-design / 手写SVG）
- [ ] **H 要素场景**：优先用动态 Effect（爆炸、慢镜、粒子）制造视觉爽感；猎奇内容配高饱和撞色
- [ ] **K 要素场景**：用数据可视化/对比卡片/步骤拆解 Effect，知识点要有视觉锚点
- [ ] **R 要素场景**：色调偏暖（金色/琥珀），人物/手写/温柔光晕元素，避免冷色硬朗风格
- [ ] SVG 内 emoji 全替换成 Unicode 符号
- [ ] 走 render-cover.mjs 输出 PNG，目检无豆腐方块

#### shot_type 分镜路由表（每镜打标签，决定素材来源）

| shot_type | 语义 | 素材来源（推荐 skill） | 产物 | 对应范式 |
|---|---|---|---|---|
| `effect` | 抽象概念/对比/枚举，用 Remotion 组件表达（默认） | 本 skill Effect 库 + code-templates | tsx 组件 | tech-mint |
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

- [ ] 复制 code-templates.md 的模板：StarfieldDrift、Scene.tsx、index.tsx、effects 骨架
- [ ] 生成 scenes.json（含顶层 `styleMode`、每镜 `shot_type`、narration、subtitleSegments）
- [ ] **底色按 styleMode**：`tech-mint` → Effect 用所选背景色方案渐变（不用实色/transparent 走星空）；`kurzgesagt` → 单一深色块纯底、无渐变无星空；`vox` → 近黑纯底、图表铺满
- [ ] **画面兑现检查（强制卡点·纯代码审查）**：逐 scene 对照 subtitle，把其中的**可视化素材**落到 Effect 画面上，不得只显示标题。**通过阅读 Effect 代码核对，不通过渲染关键帧验证**
  - 检查方法：把 subtitle 拆成「关键名词 / 数据 / 对比 / 流程 / 枚举」5类元素，逐个确认在 Effect 里有对应视觉呈现
  - 例：subtitle 含「单线程 vs 多线程」→ 画面必须有左右对比；含「内存飙升」→ 必须有增长可视化；含「版本混乱」→ 必须有多元素散布；含「①②③④」→ 必须逐项展开
  - **K 要素场景且 durationSec > 8s**：禁止只用「锚点型 Effect」（WallHeader 等仅标题的组件），必须配「内容型 Effect」（数据可视化/对比卡片/流程拆解）
- [ ] **画面连贯性检查（强制卡点·纯代码审查）**：逐相邻 Effect 对照，确认三点——① 视觉锚点承接（元素/位置/强调色至少一项延续，不得每镜另起一套视觉语言）；② 入场方向与上镜出场不冲突（避免相邻镜反向滑动打架）；③ 过渡镜 Effect 必须"承上启下"（画面同时出现上镜元素的收束形态与下镜元素的雏形），不能只放一句标题
- [ ] 字幕：固定70px，每次只显示一行（≤13视觉字符），串行逐行，三级切割（强标点→逗号→机械截断），禁 nowrap
- [ ] **字幕分片去尾标点**：每个分片展示时，去掉末尾的标点符号（，,。.；;、！!？?：:… 等），只保留正文；标点仅用于切割断句，不参与显示
- [ ] 标题文字：不超过16个字符，超出部分截断，加 `whiteSpace: "nowrap"`
- [ ] **节奏（R·Rhythm）强制规则**：
  - 前3秒 scene：必须用冲突/悬念/反转开头，禁止平铺直叙（❌"今天我们来讲…"）
  - 每15秒设一个「小看点」：新信息/反转/视觉爆发点，防跳出
  - 快切 scene（H 类）与慢叙事 scene（K/R 类）保持节奏区分（快镜短、叙事镜长）；**单镜时长与全片总时长均不设上限**，超长镜优先拆镜而非删内容
  - 结尾倒数2个 scene：节奏放慢 + 情感升华，配合卡点配乐（durationSec ≥ 8s）

### Step 5 · 音频

- [ ] **按 Step2「语速极差」判定选路**（见文稿压缩比统计）：
  - 极差 ≤ 1.0 字/秒 → **单段 TTS**（每 scene 整段一次调用，韵律自然）+ 字幕按汉字数比例分配时间
  - 极差 > 1.0 字/秒 → **多段 TTS**（按 `subtitleSegments` 逐句生成）+ ffmpeg concat + `startSec` 回写
- [ ] **运行前先验证 ChatTTS 可用**：`PYTHONPATH=/Users/sunzhenchao/ChatTTS arch -arm64 python3 /Users/sunzhenchao/ChatTTS/chattts_cli.py --text "测试" --output /tmp/t.mp3 --style gentle_female --skip-refine --json-output`，确认输出 JSON 后再批量生成
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

#### ChatTTS 可用风格（`/Users/sunzhenchao/ChatTTS/speakers/` 已保存 embedding）

**用法**：在 `scenes.json` 每个 scene 里设 `"ttsStyle": "<key>"`，或 `CHATTTS_STYLE=<key> node scripts/tts.mjs` 全局切换。

##### 通用命名风格（泛用，无固定音色倾向）

| ttsStyle | 说明 | 适用场景 |
|---|---|---|
| `calm_male` | 沉稳男声，低温度 | 知识科普、深度解析 |
| `energetic_male` | 活力男声，高温度 | 开场钩子、热点评论 |
| `gentle_female` | 温和女声（**全局默认**） | 叙事解读、情感共鸣 |
| `gentle_male` | 温和男声 | 轻松讲解 |
| `deep_voice` | 磁性低音 | 严肃话题、结论升华 |
| `deep_male` | 磁性低音男声 | 行业分析 |
| `natural_conversational` | 自然对话 | 口播互动 |
| `jsfx_female` | 技术分享女声，有 refine | 技术/工程/AI 题材 |

##### Demo 音色库（固定音色 + 固定参数，可完全复现）

> 命名规则：`{风格编号}_{风格}_{性别}_seed{N}`，speaker 文件已同步至 `/Users/sunzhenchao/ChatTTS/speakers/`。  
> 参考试听：`/Users/sunzhenchao/Desktop/工作文档/self/素材/chattts/audios/{ttsStyle}.mp3`

| ttsStyle | 性别 | 音色特征 | 风格 | speed | refine | 适用场景 |
|---|---|---|---|---|---|---|
| `01_dushu_female_seed999` | 女 | 青年女声 | 读书朗读 | 3 | ✗ | 有声书、书评 |
| `01_dushu_male_seed55` | 男 | 清亮少年感 | 读书朗读 | 3 | ✗ | 有声书、读书笔记 |
| `02_sanwen_female_seed44` | 女 | 青年厚声 | 散文朗读 | 2 | ✗ | 散文、诗歌、情感 |
| `02_sanwen_male_seed666` | 男 | 青年成熟厚声 | 散文朗读 | 2 | ✗ | 散文、情感类 |
| `03_jsfx_female_seed88` | 女 | 青年成熟女声 | 技术分享 | 5 | ✓ oral_4 | 技术口播、知识分享 |
| `03_jsfx_male_seed99` | 男 | 青年厚声 | 技术分享 | 5 | ✓ oral_4 | 技术口播 |
| `04_jsjs_female_seed44` | 女 | 青年厚声 | 技术介绍 | 5 | ✗ | 产品/工具介绍 |
| **`04_jsjs_male_seed222`** | 男 | **青年成熟厚声** | **技术介绍** | 5 | ✗ | **技术介绍（推荐·本项目默认）** |
| `05_fengjing_female_seed777` | 女 | 青年成熟厚声 | 风景介绍 | 3 | ✗ | 旅游、风景、人文 |
| `05_fengjing_male_seed888` | 男 | 清亮少年感 | 风景介绍 | 3 | ✗ | 旅游类 |
| `06_kepu_female_seed555` | 女 | 青年成熟厚声 | 科普讲解 | 6 | ✓ oral_2 | 科普、原理解析 |
| `06_kepu_male_seed333` | 男 | 青年成熟厚声 | 科普讲解 | 6 | ✓ oral_2 | 科普、深度解读 |
| `07_gaoxiao_female_seed88` | 女 | 青年成熟女声 | 搞笑吐槽 | 7 | ✓ oral_6 laugh_1 | 搞笑、吐槽、热点评论 |
| `07_gaoxiao_male_seed77` | 男 | 清亮厚声 | 搞笑吐槽 | 7 | ✓ oral_6 laugh_1 | 搞笑类 |
| `08_yingshi_female_seed3005` | 女 | 中年厚声 | 影视解说 | 7 | ✓ oral_3 | 影视解说、剧情讲解 |
| `08_yingshi_male_seed3015` | 男 | 青年成熟厚声 | 影视解说 | 7 | ✓ oral_3 | 影视解说 |
| `09_qinggan_female_seed3003` | 女 | 中年厚声 | 情感语录 | 2 | ✗ | 情感共鸣、心理、成长 |
| `09_qinggan_male_seed3001` | 男 | 青年成熟 | 情感语录 | 2 | ✗ | 情感类 |
| `10_xuanyi_female_seed3016` | 女 | 中年厚声 | 悬疑怪谈 | 3 | ✗ | 悬疑、恐怖、猎奇 |
| `10_xuanyi_male_seed3008` | 男 | 中年低沉 | 悬疑怪谈 | 3 | ✗ | 悬疑、怪谈 |
| `11_daihuo_female_seed3011` | 女 | 青年女声 | 带货口播 | 9 | ✓ oral_5 | 带货、促销、快节奏 |
| `11_daihuo_male_seed3002` | 男 | 青年厚声 | 带货口播 | 9 | ✓ oral_5 | 带货类 |
| `12_ertong_female_seed3009` | 女 | 中年厚声 | 儿童故事 | 4 | ✓ oral_4 laugh_1 | 儿童故事、亲子 |
| `12_ertong_male_seed3007` | 男 | 青年厚声 | 儿童故事 | 4 | ✓ oral_4 laugh_1 | 儿童故事 |
| `13_asmr_female_seed3010` | 女 | 青年成熟女声 | ASMR 助眠 | 1 | ✗ | 助眠、冥想、极慢速 |
| `13_asmr_male_seed3012` | 男 | 青年成熟厚声 | ASMR 助眠 | 1 | ✗ | 助眠类 |

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

- [ ] V1+V2 封面：问句 + 格式化核心内容，V2 背景与视频首帧一致
- [ ] 标题.txt（问句≤16字符）+ 描述.txt（≤1000字符，结尾#标签）

---

## 交付边界（默认收尾，不主动越界）

- **默认交付物 = Step4 项目代码 + Step5 TTS 配音 + Step6 封面/文案**。三者产出后即视为完成，向用户交付并结束。
- **不做关键帧渲染自检**：画面正确性靠 Step4「画面兑现检查（纯代码审查）」保证；不主动 `remotion still` 渲染帧来目视验证。
- **不渲染 mp4**：默认不跑 `remotion render`。用户可自行 `npm run dev` 预览、`npm run render` 出片。
- 仅当**操作者明确要求**「渲染看看 / 出 mp4 / 帮我核对某镜画面」时，才渲染关键帧或成片。

---

## 否定项（直接绕开，按类分组）

**流程/门禁**
- ❌ 跳过 Step1/2 直接写代码
- ❌ Step1 未把原始素材落盘 `source.md`（后续压缩比统计与忠实度核对无基准）
- ❌ 未经7维度评测闭环直接呈现草稿（须总分≥8且维度1-5无≤5）
- ❌ `draft-review.md` 缺「文稿压缩比统计」——压缩比读数 / 精简内容 6 类归纳 / 核心论点保留清单 / 语速核对，**四项缺一不可**
- ❌ `draft-review.md` 缺「衔接连贯性检查表」（相邻镜逐对核对，缺过渡处必须给处理结论）
- ❌ 为压时长/降压缩比而删论点、砍过渡镜（内容完整性优先，压缩比与总时长都不是门禁）
- ❌ 核心论点保留清单出现 ❌ 丢失项仍放行
- ❌ 手工口算总时长/字数（必须跑 `scripts/script-stats.mjs`，口算必错）
- ❌ 未经用户确认 styleMode 直接按默认 tech-mint 写代码（样式确认表必须含 styleMode 选择项）
- ❌ 凭美学/直觉选 styleMode——必须走 visual-system.md「风格选择决策树」，并在样式确认表填四问判定留痕
- ❌ 草稿里产出中英对照字幕（默认纯中文；操作者明确要求双语才做）
- ❌ 未经操作者授意自动渲染 mp4
- ❌ 代码生成后主动渲染关键帧（`remotion still`）做视觉自检——画面兑现只在代码层面审查，视觉核对由操作者主动发起
- ❌ 完成 Step6 后不收尾、继续渲染成片或反复自检（默认交付 = 代码+配音+封面，见「交付边界」）
- ❌ 修改后默认渲染验证（仅按需验证）

**视觉/风格/底色**
- ❌ 视频底部进度条；顶部 eyebrow / 底部品牌带
- ❌ 英文 chip/pill 短标（如 `[BUG]`）
- ❌ `tech-mint` 下 Effect AbsoluteFill 实色背景（遮住 StarfieldDrift）；`kurzgesagt`/`vox` 则相反，必须纯色块底
- ❌ `kurzgesagt`/`vox` 模式仍挂 StarfieldDrift / 用渐变底 / 加漂浮粒子（退化成 AI slop）
- ❌ `kurzgesagt` 一镜堆多概念（每镜只讲一件事、只放一个核心图形）
- ❌ `vox` 无论证结构（须「抛问题→给背景→层层推进→落判断」，标注跟随口播逐帧点亮）
- ❌ scenes.json 缺 `styleMode`（顶层）或 `shot_type`（每镜）字段——Step3 无法路由
- ❌ 生图（`flat`/`atmosphere`）提示词不带 AI slop 负向串（定义见 visual-system.md）
- ❌ 用生图模型画数据图表/信息图（数字必糊）——有字有数走 designai-infographic-image 或 Remotion 精绘
- ❌ Effect 内时间用百分比（用绝对帧数）
- ❌ Effect 内 3D rotateY 翻页（竖屏变形）
- ❌ Effect 字号过小（说明≥40px，标题≥80px，Badge≥28px）
- ❌ Effect 内短标签/短词（版本号、语言名、卡片标题、Badge）未加 `whiteSpace: "nowrap"` 导致换行
- ❌ 配图 objectFit: cover（用 contain）
- ❌ SVG 内彩色 emoji（走 resvg 渲染的一律替换成 Unicode 符号）

**Effect/画面兑现**
- ❌ subtitle 含可视化素材（对比/数据/流程/枚举）却未在 Effect 中呈现（须逐 scene 过「画面兑现检查」）
- ❌ 总览 scene 后分项无视觉锚点（用 WallHeader 挂顶）
- ❌ 长知识场景（K 要素且 >8s）复用纯锚点型 Effect（WallHeader 等仅标题组件），画面信息量远低于旁白
- ❌ 多个信息量不同的场景硬套同一锚点型 Effect 凑数（信息密度不够应新建专用内容型 Effect）
- ❌ 多个 scene 共用同一 Effect 组件（每 scene 必须独立 tsx `{sceneId}-{EffectName}.tsx`）
- ❌ Effect 文件名把 sceneId 放在后面（如 `LoopEffect-S19.tsx`）——查找键必须在最前，否则 `ls` 与编辑器模糊搜索按语义名排序，和片子时间轴无关，改某一镜要先全目录 grep 才能定位
- ❌ 相邻 Effect 视觉语言完全另起（无元素/位置/强调色任一承接），整片像 N 张互不相干的图轮播
- ❌ 过渡镜只放一句标题（过渡镜必须画出"上镜收束 + 下镜雏形"两个形态）
- ❌ 相邻镜入场/出场方向互相打架（上镜右滑出、下镜右滑入）

**字幕**
- ❌ 字幕单行超过13视觉字符（中文计1，英文计0.55）导致折行
- ❌ 字幕多行堆叠（串行：旧行消失→间隙→新行出现，任何时刻只有一行）
- ❌ 无操作者要求就加英文副行/中英对照（默认单语中文，双语会破坏单行门禁与字号体系）
- ❌ 字幕 bottom < 250px（平台安全区锁定）
- ❌ 标题超过16个字符（超出截断，加 nowrap 确保不换行）
- ❌ splitToLines 时序溢出 segEnd（chunks 过多导致后半段字幕不显示）
- ❌ chunkText 产生纯标点片段（切割后无汉字/字母/数字的 chunk 须过滤）
- ❌ 字幕分片末尾保留标点（，,。；;、等）——标点仅用于切割，展示时去掉分片末尾标点

**音频/TTS**
- ❌ 默认女声 Xiaoxiao（默认 ChatTTS gentle_female / Edge-TTS YunxiNeural 男声）
- ❌ TTS 文本含 MySQL/Redis 等英文术语（用中文等价物）
- ❌ narration 与 subtitle 内容不一致（仅允许发音替换）
- ❌ ChatTTS 用 CLI 模式（`chattts_cli.py`）批量生成——重复加载模型必超时，必须用 `chattts_batch.py`
- ❌ Node.js 调用 Python 时未设 `PYTHONPATH: "/Users/sunzhenchao/ChatTTS"`（否则 ModuleNotFoundError）
- ❌ 生成 TTS 前未先单句验证 ChatTTS 可用性
- ❌ TTS 重新生成后未同步更新 scenes.json：① `sync-durations.mjs` 更新 durationSec；② ffprobe 重算各 part 时长回写 startSec（两步缺一不可）
- ❌ TTS 后未做音量归一化（全部 MP3 用 ffmpeg loudnorm 归一化到 -16.60 LUFS）
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

## Effect 库（按语义选用，主要用于 `tech-mint`；`kurzgesagt`/`vox` 见对应模板）

| Effect | 类型 | 适用语义 | 视觉手法 |
|---|---|---|---|
| `CognitiveTrapEffect` | 内容型 | 看似简单/实为陷阱 | 汉字裂开→警示环+闪电 |
| `UserReactionsEffect` | 内容型 | 用户真实反馈 | 人头+4个错峰气泡 |
| `MindsetRulersEffect` | 内容型 | 二元对立 | 两条进度尺+巨大≠ |
| `PriorityDownweightEffect` | 内容型 | 本该优先→被降权 | 卡片从顶拖底，金→红 |
| `PiggyBankEffect` | 内容型 | 体验漏洞 | 存钱罐进绿币漏红币 |
| `GoldenQuoteEffect` | 内容型 | 金句收尾 | 金边卡片逐行点亮 |
| `WordArithmetic` | 内容型 | 反直觉等式 | 逐token浮现 |
| `ModalIslands` | 内容型 | 多模态隔阂 | 三色块+断裂虚线 |
| `PunWordSplit` | 内容型 | 一词多义 | 汉字裂开两半 |
| `WallHeader` | 锚点型 | 跨场景锚点（仅标题） | 数字chip+标签挂顶 |
| `OutroRecapEffect` | 收束型 | 片尾三步回顾 / 金句署名 | 编号胶囊错峰弹入+横线收口+金句呼吸+出处行 |

> **类型规则**：
> - **锚点型**：仅显示标题/编号，信息量低。**只能用于 ≤8s 的过渡/挂顶场景**，或作为「内容型 Effect 的顶部标题」组合使用
> - **内容型**：承载数据/对比/流程/枚举等可视化。**K 要素且 >8s 的知识场景必须用内容型**
> - 若已有 Effect 都无法兑现 subtitle 的信息密度，**新建专用 Effect**（命名 `{sceneId}-{语义}.tsx`），不要硬套锚点型凑数

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

> `vox` 图表禁止用生图模型画（数字必糊），走 infographic 或 Remotion 精绘。AI slop 负向串定义见 visual-system.md「AI slop 红线」。

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
