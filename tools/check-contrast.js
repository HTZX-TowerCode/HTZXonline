#!/usr/bin/env node
/* ==================================================================
 * 主题对比度自检（需求 20）
 * ------------------------------------------------------------------
 * 分层玻璃会在卡片上叠一层中性白，底色会变亮一点点，
 * 浅色文字的对比度随之下降。这个脚本按「最坏情况 5% 白」
 * 算一遍九套主题，保证：
 *     正文 ≥ 8　次要文字 ≥ 5　描边 ≥ 3
 *
 * 用法：cd tools && node check-contrast.js
 * 改完 js/02c-themes.js 的 vars 记得跑一下。
 * ============================================================ */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "js", "02c-themes.js"), "utf8");

/* 把源码里所有 vars:{...} 块抓出来，连主题名一起 */
function grabVars() {
  const out = [];
  /* 按 id: 切块，避免「siji 的 vars 是 Object.assign」被误配到下一套主题 */
  const parts = src.split(/\n\s*\{\s*\n\s*id:\s*"/);
  for (const part of parts.slice(1)) {
    const id = (part.match(/^([a-z_]+)"/) || [])[1];
    if (!id) continue;
    const vm = part.match(/vars:\s*\{([\s\S]*?)\n\s*\}/);
    if (!vm) continue;              /* Object.assign(...) 的跳过：四季 palette 下面单独抓 */
    const v = {};
    const rr = /"(--[a-z0-9-]+)"\s*:\s*"([^"]+)"/g;
    let mm;
    while ((mm = rr.exec(vm[1]))) v[mm[1]] = mm[2];
    if (v["--txt"]) out.push({id, v});
  }
  /* 四季的四套季节配色（运行时会插值混合，四套都验） */
  const seasonRe = /^\s*(春|夏|秋|冬):\s*\{[\s\S]*?vars:\s*\{([\s\S]*?)\n\s*\},?\s*\n\s*\},?/gm;
  let m;
  while ((m = seasonRe.exec(src))) {
    const v = {};
    const rr = /"(--[a-z0-9-]+)"\s*:\s*"([^"]+)"/g;
    let mm;
    while ((mm = rr.exec(m[2]))) v[mm[1]] = mm[2];
    if (v["--txt"]) out.push({id: "四季·" + m[1], v});
  }
  return out;
}

function rgb(hex) {
  const h = String(hex || "").trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mixWhite(c, a) {return c.map(x => Math.round(x + (255 - x) * a));}
function lum(c) {
  const f = c.map(x => {x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4);});
  return .2126 * f[0] + .7152 * f[1] + .0722 * f[2];
}
function contrast(a, b) {const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);}

const TINT = .075;  /* css/10-layers.css 里卡片顶部最大 --tint-top，按最坏算 */
const list = grabVars();
console.log("────────────────────────────────");
console.log(" 主题对比度自检（分层玻璃后）");
console.log("────────────────────────────────\n");
let bad = 0;
console.log("主题".padEnd(14) + "正文" + "　　" + "次要" + "　　" + "描边" + "　判定");
for (const t of list) {
  const txt = rgb(t.v["--txt"]), dim = rgb(t.v["--dim"] || t.v["--txt"]);
  const panel = rgb(t.v["--panel"]), line = rgb(t.v["--line"]);
  if (!txt || !panel || !line) {console.log(`${t.id}：变量缺失`); bad++; continue;}
  const card = mixWhite(panel, TINT);
  const a = contrast(txt, card), b = contrast(dim, card), c = contrast(line, panel);
  const ok = a >= 8 && b >= 5 && c >= 3;
  if (!ok) bad++;
  console.log(t.id.padEnd(14) + a.toFixed(1).padStart(4) + "　　" + b.toFixed(1).padStart(4) + "　　" + c.toFixed(1).padStart(4) + "　" + (ok ? "✅" : "❌"));
}
console.log(`\n共 ${list.length} 套配色（含四季）· 要求：正文 ≥8 / 次要 ≥5 / 描边 ≥3`);
if (bad) {console.log(`❌ ${bad} 套不达标，请调亮 --txt / --dim 或调亮 --line\n`); process.exit(1);}
console.log("✅ 全部达标\n");
