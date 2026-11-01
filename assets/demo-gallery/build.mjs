import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const c = {bg: '#F3EDE2', surface: '#FBF8F2', ink: '#1B1A17', sub: '#6B655B', accent: '#C8402F', accent2: '#2F5D62'};
const F = 'PingFang SC, Noto Sans SC, sans-serif';
const t = (x, y, s, size = 44, fill = c.ink, w = 800, anchor = 'middle') => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${w}" fill="${fill}" text-anchor="${anchor}" font-family="${F}">${s}</text>`;
const box = (x, y, w, h, fill = c.surface, stroke = c.ink) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`;
const line = (x1, y1, x2, y2, stroke = c.ink) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>`;
const sub = s => `${t(540, 1520, s, 70, c.ink, 600)}`;
const frame = (title, body, caption) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="360" height="640"><rect width="1080" height="1920" fill="${c.bg}"/>${t(540, 220, title, 52)}${body}${sub(caption)}${t(540, 1860, '示意样例·非本片实际画面', 30, c.sub, 500)}</svg>\n`;
const patterns = {
  QUESTION_REVEAL: ['问题与答案', '先抛出问题，再揭示答案', frame('核心问题', `${box(140, 420, 800, 260)}${t(540, 570, '怎么办？', 96, c.accent, 900)}${line(540, 680, 540, 860)}${box(140, 860, 800, 260, c.surface, c.accent2)}${t(540, 1010, '答案', 96, c.accent2, 900)}`, '先问后答')],
  BRANCHING_PATH: ['条件分支', '一个起点按条件分成两条路径', frame('先判断', `${box(340, 380, 400, 140)}${t(540, 470, '条件？', 44)}${line(440, 520, 260, 720)}${line(640, 520, 820, 720)}${box(100, 720, 320, 160, c.surface, c.accent)}${t(260, 815, '路径一', 44)}${box(660, 720, 320, 160, c.surface, c.accent2)}${t(820, 815, '路径二', 44)}`, '按条件选路')],
  SEQUENTIAL_REVEAL: ['逐项浮现', '多个要点按顺序依次出现', frame('三个要点', [0, 1, 2].map(i => `${box(160, 380 + i * 260, 760, 190, c.surface, i === 1 ? c.accent : c.ink)}${t(540, 495 + i * 260, `要点 ${i + 1}`, 44)}`).join(''), '逐条讲清')],
  CAUSE_EFFECT: ['因果链', '原因经机制导出结果', frame('因果关系', `${box(100, 700, 260, 160)}${t(230, 795, '原因', 44)}${line(360, 780, 410, 780, c.accent)}${box(410, 700, 260, 160, c.surface, c.accent)}${t(540, 795, '机制', 44)}${line(670, 780, 720, 780, c.accent)}${box(720, 700, 260, 160, c.surface, c.accent2)}${t(850, 795, '结果', 44)}`, '因为所以')],
  SIDE_BY_SIDE_COMPARE: ['左右对比', '两种做法并排比较', frame('对比', `${box(70, 420, 450, 560, c.surface, c.accent)}${t(295, 520, '做法 A', 44, c.accent)}${box(560, 420, 450, 560, c.surface, c.accent2)}${t(785, 520, '做法 B', 44, c.accent2)}${t(540, 720, '≠', 140, c.ink, 900)}`, '差别在这里')],
  SYNTHESIS_LOCKUP: ['要点汇总', '把已讲内容汇总为几项并收口', frame('回头查四件事', ['输入', '执行', '输出', '恢复'].map((s, i) => `${box(120 + (i % 2) * 450, 400 + Math.floor(i / 2) * 260, 390, 200, c.surface, i % 2 ? c.accent2 : c.accent)}${t(315 + (i % 2) * 450, 520 + Math.floor(i / 2) * 260, s, 44)}`).join(''), '四项闭环')],
  OUTRO_RECAP: ['片尾回顾', '金句与已讲要点，随后渐隐', frame('一句话回顾', `${box(120, 500, 840, 420, c.surface, c.ink)}${t(540, 680, '金句', 96, c.accent, 900)}${t(540, 820, '署名 / 出处', 44, c.sub, 500)}`, '谢谢观看')]
};
const index = {note: '样例由 build.mjs 生成，示意版式与动效语法，非真实渲染；配色为 paper 默认色板', patterns: {}};
for (const [name, [label, note, svg]] of Object.entries(patterns)) {
  fs.writeFileSync(path.join(dir, `${name}.svg`), svg);
  index.patterns[name] = {label, note, file: `${name}.svg`};
}
fs.writeFileSync(path.join(dir, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
