# 视觉系统参考

> 色板来源：`references/色板.md`（随 skill 分发）

## 选用流程（四步 · 按序执行）

**Step A** 风格选择（决策树，输出 styleMode + 推荐色板）→ **Step B** 色板确认（查六键色值，写入 palette.ts）→ **Step C** 字号锁定（直接取 ep5-v2 梯度）→ **Step D** 样式预览（渲染一帧，操作者 review 通过后方可进入完整制作）

---

## Step A · 风格选择

整片必须先选定一套 `styleMode`，写入 `scenes.json` 顶层，全片统一，不得逐镜混搭。决策树按内容信号一步输出（styleMode + 推荐色板），不得凭美学直觉选。

### 决策树

```
① 画面里有没有「精确的字和数」（占比/曲线/时间线/多项对比）？
   有 ↓
     深底·严肃/行业/夜间质感         → vox        + ink   深墨
     浅底·数据清爽/信息流友好          → vox-light  + snow  雪原
     浅底·观点解读/解释一个道理        → vox-light  + paper 纸本
   没有 ↓

② 讲「机制原理/系统」还是「观点态度/认知」？
   机制/原理 ↓
     推导/课堂/公式感                → kurzgesagt + chalk   黑板
     设计/流程/几何结构              → kurzgesagt + bauhaus 包豪斯
     冲突/反直觉/一句话砸进去的科普   → kurzgesagt + poster  海报黄
   观点/态度 ↓

③ 观点载体是「技术感」还是「人味」？
   技术/工程/AI/互联网黑话 ↓
     产品/数据中性/工程选型           → tech-mint + navy  海军
     严肃/深沉/行业批判              → tech-mint + ink   深墨
   读书/成长/职场/价值观 ↓
     生活/手作/亲和力                → doodle-note + wood  暖木
     人文/历史/解读道理              → doodle-note + paper 纸本

④ 最后校验：素材形态 + 一致性风险
   无图素材，且需要 20~40 张同风格画面 → 代码画（doodle-note / kurzgesagt），一致性 100%
   有实拍/截图/真实数据               → vox / tech-mint
```

### 风格模式概览

| styleMode | 叙事逻辑 | 适配题材 | 可选色板 | 主力镜头语言 |
|---|---|---|---|---|
| `tech-mint` | 画面氛围驱动，星空科技感 | AI/技术/工程/互联网黑话 | `navy` `ink` | H1 科技界面（去玻璃化） |
| `kurzgesagt` | 一镜一概念，画面主导、旁白配画 | 科普/原理/抽象概念/系统机制 | `chalk` `bauhaus` `poster` | KG-y1 标准矢量 |
| `vox` | 口播驱动，图表即主体、旁白带读 | 分析/观点/数据/行业内幕/复盘 | `ink` | C1 动态图表（+V1 混合媒体） |
| `vox-light` | 同 vox，浅底变体 | 同 vox，微信视频号白色信息流优先 | `snow` `paper` | C1 动态图表 |
| `doodle-note` | 逐笔绘制，单色线稿 + 常驻栏目标题 | 读书解说/成长/职场/价值观/金句 | `wood` `paper` | T0 手绘叙事（+W1 白板） |

> 镜头语言（单镜画面语法）**逐镜选用**，主力与 styleMode 对齐、辅助语法查兼容矩阵，详见 `references/镜头语言.md`。styleMode 定全片基调，镜头语言定单镜画面——两层不冲突。

### （styleMode + 色板）组合总表

| styleMode | 色板 | 内容信号 | 亮/暗底 |
|---|---|---|---|
| `vox` | `ink` 深墨 | 精确数据 + 严肃/行业/夜间 | 暗 |
| `vox-light` | `snow` 雪原 | 精确数据 + 清爽/信息流友好 | 亮 |
| `vox-light` | `paper` 纸本 | 精确数据 + 观点解读/解释道理 | 亮 |
| `kurzgesagt` | `chalk` 黑板 | 机制原理 + 推导/课堂/公式 | 暗 |
| `kurzgesagt` | `bauhaus` 包豪斯 | 机制原理 + 设计/流程/几何 | 亮 |
| `kurzgesagt` | `poster` 海报黄 | 机制原理 + 冲突/反直觉/科普爆点 | 亮 |
| `tech-mint` | `navy` 海军 | 技术观点 + 产品/数据/工程 | 暗 |
| `tech-mint` | `ink` 深墨 | 技术观点 + 严肃/深沉/行业批判 | 暗 |
| `doodle-note` | `wood` 暖木 | 读书/价值观 + 生活/手作/亲和力 | 亮 |
| `doodle-note` | `paper` 纸本 | 读书/价值观 + 人文/历史/道理 | 亮 |

