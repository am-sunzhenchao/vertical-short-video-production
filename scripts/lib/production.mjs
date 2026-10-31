import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {clone, digest, inside, json, stable, writeJson, atomic} from './core.mjs';

export function audioFingerprint(plan, scene) {
  return digest({narration: scene.narration, subtitle: scene.subtitle, segments: scene.subtitleSegments.map(s => ({text: s.text, narration: s.narration})), engine: plan.audioPlan.engine, style: scene.ttsStyle || plan.audioPlan.defaultStyle, alignmentMode: scene.alignmentMode || plan.audioPlan.alignmentMode, openingTempo: scene.id === 'S01' ? plan.audioPlan.openingTempo : 1, tempo: plan.audioPlan.scenesTempoById?.[scene.id] ?? 1, loudnessLUFS: plan.audioPlan.loudnessLUFS});
}
export function exportScenes(plan, previous) {
  const out = clone(plan);
  out.reviewedVersion = plan.review.reviewedVersion;
  out.fps = plan.video.fps;
  out.compositionId = plan.compositionId || 'Main';
  out.scenes = plan.scenes.map(scene => {
    const next = clone(scene);
    for (const key of ['audioDurationSec', 'durationSec', 'timingBasis', 'audioFingerprint', 'audio', 'audioState']) delete next[key];
    next.subtitleSegments.forEach(s => { delete s.startSec; delete s.audioDurationSec; });
    next.effect = scene.component.name;
    next.audioFingerprint = audioFingerprint(plan, scene);
    const old = previous?.scenes?.find(s => s.id === scene.id);
    if (old?.audioFingerprint === next.audioFingerprint && old.timingBasis === 'measured' && Number.isFinite(old.audioDurationSec) && old.audioDurationSec > 0) {
      next.audioDurationSec = old.audioDurationSec;
      next.durationSec = old.audioDurationSec + plan.audioPlan.PAD + scene.tailSec;
      next.timingBasis = 'measured';
      next.audioState = old.audioState || 'measured';
      if (old.audio) next.audio = old.audio;
      next.subtitleSegments.forEach((seg, i) => {
        if (Number.isFinite(old.subtitleSegments?.[i]?.startSec)) seg.startSec = old.subtitleSegments[i].startSec;
        if (Number.isFinite(old.subtitleSegments?.[i]?.audioDurationSec)) seg.audioDurationSec = old.subtitleSegments[i].audioDurationSec;
        if (Number.isFinite(old.subtitleSegments?.[i]?.proportionalStartSec)) seg.proportionalStartSec = old.subtitleSegments[i].proportionalStartSec;
        if (Number.isFinite(old.subtitleSegments?.[i]?.proportionalDurationSec)) seg.proportionalDurationSec = old.subtitleSegments[i].proportionalDurationSec;
      });
    } else {
      next.durationSec = scene.estimatedDurationSec;
      next.timingBasis = 'estimated';
      next.audioState = old ? old.audioFingerprint === next.audioFingerprint ? old.audioState || 'pending' : 'invalid' : 'pending';
    }
    return next;
  });
  out.audioPlan.timingBasis = out.scenes.every(s => s.timingBasis === 'measured') ? 'measured' : 'estimated';
  return out;
}
export function generatedFiles(plan, asset, scenes) {
  const imports = plan.scenes.map((s, i) => `import Effect${i} from './${s.component.name}';`).join('\n');
  const entries = plan.scenes.map((s, i) => `${JSON.stringify(s.component.name)}: Effect${i}`).join(',\n');
  return {
    [`public/scenes/${plan.slug}/scenes.json`]: `${JSON.stringify(scenes, null, 2)}\n`,
    'src/data.ts': `import scenesData from '../public/scenes/${plan.slug}/scenes.json';\nexport {scenesData};\nexport default scenesData;\n`,
    'src/effects/palette.ts': `export const palette = ${JSON.stringify(plan.palette, null, 2)} as const;\nexport default palette;\n`,
    'src/effects/typography.ts': `export const typography = ${JSON.stringify(asset.tokens, null, 2)} as const;\nexport const typographyRoles = ${JSON.stringify(asset.roles, null, 2)} as const;\nexport const fontRoles = ${JSON.stringify(asset.fontRoles, null, 2)} as const;\nexport const fontSans = fontRoles.sans;\nexport const fontWenkai = fontRoles.handwritten;\nexport const fontFamily = ${JSON.stringify(plan.typography.fontFamily)};\nexport const emphasisSize = (host: keyof typeof typography) => typography[host] + ${asset.emphasisOffset};\nexport const textStyle = (role: keyof typeof typographyRoles, fontRole: keyof typeof fontRoles = typographyRoles[role].fontRole) => ({fontSize: typographyRoles[role].fontSize, fontFamily: fontRoles[fontRole], fontWeight: typographyRoles[role].fontWeight, lineHeight: typographyRoles[role].lineHeight});\n`,
    'src/effects/registry.ts': `${imports}\nexport const registry = {\n${entries}\n};\nexport default registry;\n`
  };
}
export function generatedWrite(ctx, files, allowNew = true) {
  const mf = inside(ctx.engineRoot, '.tooling-generated.json');
  const owned = fs.existsSync(mf) ? json(mf).files : {};
  for (const [rel] of Object.entries(files)) {
    const file = inside(ctx.engineRoot, rel);
    if (fs.existsSync(file) && (!Object.hasOwn(owned, rel) || digest(fs.readFileSync(file)) !== owned[rel])) throw new Error(`User file protected: ${file}`);
    if (!allowNew && !fs.existsSync(file)) throw new Error(`Generated file missing: ${file}`);
  }
  const next = {...owned};
  for (const [rel, content] of Object.entries(files)) next[rel] = digest(content);
  transaction(ctx.engineRoot, {...files, '.tooling-generated.json': `${JSON.stringify({files: next}, null, 2)}\n`});
}
export function transaction(root, files, expected = {}) {
  const staged = [], backups = [], committed = [];
  try {
    for (const [rel, content] of Object.entries(files)) {
      const file = inside(root, rel);
      if (Object.hasOwn(expected, rel) && (!fs.existsSync(file) || digest(fs.readFileSync(file)) !== expected[rel])) throw new Error(`Concurrent modification: ${rel}`);
      fs.mkdirSync(path.dirname(file), {recursive: true});
      const tmp = `${file}.${crypto.randomUUID()}.stage`;
      fs.writeFileSync(tmp, content, {flag: 'wx'});
      staged.push({file, tmp});
    }
    for (const {file, tmp} of staged) {
      if (fs.existsSync(file)) {
        const backup = `${file}.${crypto.randomUUID()}.backup`;
        fs.renameSync(file, backup);
        backups.push({file, backup});
      }
      fs.renameSync(tmp, file);
      committed.push(file);
    }
  } catch (e) {
    for (const file of committed.reverse()) if (fs.existsSync(file)) fs.unlinkSync(file);
    for (const {file, backup} of backups.reverse()) if (fs.existsSync(backup)) fs.renameSync(backup, file);
    throw e;
  } finally {
    for (const {tmp} of staged) if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    for (const {backup} of backups) if (fs.existsSync(backup)) fs.unlinkSync(backup);
  }
}
export function verifyScenes(ctx, production) {
  const expected = exportScenes(ctx.plan, production);
  if (stable(expected) !== stable(production)) throw new Error('Production scenes differ from complete approved plan or measurement fields');
  for (const scene of production.scenes) {
    if (scene.timingBasis !== 'measured') continue;
    const mode = scene.alignmentMode || ctx.plan.audioPlan.alignmentMode;
    let previous = -1;
    for (const seg of scene.subtitleSegments) {
      if (mode === 'multi-segment-measured' && !Number.isFinite(seg.startSec)) throw new Error(`${scene.id}: measured segment start missing`);
      if (Number.isFinite(seg.startSec) && (seg.startSec < previous || seg.startSec < 0 || seg.startSec >= scene.audioDurationSec)) throw new Error(`${scene.id}: invalid measured segment start`);
      previous = seg.startSec ?? previous;
    }
  }
}
