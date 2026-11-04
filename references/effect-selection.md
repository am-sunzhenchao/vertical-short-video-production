# Effect 组件使用规范（分镜 Effect 选型）

> 配套说明：完成全局 `styleMode`（大视觉范式）选择后，为每个分镜挑选对应 Effect。
> Style Mode 数量有限，知识内容表达场景丰富，**不要为每类内容新建 Style Mode，优先通过 Effect 组合实现**。
> 适用场景：科学解释、观点表达、商业分析、系统拆解、数据分析、逻辑推演、认知误区、结果预测。

## 1 Effect 说明

### 1.1 Effect 用来干什么
- 有明确的内容表达目的，帮助观众理解信息（概念、结构、对比、数据、过程、结论等）
- 可适配多种 `styleMode`、可跨视频复用，动画节奏可参数控制，可与 Motion Pattern 组合

### 1.2 Effect 不是什么
普通文本框、简单背景色块、纯装饰动画、转场效果、单条视频一次性组件 → 这些用普通组件 / 装饰组件 / Motion Pattern 实现，**不独立成 Effect**。

### 1.3 什么时候用
- 完成 `styleMode` 选择后，逐分镜匹配 Effect
- 分镜有**相对完整的内容表达任务**时使用
- 只是装饰 / 过渡 → 用组件或 Motion Pattern，不新建 Effect

## 2 Effect 分类体系

> 分类依据：**内容表达任务**，而非组件外观；仅为 Effect Library 的组织逻辑，不强制要求每个分类建立独立文件夹。
> 「类型」列含义见 §4。锚点型组件不占语义分类，见 §4.1。

### 2.1 概念与认知类
用途：帮助观众理解抽象概念、观点、认知误区。

| Effect 组件名 | 类型 | 核心任务 | 典型场景 |
|---|---|---|---|
| ConceptMetaphorEffect | 内容型 | 通过视觉隐喻解释抽象概念 | 将抽象概念具象化为可视事物 |
| CognitiveTrapEffect | 内容型 | 展示认知误区 | 解释人产生错误判断的原因 |
| MindsetRulersEffect | 内容型 | 展示多种不同思维方式 | 不同主体的判断标准对比 |
| SurfaceDepthEffect | 内容型 | 对比表面现象与深层本质 | 表象 vs 真实内在原因 |
| MysteryRevealEffect | 内容型 | 先设置疑问，再揭晓答案 | 反常识内容、悬念式讲解 |

### 2.2 结构与机制类
用途：解释系统组成、运行逻辑、因果、决策路径。

| Effect 组件名 | 类型 | 核心任务 | 典型场景 |
|---|---|---|---|
| SystemArchitectureEffect | 内容型 | 展示系统整体结构 | 技术架构、平台架构、组织架构 |
| MechanismRevealEffect | 内容型 | 逐层揭示内部运行机制 | 事物底层工作原理讲解 |
| CausalChainEffect | 内容型 | 展示完整因果链条 | A导致B，B进一步导致C |
| CauseEffect | 内容型 | 可视化单点原因推导结果 | 一步归因，不展开链条 |
| StructureExplodeEffect | 内容型 | 对整体做拆解展示 | 系统由哪些子部件构成 |
| DecisionTreeEffect | 内容型 | 展示条件判断路径 | 多条件下如何做出决策 |
| BranchingPathEffect | 内容型 | 展示分支衍生关系 | 同一选择衍生出多种不同结果 |

### 2.3 对比与权衡类
用途：表达差异、方案选择、收益代价取舍、优先级。

| Effect 组件名 | 类型 | 核心任务 | 典型场景 |
|---|---|---|---|
| BeforeAfterEffect | 内容型 | 展示改变前后状态 | 改造、迭代前后对比 |
| SideBySideCompareEffect | 内容型 | 并排并列对比 | 两种方案、两类产品横向比较 |
| TradeoffBalanceEffect | 内容型 | 展示收益与代价权衡 | 收益、风险、成本之间取舍 |
| PriorityDownweightEffect | 内容型 | 降低某一因素权重 | 说明哪些因素属于次要因素 |
| RankingRevealEffect | 内容型 | 展示排序与等级 | 排行榜、优先级排序展示 |
| UserReactionsEffect | 内容型 | 展示多方不同反馈 | 不同群体所持有的观点 |

