#!/usr/bin/env node
// 用法: node scripts/svg2png.mjs <file.svg> [输出宽度，默认1080]
// 例:   node scripts/svg2png.mjs cover/封面v1-kurz.svg
//       node scripts/svg2png.mjs cover/封面v1-kurz.svg 2160
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "fs";

const [svgPath, w] = process.argv.slice(2);
if (!svgPath) { console.error("用法: node scripts/svg2png.mjs <file.svg> [宽度，默认1080]"); process.exit(1); }

const out = svgPath.replace(/\.svg$/i, ".png");
const resvg = new Resvg(readFileSync(svgPath, "utf8"), {
  fitTo: { mode: "width", value: Number(w ?? 1080) },
  font: { loadSystemFonts: true, defaultFontFamily: "PingFang SC" },
});
writeFileSync(out, resvg.render().asPng());
console.log(`✅ ${out}`);
