# 视频制作方案契约

## 版本、来源与路径

`制作过程/视频制作方案.json`是结构化权威方案，`制作过程/视频方案审阅稿.md`是同版可编辑视图。sourcePath/researchPath/draftPath相对于项目根解析；生产工程默认 `<slug>-video/`，明确engineDir时必须仍在用户允许项目根内。

- schemaVersion=`1.0`，planVersion为正整数。
- review.status=pending/approved；pending时reviewedVersion、approvedBy、approvedAt、approvalEvidence为null；明确批准后reviewedVersion=planVersion。
- evaluation.planVersion必须与计划版本一致；生产必须有通过的本版评测，不能自动批准。
- 改旁白、文字、字号、字体、布局、组件、动效、色板或留白属于设计变更：版本+1、清空审批、重评，再获得明确批准。
- 仅纠正实现代码使之恢复有效批准方案，或不改变设计意图的实测时间换算，可保持内容版本。不要把用户主动放大字体伪称实现bug从而跳过版本。

## 顶层字段

| 字段 | 合同 |
|---|---|
| schemaVersion/planVersion/slug/title | 版本与稳定标识；slug和组件名必须安全，拒绝路径穿越 |
| sourcePath/researchPath/draftPath | 源材料、证据、人读视图项目根相对路径 |
| coreQuestion/coreAnswer/audience/scope | 核心问题、答案、对象、适用限定 |
| video | width1080/height1920/fps25 |
| styleMode/paletteName/palette | 默认vox-light/paper；六键bg/surface/ink/sub/accent/accent2的实际值来自色板.md |
| typography | 由 `assets/typography.json`机械派生的version、tokens、fontRoles、fontFamily（sans默认）、emphasisOffset与完整roles；review-v1-fixed。asset的fonts映射为计划fontRoles，tokens由roles.fontSize派生，不让模型手填第二套数字 |
| themeOverride | 默认null；明确用户要求才覆盖 |
| narrative | outline、coverage、emotionRhythm、outro（sceneId/kind/fadeOutFrames） |
| audioPlan | engine/defaultStyle/alignmentMode/speedSpread/timingBasis/loudnessLUFS/openingTempo/PAD；经批准可登记scenesTempoById |
| review/evaluation | 当前审批、评测版本、分数、依据与状态 |
| scenes | 时间轴顺序，唯一稳定ID，独立最后Outro |

评测内容保留研究摘要/来源、科学审查、HKRR、七维评分、压缩比四项、知识覆盖及衔接处理结果。程序校验结构不证明科学论点正确，不替代人工知识Review。

## 音频字段

- alignmentMode=`single-scene-proportional`或`multi-segment-measured`；speedSpread按每镜汉字数/有声时长算极差，≤1采用整镜TTS，>1采用逻辑分段TTS。
- 计划timingBasis=estimated；生产文件在全部音频测量成功后才标measured。
- 默认engine=chattts/defaultStyle=gentle_female、loudnessLUFS=-16.60、openingTempo=0.9、PAD=0；不按题材改音色。
- subtitleSegments条数不决定路线。分段narration发音友好，计划estimatedStartSec与实际startSec不能混用。
- 额外变速需要明确批准配置，不自行生成七段shell命令或反复对最终文件降速。

## 每镜字段

| 字段 | 合同 |
|---|---|
| id/title/purpose | 稳定ID、人读标题、叙事功能；title不默认作为渲染文字 |
| knowledgeIds/claimIds/sourceIds | 指向证据文档真实ID；回顾复用已讲知识 |
| narration/subtitle | 完整中文发音稿和语义一致字幕，仅发音等价替换 |
| subtitleSegments | text/narration/estimatedStartSec；生产多段测量后加startSec |
| estimatedDurationSec/tailSec | 总场景估计含静场；一般tail0，Outro2.0–2.5 |
| shot_type/shotLang/visualGrammar | 素材路径、镜头语法、具体知识表达方法 |
| visualElements | 下述元素合同，包含全部实际标题/标签/出处/符号，不只主体图形 |
| motionPlan | knowledgeGoal/knowledgeRelation/primaryPattern/secondaryPattern/selectionReason/camera/intensity/continuityFrom/allowedMotion/forbiddenMotion/evidenceRisk |
| component | name与params；name对应独立tsx的default export；参数必须被实际读取 |
| componentLookup | 实际checkedPaths、状态、复用/新建理由、pending-human-render；文件名清单不是验收证据 |
| continuity/emotion/audioNotes | 前后承接、阅读与情绪意图、音效需要，不默认新增BGM |

## 元素合同

每项id/type/content/textRole/fontRole/colorRole/claimIds/relation/position。文本content为实际显示值；无文字textRole/fontRole可null。

- position=`{x,y,width,height}`，SceneCanvas局部1000×1210；计入半径、描边、SVG偏移、padding和字形，避免内容被viewBox裁切。
- 文字textRole来自排版合同，fontRole为sans/handwritten。顶部sceneHeading固定sans，核心nodeLabel固定sans；知识胶囊knowledgeChip44/900、结论conclusion44/800；字幕handwritten70/600。
- heroTitle96与heroSymbol140独立登记；不得用title/quote任意倍乘。符号缩放动效必须在motionPlan/params中明确。
- 警告/坐标/条件文字有对应角色，不按“画了胶囊”统一用badge26；装不下调整布局，不缩字。
- 参数、计划文字与组件应使用同一元素ID；不能只有声明而渲染另一套硬编码文案。

## 生成、Review与保留实测时序

Step5使用 `render-review.mjs`程序生成全字段视图；用户编辑后先读取差异，回写同版JSON、递增版本、重置审批并重评。视图摘要不能替代完整JSON。冲突未解决时停止，不用强制覆盖消除用户修改。

Step7使用 `init-project.mjs`复制模板及 `export-plan.mjs`导出完整scenes与注册。运行文件保留planVersion/reviewedVersion、配置及每镜全部表达字段；不要只导出narration/subtitle。

后续导出按场景ID保留有效audioDurationSec/durationSec/timingBasis及多段真实起点。旁白、分段、引擎、音色或处理参数改变必须令旧配音失效；只改视觉且音频意图未变时保留实测时序，重新计算tail与帧预算。

`validate-project.mjs`检查结构、全字段、字体角色及注册，`check-draft-sync.mjs`仅为旧稿旁白兼容检查。程序不能证明所有知识关系或字形边界，仍需人工第10步预览。

## 向后兼容

旧ep5-v2-fixed工程保持原配置，不自动搬迁/覆盖；需迁移时先备份、明确用户范围，再更新schema兼容、角色、注册、路径、实测数据与审批。
