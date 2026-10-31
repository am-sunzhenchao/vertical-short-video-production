# 工程模板与工具入口

## 新项目不再重写基础代码

批准方案后执行Skill自带初始化工具，复制 `assets/project-template/`。固定的字幕、入口、尾部渐隐、UI、类型和脚本wrapper直接复用；模型只生成每镜包装、题材相关几何与参数。旧版完整代码块保存在 `legacy/code-templates-v1.md`，只在用户要求迁移旧项目时读取，不用于新项目。

路径 `<skill-root>`、`<project-root>`须替换为实际绝对路径。所有工具默认读取项目根 `制作过程/视频制作方案.json`，不依赖cwd或固定用户名。

## 命令索引

| 时机 | 工具 | 职责 |
|---|---|---|
| Step5 | `scripts/script-stats.mjs --raw ... --plan ...` | 无生产工程时直接统计预估有声时长、字数、压缩比；零原文为N/A |
| Step5–6 | `scripts/render-review.mjs --project-root ...` | 同版完整JSON生成人读审阅稿，不悄悄覆盖用户修改 |
| Step7 | `scripts/init-project.mjs --project-root ...` | 核验审批、全局浏览器与安全路径，复制模板，生成配置和注册；不生成假Effect |
| Step7/Review | `scripts/export-plan.mjs --project-root ...` | 导出完整场景表达配置，保持有效实测时序；旁白/音色变化使旧音频失效 |
| Step7–9 | `scripts/validate-project.mjs --project-root ...` | 审批/字段/字体角色/组件/路径/数据一致性及静态检查 |
| Step8 | `scripts/audio-pipeline.mjs --project-root ... --generate --tts-batch chattts` | 一次模型加载、全数结果检查、处理音频、回写真实时序 |
| Step8 | `scripts/audio-pipeline.mjs --project-root ... --sync-only` | 测量已有最终音频；缺失或失败不假标measured |
| Step9获批SVG | `scripts/render-cover.mjs --project-root ...` | 校验当前SVG批准摘要后转换PNG；确认前不运行 |

具体可选参数以工具 `--help` 为准。初始化不会自行安装依赖；在生成的生产根运行独立 `npm install`，或明确使用初始化工具的安装选项。缺全局Chrome先让用户配置，不触发项目级下载。

## 可复制模板

| 路径 | 作用 |
|---|---|
| `assets/typography.json` | 完整排版值唯一来源，review-v1-fixed |
| `assets/project-template/src/ui/` | 标题、知识胶囊、节点、结论、图表文字、字幕、回顾和局部画布 |
| `assets/project-template/src/Scene.tsx`、`Video.tsx`、`subtitles.ts`、`types.ts` | 字幕纯函数、场景/Sequence/Audio/渐隐及运行类型 |
| `assets/project-template/scripts/run.mjs` | 从project.config.json读取真实根目录并调用Skill工具 |
| `assets/project-template/package.json` | Remotion/react依赖、dev/render/typecheck/lint及生产工具命令 |

每镜文件命名 `{sceneId}-{EffectName}.tsx`、使用default export，接收 `{frame,fps,durationInFrames,scene}`；调用共用UI或经过核实的运动组件。声明的component.params和visualElements必须被实际消费，不能只保存元数据。

## Review与校验

- 设计字段变更递增planVersion、重置审批与评测，明确批准新版本后再生产；不改变设计意图的类型/路径bug修复及实测时间换算不自行改变内容版本。
- 审阅稿、运行scenes和注册为可再生成派生数据；保留用户手工修改并先处理冲突，不用覆盖开关消除差异。
- `check-draft-sync.mjs`保留用于旧草稿旁白检查，不代替新工具的全字段、排版和版本检查。
- 每批Effect执行生成工程的 `npm run typecheck` 与 `npm run lint`。输出只代表非渲染验证；字体形状、遮挡、流场正确性和正常速度对齐仍待人工第10步验证。
- 不新增代码注释、emoji，不自动渲染Remotion关键帧/短片/MP4；基础模板不承诺通用组件已通过人工视觉准入。

## 读取与性能边界

只读需要的工具接口和组件文件，不全文加载旧模板；依赖安装可与独立Effect开发并行，公共类型先固定再分工。基础复制减少重复源码生成，不等于已测量Token节省或TTS性能提升。以同题材、同模型的新旧多次运行记录实际Token、耗时和Review返工次数，未测量不宣称收益百分比。
