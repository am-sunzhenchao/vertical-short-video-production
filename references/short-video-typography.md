# 短视频字体规范
> 适用于竖屏短视频。字号单位为 px；实现时优先使用语义角色，避免在组件中重复写死字号。

## 1. 字体角色与字号

| 用途 | 角色 | 字号 | 字重 | 行高 | 字体 |
| ---- | ---- | ---- | ---- | ---- | ---- |
| 封面主标题 | `heroTitle` | 96 | 900 | 1.15 | sans |
| 封面符号 | `heroSymbol` | 140 | 900 | 1.0 | sans |
| 标题、场景标题 | `title`、`sceneHeading` | 52 | 800 | 1.25 | sans |
| 警示 | `warning` | 52 | 900 | 1.3 | sans |
| 术语强调 | `term` | 56 | 900 | 1.3 | sans |
| 引言、金句 | `quote` | 58 | 900 | 1.4 | sans |
| 知识标签 | `knowledgeChip` | 44 | 900 | 1.3 | sans |
| 节点标签 | `nodeLabel` | 44 | 800 | 1.3 | sans |
| 小标题、结论 | `subheading`、`conclusion` | 44 | 800 | 1.3 / 1.4 | sans |
| 正文 | `body` | 42 | 700 | 1.5 | sans |
| 图表、示意图标签 | `diagramLabel`、`chartLabel` | 38 | 700 | 1.4 | sans |
| 注释 | `note` | 36 | 600 | 1.5 | sans |
| 章节标签 | `section` | 34 | 700 | 1.4 | sans |
| 箭头 | `arrow` | 32 | 700 | 1.0 | sans |
| 回顾标题 | `recapHeading`、`recapTitle` | 50 | 800 | 1.3 | sans |
| 系列名、次要信息、序号 | `series`、`secondary`、`index` | 30 | 700 / 600 / 900 | 1.4 / 1.4 / 1.3 | sans |
| 徽标 | `badge` | 26 | 900 | 1.3 | sans |
| 代码 | `code` | 28 | 500 | 1.6 | mono |
| 代码标题 | `codeHeading` | 30 | 600 | 1.45 | mono |
| 手写风格副标题 | `subtitle` | 70 | 600 | 1.6 | handwritten |
| 强调箭头 | `heroArrow` | 56 | 900 | 1.0 | sans |

## 2. 字体族
- `sans`：`'PingFang SC', sans-serif`
- `handwritten`：`'LXGW WenKai', 'PingFang SC', sans-serif`
- `mono`：`'SF Mono', 'Consolas', 'Monaco', monospace`
- 默认字体：`sans`

## 3. 使用规则
1. **按语义选角色**：标题用 `title`，正文用 `body`，图表文字用 `chartLabel` 或 `diagramLabel`，不要只凭视觉感觉随意指定字号。
2. **保持层级**：主标题、正文、辅助信息应有明显字号与字重差异；同一层级在全片保持一致。
3. **保证可读性**：竖屏画面优先保证手机观看；文字过多时先精简文案或拆镜头，不要一味缩小字号。
4. **谨慎使用小字**：`badge`、`code`、`series` 等小字号仅用于辅助信息，不承载关键知识点。
5. **强调字号**：强调文字相对基础字号增加 `8px`（`emphasisOffset: 8`）；避免连续多处强调。
6. **避免字体滥用**：全片以 `sans` 为主，手写体和等宽字体只用于明确的特殊语境。

## 4. 字幕条（底部字幕）

底部字幕条与画面字体是两套体系：字幕条固定单行、逐行串行淡入淡出，不参与上面的角色表。

| 项目 | 规范 |
| ---- | ---- |
| 字号 | 固定 **70px**，不动态缩放；`doodle-note` 浅底 64px |
| 单行限制 | 每行 ≤ 13 个视觉字符（中文计 1，英文/数字计 0.55），确保 70px 下不折行 |
| 行高 | 1.6 |
| 字重 | 600 |
| 字体 | `sans`；`doodle-note` 用 `handwritten` |
| 深底模式颜色 | 浅色字（`#e8fff3` 或所选色板 `ink` 反色）+ 深色 textShadow |
| 浅底模式颜色 | 文字主色深字 + 浅色 textShadow `0 2px 8px rgba(255,255,255,0.92)` |
| 装饰 | 禁用发光滤镜；禁用 `whiteSpace: "nowrap"` |

> 字幕条不换行、不做多行堆叠；超长文案走三级切割（见 `visual-system.md` 字幕系统），不要缩字号。

## 5. 维护约定
- 组件优先引用统一的 typography token / role，不要另建重复字号。
- 新增角色前先检查是否能复用现有角色；只有语义和排版属性确实不同才新增。
- 修改字号时同步检查实际手机尺寸下的可读性、换行和画面安全区。