### 2.4 数据与趋势类
用途：表达规模、占比、变化趋势、数量级、积累效应。

| Effect 组件名 | 类型 | 核心任务 | 典型场景 |
|---|---|---|---|
| TrendAnalysisEffect | 内容型 | 可视化变化趋势 | 市场走势、业务增长变化 |
| ProportionVisualEffect | 内容型 | 表达占比分配关系 | 市场份额、资源分配占比 |
| DataBuildEffect | 内容型 | 分步构建数据图表 | 柱状图、折线图逐步渲染 |
| ScalePerspectiveEffect | 内容型 | 表现数量级差距 | 宏观微观对比、大小量级差异 |
| WordArithmeticEffect | 内容型 | 通过文字组合表达数量与逻辑 | 概念拆解、文字逻辑演算 |
| PiggyBankEffect | 内容型 | 表现持续积累增长 | 复利、资源累积、储蓄模型 |

### 2.5 时间与过程类
用途：展示演进流程、状态变迁、信息流动、分步过程。

| Effect 组件名 | 类型 | 核心任务 | 典型场景 |
|---|---|---|---|
| TimelineJourneyEffect | 内容型 | 展示时间维度演进 | 历史事件、产品迭代演进 |
| MorphSequenceEffect | 内容型 | 表现状态平滑转变 | 一个概念向另一个概念转换 |
| SequentialRevealEffect | 内容型 | 按顺序分步披露信息 | 步骤式教程、分步讲解 |
| FlowFieldEffect | 内容型 | 表现流动传递关系 | 信息流、资金流、能量传递 |

### 2.6 场景与故事类
用途：借助情境、角色、文字游戏来解释观点。

| Effect 组件名 | 类型 | 核心任务 | 典型场景 |
|---|---|---|---|
| CharacterScenarioEffect | 内容型 | 通过人物情境阐释观点 | 用户、消费者、员工场景演绎 |
| ModalIslandsEffect | 内容型 | 使用多独立场景代表不同状态 | 不同选择、不同处境对照 |
| PunWordSplitEffect | 内容型 | 文字拆分制造反差、双关 | 文字游戏、概念反转表达 |

### 2.7 总结与结论类
用途：收拢信息，复盘回顾，强化关键记忆点。

| Effect 组件名 | 类型 | 核心任务 | 典型场景 |
|---|---|---|---|
| SynthesisLockupEffect | 内容型 | 聚合多条信息输出综合结论 | 多信息合并得到核心观点 |
| FocusCalloutEffect | 内容型 | 着重强调关键信息 | 重要结论、关键数字高亮 |
| GoldenQuoteEffect | 内容型 | 强化单条核心观点 | 收尾金句、最终结论 |
| OutroRecapEffect | 收束型 | 对全片内容做回顾复盘 | 视频结尾整体内容总结 |

## 3 Effect 选择决策树（Agent 执行）

> 已确定 `styleMode` 后，对每个分镜按下面顺序判定；决策依据是该分镜的**核心表达任务**，不是画面外观。