### 命中信号 vs 反信号

| styleMode + 色板 | 命中信号 | 反信号（选了就翻车） |
|---|---|---|
| `vox` + `ink` | 有曲线/占比/时间线，严肃行业/夜间质感 | 全是抽象概念、没有一个数 → 空图表 |
| `vox-light` + `snow`/`paper` | 同 vox，主投微信视频号、清爽观感 | 需要影院感/悬疑/夜间质感 → 浅底像 PPT |
| `kurzgesagt` + `chalk`/`bauhaus`/`poster` | "它是怎么运作的"，可拆成一镜一概念 | 观点密集，一镜要塞三层意思 |
| `tech-mint` + `navy`/`ink` | 技术选型、架构、工程踩坑 | 情绪/共鸣类题材 → AI slop 高发区 |
| `doodle-note` + `wood`/`paper` | 读书解说、金句、认知台阶，需要亲和力 | 需要精确数据、真实质感、炫技视觉 |

> **两条覆盖规则**：
> 1. 操作者给了参考片 → 风格由参考片决定，不走决策树；只判定「该风格能否跑通」
> 2. 决策树结论必须写进 `draft-review.md` 的样式确认表，逐问给出结论

---

## Step B · 色板确认

决策树确定色板名后，在此查阅六键色值，写入 `src/effects/palette.ts` 单点维护。**各 Effect 文件不得硬编码颜色，一律引用 palette 常量。**

| 色板 | 亮/暗 | bg | surface | ink | sub | accent | accent2 |
|---|---|---|---|---|---|---|---|
| `paper` 纸本 | 亮 | #F3EDE2 | #FBF8F2 | #1B1A17 | #6B655B | #C8402F | #2F5D62 |
| `poster` 海报黄 | 亮 | #FFD23F | #FFF6D6 | #111111 | #4A4433 | #FF5A36 | #14213D |
| `ink` 深墨 | 暗 | #121417 | #1E2226 | #F2EFE8 | #A39E93 | #F2B33D | #5FB3A1 |
| `navy` 海军 | 暗 | #0D1B2A | #16293D | #EEF3F6 | #8FA3B3 | #5CC8E0 | #F2A93B |
| `bauhaus` 包豪斯 | 亮 | #EFE9DD | #FFFFFF | #111111 | #555555 | #D62828 | #1D4E89 |
| `snow` 雪原 | 亮 | #E9EEF0 | #FFFFFF | #1F2A30 | #5E6B72 | #D9482B | #3E7C8C |
| `wood` 暖木 | 亮 | #EDE3D1 | #F7F1E6 | #2B2622 | #7A6E62 | #C4552D | #3F5B4B |
| `chalk` 黑板 | 暗 | #23302B | #2E3D37 | #F1EFE6 | #A9B3AA | #F4D35E | #E87D5A |

### 色值使用约束（全模式通用）

- 强调色一镜里只指一个东西；`accent` / `accent2` 不同时大面积使用
- 底色全片亮暗区间不变：亮底不出现近黑场景，暗底不突然冒出白底图表
- 不用渐变底，不加霓虹外发光；要层次用明暗两层平涂、描边、白卡
- 蓝紫禁区（色相 225°–300° 且饱和度 ≥0.30）不做底色，不大面积使用
- 有真实素材（截图/照片）时可从素材取色做 accent，底色仍用色板

### 暗底专属约束（ink / navy / chalk）

- 字幕用 `palette.ink`（浅色），加深色 textShadow 压住图形
- 渐隐遮罩与 `palette.bg` 同色，不用黑色

### 亮底专属约束（paper / poster / bauhaus / snow / wood）

- 字幕改深色（`palette.ink`），加浅色 textShadow（`0 2px 8px rgba(255,255,255,0.92)`）
- 渐隐遮罩与 `palette.bg` 同色，不用黑色（否则片尾压黑）
- 禁用一切发光滤镜；层级靠描边 + 白卡 + 字重拉开，不靠光

---

## Step C · 字号梯度

> 来源：ep5-v2-video 实测，15 个 Effect、74 处 fontSize 静态归类。  
> **直接取用，不在生产时重新推算。**

