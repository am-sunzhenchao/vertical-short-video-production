# 本次 Skill 优化记录

## 新增
- `references/motion-system.md`：三层动效架构、12 种标准动效模式、motionPlan 契约、运动参数基线、镜头语言规则、组件新增门槛、镜头/全片 QA 与试点指标。
- `references/scientific-review.md`：科学主张提取、风险分级、证据核验、措辞修订、状态管理与视觉示意约束。

## 修改
- `SKILL.md`：将科学审查和 motionPlan 前置到草稿阶段；新增标准动效模式选型、优先复用现有组件、色板锁定、关键帧/短片段验收；修正“只看代码、不做视觉验收”的旧门禁。
- `references/visual-system.md`：增加 Huashu 色板与镜头语言参考入口，区分 styleMode 与动效模式，要求记录色板名与实际 HEX 值。
- `references/code-templates.md`：在 scenes.json 示例中加入可选 `visualTheme` 和 `motionPlan` 元数据；把草稿同步脚本章节改为指向唯一维护版本。
- `scripts/check-draft-sync.mjs`：改为正式制作 fail-closed；缺草稿/场景文件、场景映射缺失、文本不一致或 JSON 错误均失败。只有显式 `--allow-missing` 才能用于探索性跳过，不能作为交付门禁。
- `README.md`：更新流程与目录说明。

## 验证
- `node --check scripts/check-draft-sync.mjs` 通过。
- 构造正确草稿与 scenes.json 的临时用例，脚本通过。
- 构造场景编号不匹配的临时用例，脚本以非零状态失败。
- 缺失草稿时默认失败；显式 `--allow-missing` 时会警告并跳过。

## 尚未做的事
- 未新增 Remotion Effect 组件；本轮先统一决策契约和门禁，避免未盘点旧组件前重复造轮子。
- 未把 Huashu 仓库的代码直接复制进来，也未把其渲染引擎替换 Remotion。
- Huashu 色板文件作为上游参考链接保留；实际项目仍需在样式确认表中选择一套色板并记录准确 HEX，防止只写“使用 Huashu 色板”却未真正锁定颜色。
