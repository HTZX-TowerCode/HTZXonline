/* ==================================================================
 * 工具层 · 数值与日志
 * ==================================================================
 * 随机数、数值夹取、属性增减、日志输出、飘字。
 * 所有"改数字"的操作最终都会走到这里的 modProp()，
 * NaN 防护也在这里统一处理。
 *
 * 维护等级：引擎层（一般不动）
 * ============================================================ */

    let S = null, slotCur = 0;

    const rnd = n => Math.floor(Math.random() * n);

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    /* ==================================================================
     * 好运判定：事件里所有「看运气」的分支都走这里
     * ------------------------------------------------------------------
     * 这样【锦鲤附体】【乌鸦嘴】两个天赋和【幸运硬币】道具才真的有用
     * —— 以前它们只在天赋表里写着，代码里没人认。
     * 用法：if (luckyRoll(0.5)) { …好运分支… }
     * ================================================================== */
    function luckyRoll(p) {
      let v = clampNum(p, 0, 1, 0.5);
      if (typeof Talent !== "undefined") {
        if (Talent.have("锦鲤附体")) v += 0.15;
        if (Talent.have("乌鸦嘴")) v -= 0.12;
      }
      if (S && S.luckyCharm) v += 0.10;      // 小卖铺的幸运硬币
      return Math.random() < clampNum(v, 0.02, 0.98);
    }

    /* ==================================================================
     * 数值边界：任何进入状态的数字都必须先过这一关，杜绝 NaN / Infinity
     * ================================================================== */

    const num = (v, d = 0) => (typeof v === "number" && isFinite(v)) ? v : d;

    const clampNum = (v, a, b, d = a) => clamp(num(v, d), a, b);

    // 属性的合法区间与兜底值：[下限, 上限, 出问题时兜底成多少]
    // 主界面显示前七项；「亲情」是第八项，只在家庭事件中生效，
    // 不显示在 HUD 属性栏（避免界面变长），在天赋图鉴里能看到。

    const PROP_RANGE = {
      心态: [0, 150, 100], 经济: [0, 1e9, 100], 健康: [0, 150, 100], 效率: [10, 150, 100],
      悟性: [10, 150, 10], 社交: [10, 150, 100], 压力: [0, 150, 10],
      亲情: [10, 150, 80]
    };

    /* ==================================================================
     * 属性可见性（v1.1 起）
     * ------------------------------------------------------------------
     * PROP_HUD     面板上真正看得见的四项：心态 / 经济 / 健康 / 压力
     * PROP_HIDDEN  后台实时计算、面板上一律不出现：效率 / 悟性 / 社交 / 亲情
     * PROP_BLUR    HUD 里除「经济」之外都要模糊化：只给档位文字，不给数字
     *
     * 学科属性（语文 / 数学 ……）不再常驻面板，只在考试事件里显示。
     * 想恢复完整数值面板：把 PROP_HUD 改成 Object.keys(PROP_RANGE)，
     * 并把 PROP_BLUR 改成空数组即可。
     * ================================================================== */
    const PROP_HUD = ["心态", "经济", "健康", "压力"];

    const PROP_HIDDEN = ["效率", "悟性", "社交", "亲情"];

    const PROP_BLUR = ["心态", "健康", "压力"];

    /* ==================================================================
     * v1.4 三档真实度：把上面三张静态表变成「按模式查询」
     * ------------------------------------------------------------------
     *   game 游戏 —— 八项属性全部可见、全部给数值；学科分数也常驻
     *   sim  模拟 —— 四项可见、除经济外五档；条类仍给具体数值
     *   real 真实 —— 与旧版完全一致；条类只有视觉长度
     * ★ 经济在任何模式下都显示数值（钱本来就该数得清）。
     *
     * 下面四个函数供 17-ui.js / modProp() / 后续 C、D 批的条类复用，
     * 别在别处另写一套判断。
     * ================================================================== */

    /* 这一项属性要不要出现在面板上 */
    function propVisible(k) {
      if (typeof realismMode === "function" && realismMode() === "game") return true;
      return PROP_HUD.indexOf(k) >= 0;
    }

    /* 这一项属性给数字，还是只给「极低/较低/中/较高/极高」 */
    function propShowsNumber(k) {
      if (k === "经济") return true;                       // 任何模式都给数字
      return (typeof realismMode === "function") && realismMode() === "game";
    }

    /* 条类（体力 / 文具耐久 / 读书进度）给不给数值 */
    function barHasNumber() {
      return (typeof barShowsNumber === "function") ? barShowsNumber() : false;
    }

    /* ==================================================================
     * 档位：把 0~150 的数值翻译成「极低 / 较低 / 中 / 较高 / 极高」
     * ------------------------------------------------------------------
     * 五档均分，档位宽度 30。面板上只显示档位文字 + 五格刻度条，
     * 玩家看到的是"状态好不好"，不是精确的 87 还是 88。
     * 想改档位文案改 js/01b-i18n.js 的 level.* ；想改宽度改这里的 STEP。
     * ================================================================== */
    const PROP_LEVEL_STEP = 30;

    const PROP_LEVELS = [
      {lv: 0, key: "level.vlow"},
      {lv: 1, key: "level.low"},
      {lv: 2, key: "level.mid"},
      {lv: 3, key: "level.high"},
      {lv: 4, key: "level.vhigh"}
    ];

    /* 数值落在第几档（0~4） */
    function propLevel(v) {
      const x = clamp(num(v, 0), 0, 150);
      return clamp(Math.floor(x / PROP_LEVEL_STEP), 0, 4);
    }

    /* 属性的语义方向：+"越高越好" / -"越高越糟"
     * 压力是唯一反向的 —— 档位文字照写「极高」，但颜色要反过来。 */
    function propPolarity(k) {return k === "压力" ? -1 : 1;}

    /* 档位文字（已过双语层） */
    function propLevelText(k, v) {
      const lv = propLevel(v);
      const key = (PROP_LEVELS[lv] || PROP_LEVELS[2]).key;
      return L(key);
    }

    const SUBJ_CAP = 1500;   // 单科学力上限，防止长期累积后失控

    function fixProp(k, v) {
      const r = PROP_RANGE[k] || [0, 150, 100];
      return clamp(num(v, r[2]), r[0], r[1]);
    }

    function sanitizeProp(p) {
      const out = {};
      for (const k in PROP_RANGE) out[k] = fixProp(k, p ? p[k] : undefined);
      return out;
    }

    function sanitizeSubj(s) {
      const out = {};
      for (const g in SUBJECTS_BY_GRADE)
        SUBJECTS_BY_GRADE[g].forEach(k => {out[k] = clamp(num(s ? s[k] : undefined, 30), 0, SUBJ_CAP);});
      if (s) for (const k in s) if (out[k] === undefined) out[k] = clamp(num(s[k], 30), 0, SUBJ_CAP);
      return out;
    }
    /* 把当前学年的科目补齐/修好，任何 NaN 都会被拉回 30 左右 */

    function ensureSubj() {
      if (!S) return;
      const subs = subjectsOf(S.term) || [];
      for (const k of subs) {
        if (S.subj[k] === undefined || !isFinite(S.subj[k])) S.subj[k] = 25 + rnd(15);
        S.subj[k] = clamp(S.subj[k], 0, SUBJ_CAP);
      }
    }

    function recalcScore() {
      const subs = subjectsOf(S.term) || [];
      S.score = subs.length ? clampNum(subs.reduce((a, x) => a + num(S.subj[x], 0), 0), 0, SUBJ_CAP * 20) : 0;
    }

    /* ==================================================================
     * 真实学习难度曲线
     * ================================================================== */

    /* 剧情模式下的属性保底线。
     * 亲情单独设一条更高的底线（storyFloorFamily），
     * 避免展示时玩家因为几次手机违规就"众叛亲离"，那不是我们想传达的。 */
    function propFloor(k) {
      /* v1.4：旧的 "story" 保底语义归入「简单」档（旧存档归一后同样生效） */
      const easy = (typeof isEasyMode === "function") ? isEasyMode()
        : (GAME_CONFIG.difficulty === "story");
      if (!easy) return 0;
      if (k === "健康" || k === "心态") return GAME_CONFIG.storyFloor;
      if (k === "亲情") return GAME_CONFIG.storyFloorFamily;
      /* 经济也留一条底线：剧情模式承诺「不会中途暴毙」，
       * 而经济归零满 12 周会触发「辍学打工」提前结束 —— 展示时不想看到这个。
       * 想要经济压力，请切到 standard / hard 难度。 */
      if (k === "经济") return GAME_CONFIG.storyFloorMoney;
      return 0;
    }

    /* ==================================================================
     * v1.5 A 批 · 统一扣钱（Q7：不允许欠钱）
     * ------------------------------------------------------------------
     * 以前旅游结算直接写 `S.prop.经济 = money - spent`，绕过了 modProp，
     * 既没有保底线也没有飘字反馈。所有"花钱"一律走这里。
     * 返回值：false = 钱不够，一分不扣（调用方负责提示）。
     * ================================================================== */
    function spendMoney(v, o) {
      if (!S || !S.prop) return false;
      o = o || {};
      const cost = Math.max(0, Math.round(num(v, 0)));
      const have = num(S.prop.经济, 0);
      if (cost > 0 && have < cost) {
        if (!o.silent && typeof toast === "function") toast(L("shop.poor"));
        return false;
      }
      if (cost > 0) modProp("经济", -cost);
      /* 双保险：即使有人并发改了 prop，也不允许落到负数 */
      S.prop.经济 = Math.max(propFloor("经济"), num(S.prop.经济, 0));
      return true;
    }

    /* ==================================================================
     * v1.5 A 批 · 运行时状态净化（脏存档 / 手改 localStorage 的最后一道闸）
     * ------------------------------------------------------------------
     * 0 批诊断里塞进去没被拉回来的：体力 99999、文具耐久 ±99、
     * 袋容量 9999、周数 99999、S.evCnt = null。
     * 正常游玩不会造出这些值，但读档那一刻统一过一遍最稳。
     *
     * ★ 只在「读档重建 S 之后」调一次，别放进 renderHUD 里（会拖慢帧率）。
     *   每加一个新系统，在这里补一行即可，别散落到各处 || 兜底。
     * ================================================================== */
    function sanitizeState() {
      if (!S) return;
      const obj = v => (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
      const arr = v => Array.isArray(v) ? v : [];

      /* 周 / 学期：TERMS 与 WEEKS_PER_TERM 定义在 09-data-fixed.js，运行时已就绪 */
      const maxWeek = (typeof WEEKS_PER_TERM !== "undefined" && typeof TERMS !== "undefined")
        ? WEEKS_PER_TERM * TERMS : 120;
      S.week = clampNum(S.week, 0, maxWeek, 0);
      S.term = clampNum(S.term, 0, (typeof TERMS !== "undefined" ? TERMS : 6), 0);

      /* 属性：sanitizeProp 已按 PROP_RANGE clamp，经济再单独钉死不许欠钱 */
      S.prop = sanitizeProp(S.prop);
      S.prop.经济 = Math.max(propFloor("经济"), num(S.prop.经济, 0));

      /* 剩余时间（体力池）：0 ~ 本周上限，读档同周保留余量 */
      const maxStam = (typeof staminaMax === "function") ? staminaMax() : 100;
      S.stam = clampNum(S.stam, 0, maxStam, maxStam);
      S.stamWeek = Math.round(num(S.stamWeek, -1));

      /* 事件 / 计数 / 标记类：必须是对象或数组，null 会让后续 [id] 抛错 */
      ["evCnt", "evCntWeek", "evLastWeek", "cnt", "cure", "flags", "hk", "exp", "daoDone"].forEach(k => {S[k] = obj(S[k]);});
      ["ach", "pending", "chainQueue", "clubTried"].forEach(k => {S[k] = arr(S[k]);});
      S.evCountWeek = clampNum(S.evCountWeek, 0, 9999, 0);
      S.evWeekTotal = clampNum(S.evWeekTotal, 0, 99, 0);
      S.allowCount = clampNum(S.allowCount, 0, 2, 0);

      /* v1.5 C：心事状态 / 长链深度 / 已见长链 —— 读档或手改存档都要归一 */
      S.chainDepth = clampNum(S.chainDepth, 0, num((typeof GAME_CONFIG !== "undefined" ? GAME_CONFIG.epicMaxDepth : 6), 6), 0);
      S.chainWeek = Math.round(num(S.chainWeek, -1));
      if (!Array.isArray(S.epicSeen)) S.epicSeen = [];
      S.epicSeen = S.epicSeen.filter(x => typeof x === "string").slice(0, 200);
      if (typeof romanceSanitize === "function") romanceSanitize();
      else if (!S.romance || typeof S.romance !== "object") S.romance = {on: false, weeks: 0, since: 0, lost: [], pendingNotice: null};

      /* 文具袋：结构补全 + 数值边界都在 bagEnsure 里，这里只触发 */
      if (typeof bagEnsure === "function") bagEnsure();
      /* 旧档（v9 之前没有文具袋）读进来一支笔都没有，钱又不够买最便宜的，
       * 会连学习 / 做题 / 读书一起锁死。这里复用 D 批的「同桌送铅笔头」兜底。 */
      if (typeof bagRequireWrite === "function" && !bagRequireWrite()
        && num(S.prop.经济, 0) < 12 && typeof bagAdd === "function") {
        bagAdd("pencil_stub", {silent: true, force: true, from: "同学送的"});
        if (typeof bagItems === "function" && !bagItems("eraser").length)
          bagAdd("eraser", {silent: true, force: true, from: "同学送的"});
      }

      /* 学科 / 总分 */
      if (typeof ensureSubj === "function") ensureSubj();
      if (typeof recalcScore === "function") recalcScore();
      S.zhongkao = clampNum(S.zhongkao, -1, 999, -1);
      S.lastExamScore = clampNum(S.lastExamScore, 0, 100, 0);
      S.bestExam = clampNum(S.bestExam, 0, 100, 0);
      return S;
    }

    function modProp(k, v) {
      if (S.prop[k] === undefined || !isFinite(S.prop[k])) S.prop[k] = fixProp(k, undefined);
      v = num(v, 0);
      if (!v) return;
      const before = S.prop[k];
      S.prop[k] = clamp(S.prop[k] + v, propFloor(k), PROP_RANGE[k] ? PROP_RANGE[k][1] : 150);
      if (S.prop[k] < (PROP_RANGE[k] ? PROP_RANGE[k][0] : 0)) S.prop[k] = PROP_RANGE[k] ? PROP_RANGE[k][0] : 0;
      if (Math.abs(v) >= 1) {
        const good = (k === "压力") ? (v < 0) : (v > 0);
        // 隐藏属性（效率 / 悟性 / 社交 / 亲情）：面板上看不到，
        // 飘一个带数字的字只会暴露它们，改成不带数字的方向提示。
        if (isHiddenProp(k)) {
          if (floatHiddenWanted()) floatGain(`${propName(k)} ${v > 0 ? "▲" : "▼"}`, good);
        } else if (isBlurProp(k)) {
          /* v1.5 D 批：真实 / 模拟模式的模糊属性一律只飘 ▲▼。
           * 以前这里还看 ui.floatNumbers（默认 true），结果反馈窗改干净了，
           * 屏幕上却仍飘着「心态 +7」—— 模糊化被飘字漏了个干净。
           * 经济不在 PROP_BLUR 里，任何模式都照常给数字。 */
          floatGain(`${propName(k)} ${v > 0 ? "▲" : "▼"}`, good);
        } else {
          floatGain(`${propName(k)} ${v > 0 ? "+" : ""}${Math.round(v)}`, good);
        }
      }
    }

    /* 该属性是否在面板上隐藏。
     * 游戏模式全部摊开，所以这里一律返回 false。 */
    function isHiddenProp(k) {
      if (typeof realismMode === "function" && realismMode() === "game") return false;
      return (typeof PROP_HIDDEN !== "undefined") && PROP_HIDDEN.indexOf(k) >= 0;
    }

    /* 该属性是否要模糊化（只给档位，不给数字）。
     * 游戏模式下不模糊；其余按 PROP_BLUR（经济永远不在里面）。 */
    function isBlurProp(k) {
      if (propShowsNumber(k)) return false;
      return (typeof PROP_BLUR !== "undefined") && PROP_BLUR.indexOf(k) >= 0;
    }

    /* 飘字开关，见 GAME_CONFIG.ui */
    function floatNumbersWanted() {
      const u = (typeof GAME_CONFIG !== "undefined" && GAME_CONFIG.ui) || {};
      return u.floatNumbers !== false;
    }

    function floatHiddenWanted() {
      const u = (typeof GAME_CONFIG !== "undefined" && GAME_CONFIG.ui) || {};
      return u.hiddenFloats === true;
    }

    /* ==================================================================
     * v1.4.3 性能（坑 67）：HUD 写入去重
     * ------------------------------------------------------------------
     * renderHUD() 在一次操作里可能被调好几次，以前每次都把
     * statPanel / talentPanel / itemPanel / 顶栏条整块 innerHTML 重建。
     * 即使内容一模一样，浏览器也要销毁旧节点、重新解析 HTML、重算样式。
     * 这里按「id + 目标 HTML」缓存，没变就不写 DOM。
     *
     * ★ 只给这几个由 renderHUD 独占的节点用；若别处直接改了它们的
     *   innerHTML，记得调 clearHudCache()。
     * ================================================================== */
    const HUD_HTML_CACHE = Object.create(null);
    function setHudHtml(id, html) {
      if (HUD_HTML_CACHE[id] === html) return;
      HUD_HTML_CACHE[id] = html;
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    }
    function clearHudCache() {
      for (const k in HUD_HTML_CACHE) delete HUD_HTML_CACHE[k];
    }

    /* ★ v1.4.3 性能（坑 67）：日志栏 DOM 只保留最近 LOG_DOM_MAX 条。
     * 以前每写一条日志就 appendChild + 立刻读 scrollHeight（强制同步布局），
     * 玩到后期日志上千条，一次批量写入实测掉到 13fps、p95 216ms。
     *   · S.logs 是**数据**，只增不裁 —— fbBegin/fbCollect 用数组长度当游标，
     *     裁了会让「这一下的结果」丢文本（见 03f-feedback.js）。
     *   · 界面上的 DOM 裁到 120 条，回看历史仍可从 S.logs 取。
     *   · 滚动合并到下一帧，一次操作里连写十条也只布局一次。 */
    const LOG_DOM_MAX = 120;
    let SAY_SCROLL_QUEUED = false;
    function say(txt, cls = "") {
      /* 单亲 / 留守家庭：日志里爸爸妈妈的称呼也要统一（双亲家庭原样） */
      if (typeof famText === "function" && typeof txt === "string") txt = famText(txt);
      S.logs.push({txt, cls});
      const el = document.getElementById("log");
      if (!el) return;
      const d = document.createElement("div");
      if (cls) d.className = cls;
      d.textContent = txt;
      el.appendChild(d);
      while (el.childElementCount > LOG_DOM_MAX) el.removeChild(el.firstChild);
      if (!SAY_SCROLL_QUEUED) {
        SAY_SCROLL_QUEUED = true;
        const box = el;
        const scrollNow = () => {SAY_SCROLL_QUEUED = false; box.scrollTop = box.scrollHeight;};
        if (typeof window !== "undefined" && window.requestAnimationFrame) window.requestAnimationFrame(scrollNow);
        else setTimeout(scrollNow, 0);
      }
    }

    function count(k) {
      S.cnt[k] = (S.cnt[k] || 0) + 1;
      bumpCure(k);   // 行动 / 运动 / 高分等计数同步推进「破茧」进度
    }
    /* story 模式下给 健康 / 心态 留一条保底线，避免展示时突然暴毙 */

    let floatIdx = 0;

    function floatGain(txt, good) {
      /* 同帧最多留 12 条飘字，再多反而叠成一团、还要多画十几层 */
      const old = document.querySelectorAll(".floatgain");
      if (old.length >= 12) old[0].remove();
      const d = document.createElement("div");
      d.className = "floatgain";
      d.style.color = good === false ? "var(--red)" : (good === true ? "var(--green)" : "var(--gold)");
      const fi = floatIdx++;
      // 横向 5 个一循环（±120px 内），每满 5 条再整体下移一行，避免叠字
      d.style.left = `calc(50% + ${(fi % 5 - 2) * 60}px)`;
      d.style.top = `calc(55% + ${Math.floor(fi / 5) % 4 * 26}px)`;
      d.textContent = txt;
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 1600);
    }
