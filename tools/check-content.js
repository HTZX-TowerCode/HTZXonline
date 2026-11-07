#!/usr/bin/env node
/* ==================================================================
 * 内容体检脚本
 * ------------------------------------------------------------------
 * 改完内容后跑一下，它会用中文告诉你哪里写错了。
 *
 * 用法（在 tools/ 目录下开终端）：
 *     node check-content.js
 *
 * 也可以双击「体检内容.bat」（Windows）
 * ============================================================ */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const PROPS = ["心态", "经济", "健康", "效率", "悟性", "社交", "压力", "亲情"];
const SUBJECTS = ["语文", "数学", "英语", "物理", "化学", "历史", "政治", "生物", "地理"];

let errors = [], warns = [], oks = [];

/* 只把"数据部分"抽出来执行，避免依赖浏览器环境 */
function loadDataPart(file) {
  const src = fs.readFileSync(path.join(ROOT, "js", file), "utf8");
  return src;
}

function runInSandbox(files) {
  const ctx = {console, Math, JSON, isFinite, parseFloat, parseInt, Object, Array, String, Number};
  vm.createContext(ctx);
  // 提供内容文件里可能用到的最小桩
  ctx.S = null;
  ctx.say = () => {};
  ctx.count = () => {};
  ctx.modProp = () => {};
  ctx.gainTalent = () => {};
  ctx.subjectsOf = () => [];
  ctx.Talent = {have: () => false};
  ctx.TALENTS = {};
  for (const f of files) {
    try {vm.runInContext(loadDataPart(f), ctx, {filename: f});}
    catch (e) {errors.push(`【${f}】语法错误：${e.message}`);}
  }
  return ctx;
}

// ---------- 1. 语法检查 ----------
console.log("────────────────────────────────");
console.log(" 中考人生模拟器 · 内容体检");
console.log("────────────────────────────────\n");

const DATA_FILES = [
  "03-data-talents.js", "04-data-subjects.js", "05-data-shop.js",
  "06-data-books.js", "07-data-events.js", "08-data-events-school.js",
  "10-data-achievements.js", "11-data-endings.js", "12-data-cures.js",
  "03d-talent-pick.js",          // v1.4：新增天赋 / 蜕变表（须在 12 之后）
  "05c-data-sport.js", "05d-data-quiz.js",
  "05d2-data-quiz-more.js",   // v1.5.2：题库追加表（须在 05d 之后，会并入 QUIZ_BANK）
  "05g-data-family.js",       // v1.4 C 批：亲情事件（须在 07 之后，会并入 EVENTS）
  "05h-weekend.js",           // v1.4 C2：周末时间表（只校验语法，浏览器里才跑）
  "05i-data-stationery.js",   // v1.4 D：文具袋 / 图书（须在 07 之后）
  "05j-data-stationery-events.js", // v1.4 D：文具联动事件（会并入 EVENTS）
  "05k-data-minigame-events.js",   // v1.4 E：小游戏触发事件（会并入 EVENTS）
  "05l-data-clubs-extra.js",   // v1.5 C：社团扩充 52 条（会并入 EVENTS）
  "05m-data-events-extra.js",  // v1.5 C：随机池 30 条 + 长链 41 层（会并入 EVENTS）
  "05o-data-romance.js",       // v1.5 C：心事状态与相关事件（会并入 EVENTS）
];

/* 社团表依赖 TALENTS，单独开一个沙盒跑 */
const CLUB_FILES = ["03-data-talents.js", "05b-data-clubs.js"];

for (const f of DATA_FILES) {
  const p = path.join(ROOT, "js", f);
  if (!fs.existsSync(p)) {errors.push(`缺少文件 ${f}`); continue;}
  const src = fs.readFileSync(p, "utf8");
  try {new Function(src); oks.push(`${f} 语法正常`);}
  catch (e) {errors.push(`【${f}】JS 语法错误：${e.message}\n      可能原因：逗号多了/少了、引号没配对、括号没闭合`);}
}

// ---------- 2. 载入数据 ----------
const ctx = runInSandbox(DATA_FILES);
/* 顶层 const 不会挂到 context 对象上，要用表达式取 */
function get(expr, fallback) {
  try {const v = vm.runInContext(expr, ctx); return v === undefined ? fallback : v;}
  catch (e) {return fallback;}
}

function getFrom(c, expr, fallback) {
  try {const v = vm.runInContext(expr, c); return v === undefined ? fallback : v;}
  catch (e) {return fallback;}
}

/* 1.0 新增：时段与季节的合法取值。写错字事件就永远不出现了 */
const SLOT_OK = ["weekday", "clubday", "weekend"];
const SEASON_OK = ["春", "夏", "秋", "冬"];

// ---------- 3. 事件检查 ----------
const evMain = get("EVENTS", []), evSchool = get("SCHOOL_EVENTS", []);
/* 学校事件已并入 EVENTS，这里去重避免误报重复 */
const events = evMain.concat(evSchool.filter(e => !evMain.some(x => x.id === e.id)));
console.log(`共载入 ${events.length} 条随机事件`);
const seenId = new Set();
let cmdCount = 0;

for (const ev of events) {
  const name = ev.t || "(无标题)";
  if (!ev.id) errors.push(`事件「${name}」缺少 id（唯一编号）`);
  else if (seenId.has(ev.id)) errors.push(`事件 id 重复：${ev.id}（每个事件的 id 必须不一样）`);
  else seenId.add(ev.id);

  if (!ev.t) errors.push(`事件 ${ev.id} 缺少标题 t`);
  if (!ev.c) warns.push(`事件「${name}」没有正文 c`);
  if (typeof ev.w !== "number") warns.push(`事件「${name}」的 w（出现权重）不是数字，建议写 3~6`);
  if (!Array.isArray(ev.opts) || !ev.opts.length) {errors.push(`事件「${name}」没有任何选项`); continue;}

  /* 时段 / 季节：写错字事件就永远不出现，必须拦下来 */
  const slotList = Array.isArray(ev.slot) ? ev.slot : (ev.slot ? [ev.slot] : []);
  for (const s of slotList) {
    if (!SLOT_OK.includes(s)) errors.push(`事件「${name}」的 slot「${s}」写错了，只能是 ${SLOT_OK.join(" / ")}（或写成数组）`);
  }
  const seasonList = Array.isArray(ev.season) ? ev.season : (ev.season ? [ev.season] : []);
  for (const s of seasonList) {
    if (!SEASON_OK.includes(s)) errors.push(`事件「${name}」的 season「${s}」写错了，只能是 ${SEASON_OK.join(" / ")}`);
  }

  for (const o of ev.opts) {
    if (!o.t) errors.push(`事件「${name}」有一个选项没写文字`);
    // 「挂起 / raise」指定的后续事件必须真的存在，否则永远不会触发
    if (Array.isArray(o.raise)) for (const r of o.raise) {
      if (r && r.id && !events.some(x => x.id === r.id)) {
        errors.push(`事件「${name}」→ 选项「${o.t}」挂起的事件「${r.id}」在事件表里不存在`);
      }
    }
    /* 中文指令可能写在 o.run 里，也可能写在条件分支 o.branch[].run 里
     * —— 两处都要体检，以前只看 o.run，分支里的错别字一直没人发现。 */
    const specs = [];
    if (o.run) specs.push(o.run);
    if (Array.isArray(o.branch)) for (const b of o.branch) if (b.run) specs.push(b.run);
    for (const spec of specs) {
      const runs = Array.isArray(spec) ? spec : (typeof spec === "string" ? [spec] : null);
      if (!runs) continue;
      for (const cmd of runs) {
        if (typeof cmd !== "string") continue;
        cmdCount++;
        checkCmd(cmd, `事件「${name}」→ 选项「${o.t}」`);
      }
    }
  }
}