```
字幕带（独立体系，与 Effect 字号完全隔离）
  口播字幕：70px  600  palette.ink

Effect 内字号金字塔（级差 4–6px，相邻层至少差 2 级可区分）
  金句 / 术语名 / 警示大字：  56–58px  900
  镜内大标题 / 钩子句：       48–52px  800
  副级标题 / 对比词标签：     44px     700–900
  正文叙述句（主力字号）：    40–42px  700–800
  眉题 / 图表标签 / 小注：   34–38px  600–700
  次级说明 / 对比小词：       28–32px  600
  徽章 / badge / 编号圈：    22–28px  900
  行内强调词：                宿主 +4~12px  900  palette.accent
```

| 内容类型 | 字号 (px) | 字重 | 颜色惯例 |
|---|---|---|---|
| 口播字幕（独立体系） | 70 | 600 | palette.ink + textShadow |
| 金句 / 结论 / 转折句 | 58 | 900 | palette.accent 或 palette.ink |
| 关键术语名 / 大箭头 | 56 | 900 | palette.accent |
| 警示大字标签 | 52 | 900 | palette.accent（负面场景） |
| 镜内大标题 / 钩子句 | 48–52 | 800 | palette.ink（激活）/ palette.sub（未激活） |
| 副级标题 / 对比词标签 | 44 | 700–900 | palette.ink |
| 正文叙述句 | 40–42 | 700–800 | palette.ink |
| 眉题 / 栏目标签 | 34 | 700 | palette.accent + 横线 |
| 辅助小注 / 条件句 | 36–38 | 600–700 | palette.sub |
| 图表标签 / 数据卡头 | 36–40 | 700–800 | palette.sub / palette.ink |
| 次级说明 / 对比小词 | 28–32 | 600 | palette.sub |
| 徽章 / 胶囊 / badge | 22–28 | 900 | accent 底反白，或 palette.ink |
| 序号圈数字 | 30 | 900 | palette.accent 底 + 反白 |
| 符号 / 箭头 | 32–56 | 700–900 | palette.accent |
| 行内强调词 | 宿主 +4~12 | 900 | palette.accent |

---

## Step D · 样式预览

见 SKILL.md Step 2.5。色板与字号确认后，渲染一帧探针帧供人眼核验，通过后方可进入 Step 3 完整制作。

---

## 各风格模式详细规范

### 模式一 · `tech-mint`（深空科技，默认）

**叙事逻辑**：画面氛围驱动，星空科技感，适合 AI/技术/工程/互联网黑话。

| 项目 | 规范 |
|---|---|
| 背景 | `palette.bg` 纯色实底（**不用渐变**）+ StarfieldDrift 透明动画层叠加 |
| 配色 | 引用选定色板六键；星点颜色：主星 `palette.accent`，金色星 `palette.accent2` |
| 图形 | accent 色强调线，可用 accent 色做发光效果（`stdDeviation 14–18`） |
| 动效 | StarfieldDrift 星空漂移 + 透视网格；元素淡入/平移；accent 色横线发光 |
| 禁用 | ❌ Effect AbsoluteFill 设实色背景（遮住 StarfieldDrift） ❌ 渐变底色 |

**两套色板对应（navy / ink）**

| 角色 | 色板键 | navy 海军 | ink 深墨 |
|---|---|---|---|
| 背景底 | `bg` | #0D1B2A | #121417 |
| 卡片/面板 | `surface` | #16293D | #1E2226 |
| 主字/正文 | `ink` | #EEF3F6 | #F2EFE8 |
| 次字/细线 | `sub` | #8FA3B3 | #A39E93 |
| 主强调 | `accent` | #5CC8E0 | #F2B33D |
| 副强调 | `accent2` | #F2A93B | #5FB3A1 |

---

### 模式二 · `kurzgesagt`（扁平矢量科普）

**叙事逻辑**：一镜一概念，画面主导、旁白配画，适合科普/原理/抽象概念/系统机制。

| 项目 | 规范 |
|---|---|
| 背景 | `palette.bg` 纯色实底，全片一个底色 |
| 配色 | 引用色板六键；高对比撞色（chalk/poster 暗/亮高对比，bauhaus 几何感） |
| 信息密度 | **一镜一概念**：每个 scene 只讲一件事，只放一个核心图形 + 极简标注 |
| 动效 | 2D 平移/缩放/整体淡入，元素依次弹入（easeOutBack 轻微回弹），节奏快 |
| 禁用 | ❌ StarfieldDrift ❌ 任何渐变 ❌ 漂浮粒子 ❌ 玻璃拟态 ❌ 阴影/发光滤镜 |

> `chalk` 为暗底，`bauhaus`/`poster` 为亮底——亮底变体须同步遵守亮底专属约束（字幕深色、遮罩同底色、禁发光）。