```
① 分镜的核心表达任务是什么？
├─ A. 帮观众理解概念 / 观点 / 认知
│  ├─ 抽象概念需要具象化 → ConceptMetaphorEffect
│  ├─ 解释认知误区 → CognitiveTrapEffect
│  ├─ 对比不同思维方式 → MindsetRulersEffect
│  ├─ 表象 vs 深层本质 → SurfaceDepthEffect
│  └─ 反常识悬念 → 揭晓 → MysteryRevealEffect
├─ B. 解释结构 / 机制 / 因果 / 决策
│  ├─ 展示系统整体结构 → SystemArchitectureEffect
│  ├─ 逐层揭示运行机制 → MechanismRevealEffect
│  ├─ 展示因果链条 A→B→C → CausalChainEffect
│  ├─ 单点原因推导结果 → CauseEffect
│  ├─ 拆解整体组成 → StructureExplodeEffect
│  ├─ 条件判断路径 → DecisionTreeEffect
│  └─ 一选择多分支结果 → BranchingPathEffect
├─ C. 对比 / 权衡 / 排序
│  ├─ 变化前后对比 → BeforeAfterEffect
│  ├─ 并列比较两种方案 → SideBySideCompareEffect
│  ├─ 收益 / 风险 / 成本权衡 → TradeoffBalanceEffect
│  ├─ 说明哪些因素不重要 → PriorityDownweightEffect
│  ├─ 排名 / 优先级展示 → RankingRevealEffect
│  └─ 不同群体不同反应 → UserReactionsEffect
├─ D. 数据 / 趋势 / 比例 / 积累
│  ├─ 变化趋势 → TrendAnalysisEffect
│  ├─ 占比分配 → ProportionVisualEffect
│  ├─ 图表逐步构建 → DataBuildEffect
│  ├─ 数量级 / 宏微观差异 → ScalePerspectiveEffect
│  ├─ 文字组合表达数量与逻辑 → WordArithmeticEffect
│  └─ 积累 / 复利 / 增长 → PiggyBankEffect
├─ E. 时间演进 / 过程 / 流动
│  ├─ 时间线发展 → TimelineJourneyEffect
│  ├─ 状态逐步转变 → MorphSequenceEffect
│  ├─ 按顺序分步讲解 → SequentialRevealEffect
│  └─ 信息 / 资金 / 能量流动 → FlowFieldEffect
├─ F. 人物情境 / 文字游戏
│  ├─ 人物情境演绎观点 → CharacterScenarioEffect
│  ├─ 多独立场景对照状态 → ModalIslandsEffect
│  └─ 文字拆分双关 / 反差 → PunWordSplitEffect
└─ G. 收束 / 复盘 / 强调
   ├─ 多信息汇聚成结论 → SynthesisLockupEffect
   ├─ 强调关键结论 / 数字 → FocusCalloutEffect
   ├─ 收尾金句 → GoldenQuoteEffect
   └─ 全片回顾复盘 → OutroRecapEffect
```

### 3.1 判定规则
1. 匹配不到合适 Effect → **优先组合已有 Effect**，不新建
2. 一个分镜有多个任务 → 选**主导任务**对应的 Effect，必要时组合 2 个
3. 禁止用新增 `styleMode` 的方式解决分镜局部表达问题
4. 结果写入 `scenes.json` 的 `effectName` 字段，并传入业务参数；组合写法为 `A + B`
5. 跨章节挂顶标题用 `WallHeaderEffect`（锚点型，见 §4.1），不占语义分类

## 4 Effect 类型

同一支片里三种类型分工不同，**选型时先看类型再看语义**。

### 4.1 锚点型 · `WallHeaderEffect`
- 仅显示标题 / 编号 / 栏目名，信息量低
- **只能用于 ≤8s 的过渡镜、挂顶镜、章节标题**，或作为内容型 Effect 的顶部标题组合使用
- 长知识镜（>8s）**禁止单独使用锚点型**——画面信息量会远低于旁白
- 一镜最多一个锚点，不要叠加多个标题层

### 4.2 内容型
- 承载数据 / 对比 / 流程 / 枚举等可视化
- 凡是分镜有实质内容要表达，**默认用内容型**
- 新建 Effect 时绝大多数属于这一类

### 4.3 收束型
- 用于片尾 1~2 镜，做回顾、复盘、金句署名
- 节奏放慢，元素错峰弹入后留静场呼吸

### 4.4 新建 Effect 的时机
若已有 Effect 都无法兑现 subtitle 的信息密度，**新建专用 Effect**，不要硬套锚点型凑数。
命名 `{sceneId}-{语义}.tsx`，sceneId 必须在最前（如 `S07-CausalChain.tsx`）。
