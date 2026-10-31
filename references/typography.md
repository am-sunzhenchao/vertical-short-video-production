# 竖屏排版合同

## 版本与唯一来源

新项目使用 `review-v1-fixed`。可执行字号、字重、行高与字体角色的唯一来源是 `assets/typography.json`；`init-project.mjs` 将其生成到项目 `src/effects/typography.ts`。本文解释角色选择，不另维护可自由变动的数值。旧 `ep5-v2-fixed` 项目不主动迁移。

该合同基于 moguyun-v2 两轮人工 Review，锁定普通顶部标题、重要标签与字幕字体；并不表示所有题材和设备都已完成视觉验收。

## 文字角色

| textRole | 字号/字重 | 字体角色 | 使用场景 |
|---|---|---|---|
| sceneHeading / title | 52/800 | sans | 已有章节顶部第一行，左对齐纯文字 |
| knowledgeChip | 44/900 | sans，手写镜可显式handwritten | 重要例证、差异枚举的胶囊文字 |
| nodeLabel | 44/800 | sans | 少量核心机制节点 |
| conclusion / subheading | 44/800 | 按镜内明确字体策略 | 概括性结论，不因装入胶囊改成小徽章 |
| diagramLabel / chartLabel | 38/700 | 按镜内明确字体策略 | 图表标注、坐标、数据读数 |
| body | 42/700 | 按镜内明确字体策略 | 主体说明、Outro回顾项 |
| note | 36/600 | 按镜内明确字体策略 | 辅助解释、条件、出处 |
| secondary | 30/600 | 按镜内明确字体策略 | 次级尺度参照，不承载唯一知识结论 |
| term | 56/900 | 按镜内明确字体策略 | 关键术语 |
| quote | 58/900 | 按镜内明确字体策略 | 金句、等式 |
| recapHeading / recapTitle | 50/800 | sans | Outro回顾标题 |
| index | 30/900 | sans | 序号 |
| subtitle | 70/600 | handwritten | 全片显式文楷字幕，纯中文单行 |
| heroTitle | 96/900 | sans | 经规划的居中开场钩子 |
| heroSymbol | 140/900 | sans或矢量符号 | 经规划的重音符号，动效单独登记 |
| badge | 26/900 | sans | 非知识性小标记，不能承载主要例证或结论 |

保留section/series/arrow/heroArrow及旧名称别名用于兼容；token存在不意味着可以主动增加栏目带、进度条。行内强调按宿主+8规则登记，不允许任意倍乘title/quote。

## 字体策略

- sans：`'PingFang SC', sans-serif`；handwritten：`'LXGW WenKai', 'PingFang SC', sans-serif`。
- 顶部标题和核心节点固定sans，无W1顶部标题例外；手写只用于已明确规划的镜内注释、金句或知识胶囊。
- 字幕显式handwritten，不继承Effect根字体；所有镜字幕保持相同字体。
- 每个文字元素登记 `textRole`、`fontRole`、`colorRole`。字体/字重由共用组件读取，不在Effect中手工覆盖fontSize/fontWeight/fontFamily。
- 需要文楷时先探测中文字体可用性，缺失需用户配置或明确批准替代，不静默下载。Regular文件不代表真实700/900字重；合成粗体的使用应记录，并由人工检查效果。
- 用户指定其他字体属于全局覆盖，更新方案版本、排版配置及审批。不能因缺字体偷偷改变默认字幕。

## 容器与布局

胶囊是容器，不是文字语义。例证用knowledgeChip，结论用conclusion，机制节点用nodeLabel；不要把有边框的文字一律降级为badge26。44/800和44/900是两个固定角色，不写“800–900由模型选择”。

使用共用 `SceneHeading / KnowledgeChip / ChipGroup / NodeLabel / Conclusion / Quote / DiagramText / SceneCanvas`。普通标题样式统一，但不强制给居中钩子、Outro或无需标题的镜头新增顶部一行。

SceneCanvas局部区域1000×1210，屏幕原点(40,150)。position用局部坐标，完整边界包含SVG偏移、半径、描边、padding与实际字形。主视觉不进入字幕区域（屏幕top1440，左右56，bottom250）。缺空间先换行、重新排列或拆镜，不自动缩字号、不缩容器规避合同。

## 字幕与封面

字幕70/600，单行≤13视觉字符，串行淡入淡出、去尾标点；有声帧预算扣除tailSec，多段使用真实startSec。比例分配不是全面精准对齐的保证，仍需人工正常速度预览。

封面1080×1440为独立排版体系，不直接套用视频title或heroTitle作为封面字号。按封面SVG独立Review确认后转换PNG。

## 检查

1. `validate-project.mjs` 检查角色、固定配置、方案/运行元数据和Effect自由字号声明；`typecheck`检查类型。
2. 人工检查实际字体、合成粗体、长标题、多个长胶囊、图形与字幕安全区、正常速度对齐。
3. 不把源码/类型检查称为视觉验收；旧项目迁移仅按用户明确授权执行。