**三套色板对应（chalk / bauhaus / poster）**

| 角色 | chalk 黑板 | bauhaus 包豪斯 | poster 海报黄 |
|---|---|---|---|
| `bg` | #23302B | #EFE9DD | #FFD23F |
| `surface` | #2E3D37 | #FFFFFF | #FFF6D6 |
| `ink` | #F1EFE6 | #111111 | #111111 |
| `sub` | #A9B3AA | #555555 | #4A4433 |
| `accent` | #F4D35E | #D62828 | #FF5A36 |
| `accent2` | #E87D5A | #1D4E89 | #14213D |

---

### 模式三 · `vox`（图表驱动解释）

**叙事逻辑**：口播驱动，图表即主体、旁白带读，适合分析/观点/数据/行业内幕/复盘。

| 项目 | 规范 |
|---|---|
| 背景 | `palette.bg` 纯色实底，或真实素材（地图/档案/照片）压暗铺满 |
| 画面主体 | 图表铺满全屏，旁白带读；画面为口播做证据 |
| 标注 | `palette.accent` 标注线、箭头、圈红、下划线，逐帧点亮 |
| 叙事结构 | 抛问题 → 给背景 → 层层推进 → 落一个判断 |
| 音画关系 | 严格口播驱动：配音先定时长，标注节奏跟随旁白 |
| 禁用 | ❌ 花哨转场 ❌ 粒子 ❌ 图表用生图画（数字必糊，须用 infographic/精绘） |

**色板（ink 深墨）**

| 角色 | 色板键 | 色值 |
|---|---|---|
| 背景底 | `bg` | #121417 |
| 卡片容器 | `surface` | #1E2226 |
| 主字 | `ink` | #F2EFE8 |
| 次字/细线 | `sub` | #A39E93 |
| 标注线/强调 | `accent` | #F2B33D |
| 辅助图表色 | `accent2` | #5FB3A1 |

#### `vox-light` 浅底变体

`vox` 的全部叙事与标注规范不变，替换色板。微信视频号白色信息流友好。须同步遵守亮底专属约束。

**snow 雪原（数据清爽）**

| 角色 | 色板键 | 色值 |
|---|---|---|
| 背景底 | `bg` | #E9EEF0 |
| 卡片容器 | `surface` | #FFFFFF |
| 主字 | `ink` | #1F2A30 |
| 次字/细线 | `sub` | #5E6B72 |
| 标注线/强调 | `accent` | #D9482B |
| 辅助色 | `accent2` | #3E7C8C |

**paper 纸本（观点解读）**

| 角色 | 色板键 | 色值 |
|---|---|---|
| 背景底 | `bg` | #F3EDE2 |
| 卡片容器 | `surface` | #FBF8F2 |
| 主字 | `ink` | #1B1A17 |
| 次字/细线 | `sub` | #6B655B |
| 标注线/强调 | `accent` | #C8402F |
| 辅助色 | `accent2` | #2F5D62 |

---

### 模式四 · `doodle-note`（手绘读书笔记）

**叙事逻辑**：逐笔绘制，单色线稿 + 常驻栏目标题，适合读书解说/成长/职场/价值观/金句。

| 项目 | 规范 |
|---|---|
| 背景 | `palette.bg` 浅色纸底，全片不变，**禁渐变/星空/粒子** |
| 线条 | `palette.ink`（接近黑）单线，等线宽 3~4px，圆头圆角，**无填色无阴影** |
| 手绘感 | path 端点抖动 + 中段弓形偏移（确定性伪随机，同 seed 同结果）；小半径圆抖动幅度随半径收敛 |
| 绘制动效 | `pathLength=1` + `strokeDashoffset` 逐笔绘制，元素按语义顺序错峰画出 |
| 版式 | 三段：顶部常驻栏目标题 / 中部插画 `contain` / 底部字幕。**此模式下「顶部常驻标题」是版式特征，不受「❌ 顶部 eyebrow」否定项约束** |
| 防冻结 | 插画画完后须有**纸面呼吸**（极缓 translate/scale/±0.12° rotate） |
| 素材来源 | 优先代码手绘 SVG；复杂有机轮廓用不规则平滑闭合形，别用多边形硬凑 |
| 已知边界 | 复杂隐喻代码画不出来，**读不出语义就删掉换喻**，不要留着凑数 |
| 字体 | 中文手写/楷体（霞鹜文楷 SIL OFL）；**动手前先探测本机字体**，缺字体先补装 |
| 禁用 | ❌ 渐变 ❌ 星空 ❌ 粒子 ❌ 发光滤镜 |

