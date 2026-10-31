# 批准后的生产规范（Step7–9）

## 全字段入口与版本

开始每一阶段前读取当前计划和审阅稿，确认planVersion、review.status=approved、reviewedVersion、评测版本及全部文字/来源/组件/动效/字体/色板配置一致。修改用户设计（含字体、标签、布局）需版本+1、重评、明确批准；真实音频时间换算和恢复批准方案的实现bug可保持内容版本。

新项目使用 `render-review.mjs`、`export-plan.mjs`、`validate-project.mjs`；既有 `check-draft-sync.mjs`只做旧稿旁白兼容检查。全字段校验不能被“11镜旁白一致”替代。生成器遇用户修改的视图停止，先回写差异，不覆盖消除冲突。

## Step7：复制工程模板，生成题材代码

1. 按 `code-templates.md`工具索引执行 `init-project.mjs --project-root <实际项目根>`，复制assets/project-template。生成palette、完整排版、场景数据、注册和project.config.json；不手工重写字幕、入口、TTS脚本或一整份运行JSON。
2. 初始化验证有效批准方案、工程路径与全局Chrome；缺浏览器先让用户安装/复制，不能触发项目级下载。依赖独立npm install，不复制node_modules；旧工程不自动迁移。
3. 读需要的共用UI/模式组件文件，按计划生成独立 `{sceneId}-{EffectName}.tsx` default export包装，完整接收frame/fps/durationInFrames/scene。component.params和visualElements必须被真正使用，不另硬编码文案。
4. 顶部标题SceneHeading52/800/sans；知识Chip44/900，结论44/800，机制节点44/800/sans；图表标注38/700；字幕显式文楷70/600。资产合同review-v1-fixed是数值唯一来源。手写镜只改已规划的镜内文字fontRole，不能把顶部标题或字幕字体交给继承。
5. SceneCanvas局部1000×1210，屏幕原点(40,150)。图形bounds包含描边/半径/SVG偏移/padding/动态缩放；主视觉至1360之前、字幕top1440/左右56/bottom250。装不下先排布/换行/拆镜，不缩字。
6. 每批Effect运行生成工程的typecheck与lint（validate-project），并做知识兑现和相邻镜静态核对。缺组件或无效参数必须阻塞，不能静默空画面。

## 组件与素材

- 每镜独立包装，可引用真实共享组件；优先左右对照、顺序揭示和Outro等通用模块。能力索引列真实路径/props，不将旧Effect名称表当成已经存在或通过验收的库。
- 长知识镜不能只有标题，旁白中的关键名词、数字、对比、流程、因果需落实到画面；共用样式不代表所有镜头套同一布局。
- FLOW_FIELD使用明确路径/方向，数据图真实数值与坐标、无数据标示意；不随机粒子冒充科学模拟。motionPlan帧驱动且确定性，禁止setTimeout/CSS自动播放决定关键知识状态。
- effect优先代码动态表达；静态数据infographic/chart、流程process、矢量flat、氛围atmosphere、手绘doodle，仍按批准shot_type路由。精确数据不交通用生图；生成图片前使用对应提示词与负向规范，不绕过Step6批准。
- 实际颜色统一palette六键；默认paper/vox-light平涂，不挂星空、不添加渐变/发光/玻璃、栏目带/品牌带/进度条。真实图片无需强行改色，但容器/标注统一。
- 不新增代码注释或emoji。顺序揭示不等于因果，几个卡片淡入不能冒充机制解释。

## 字幕与Outro

固定70/600文楷，纯中文单行≤13视觉字符；三级切割、去尾标点、过滤纯标点，串行淡入淡出。模板字幕纯函数有预算验证，极短区间压动画间隙不压字号；普通镜整段TTS比例分配，分段用真实startSec。比例法仍需人工听看校验。

Outro独立最后一镜，不含新知识；回顾标题50/800、回顾项42/700、序号30/900、金句58/900、出处36/600。tailSec2.0–2.5、有声区间完成最后入场，静场仅呼吸和渐隐，末30–35帧遮罩用bg而非黑场。真实音频同步后重算触发，不沿用过期估计帧。

## Step8前：环境确认

只在批准后的音频制作前读取实际Skill根chattts/config.json，验证chatts_root/ChatTTS、speakers和默认gentle_female文件。有效配置不改；缺失才请用户提供正确根路径。备用speaker不阻塞默认配音，不建议运行不存在的sync_speakers.py。

先做单句CLI测试（不是批量），确认有效音频和真实时长；Apple Silicon解释器匹配arm64，PYTHONPATH来自配置。ffmpeg/ffprobe从实际PATH或明确配置定位，不硬编码用户名。

## Step8：统一音频管线

使用 `audio-pipeline.mjs --project-root <实际根> --generate --tts-batch chattts`。全量或单镜生成支持由工具help给出；模型批处理只加载一次。脚本必须验证子进程退出状态、任务结果、逐个输出路径与有效时长；不能因最后一个管道命令成功就假称全部成功。

- 根据批准alignmentMode选择整镜或逻辑分段；不按subtitleSegments数量切换。默认gentle_female，不按题材改音色；备用edge需明确批准且YunxiNeural。
- 保存raw音频与处理状态，从同一原始输入处理，实现幂等，不重复降速。全部MP3归一化-16.60LUFS/TP-3.59/LRA1.20、44100；第一镜openingTempo0.9，额外tempo仅来自批准配置。
- 绝对输出路径，spawn/execFile数组传参、不拼接shell；全部准备及测量成功后提交最终音频与scene元数据，失败不标整片measured。
- `--sync-only`只测已有最终音频，缺失/无效必须报错；每镜durationSec=audioDurationSec+PAD+tailSec，多段startSec按最终处理后的part累加，不保留旧边界。
- 旁白/分段/引擎/音色变化使旧音频失效；只改视觉不应冲掉有效实测时长。保留estimated字段用于对比，生产timingBasis明确measured。
- 每镜语速>5.8必须降速或改分段并遵守重新审批，不能删知识；极差路线变更同样回计划审批。不自动切引擎/音色或偷偷调整设计。
- 生成后用script-stats实测核对有声时长、语速与极差，用validate和typecheck检查同步；不自动渲染视频。

## Step9：封面Review与发布物

只先输出项目发布素材下V1/V2封面SVG1080×1440、标题.txt（问句≤16字）、描述.txt（≤1000字符带标签）。封面同批准色板、V2背景与视频首帧设计一致；封面字号独立，不反向改视频排版。

交付SVG后停止等待用户对具体当前文件明确确认。记录文件、SHA-256、确认人及依据在现有审阅稿封面Review区；修改SVG后旧批准失效，旧PNG不可当最新。

确认后用 `render-cover.mjs`核验当前SHA-256与获批摘要，只转换批准版本；参数与digest仅防误执行，不替代用户确认。输出PNG后人工看字形/截断/尺寸；静态转换不授权Remotion视频渲染。

## 收尾和性能

交付代码、有效音频、方案及获批封面文案，声明“非渲染检查通过/视觉待人工验收”。不主动执行关键帧、短片或MP4，不用tsc声称视觉正确。

按需读取模板索引而非全文旧模板。依赖安装可与独立Effect实现并行，公共类型稳定后再分工；保留全部科学/知识/审批/视觉质量卡点。Token和耗时收益须用同题材同模型多次实测，未测量不承诺节省比例。
