# vertical-short-video-production

竖版中文知识短视频制作 skill，输入脚本/素材，输出可直接在 Remotion Studio 预览、`npm run render` 出片的完整项目。

---

## 适用场景

- 知识科普 / 观点解释 / 技术口播
- 抖音 / 微信视频号竖屏（1080×1920）
- Kurzgesagt / Vox / tech-mint 风格
- 只做其中一环也适用：分镜草稿、TTS 配音、封面设计

---

## 文件结构

```
vertical-short-video-production/
├── SKILL.md              # 主流程（Step1–6）+ 否定项约束
├── visual-system.md      # 视觉规范：版面安全区、风格决策树、Effect 规范
├── code-templates.md     # 可复制代码模板（Effects、scenes.json、脚本等）
├── chattts/
│   ├── chattts_batch.py  # ChatTTS 批处理脚本（模型只加载一次）
│   ├── config.json       # ChatTTS 本地安装路径配置
│   ├── sync_speakers.py  # 同步 speaker embedding 到 ChatTTS 目录
│   ├── voice_presets.json
│   └── speakers/         # 通用风格 + Demo 音色 embedding 文件
└── scripts/
    ├── check-draft-sync.mjs  # 草稿与 scenes.json 一致性检查（Step3/5 门禁）
    ├── svg2png.mjs           # SVG 单文件转 PNG
    └── package.json
```

---

## 前置依赖

| 依赖 | 说明 |
|------|------|
| Node.js ≥ 18 | Remotion 运行环境 |
| ChatTTS | 本地 TTS 引擎，需配置 `chattts/config.json` |
| ffmpeg | 音频处理（归一化、降速） |
| ffprobe | 音频时长读取 |

首次使用时 skill 会引导配置 ChatTTS 路径，写入 `chattts/config.json`。

---

## 核心流程（6 步）

```
Step 1  素材盘点         读取所有文档/图片，落盘 source.md
Step 2  草稿 + 评测      写分镜草稿，7维度打分，落盘 draft-review.md
                         ↓ 用户 Review 通过后继续
Step 3  视觉素材         按 shot_type 路由（Effect / 信息图 / 生图）
Step 4  Remotion 实现    写 Effect TSX，编译验证用 npx tsc --noEmit
Step 5  TTS 配音         批量生成 → 归一化 → sync-durations
                         开场 S01 额外 atempo=0.9 降速
Step 6  封面 + 发布文案  V1+V2 封面 SVG/PNG，标题.txt，描述.txt
```

---

## 视觉风格（4 选 1）

| styleMode | 参照 | 适用题材 |
|-----------|------|---------|
| `tech-mint` | 深空薄荷 | AI / 技术 / 工程 |
| `kurzgesagt` | 扁平矢量科普 | 科普 / 原理 / 机制 |
| `vox` | 图表驱动 | 数据 / 分析 / 观点 |
| `doodle-note` | 手绘读书笔记 | 读书 / 成长 / 价值观 |

---

## 关键约束（高频违规项）

- **顶部留白**：Effect 内容元素 `top ≥ 150px`，背景装饰层不限
- **TTS 中文化**：narration 不得含英文字母数字混排（`36G` → `三十六G`）
- **编译验证**：用 `npx tsc --noEmit`，禁止用 `remotion still`（污染 `out/` 目录）
- **Outro 三件套**：OutroRecap scene + tailSec 静场 + 整片渐隐，缺一不可
- **容器 opacity**：背景色块与子内容共用同一 opacity 变量，不得容器先于内容出现

完整约束见 `SKILL.md` 否定项。

---

## 常用命令

```bash
# 开发预览
npm start

# 出片
npm run render

# 单场景重新生成 TTS（含归一化 + sync）
node scripts/tts-single.mjs --scene S03

# 开场镜头 TTS（降速 0.9）
node scripts/tts-single.mjs --scene S01 --slow

# 草稿一致性检查
node scripts/check-draft-sync.mjs

# 封面渲染
node scripts/render-cover.mjs

# 编译验证（不产生输出文件）
npx tsc --noEmit
```

---

## 更新记录

| 日期 | 变更 |
|------|------|
| 2026-09-05 | 新增 `tts-single.mjs` 单场景重生成工作流 |
| 2026-09-05 | TTS 中文化范围扩展至数字+单位+专有名词 |
| 2026-09-05 | 顶部留白约束从 120px 调整为 150px |
| 2026-09-05 | 新增「容器与内容共用 opacity」动画规范 |
| 2026-09-05 | 编译验证改为 `npx tsc --noEmit`，禁止 `remotion still` |
| 2026-09-05 | 开场 S01 音频强制 atempo=0.9 降速约束 |