function checkCmd(cmd, where) {
  const s = String(cmd).trim();
  if (!s) return;
  // 概率前缀
  let m = s.match(/^概率\s*([\d.]+)\s*(.+)$/);
  if (m) {
    const p = parseFloat(m[1]);
    if (!(p >= 0 && p <= 1)) errors.push(`${where}：概率要写成 0~1 之间的小数，例如「概率 0.35 天赋 豪」，现在是 ${m[1]}`);
    return checkCmd(m[2], where);
  }
  if (/^提示\s+/.test(s)) return;
  /* v1.4 E 批：小游戏指令 */
  if (/^小游戏\s+五子棋$/.test(s)) return;
  /* v1.5 C 批：心事状态（静态介绍里不出现相关字眼，指令本身只是状态开关） */
  if (/^心事\s+(开始|收心)$/.test(s)) return;
  /* v1.4 D 批：文具 / 图书联动指令（需求 15）。
   * 「文具 获得 xxx」要查 id 真的存在，否则事件点了没反应。
   * v1.5 B 批：支持按具体 id 操作的精确指令（消耗 / 移除 / 修复 / 补齐 / 归还），
   * 以及「获得 xxx N件」。所有点名的 id 一律查表。 */
  if (/^文具\s/.test(s)) {
    const defs = get("STATIONERY_DEFS", []).concat(get("BOOK_DEFS", []));
    const known = id => defs.some(d => d.id === id);
    const checkId = (id, label) => {
      if (!known(id)) errors.push(`${where}：${label}「${id}」在文具表 / 书目表里不存在`);
    };
    let mm = s.match(/^文具\s+获得\s+(\S+?)(?:\s+(\d+)件)?$/);
    if (mm) {checkId(mm[1], "文具"); return;}
    mm = s.match(/^文具\s+(?:消耗|移除|修复)\s+(\S+?)(?:\s+\d+)?$/);
    if (mm) {checkId(mm[1], "文具"); return;}
    if (/^文具\s+补齐\s+书写$/.test(s)) return;
    if (/^文具\s+归还$/.test(s)) return;
    if (/^文具\s+丢失\s+(书写|球拍|实验|任意|装饰|橡皮)$/.test(s)) return;
    if (/^文具\s+磨损\s+(书写|球拍|实验|橡皮)\s*\d*$/.test(s)) return;
    if (/^文具\s+(借书|借出)\s*\d*周?$/.test(s)) return;
    if (/^文具\s+(换袋|散落)$/.test(s)) return;
    errors.push(`${where}：看不懂这条文具指令「${s}」，可用：丢失 / 磨损 / 获得 / 消耗 / 移除 / 修复 / 补齐 / 归还 / 借书 / 借出 / 换袋 / 散落`);
    return;
  }
  if (/^全科\s*[+-]?[\d.]+%$/.test(s)) return;
  if (/^学力\s+(最弱|.+?)\s*[+-][\d.]+$/.test(s)) {
    const k = s.match(/^学力\s+(最弱|.+?)\s*[+-]/)[1];
    if (k !== "最弱" && !SUBJECTS.includes(k)) errors.push(`${where}：科目名「${k}」不存在，可用：${SUBJECTS.join("、")}`);
    return;
  }
  if (/^学习加成\s*[+-]?[\d.]+%(\s*\d+\s*周)?$/.test(s)) return;
  if (/^学习减益\s*[\d.]+%(\s*\d+\s*周)?$/.test(s)) return;
  if (/^计数\s+\S+(\s*\+\d+)?$/.test(s)) return;
  if (/^标记\s+\S+$/.test(s)) return;
  if (/^清除标记\s+\S+$/.test(s)) return;
  if (/^挂起\s+\S+\s+\d+周\s*[\d.]+倍?$/.test(s)) {
    const id = s.match(/^挂起\s+(\S+)/)[1];
    const all = get("EVENTS", []);
    if (!all.some(e => e.id === id)) errors.push(`${where}：挂起的事件 id「${id}」在事件表里不存在`);
    return;
  }
  if (/^天赋\s+\S+$/.test(s)) {
    const tn = s.match(/^天赋\s+(\S+)$/)[1];
    if (!get("TALENTS", {})[tn]) errors.push(`${where}：天赋「${tn}」在天赋表里不存在`);
    return;
  }
  m = s.match(/^(.+?)\s*([+-][\d.]+)$/);
  if (m) {
    if (!PROPS.includes(m[1])) errors.push(`${where}：「${m[1]}」不是有效属性名，可用：${PROPS.join("、")}`);
    return;
  }
  errors.push(`${where}：看不懂这条指令「${s}」，请对照 docs/CONTENT_GUIDE.md 的指令表`);
}

// ---------- 4. 天赋表检查 ----------
const T = get("TALENTS", {});
console.log(`共载入 ${Object.keys(T).length} 个天赋`);
for (const [name, t] of Object.entries(T)) {
  if (typeof t.lv !== "number") errors.push(`天赋「${name}」缺少等级 lv`);
  if (!t.desc) warns.push(`天赋「${name}」没有效果描述 desc`);
  if (Array.isArray(t.inc)) for (const c of t.inc) {
    if (!T[c]) errors.push(`天赋「${name}」的矛盾项「${c}」在天赋表里不存在`);
  }
}

// ---------- 4.5 社团表检查 ----------
const clubCtx = runInSandbox(CLUB_FILES);
const CLUBS = getFrom(clubCtx, "CLUBS", []);
const CLUB_EVENTS = getFrom(clubCtx, "CLUB_EVENTS", []);
const T2 = get("TALENTS", {});
console.log(`共载入 ${CLUBS.length} 个社团 · ${CLUB_EVENTS.length} 条社团事件`);
const clubIds = new Set();
for (const c of CLUBS) {
  if (!c.id) {errors.push("有一个社团缺少 id"); continue;}
  if (clubIds.has(c.id)) errors.push(`社团 id 重复：${c.id}`);
  clubIds.add(c.id);
  if (!c.n) errors.push(`社团 ${c.id} 缺少名称 n`);
  /* 社团的「长期参与奖励」必须是一个真实存在的天赋，
   * 否则玩家坚持 6 次什么也拿不到 —— 这个坑以前踩过。 */
  if (c.talent && !T2[c.talent]) {
    errors.push(`社团「${c.n || c.id}」的奖励天赋「${c.talent}」在天赋表里不存在（去 js/03-data-talents.js 加，或改成一个已有的天赋）`);
  }
  if (c.perk) for (const k in c.perk) {
    if (!PROPS.includes(k)) errors.push(`社团「${c.n || c.id}」的加成属性「${k}」不存在，可用：${PROPS.join("、")}`);
  }
}
for (const e of CLUB_EVENTS) {
  if (seenId.has(e.id)) errors.push(`事件 id 重复（社团事件与别的事件撞了）：${e.id}`);
  else seenId.add(e.id);
  if (!Array.isArray(e.opts) || !e.opts.length) errors.push(`社团事件 ${e.id} 没有选项`);
  const sl = Array.isArray(e.slot) ? e.slot : (e.slot ? [e.slot] : []);
  for (const s of sl) if (!SLOT_OK.includes(s)) errors.push(`社团事件 ${e.id} 的 slot「${s}」写错了`);
}

// ---------- 4.6 成就可达性检查（死成就） ----------
/* 成就写好了、但全项目没有任何一处会给它计数 —— 玩家一辈子也拿不到。
 * 这里把「成就用到的计数」和「代码里真的会累加的计数」对一遍。 */
const jsDir = path.join(ROOT, "js");
const allSrc = fs.readdirSync(jsDir).filter(f => f.endsWith(".js"))
  .map(f => fs.readFileSync(path.join(jsDir, f), "utf8")).join("\n");