**两套色板对应（wood / paper）**

| 角色 | wood 暖木 | paper 纸本 |
|---|---|---|
| `bg`（纸底） | #EDE3D1 | #F3EDE2 |
| `surface`（卡片） | #F7F1E6 | #FBF8F2 |
| `ink`（线条/主字） | #2B2622 | #1B1A17 |
| `sub`（次字） | #7A6E62 | #6B655B |
| `accent`（栏目标签/强调） | #C4552D | #C8402F |
| `accent2` | #3F5B4B | #2F5D62 |

---

## AI slop 红线（四模式通用）

无论哪套模式，凡是「生图/画面」环节，一律避免：**蓝紫渐变、玻璃拟态、漂浮粒子、无意义光晕、赛博霓虹堆砌**。生图提示词固定加负向约束：`flat design, solid color blocks, no gradient, no glow, no particles, no glassmorphism`。

---

## 版面安全区（关键约束）

```
┌─────────────────┐  y=0
│   留白           │  0–150
├─────────────────┤
│  上方视觉区      │  top:150, left/right:40, height:1210
│  (Effect/图)    │  objectFit: contain，禁止 cover
├─────────────────┤  y=1360
│  字幕带         │  top:1440, left/right:56, bottom=220(锁定)
├─────────────────┤  y=1700
│  平台安全区      │  1700–1920 禁止任何内容
└─────────────────┘  y=1920
```

---

## 装饰要素

- **StarfieldDrift**（**仅 `tech-mint`**）：全片底层，80星点飘落+闪烁，主星 `palette.accent`，金色星 `palette.accent2`，透视网格；`kurzgesagt` / `vox` 模式**禁用**
- **透视网格**（仅 `tech-mint`）：`palette.sub` 细线汇聚中心，opacity 0.06–0.08
- **强调横线**：`palette.accent` + feGaussianBlur 发光（`kurzgesagt` 改用纯色块实线，无发光）
- **大字发光**：stdDeviation ≈ 14–18；**小元素发光**：stdDeviation ≈ 6–10（`kurzgesagt`/`vox`/`doodle-note` 禁用发光滤镜）

---

## Effect 组件规范

- **底色按 styleMode 决定**：`tech-mint` 下 Effect AbsoluteFill 必须 `background: "transparent"`（否则遮住 StarfieldDrift）；其余模式 Effect 直接用 `palette.bg` 纯色底
- 禁用 3D rotateY 翻页——竖屏透视变形，改用 2D 平移/缩放/淡入
- **字号按 Step C 梯度，直接取用，不重新推算**
- 进入时间用绝对帧数，不用百分比
- prop 接口：`{ frame, fps, durationInFrames, scene }`，**必须完整解构**，不得只解构 `frame` 丢掉 `scene`
- **容器与内容必须共用同一 opacity 入场**：背景色块和子元素共用同一 opacity 动画变量，不允许容器先于内容出现

---

## 字幕系统

- **固定字号 70px**，不动态缩放，不使用 `whiteSpace: "nowrap"`
- **每次只显示一行**，任何时刻屏幕上只有一条字幕，旧行淡出 → GAP → 新行淡入
- **每行不超过 13 个视觉字符**（中文字符计1，英文/数字计0.55），确保 70px 下不折行
- FADE_IN=10帧，FADE_OUT=10帧，GAP=8帧
- **颜色**：暗底用 `palette.ink`（浅色）；亮底用 `palette.ink`（深色）+ 浅色 textShadow（`0 2px 8px rgba(255,255,255,0.92)`）
- **三级切割顺序**（`chunkText` 算法）：
  1. 先按强标点切（`。？！；…`）
  2. 超过 13 字的段再按逗号/顿号切（`，、,`）
  3. 仍超过 13 字的段按字符数机械截断
- 切割后每块按 `visualLen` 比例分配显示时间

---

## 封面规范

- V1+V2 两版，1080×1440
- 两版都必须：**问句大标题** + **格式化核心内容**（编号/色块/对比，禁纯文字段落）
- V2 背景与视频首帧一致，无跳变
- 标题.txt：问句≤16字符；描述.txt：内容摘要≤1000字符，结尾带 #话题标签
- 封面配色沿用整片色板，不另起新色

---

## narration vs subtitle 规则

- 两者内容必须完全一致，仅允许英文术语→中文等价物替换（发音修复）
- subtitle 保留英文原词；narration 替换为中文读音友好的等价词
- TTS 读 `narration ?? subtitle`