const countedKeys = new Set();
for (const m of allSrc.matchAll(/count\(\s*["']([A-Za-z_]\w*)["']\s*\)/g)) countedKeys.add(m[1]);
for (const m of allSrc.matchAll(/S\.cnt\.([A-Za-z_]\w*)\s*(?:=[^=]|\+\+|--|\+=)/g)) countedKeys.add(m[1]);

/* 「计数 运动」这类中文指令，要经 EFFECT_COUNT_MAP 翻译后才算数 */
const fxSrc = fs.readFileSync(path.join(jsDir, "13-engine-effects.js"), "utf8");
const mapBlock = fxSrc.match(/const EFFECT_COUNT_MAP = \{([\s\S]*?)\};/);
const zh2key = {};
if (mapBlock) {
  for (const m of mapBlock[1].matchAll(/([\u4e00-\u9fa5]+)\s*:\s*"(\w+)"/g)) zh2key[m[1]] = m[2];
}
for (const ev of events) for (const o of (ev.opts || [])) {
  const specs = [];
  if (o.run) specs.push(o.run);
  if (Array.isArray(o.branch)) for (const b of o.branch) if (b.run) specs.push(b.run);
  for (const spec of specs) {
    const runs = Array.isArray(spec) ? spec : (typeof spec === "string" ? [spec] : null);
    if (!runs) continue;
    for (const cmd of runs) {
      const m = String(cmd).match(/^计数\s+(\S+)/);
      if (m) countedKeys.add(zh2key[m[1]] || m[1]);
    }
  }
}

const achSrc = fs.readFileSync(path.join(jsDir, "10-data-achievements.js"), "utf8");
const achKeys = new Set();
for (const m of achSrc.matchAll(/S\.cnt\.([A-Za-z_]\w*)/g)) achKeys.add(m[1]);
for (const k of achKeys) {
  if (!countedKeys.has(k)) {
    errors.push(`成就用到了计数「${k}」，但整个项目没有任何地方会给它 +1（玩家永远拿不到这个成就）`);
  }
}

// ---------- 5. 破茧表检查 ----------
const CURES = get("CURES", []);
console.log(`共载入 ${CURES.length} 条破茧`);
for (const c of CURES) {
  if (!T[c.talent]) errors.push(`破茧条目「${c.talent}」在天赋表里不存在`);
  if (!c.stat) errors.push(`破茧「${c.talent}」缺少 stat（靠什么行为累积）`);
  if (typeof c.need !== "number") errors.push(`破茧「${c.talent}」的 need 不是数字`);
  if (c.grant && !T[c.grant]) errors.push(`破茧「${c.talent}」赠送的天赋「${c.grant}」不存在`);
  if (!c.text) warns.push(`破茧「${c.talent}」没有鼓励文案`);
}

// ---------- 5b. 运动事件链检查 ----------
const SPORT = get("SPORT_EVENTS", []);
if (SPORT.length) {
  console.log(`共载入 ${SPORT.length} 条运动事件`);
  const sportIds = new Set();
  for (const e of SPORT) {
    if (!e.id) {errors.push("有一条运动事件没有 id"); continue;}
    if (!/^sp_/.test(e.id)) errors.push(`运动事件「${e.id}」的 id 必须以 sp_ 开头（否则会混进普通事件池）`);
    if (sportIds.has(e.id)) errors.push(`运动事件 id 重复：${e.id}`);
    sportIds.add(e.id);
    if (!e.opts || !e.opts.length) errors.push(`运动事件「${e.id}」没有选项`);
    (e.opts || []).forEach((o, i) => {
      if (!o.t) errors.push(`运动事件「${e.id}」第 ${i + 1} 个选项没有文字`);
      const specs = [];
      if (o.run) specs.push(o.run);
      if (Array.isArray(o.branch)) for (const b of o.branch) if (b.run) specs.push(b.run);
      for (const spec of specs) {
        const runs = Array.isArray(spec) ? spec : (typeof spec === "string" ? [spec] : null);
        if (!runs) continue;
        for (const cmd of runs) {
          if (typeof cmd !== "string") continue;
          cmdCount++;
          checkCmd(cmd, `运动事件「${e.id}」`);
        }
      }
    });
  }
}

// ---------- 5c. 做题题库检查 ----------
const BANK = get("QUIZ_BANK", null);
if (BANK) {
  let n = 0;
  const SUBJ_OK_SET = new Set(SUBJECTS);
  for (const [sub, list] of Object.entries(BANK)) {
    if (!SUBJ_OK_SET.has(sub)) errors.push(`题库里有不存在的科目「${sub}」`);
    (list || []).forEach((q, i) => {
      n++;
      const where = `题库 ${sub} 第 ${i + 1} 题`;
      if (!q.q) errors.push(`${where} 没有题干`);
      if (q.type === "fill") {
        if (q.ans == null || String(q.ans).trim() === "") errors.push(`${where} 是填空题但没有答案`);
      } else {
        if (!Array.isArray(q.opts) || q.opts.length < 2) errors.push(`${where} 是选择题但选项少于 2 个`);
        else if (q.opts.indexOf(String(q.ans)) < 0) errors.push(`${where} 的正确答案「${q.ans}」不在选项里 —— 玩家永远答不对`);
      }
      if (q.g != null && !(q.g >= 0 && q.g <= 2)) errors.push(`${where} 的年级 g=${q.g} 不合法（只能是 0/1/2）`);
    });
  }
  console.log(`共载入 ${n} 道题目`);

  /* 「写了却永远抽不到」的死题检测：
   * 生物 / 地理只在初一初二考，物理只在初二初三考 ——
   * 如果某科的题目标了比它能出现的最高年级还高的 g，玩家一辈子遇不上。 */
  const GRADE_SUBJ = {"语文": 2, "数学": 2, "英语": 2, "历史": 2, "政治": 2,
    "物理": 2, "化学": 2, "生物": 1, "地理": 1};
  for (const [sub, list] of Object.entries(BANK)) {
    const maxG = GRADE_SUBJ[sub];
    if (maxG == null) continue;
    (list || []).forEach((q, i) => {
      if (Number(q.g == null ? 0 : q.g) > maxG) {
        warns.push(`题库 ${sub} 第 ${i + 1} 题标了 g=${q.g}，但该科最高只到 g=${maxG} —— 这道题永远抽不到（把 g 调小或删掉）`);
      }
    });
  }

  // 每个年级实际能抽到的题量，太少了要提醒
  for (let g = 0; g <= 2; g++) {
    let cnt = 0;
    for (const [sub, list] of Object.entries(BANK)) {
      if (Number(GRADE_SUBJ[sub] == null ? 2 : GRADE_SUBJ[sub]) < g) continue;
      cnt += (list || []).filter(q => Number(q.g == null ? 0 : q.g) <= g).length;
    }
    console.log(`  初${g + 1} 可抽 ${cnt} 题`);
    if (cnt < 30) warns.push(`初${g + 1}只能抽到 ${cnt} 道题，太少容易重复（建议补到 30+）`);
  }

  /* v1.5.2：同科同题干不能出现两次。
   * 以前出现过「同一题干、两条记录各配一个不同答案」，玩家第二次遇到
   * 会以为自己答错了 —— 这是内容事故，不是警告，必须挡住。 */
  const qSeen = new Map();
  for (const [sub, list] of Object.entries(BANK)) {
    (list || []).forEach((q, i) => {
      const key = sub + "|" + String(q.q == null ? "" : q.q).trim();
      if (qSeen.has(key)) {
        errors.push(`题库 ${sub} 题干重复：「${String(q.q).slice(0, 26)}」（第 ${qSeen.get(key)} 题与第 ${i + 1} 题）`);
      } else qSeen.set(key, i + 1);
    });
  }

  /* 每科每个开设年级至少 15 道可抽题 —— 玩家一次最多做 5 道，
   * 低于这个数连着几周就会撞题。口径与 04-data-subjects.js 保持一致。 */
  const GRADE_LIST = [
    ["语文", "数学", "英语", "生物", "地理", "历史", "政治"],
    ["语文", "数学", "英语", "生物", "地理", "历史", "政治", "物理"],
    ["语文", "数学", "英语", "物理", "化学", "历史", "政治"]
  ];
  for (let g = 0; g <= 2; g++) {
    for (const sub of GRADE_LIST[g]) {
      const n = (BANK[sub] || []).filter(q => Number(q.g == null ? 0 : q.g) <= g).length;
      if (n < 15) warns.push(`初${g + 1} ${sub} 只有 ${n} 道可抽题（建议 ≥ 15）`);
    }
  }
}

// ---------- 5d. 天赋退化表检查 ----------
const DECAY = get("TALENT_DECAY", []);
if (DECAY.length) {
  console.log(`共载入 ${DECAY.length} 条天赋退化`);
  const STAT_OK = ["study", "sport", "read", "social", "quiz"];
  for (const d of DECAY) {
    if (!T[d.talent]) errors.push(`退化条目「${d.talent}」在天赋表里不存在`);
    if (STAT_OK.indexOf(d.stat) < 0) errors.push(`退化「${d.talent}」的 stat="${d.stat}" 不认识（只能是 ${STAT_OK.join(" / ")}）`);
    if (!(d.idle > 0)) errors.push(`退化「${d.talent}」的 idle（几周不做才退化）必须是正数`);
    if (!(d.chance > 0 && d.chance <= 1)) errors.push(`退化「${d.talent}」的 chance 必须在 0~1 之间`);
    if (d.grant && !T[d.grant]) errors.push(`退化「${d.talent}」留下的阴影「${d.grant}」不存在`);
    if (!d.text) warns.push(`退化「${d.talent}」没有文案`);
  }
  // 退化表里不能出现负面天赋（负面天赋靠"破茧"消除，不是靠退化）
  const BAD = get("BAD_TALENTS", []);
  for (const d of DECAY) if (BAD.indexOf(d.talent) >= 0) errors.push(`「${d.talent}」是负面天赋，不该出现在退化表里（它应该走「破茧」消除）`);
}

// ---------- 6. 结局检查 ----------
const END = get("ENDINGS", []);
console.log(`共载入 ${END.length} 个结局`);
END.forEach((e, i) => {if (!e.n || !e.c) errors.push(`第 ${i + 1} 个结局缺少名称或条件`);});

// ---------- 7. 消息栏检查（需求 16） ----------
/* 消息文件里有 document / localStorage / showModal，不能塞进沙盒执行，
 * 所以用正则静态读，只查「维护者最容易写错」的几项：
 *   id 唯一、必填字段、日期格式、正文非空。 */
{
  const p = path.join(ROOT, "js", "00c-messages.js");
  if (!fs.existsSync(p)) {
    errors.push("缺少 js/00c-messages.js（消息栏）");
  } else {
    const src = fs.readFileSync(p, "utf8");
    // 只取 MESSAGES 数组那一段，别把下面逻辑里的 id 误算进来
    const start = src.indexOf("const MESSAGES");
    const end = src.indexOf("const MSG_READ_KEY");
    const body = start >= 0 ? src.slice(start, end > 0 ? end : src.length) : "";
    const ids = [...body.matchAll(/\bid:\s*"([^"]+)"/g)].map(m => m[1]);
    console.log(`共载入 ${ids.length} 条消息`);
    const seen = {};
    ids.forEach(id => {
      if (seen[id]) errors.push(`消息 id「${id}」重复了，每条消息 id 必须唯一`);
      seen[id] = true;
      if (!/^[a-zA-Z0-9_-]+$/.test(id)) errors.push(`消息 id「${id}」只能含英文字母、数字、- 和 _`);
    });
    // 按 id 切块，逐块查必填字段
    const parts = body.split(/\bid:\s*"[^"]+"/).slice(1);
    parts.forEach((part, i) => {
      const id = ids[i] || `第 ${i + 1} 条`;
      if (!/\btitle:\s*"[^"]+"/.test(part)) errors.push(`消息「${id}」缺 title`);
      if (!/\bdate:\s*"\d{4}-\d{2}-\d{2}"/.test(part)) errors.push(`消息「${id}」缺 date 或日期不是 YYYY-MM-DD`);
      if (!/\blines:\s*\[/.test(part)) errors.push(`消息「${id}」缺 lines（正文数组）`);
      if (/\blines:\s*\[\s*\]/.test(part)) warns.push(`消息「${id}」的 lines 是空的`);
      if (/<[a-z]+\s|style=|onclick=/i.test(part)) warns.push(`消息「${id}」的正文里像是有 HTML，会被转义成文字显示`);
    });
  }
}

// ---------- 8. v1.4 开局配置与天赋校验 ----------
{
  const T = get("TALENTS", {});
  const EV = get("TALENT_EVOLVE", []);
  const DECAY2 = get("TALENT_DECAY", []);
  console.log(`共载入 ${Object.keys(T).length} 个天赋、${EV.length} 条蜕变、${DECAY2.length} 条退化`);

  /* 所有 inc / CURES / DECAY / EVOLVE 里引用的天赋名都要存在 */
  for (const [n, t] of Object.entries(T)) {
    (t.inc || []).forEach(x => {
      if (!T[x]) warns.push(`天赋「${n}」的排斥项「${x}」不在天赋表里（不影响运行，但排斥会失效）`);
    });
  }
  const statOK = ["study", "sport", "read", "social", "quiz", "goodExam"];
  EV.forEach(e => {
    if (!T[e.from]) errors.push(`蜕变「${e.from}」→ 源天赋不存在`);
    if (!T[e.into]) errors.push(`蜕变「${e.from}」→ 目标天赋「${e.into}」不存在`);
    if (e.from === e.into) errors.push(`蜕变「${e.from}」不能蜕变成自己`);
    if (statOK.indexOf(e.stat) < 0 && ["rest", "exam"].indexOf(e.stat) < 0) {
      errors.push(`蜕变「${e.from}」的 stat="${e.stat}" 不认识`);
    }
    if (!(e.need > 0)) errors.push(`蜕变「${e.from}」的 need 必须是正数`);
    if (!e.title || !e.text) warns.push(`蜕变「${e.from}」缺文案`);
  });
  DECAY2.forEach(d => {
    if (!T[d.talent]) errors.push(`退化条目「${d.talent}」不在天赋表里`);
  });

  /* 配置：四档难度、三档真实度、六个起点 */
  const conf = (() => {
    const p = path.join(ROOT, "js", "02-config.js");
    if (!fs.existsSync(p)) return null;
    try {
      const c = {};
      vm.createContext(c);
      /* 只执行到 applyTheme 之前的纯数据部分；顶层 const 不挂到 context 对象上，
       * 要用表达式在沙盒里取，不能写 c.GAME_CONFIG。 */
      vm.runInContext(fs.readFileSync(p, "utf8").replace(/function\s+applyTheme[\s\S]*$/, ""), c);
      return vm.runInContext("GAME_CONFIG", c);
    } catch (e) {warns.push(`配置层静态读取失败（跳过）：${e.message}`); return null;}
  })();
  if (conf) {
    const ids = (conf.DIFFICULTIES || []).map(x => x.id);
    if (ids.join(",") !== "easy,normal,hard,hell") errors.push(`难度档位应为 简单/一般/困难/地狱，现在是 ${ids.join("/")}`);
    const rm = (conf.REALISM_MODES || []).map(x => x.id);
    if (rm.join(",") !== "game,sim,real") errors.push(`真实度档位应为 游戏/模拟/真实，现在是 ${rm.join("/")}`);
    const plans = conf.TERM_PLAN || [];
    if (plans.length !== 6) errors.push(`起始学期应有 6 个，现在 ${plans.length} 个`);
    plans.forEach(p2 => {
      if (p2.to !== 5) errors.push(`起点「${p2.id}」的终点不是初三下（to=${p2.to}）`);
    });
    for (const k of ["easy", "normal", "hard", "hell"]) {
      if (!conf.difficultyTune || !conf.difficultyTune[k]) errors.push(`难度系数缺 ${k}`);
      if (!conf.study || !conf.study.studyCost || !conf.study.studyCost[k]) errors.push(`学习代价缺 ${k}`);
    }
  }
}

// ---------- v1.4 C 批：体力池 / 反馈 / 亲情事件 校验 ----------
{
  const stamSrc = fs.readFileSync(path.join(ROOT, "js", "03e-stamina.js"), "utf8");
  const fbSrc = fs.readFileSync(path.join(ROOT, "js", "03f-feedback.js"), "utf8");
  ["03e-stamina.js", "03f-feedback.js"].forEach(f => {
    const p = path.join(ROOT, "js", f);
    if (!fs.existsSync(p)) errors.push(`缺少文件 ${f}`);
    else {try {new Function(fs.readFileSync(p, "utf8"));} catch (e) {errors.push(`【${f}】JS 语法错误：${e.message}`);}}
  });
  if (!/allowance:\s*0/.test(stamSrc)) errors.push("体力配置：向父母要零花钱必须是不耗体力（allowance: 0）");
  if (!/quizPerItem/.test(stamSrc)) errors.push("体力配置：缺少按题数计价的 quizPerItem");
  if (!/fbUnlock/.test(fbSrc)) errors.push("反馈模块：缺少 fbUnlock，解锁天赋/成就不会进反馈弹窗");
  const fam = get("FAMILY_EVENTS", []);
  if (!Array.isArray(fam) || fam.length < 6) errors.push(`亲情事件数量不足（现在 ${fam.length} 条，至少 6 条）`);
  const famIds = new Set();
  (fam || []).forEach(e => {
    if (!e.id) errors.push("亲情事件有条目缺 id");
    else if (famIds.has(e.id)) errors.push(`亲情事件 id 重复：${e.id}`);
    famIds.add(e.id);
    if (!e.opts || !e.opts.length) errors.push(`亲情事件「${e.t || e.id}」没有选项`);
    (e.opts || []).forEach(o => {
      if (o.stam != null && (!Number.isFinite(o.stam) || o.stam < 0 || o.stam > 40))
        errors.push(`亲情事件「${e.t || e.id}」的选项 stam 不合法：${o.stam}`);
    });
  });
  console.log(`共载入 ${fam.length} 条亲情事件 · 体力与反馈模块已校验`);

  // C2：题库扩充与做题接口
  const quizSrc = fs.readFileSync(path.join(ROOT, "js", "05d-data-quiz.js"), "utf8");
  if (!/QUIZ_EXTRA/.test(quizSrc)) errors.push("题库：缺少 QUIZ_EXTRA 扩充表");
  if (!/function pickQuizOf/.test(quizSrc)) errors.push("题库：缺少按科目+题数抽题的 pickQuizOf");
  /* v1.5.2：第三批追加表必须真的挂进页面，不然写了等于没写。
   * 顺序也要对 —— 它依赖 05d 里已经建好的 QUIZ_BANK。 */
  const moreSrc = fs.readFileSync(path.join(ROOT, "js", "05d2-data-quiz-more.js"), "utf8");
  if (!/QUIZ_MORE/.test(moreSrc) || !/QUIZ_BANK\[sub\]\.push/.test(moreSrc))
    errors.push("题库：05d2-data-quiz-more.js 没有把 QUIZ_MORE 并进 QUIZ_BANK");
  const idxSrc = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const i05d = idxSrc.indexOf('src="js/05d-data-quiz.js"');
  const i05d2 = idxSrc.indexOf('src="js/05d2-data-quiz-more.js"');
  if (i05d2 < 0) errors.push("题库：index.html 没加载 05d2-data-quiz-more.js（新题不会生效）");
  else if (i05d2 < i05d) errors.push("题库：05d2-data-quiz-more.js 排在了 05d 前面，QUIZ_BANK 还没建好");
  const bankAll = get("QUIZ_BANK", {});
  let totalQ = 0;
  Object.keys(bankAll).forEach(k => {totalQ += (bankAll[k] || []).length;});
  if (totalQ < 450) errors.push(`题库数量不足（现在 ${totalQ} 道，v1.5.2 后至少 450 道）`);
  if (!errors.length) oks.push(`题库：${totalQ} 道 · 三批表齐全 · 挂载顺序正确 ✅`);
  console.log(`题库共 ${totalQ} 道 · 支持选科目与 1~5 道`);

  // C2：周末时间表
  const wkSrc = fs.readFileSync(path.join(ROOT, "js", "05h-weekend.js"), "utf8");
  ["05h-weekend.js"].forEach(f => {
    const p2 = path.join(ROOT, "js", f);
    try {new Function(fs.readFileSync(p2, "utf8"));} catch (e) {errors.push(`【${f}】JS 语法错误：${e.message}`);}
  });
  if (!/weekendSettleHtml|weekendApply/.test(wkSrc)) errors.push("周末时间表：缺少结算入口");
  const wkActs = get("WEEKEND_ACTS", []), wkSlots = get("WEEKEND_SLOTS", []);
  if (!Array.isArray(wkActs) || wkActs.length < 8) errors.push(`周末活动数量不足（现在 ${wkActs.length} 个）`);
  if (!Array.isArray(wkSlots) || wkSlots.length !== 4) errors.push("周末时段应为 4 段");
  const wkIds = new Set();
  (wkActs || []).forEach(a => {
    if (!a.id || wkIds.has(a.id)) errors.push(`周末活动 id 缺失或重复：${a.id}`);
    wkIds.add(a.id);
    if (!Array.isArray(a.run) || !a.run.length) errors.push(`周末活动「${a.name}」没有效果指令`);
    if (!Number.isFinite(a.stam) || a.stam < 0) errors.push(`周末活动「${a.name}」体力消耗不合法`);
  });
  console.log(`周末时间表 ${wkSlots.length} 段 · ${wkActs.length} 种活动`);

  // ---------- v1.4 D：文具袋 / 图书 / 联动事件 ----------
  const stds = get("STATIONERY_DEFS", []), bkds = get("BOOK_DEFS", []);
  const shopStock = get("SHOP_STOCK", []), statRules = get("BAG_RULES", {});
  console.log(`文具 ${stds.length} 种 · 图书 ${bkds.length} 本 · 小卖部常售 ${shopStock.length} 件`);
  if (!Array.isArray(stds) || stds.length < 15) errors.push(`文具种类不足（现在 ${stds.length} 种，至少 15 种）`);
  if (!Array.isArray(bkds) || bkds.length < 8) errors.push(`书目不足（现在 ${bkds.length} 本，至少 8 本）`);
  const CAT_OK = ["write", "eraser", "bag", "sport", "lab", "charm", "book"];
  const allDefIds = new Set();
  [...(stds || []), ...(bkds || [])].forEach(d => {
    if (!d.id || allDefIds.has(d.id)) errors.push(`文具/图书 id 缺失或重复：${d.id}`);
    allDefIds.add(d.id);
    if (!d.n || !d.icon) errors.push(`「${d.id}」缺少名字或图标`);
    if (!Number.isFinite(d.price) || d.price <= 0) errors.push(`「${d.n}」价格不合法`);
    if (!Number.isFinite(d.dur) || d.dur <= 0) errors.push(`「${d.n}」耐久不合法`);
    if (d.cat && !CAT_OK.includes(d.cat)) errors.push(`「${d.n}」的 cat「${d.cat}」不认识`);
    if (d.cat === "bag" && !Number.isFinite(d.cap)) errors.push(`文具袋「${d.n}」缺少容量 cap`);
    if (d.need === "eraser" && !(stds || []).some(x => x.cat === "eraser")) errors.push(`「${d.n}」需要橡皮，但文具表里没有橡皮`);
  });
  /* 旧消耗品必须真的清干净 */
  ["coffee", "energy", "vitamin", "talisman", "pill"].forEach(id => {
    if (Array.isArray(shopStock) && shopStock.includes(id)) errors.push(`小卖部还留着旧道具 ${id}`);
  });
  (shopStock || []).forEach(id => {
    if (!allDefIds.has(id)) errors.push(`小卖部常售「${id}」在文具表里不存在`);
  });
  /* 书：进度条阶段必须递增、且有一档收尾 */
  (bkds || []).forEach(bk => {
    if (!Number.isFinite(bk.progMax) || bk.progMax <= 0) errors.push(`书「${bk.n}」缺少 progMax`);
    if (!Number.isFinite(bk.stamPer) || bk.stamPer <= 0) errors.push(`书「${bk.n}」缺少 stamPer`);
    if (!Array.isArray(bk.stages) || !bk.stages.length) {errors.push(`书「${bk.n}」没有分阶段反馈 stages`); return;}
    let last = 0;
    bk.stages.forEach((st, i) => {
      if (!Number.isFinite(st.at) || st.at <= last || st.at > 1) errors.push(`书「${bk.n}」第 ${i + 1} 阶段的 at 必须递增且 ≤1`);
      last = st.at;
      if (!st.txt) errors.push(`书「${bk.n}」第 ${i + 1} 阶段没有文案`);
      if (Array.isArray(st.eff)) st.eff.forEach(c => {cmdCount++; checkCmd(c, `书「${bk.n}」第 ${i + 1} 阶段`);});
    });
    if (Math.abs(last - 1) > 1e-6) errors.push(`书「${bk.n}」最后一阶段的 at 必须是 1（读完了）`);
  });
  /* 需求 14：不同书的「体力→进度」比例要真的不一样 */
  const ratios = new Set((bkds || []).map(b => b.stamPer));
  if (ratios.size < 3) errors.push("不同书的 stamPer 太雷同，需求 14 要求比例关系不一致");
  /* 联动事件：三类变化都得有 */
  const sev = get("STATIONERY_EVENTS", []);
  console.log(`文具联动事件 ${sev.length} 条`);
  if (!Array.isArray(sev) || sev.length < 15) errors.push(`文具联动事件不足（现在 ${sev.length} 条，v1.5 B 批应为 15 条）`);
  const joined = (sev || []).flatMap(e => (e.opts || []).flatMap(o => o.run || [])).join("|");
  ["文具 丢失", "文具 借书", "文具 借出"].forEach(k => {
    if (!joined.includes(k)) errors.push(`联动事件缺少指令「${k}」`);
  });
  /* 必备入口函数 */
  ["05i-data-stationery.js", "05j-data-stationery-events.js"].forEach(f => {
    const src = fs.readFileSync(path.join(ROOT, "js", f), "utf8");
    try {new Function(src);} catch (e) {errors.push(`【${f}】JS 语法错误：${e.message}`);}
  });
  const stSrc = fs.readFileSync(path.join(ROOT, "js", "05i-data-stationery.js"), "utf8");
  ["bagGiveStart", "bagWeeklyTick", "bagGate", "bookExpire", "bookRead", "openBag", "openShop", "openOnlineShop", "openBookCorner", "stationeryCmd"].forEach(fn => {
    if (!stSrc.includes("function " + fn)) errors.push(`文具模块缺少函数 ${fn}()`);
  });
  console.log(`上网每周 ${statRules.onlineCount || 4} 件 · 价格浮动 ±${Math.round((statRules.onlineFloat || .25) * 100)}% · 散落效率 ×${statRules.scatterStudyMul || .72}`);
}

/* ==================================================================
 * v1.4 E 批补丁（坑 63）：CSS 颜色变量守卫
 * ------------------------------------------------------------------
 * --glow / --glow2 / --brand-rgb 存的是 **rgb 三元组字符串**
 * （如 "156, 77, 204"），不是颜色值。
 * 直接写 color: var(--glow2) 会被浏览器判为无效声明，
 * 整条属性被丢弃 —— 进度条 / 体力条看起来就是「空的」。
 * 正确写法：rgb(var(--glow2, r, g, b)) 或 rgba(var(--glow), .2)。
 * ================================================================== */
function checkCssColorVars() {
  const dir = path.join(ROOT, "css");
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".css")).sort();
  let hits = 0, lines = 0;
  files.forEach(f => {
    const src = fs.readFileSync(path.join(dir, f), "utf8").split("\n");
    src.forEach((ln, i) => {
      const t = ln.trim();
      if (t.startsWith("*") || t.startsWith("/*") || t.startsWith("//")) return;
      if (!/var\(--(glow|glow2|brand-rgb)\b/.test(ln)) return;
      lines++;
      if (!/\brgba?\(/.test(ln)) {
        errors.push(`【css/${f}:${i + 1}】把 rgb 三元组变量当颜色直接用了：${t.slice(0, 90)} —— 要写成 rgb(var(--glow, r, g, b))`);
        hits++;
      }
    });
  });
  if (!hits) oks.push(`CSS 颜色变量：${files.length} 个文件、${lines} 处引用，全部包在 rgb()/rgba() 里 ✅`);
}

/* ==================================================================
 * v1.4.1 守卫：文具报废 / 丢失必须有提示，且门禁不能被绕过
 * ------------------------------------------------------------------
 * 以前笔用坏了只写一行日志，玩家点「学习」才发现按钮灰了，
 * 原因还只放在 title 里（手机没有 hover）。这三条一起查。
 * ================================================================== */
function checkStationeryGate() {
  const wx = fs.readFileSync(path.join(ROOT, "js", "05i-data-stationery.js"), "utf8");
  const flow = fs.readFileSync(path.join(ROOT, "js", "16-flow.js"), "utf8");
  const ui = fs.readFileSync(path.join(ROOT, "js", "17-ui.js"), "utf8");
  const wk = fs.readFileSync(path.join(ROOT, "js", "05h-weekend.js"), "utf8");
  if (!/学习、做题、读书暂时做不了/.test(wx)) errors.push("文具报废文案没写清「学习、做题、读书暂时做不了」");
  if (!/bagGateNotice/.test(flow)) errors.push("takeAction 缺少 bagGateNotice 兜底：社团课/周末能绕过门禁");
  if (!/bagGate\("quiz"\)/.test(ui)) errors.push("做题配置入口缺少文具门禁");
  if (!/没有能写字的笔了，先去小卖部买一支/.test(wk)) errors.push("周末时间表结算没有因缺笔跳过并写明原因");
  if (!/gate-banner/.test(flow)) errors.push("行动面板缺少常驻的缺笔横幅（不能只靠 title）");
  if (!errors.length) oks.push("文具门禁：报废/丢失提示 + 四个入口兜底 + 常驻横幅 ✅");
}

/* ==================================================================
 * v1.4.2 守卫：主菜单纯玩五子棋不能碰存档、不能卡住
 * ------------------------------------------------------------------
 * 坑 66：主菜单 S 可能是 null，gmkFinish 以前无条件 modProp()，
 * 抛异常打断 showModal 收尾，玩家点「收好棋子」永远关不掉弹窗。
 * 而且从游戏回主菜单后 S 还在，只看 !!S 会误判成游戏内、污染存档。
 * ================================================================== */
function checkGomokuStandalone() {
  const g = fs.readFileSync(path.join(ROOT, "js", "20-minigames.js"), "utf8");
  const ui = fs.readFileSync(path.join(ROOT, "js", "17-ui.js"), "utf8");
  const css = fs.readFileSync(path.join(ROOT, "css", "08-minigames.css"), "utf8");
  if (!/function gmkStandalone\(\)/.test(g)) errors.push("五子棋缺少 gmkStandalone()：主菜单会被当成游戏内");
  if (!/gameScreen/.test(g)) errors.push("gmkStandalone 必须按「游戏屏是否可见」判断，不能用 !!S（toStart 不清 S）");
  if (!/if \(standalone\) return;/.test(g)) errors.push("gmkFinish 纯玩时没有提前 return，会 modProp 到 null 上导致弹窗卡死");
  if (!/standalone \? null : resume/.test(g)) errors.push("纯玩结果窗仍继承了事件链 resume");
  if (!/feedback: false, standalone: standalone/.test(g)) errors.push("纯玩棋局没标 meta.standalone，遮罩不会独占");
  if (!/gmk-standalone/.test(ui) || !/gmk-standalone/.test(css)) errors.push("主菜单纯玩遮罩（gmk-standalone）缺 JS 或 CSS");
  if (!errors.length) oks.push("五子棋纯玩：不写存档 / 不接事件链 / 遮罩独占 / 关闭清干净 ✅");
}

/* ==================================================================
 * v1.5.4 守卫：五子棋棋盘在任何屏幕上都是正方形（坑 82）
 * ------------------------------------------------------------------
 * 历史上两次让它变扁 / 变小：
 *   ① #gmkCanvas 上的 max-height 单独钳住高度，宽度不动 → 矮屏扁矩形
 *   ② gmkFit() 在 pop 入场动画（transform: scale）期间读
 *      getBoundingClientRect()，把缩放后的尺寸写进内联 px → 永久小一圈
 * ================================================================== */
function checkGomokuShape() {
  const g = fs.readFileSync(path.join(ROOT, "js", "20-minigames.js"), "utf8");
  const css = fs.readFileSync(path.join(ROOT, "css", "08-minigames.css"), "utf8");
  const bad = [];
  const a = css.indexOf("#gmkCanvas {");
  const block = a >= 0 ? css.slice(a, css.indexOf("}", a)) : "";
  if (!block) bad.push("找不到 #gmkCanvas 样式块");
  if (/max-height/.test(block))
    bad.push("#gmkCanvas 又加了 max-height：会单独压高度，棋盘变扁矩形");
  if (!/aspect-ratio\s*:\s*1\s*\/\s*1/.test(block))
    bad.push("#gmkCanvas 缺 aspect-ratio:1/1 兜底");
  if (!/height\s*:\s*var\(--gmk-side\)/.test(block) || !/width\s*:\s*100%/.test(block))
    bad.push("棋盘宽高没有取同一个 --gmk-side，尺寸可能不等");
  if (!/--gmk-side\s*:/.test(css)) bad.push("缺 --gmk-side 边长变量");
  if (!/max\(180px/.test(css) || !/max\(160px/.test(css))
    bad.push("矮屏缺边长下限，横屏会小到点不了交叉点");
  if (!/:has\(#gmkCanvas\)/.test(css))
    bad.push("standalone 弹窗没限定「有棋盘时」才 fit-content，结果窗会被挤窄");
  const fit = g.slice(g.indexOf("function gmkFit("), g.indexOf("function gmkBindFit("));
  if (!/clientWidth/.test(fit) || /getBoundingClientRect\(\)/.test(fit))
    bad.push("gmkFit 又用 getBoundingClientRect()：pop 动画的 transform 会把棋盘量小");
  if (!/addEventListener\("resize"/.test(g)) bad.push("没监听 resize，改窗口后不会重算边长");
  if (!/gmkBindFit\(\);/.test(g) || !/gmkFit\(\);/.test(g))
    bad.push("gmkBind 没调用 gmkFit，动态兜底没接上");
  errors.push(...bad);
  if (!bad.length) oks.push("五子棋：宽高同源 · 无 max-height · 布局尺寸兜底 · 矮屏有下限 ✅");
}

/* ==================================================================
 * v1.4.3 守卫：渲染性能（坑 67）
 * ------------------------------------------------------------------
 * 三个真实瓶颈，都是改了以后再被"顺手加回来"就会复发的：
 *   ① backdrop-filter: blur 挂在顶栏 / 弹窗 → 每帧模糊整屏
 *   ② 多个全屏 ::before/::after + mix-blend-mode + 内容 filter
 *   ③ 日志 DOM 无限增长、say() 里每条都强制同步布局
 * 还有：无限动画动 text-shadow / background-position 会每帧重绘。
 * ================================================================== */
function checkRenderPerf() {
  const cssDir = path.join(ROOT, "css");
  const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith(".css"));
  let blur = 0, blend = 0, hudFilter = 0;
  cssFiles.forEach(f => {
    const src = fs.readFileSync(path.join(cssDir, f), "utf8");
    src.split("\n").forEach(ln => {
      const t = ln.trim();
      if (t.startsWith("*") || t.startsWith("/*") || t.startsWith("//")) return;
      if (/backdrop-filter\s*:\s*blur/.test(ln)) {errors.push(`【css/${f}】又挂上了 backdrop-filter: blur（常驻全屏模糊，见坑 67）`); blur++;}
      if (/mix-blend-mode/.test(ln)) {errors.push(`【css/${f}】mix-blend-mode 会强制整屏合成（见坑 67）`); blend++;}
      if (/mood-(dark|weak).*#hud.*filter|#hud\s*\{[^}]*filter/.test(ln)) hudFilter++;
    });
  });
  /* 无限动画只允许动 opacity / transform 这类合成层属性 */
  const allCss = cssFiles.map(f => fs.readFileSync(path.join(cssDir, f), "utf8")).join("\n");
  if (/@keyframes[^{]*\{[\s\S]{0,400}?text-shadow[^}]*\}/.test(allCss) && /infinite/.test(allCss)) {
    /* 只提示，keyframes 里静态 text-shadow 是允许的（如静态发光），
       这里只查「仍在跑的无限动画引用了会重绘的动画名」 */
    const heavy = ["goldPulse", "rainbowFlow"];
    heavy.forEach(k => {
      if (new RegExp("animation[\s\S]{0,120}" + k).test(allCss))
        errors.push(`无限动画 ${k} 又被引用了（动 text-shadow / background-position，每帧重绘）`);
    });
  }
  const utils = fs.readFileSync(path.join(ROOT, "js", "01-utils.js"), "utf8");
  const ui = fs.readFileSync(path.join(ROOT, "js", "17-ui.js"), "utf8");
  if (!/LOG_DOM_MAX/.test(utils)) errors.push("say() 缺 LOG_DOM_MAX：日志 DOM 会无限增长，越玩越卡");
  if (!/childElementCount\s*>\s*LOG_DOM_MAX/.test(utils)) errors.push("say() 没有裁剪日志 DOM");
  if (!/SAY_SCROLL_QUEUED/.test(utils)) errors.push("say() 没有把滚动合并到下一帧（每条都强制同步布局）");
  if (!/function setHudHtml/.test(utils)) errors.push("缺 setHudHtml()：renderHUD 会反复重建面板 DOM");
  if (!/setHudHtml\("statPanel"/.test(ui)) errors.push("renderHUD 的 statPanel 没走 diff 缓存");
  const mood = fs.readFileSync(path.join(cssDir, "05-mood.css"), "utf8");
  /* 数「真正创建的层」，不是数选择器出现次数 —— 同一层可以有多条规则
   * 覆盖（默认 / 重档 / reduced-motion）。每个全屏层都必带 content:""。 */
  const moodLayers = (mood.match(/content\s*:\s*["']{2}/g) || []).length;
  if (moodLayers !== 1)
    errors.push(`氛围特效应是单个全屏层，现在创建了 ${moodLayers} 个（见坑 67）`);
  if (!errors.length) oks.push(`渲染性能：无 blur/混合层、日志上限、HUD diff、无限动画只动 opacity ✅`);
}

/* ==================================================================
 * v1.5 A 批守卫：存档兼容与数值边界（坑 68）
 * ------------------------------------------------------------------
 * 这些都是删掉就会悄悄退化、玩一阵子才暴露的东西。
 * ================================================================== */
/* ==================================================================
 * v1.5 B 批守卫：天赋联动 / 排斥 / 文具指令（坑 70）
 * ------------------------------------------------------------------
 * 这些都是「删掉不报错、玩一阵子才退化」的东西。
 * ================================================================== */
/* ==================================================================
 * v1.5 C 批守卫：内容扩容 / 长链 / 心事（坑 71、72）
 * ================================================================== */
/* ==================================================================
 * v1.5 D 批守卫：文本 / 真实度反馈 / 耐久条（坑 75~77）
 * ================================================================== */
function checkDBatch() {
  const bagCss = fs.readFileSync(path.join(ROOT, "css", "07-bag.css"), "utf8");
  const fb = fs.readFileSync(path.join(ROOT, "js", "03f-feedback.js"), "utf8");
  const stam = fs.readFileSync(path.join(ROOT, "js", "03e-stamina.js"), "utf8");
  const utils = fs.readFileSync(path.join(ROOT, "js", "01-utils.js"), "utf8");
  const i18n = fs.readFileSync(path.join(ROOT, "js", "01b-i18n.js"), "utf8");
  const guide = fs.readFileSync(path.join(ROOT, "docs", "guide.md"), "utf8");
  const cures = fs.readFileSync(path.join(ROOT, "js", "12-data-cures.js"), "utf8");
  const endings = fs.readFileSync(path.join(ROOT, "js", "11-data-endings.js"), "utf8");
  const school = fs.readFileSync(path.join(ROOT, "js", "08-data-events-school.js"), "utf8");

  /* 耐久条：别再被改回 7px */
  if (!/height:\s*12px/.test(bagCss)) errors.push("文具耐久 / 读书进度条又被改细了（应为 12px）");

  /* 真实模式：三处数值出口都要收干净 */
  if (!/function fbBlurWord/.test(fb) || !/function fbDeltaChip/.test(fb))
    errors.push("反馈窗缺 fbBlurWord/fbDeltaChip：真实模式会重新漏出「心态 +7」");
  if (!/deltaTitleBlur/.test(fb)) errors.push("反馈窗缺模糊态标题「状态有变」");
  if (!/barHasNumber/.test(fb)) errors.push("反馈窗没按条类数值开关处理「时间 −N」");
  if (!/k === "经济"/.test(fb)) errors.push("反馈窗没保留「经济任何模式都给数字」");
  if (!/barHasNumber/.test(stam) || !/大半天|挺费时间|花点时间/.test(stam))
    errors.push("选项按钮的 stamLabel 没做真实模式分支，选项上仍会显示「时间 −22」");
  if (/isBlurProp\(k\) && !floatNumbersWanted\(\)/.test(utils))
    errors.push("坑 75 复发：modProp 飘字又挂回 ui.floatNumbers，真实模式会飘「心态 +7」");

  /* 静态文案：旧口径与 AI 味 */
  /* 只扫 about.body 的模板字符串，别把开发注释里的「旧版写法」当残留 */
  const bodyM = i18n.match(/"about\.body"\s*:\s*`([\s\S]*?)`/);
  const aboutBody = bodyM ? bodyM[1] : "";
  if (!aboutBody) errors.push("找不到 about.body 模板字符串");
  const stale = [/1~2 次本周行动/, /天赋不会在一开始赠送/, /读书角/, /阴影总会散去/];
  stale.forEach(re => {if (re.test(aboutBody)) errors.push(`about.body 里还有旧版说法 ${re}`);});
  if (!/剩余时间/.test(aboutBody) || !/文具袋/.test(aboutBody))
    errors.push("about.body 没写现在的剩余时间池 / 文具袋");
  const aiClich = [/不是.{0,14}而是/, /叫作自由/, /也是一种能力/, /未来可期/,
    /知识的星辰大海/, /三年磨一剑/, /这本身就很了不起/, /阴影总会散去/,
    /有些.{0,10}才看得见/, /有些门，要等自己准备好了再推/, /每一步都算数/];
  [[cures, "破茧/退化"], [endings, "结局"], [school, "校本事件"], [guide, "新手介绍"]].forEach(([txt, name]) => {
    aiClich.forEach(re => {if (re.test(txt)) errors.push(`${name} 里还有 AI 味套话 ${re}`);});
  });

  /* 全文代码块残留：所有事件池的可见文本不许带标签片段 / 占位符。
   * 历史上「\n→<br> 无差别替换」把标签结构打坏，属性泄漏到页面上，
   * 复发过两次。这里做静态兜底（运行时渲染由 verify_d.js 逐个开弹窗）。 */
  const pools = ["EVENTS", "SCHOOL_EVENTS", "SPORT_EVENTS", "EPIC_EVENTS",
    "CLUB_EVENTS_EXTRA", "EXTRA_EVENTS", "ROMANCE_EVENTS", "STATIONERY_EVENTS", "FAMILY_EVENTS"];
  const leakRe = /<br\s*\/?>|style\s*=|var\(--|class\s*=|&lt;|\{0\}|undefined|NaN/;
  let scanned = 0;
  pools.forEach(name => {
    const arr = get(name, []);
    arr.forEach(e => {
      if (!e) return;
      scanned++;
      const fields = [e.t, e.c].concat((e.opts || []).map(o => [o.t, o.sub].join(" ")));
      fields.forEach(f => {
        if (typeof f === "string" && leakRe.test(f))
          errors.push(`事件「${e.id}」文案里混进了代码块 / 占位符：${String(f).slice(0, 60)}`);
      });
    });
  });
  if (!errors.length)
    oks.push(`D 批：耐久条 12px · 真实度三处数值收敛 · ${scanned} 条文案无代码块 · 静态文案去 AI 味 ✅`);
}

/* ==================================================================
 * v1.5.1 守卫：书不占格子 / 一种书一本 / 读完可复读（坑 79）
 * ================================================================== */
function checkBookRules() {
  const bag = fs.readFileSync(path.join(ROOT, "js", "05i-data-stationery.js"), "utf8");
  if (!/function bagIsBook\(/.test(bag) || !/function bagCount\(/.test(bag))
    errors.push("书 / 文具的容量分层函数不见了：bagIsBook / bagCount");
  if (!/function bagHasBook\(/.test(bag))
    errors.push("缺 bagHasBook：同一种书会在一个存档里出现两本");
  if (!/if \(isBook && !o\.restore && bagHasBook\(defId\)\)/.test(bag))
    errors.push("bagAdd 没做「书架已有」去重，买重 / 借重会回来");
  /* v1.5.3：容量判定只数笔 / 橡皮。任何一处写回 items.length 都会让
   * 书、球拍、书签重新占格子，把笔袋挤满。 */
  if (!/function bagOccupies\(/.test(bag))
    errors.push("缺 bagOccupies：没法保证只有笔和橡皮占格子");
  const capLines = bag.split("\n").filter(l => />= .*cap|count >=/.test(l) && /bagCount|items\.length/.test(l));
  capLines.forEach(l => {
    if (/items\.length/.test(l)) errors.push("容量判定又用回了 items.length（不占格子的东西会被算进去）：" + l.trim().slice(0, 80));
  });
  if (!/occupying\.slice\(0, b\.cap\)\.concat\(free\)/.test(bag))
    errors.push("bagEnsure 没把占格 / 不占格分开截断，旧档读进来书和球拍会被切掉");
  /* 名字里不能再带 emoji：面板已经单独画一个 .bag-ico，会变成两个图标 */
  const defBlock = bag.slice(bag.indexOf("const STATIONERY_DEFS"), bag.indexOf("const BOOK_DEFS"));
  /* 用 \bn: 精确取「名字字段」——写成 n:"..." 会连 icon:"..." 里的 n:"
   * 一起匹配，造成 40 处假报错。 */
  const nVals = [...defBlock.matchAll(/\bn:\s*"([^"]*)"/g)].map(m => m[1]);
  const namedTwice = nVals.filter(v => /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(v));
  if (namedTwice.length) errors.push("文具定义的 n 里还带 emoji（面板会显示两个图标）：" + namedTwice.length + " 处");
  if (!/if \(d && d\.n\) it\.n = d\.n;/.test(bag))
    errors.push("bagEnsure 没同步旧档的 it.n，旧存档读进来仍会显示两个图标");
  /* 不占格子之后要防囤同类刷每周收益 */
  if (!/function bagHasDurable\(/.test(bag)) errors.push("缺 bagHasDurable：耐用品能无限囤");
  if (!/const perk = \{\}, counted = \{\};/.test(bag))
    errors.push("bagWeeklyTick 没按 def 去重，囤同类文具会刷每周收益");
  if (!/function bookReread\(/.test(bag) || !/const BOOK_REREAD = \[/.test(bag))
    errors.push("复读函数 / 复读效果表不见了");
  if (!/if \(it\.finished\) \{bookReread\(it, d, cost\); return;\}/.test(bag))
    errors.push("bookRead 没把已读完的书分流到复读，会重复结算初读奖励");
  if (!/it\.rereads = n \+ 1/.test(bag)) errors.push("复读次数没记进书对象");
  /* 先放货再扣钱：买重被拒时不能吞玩家的钱 */
  const buyBody = bag.slice(bag.indexOf("function bagBuy("), bag.indexOf("function bagBuy(") + 900);
  const iAdd = buyBody.indexOf("bagAdd("), iPay = buyBody.indexOf('modProp("经济", -price)');
  if (iAdd < 0 || iPay < 0 || iAdd > iPay)
    errors.push("bagBuy 又变成先扣钱再放货：买重 / 袋满时会白扣钱");
  if (!errors.length) oks.push("图书：一种书一本 · 读完可复读 · 买重不扣钱 ✅");

  /* ================================================================
   * v1.5.3 · 小卖铺必须陈列【全部】文具与书，按分类分组
   * 以前只列 SHOP_STOCK 8 件，钢笔 / 球拍 / 计算器 / 书全都不显示。
   * ================================================================ */
  const groups = get("SHOP_GROUPS", []);
  const statCnt = get("STATIONERY_DEFS", []).length;
  const bkCnt = get("BOOK_DEFS", []).length;
  if (!groups.length) errors.push("小卖铺缺 SHOP_GROUPS 分类表");
  if (statCnt < 30) errors.push(`文具种类太少（${statCnt} 种，v1.5.3 后应 ≥ 30）`);
  if (bkCnt < 14) errors.push(`书目太少（${bkCnt} 本，v1.5.3 后应 ≥ 14）`);
  const cats = new Set(groups.map(g => g.cat));
  ["write", "eraser", "bag", "sport", "lab", "charm", "book"].forEach(c => {
    if (!cats.has(c)) errors.push(`小卖铺分类缺「${c}」，这一类商品不会显示`);
  });
  if (/SHOP_STOCK\.map/.test(bag))
    errors.push("小卖铺又改回按 SHOP_STOCK 列固定 8 件，新文具和书不会显示");
  if (!/SHOP_GROUPS\.map\(shopGroupHtml\)/.test(bag))
    errors.push("openShop 没有遍历 SHOP_GROUPS，货架不会全量陈列");
  if (!/function bindShopItems\(/.test(bag) || !/bindShopItems\(\);/.test(bag))
    errors.push("货架商品按钮没绑事件，点不动");
  /* 每组都得有真实商品，不能留空组 */
  const allDefs = get("STATIONERY_DEFS", []).concat(get("BOOK_DEFS", []).map(d => ({cat: "book", id: d.id})));
  groups.forEach(g => {
    if (!allDefs.some(d => d.cat === g.cat)) errors.push(`小卖铺分类「${g.title}」一件商品都没有`);
  });
  if (!errors.length) oks.push(`小卖铺：${statCnt} 种文具 + ${bkCnt} 本书 · ${groups.length} 组全量陈列 · 图标不重复 ✅`);
}

function checkCBatch() {
  const flow = fs.readFileSync(path.join(ROOT, "js", "16-flow.js"), "utf8");
  const cfg = fs.readFileSync(path.join(ROOT, "js", "02-config.js"), "utf8");
  const clubE = fs.readFileSync(path.join(ROOT, "js", "05l-data-clubs-extra.js"), "utf8");
  const extra = fs.readFileSync(path.join(ROOT, "js", "05m-data-events-extra.js"), "utf8");
  const rom = fs.readFileSync(path.join(ROOT, "js", "05o-data-romance.js"), "utf8");
  const save = fs.readFileSync(path.join(ROOT, "js", "18-save.js"), "utf8");
  const study = fs.readFileSync(path.join(ROOT, "js", "15-engine-study.js"), "utf8");

  const clubCnt = (clubE.match(/id:\s*"cl_[a-z_0-9]+"/g) || []).length;
  if (clubCnt < 52) errors.push(`社团扩充只有 ${clubCnt} 条（应为 52 条，每社补 4 条）`);
  const randCnt = (extra.match(/id:\s*"ex_/g) || []).length;
  if (randCnt < 30) errors.push(`随机池扩充只有 ${randCnt} 条（应为 30 条）`);
  const epicCnt = (extra.match(/id:\s*"ep_/g) || []).length;
  if (epicCnt < 40) errors.push(`长链层数只有 ${epicCnt}（5 条主线合计应 ≥40 层）`);
  const heads = (extra.match(/once: true/g) || []).length;
  if (heads < 5) errors.push(`长链开头只有 ${heads} 条（应为 5 条主线，且必须 once:true）`);

  if (!/epicMaxDepth/.test(cfg)) errors.push("GAME_CONFIG 缺 epicMaxDepth，6 层链会被随机配额截断");
  if (!/const queued = Array.isArray\(S.chainQueue\)/.test(flow))
    errors.push("runEventChain 没有长链独立通道，排队后续仍会占 maxEventsPerWeek 配额");
  if (!/S.chainDepth = num\(S.chainDepth, 0\) \+ 1/.test(flow))
    errors.push("长链深度没有累加，epicMaxDepth 形同虚设");
  if (!/const nx = Array.isArray\(o.next\)/.test(flow))
    errors.push("选项 next 不支持数组，一层里排不了两段");
  if (!/EPIC_EVENTS/.test(flow)) errors.push("buildEventDef 的排队分支没找 EPIC_EVENTS，长链后续会断");

  ["romanceSanitize", "romanceStart", "romanceEnd", "romanceStudyMul", "romanceWeekly",
   "romanceLoseTalent", "romanceReturn", "romanceNotice"].forEach(fn => {
    if (!rom.includes("function " + fn)) errors.push(`心事模块缺少函数 ${fn}()`);
  });
  if (!/romanceWeekly\(\)/.test(study)) errors.push("weeklySettle 没挂 romanceWeekly，心事不会产生持续代价");
  if (!/romanceStudyMul\(\)/.test(study)) errors.push("studySettle 没挂 romanceStudyMul，学习不会打折");
  if (!/romanceNotice\(goWeek\)/.test(flow)) errors.push("startWeek 没挂说明窗，丢天赋不会弹提示");
  if (!/10: d =>/.test(save)) errors.push("缺 v10 迁移，旧档读进来没有心事字段");
  const staticFiles = ["js/01b-i18n.js", "js/00c-messages.js", "js/10-data-achievements.js",
    "js/03-data-talents.js", "docs/guide.md", "docs/changelog.md", "docs/credits.md"];
  const banned = /恋爱|早恋|悸动|情书|心上人/;
  staticFiles.forEach(f => {
    const fp = path.join(ROOT, f);
    if (!fs.existsSync(fp)) return;
    if (banned.test(fs.readFileSync(fp, "utf8")))
      errors.push(`静态介绍 ${f} 里出现了相关字眼（Q6①A 要求一律不提）`);
  });
  if (!errors.length) oks.push(`C 批：社团 ${clubCnt}/随机池 ${randCnt}/长链 ${epicCnt} 层 · 6 层通道 · 心事闭环 · 静态文案干净 ✅`);
}

function checkLogicLinks() {
  const flow = fs.readFileSync(path.join(ROOT, "js", "16-flow.js"), "utf8");
  const tal = fs.readFileSync(path.join(ROOT, "js", "14-engine-talent.js"), "utf8");
  const bag = fs.readFileSync(path.join(ROOT, "js", "05i-data-stationery.js"), "utf8");
  const books = fs.readFileSync(path.join(ROOT, "js", "06-data-books.js"), "utf8");
  const evs = fs.readFileSync(path.join(ROOT, "js", "05j-data-stationery-events.js"), "utf8");

  if (!/needTalent|noTalent/.test(flow)) errors.push("eventAllowed() 里的天赋 gate 被删了，天赋不再影响事件出现条件");
  if (!/talentBoost/.test(flow)) errors.push("eventWeight() 里的 talentBoost 被删了，成就链会被硬开关切断");
  if (!/WEEKS_PER_TERM\s*\*\s*TERMS/.test(flow))
    errors.push("front/back 事件曲线又写死 /150 了：现在一学期 20 周共 120 周");
  if (!/function\s+talentPairConflict/.test(tal))
    errors.push("缺 talentPairConflict()：91 条单向 inc 边会漏判反向排斥");
  if (!/talentPairConflict\(name, x\)/.test(tal))
    errors.push("Talent.unlock() 没双向查冲突，已有天赋会被新天赋悄悄顶掉或并存");
  if (!/折成了悟性|相斥/.test(tal))
    errors.push("gainTalent 失败分支应明确写出「与哪个天赋相斥 + 折成悟性」");
  if (!/talentPairConflict/.test(books))
    errors.push("pickGoodTalent() 没排除冲突天赋，读书会抽到拿不到的天赋");
  if (!/function\s+bagBreakItem/.test(bag)) errors.push("缺 bagBreakItem()：报废反馈会散落回各处");
  if (!/function\s+bagHas/.test(bag)) errors.push("缺 bagHas()：内容作者没法写「有这支笔才触发」的 cond");
  ["消耗", "移除", "修复", "归还"].forEach(k => {
    if (!bag.includes("文具\\s+" + k)) errors.push(`文具精确指令「${k}」不见了`);
  });
  if (!/parseInt\(m\[2\], 10\)/.test(bag))
    errors.push("坑 69 复发：文具指令里从正则读出的数字没 parseInt，num() 会退回默认值");
  if (!/got\s*!==\s*false/.test(bag))
    errors.push("读书解锁天赋后必须判断返回值，别把没拿到的天赋记进「以书入道」成就");
  const cnt = (evs.match(/id:\s*"bag_/g) || []).length;
  if (cnt < 15) errors.push(`文具联动事件只有 ${cnt} 条（应为 15 条）`);
  const gates = fs.readdirSync(path.join(ROOT, "js"))
    .filter(f => /^0[5-8].*\.js$/.test(f))
    .reduce((n, f) => n + (fs.readFileSync(path.join(ROOT, "js", f), "utf8").match(/needTalent:|noTalent:|talentBoost:/g) || []).length, 0);
  if (gates < 14) errors.push(`天赋 gate / boost 只有 ${gates} 处（应为 14 处）`);
  if (!errors.length) oks.push(`逻辑联动：天赋 gate+boost / 双向排斥 / 精确文具指令 / ${cnt} 条联动 ✅`);
}

function checkSaveFramework() {
  const sv = fs.readFileSync(path.join(ROOT, "js", "18-save.js"), "utf8");
  const ut = fs.readFileSync(path.join(ROOT, "js", "01-utils.js"), "utf8");
  const bag = fs.readFileSync(path.join(ROOT, "js", "05i-data-stationery.js"), "utf8");
  const travel = fs.readFileSync(path.join(ROOT, "js", "05f-data-travel.js"), "utf8");

  if (!/const\s+MIGRATIONS\s*=/.test(sv)) errors.push("存档迁移表 MIGRATIONS 不见了：旧档会退化成散落的 || 兜底");
  if (!/function\s+migrateSave/.test(sv)) errors.push("缺 migrateSave()：旧档不会升级到当前 SAVE_VER");
  if (!/__future/.test(sv) || !/只读不写/.test(sv))
    errors.push("未来版本存档的「只读不写」保护被删了，新版档会被旧版覆盖");
  if (!/slotFlag|enumerable:\s*false/.test(sv))
    errors.push("存档运行时标记必须不可枚举，否则会被 JSON.stringify 写回 localStorage");
  if (!/saveChecksum/.test(sv)) errors.push("缺存档校验和");
  if (!/raw\[i\]/.test(sv)) errors.push("写回时未来档 / 可疑档要用 raw 原样，别把迁移后的内存对象落盘");
  if (!/migratedFrom\s*&&\s*d\.migratedFrom\s*<\s*9/.test(sv))
    errors.push("旧档升级补发文具的逻辑被删了：v9 前存档读进来会三样学习行动一起变灰");
  if (!/function\s+sanitizeState/.test(ut)) errors.push("缺 sanitizeState()：脏存档的越界值没人拉回来");
  if (!/resumeGame[\s\S]{0,6000}sanitizeState/.test(sv))
    errors.push("resumeGame() 没调 sanitizeState()，读档边界形同虚设");
  if (!/function\s+spendMoney/.test(ut)) errors.push("缺 spendMoney()：花钱会重新散落成直接赋值");
  if (/S\.prop\.经济\s*=\s*Math\.round\(money\s*-\s*spent\)/.test(travel))
    errors.push("旅游结算又绕过 spendMoney 直接赋值了（Q7 不允许欠钱）");
  if (!/it\.dur\s*>\s*0/.test(bag)) errors.push("bagEnsure 没过滤 dur<=0 的报废文具");
  if (!/delete\s+it\.prog/.test(bag)) errors.push("bagEnsure 没清掉非书类文具上的脏读书进度字段");

  /* README 别被旧版粘回来 */
  const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
  [["19 个文件", "19 个"], ["136 题", "136 题"], ["150 周", "150 周"],
   ["EN_READY", "EN_READY"], ["每周 1~2 次", "每周 1~2 次"], ["七套主题", "七套"]].forEach(pair => {
    if (readme.indexOf(pair[1]) >= 0) errors.push(`README 里又出现了过时口径「${pair[0]}」，请按当前代码实况写`);
  });
  if (!errors.length) oks.push("存档兼容：迁移表 / 校验和 / 未来档只读 / 边界净化 / 统一扣钱 / README 口径 ✅");
}

checkBookRules();
checkDBatch();
checkCBatch();
checkLogicLinks();
checkSaveFramework();
checkRenderPerf();
checkGomokuStandalone();
checkGomokuShape();
checkStationeryGate();
checkCssColorVars();

// ---------- 输出结果 ----------
console.log(`\n检查了 ${cmdCount} 条中文指令\n`);
console.log("────────────────────────────────");
if (errors.length) {
  console.log(`\n❌ 发现 ${errors.length} 个必须修的问题：\n`);
  errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
} else {
  console.log("\n✅ 全部通过，可以放心运行！");
  oks.forEach(x => console.log("  · " + x));
}
if (warns.length) {
  console.log(`\n⚠️  ${warns.length} 个小提醒（不影响运行）：\n`);
  warns.slice(0, 20).forEach(w => console.log(`  · ${w}`));
  if (warns.length > 20) console.log(`  …还有 ${warns.length - 20} 条`);
}
console.log("\n────────────────────────────────\n");
/* v1.4 E 批（需求 20）：改完主题必须跑对比度自检。
 * 单独跑：cd tools && node check-contrast.js */
if (!errors.length) require("./check-contrast.js");
process.exit(errors.length ? 1 : 0);
