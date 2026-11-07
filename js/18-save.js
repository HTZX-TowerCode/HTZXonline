/* ==================================================================
 * 存档层 · 本地存档
 * ==================================================================
 * 三个存档槽的读写、读档时的数据净化与字段补全。
 *
 * 维护等级：存档层（一般不动）
 * ============================================================ */

    /* ==================================================================
     * 随机名库
     * ------------------------------------------------------------------
     * 建角色时点「随机」会从这个池子里取。
     * en 那份留着 —— 英语模式恢复后只要在取用的地方加一句
     * (LANG !== "zh" ? NAME_POOL.en : NAME_POOL.zh) 就能切过去。
     * ============================================================ */
    const NAME_POOL = {
      zh: {
        male: ["李承宇", "王浩然", "张子墨", "刘俊熙", "陈宇航", "杨启航", "赵泽楷", "周天佑",
          "顾北辰", "沈亦白", "陆时安", "程星野", "谢知遥", "韩煜城", "顾言澈", "林书珩"],
        female: ["林诗涵", "苏婉清", "沈梦瑶", "顾念之", "叶清欢", "陆雨萱", "唐若曦", "许安然",
          "江晚吟", "沈知意", "顾星晚", "温以宁", "白书予", "叶挽晴", "林疏桐", "苏可盈"]
      },
      en: {
        male: ["Ethan", "Noah", "Liam", "Lucas", "Mason", "Owen", "Caleb", "Ryan",
          "Adrian", "Felix", "Julian", "Milo", "Theo", "Ivan", "Oscar", "Leon"],
        female: ["Emma", "Ava", "Sophia", "Chloe", "Luna", "Mia", "Nora", "Iris",
          "Elena", "Clara", "Hazel", "Ruby", "Vera", "Stella", "Freya", "Lydia"]
      }
    };

    /* ==================================================================
     * 彩蛋：这几个名字不能用来建存档
     * ------------------------------------------------------------------
     * 作者把自己的名字设成了"不可用人名" —— 想用真名建号的玩家
     * 会收到一句专属提示（不是报错，是彩蛋）。
     *
     * 判定规则：
     *   · 不区分大小写（XYF / Xyf 都拦）
     *   · 忽略首尾空格
     *   · 中文名直接比对
     * 想加名字就往下面数组里加字符串，一行一个。
     * ============================================================ */
    const BANNED_NAMES = ["xyf", "xiayifu", "夏毅夫", "夏if"];

    /* 这个名字是不是被彩蛋占用了
     * v1.4：不只 trim 首尾 —— 「夏 IF」「夏　毅夫」「xi ayifu」这类
     * 中间夹空格 / 全角空格 / 零宽字符的写法也要拦住。
     * 判定：全部空白与零宽字符剔掉后，再不区分大小写比对。 */
    function isBannedName(nm) {
      const strip = s => String(s == null ? "" : s)
        .toLowerCase().replace(/[\s\u3000\u200b-\u200d\ufeff]+/g, "");
      const n = strip(nm);
      if (!n) return false;
      return BANNED_NAMES.some(b => strip(b) === n);
    }

    const SAVE_KEY = "zhongkao_life_saves_v6";
    const SAVE_VER = 10;            // v1.5 C：新增心事状态 / 长链深度 / 已见长链，结构 +1
    const SAVE_SLOTS = 3;

    /* ==================================================================
     * v1.5 A 批 · 存档迁移框架（Q5：稳定 + 便于后续版本兼容）
     * ------------------------------------------------------------------
     * 以前旧档全靠散落在 resumeGame / startWeek 里的 `|| 默认值` 兜底，
     * 加一个字段要改三四处，还容易漏。现在统一成「逐级迁移表」：
     *
     *   ★ 以后每次改存档结构，只做两件事：
     *       1. 在 MIGRATIONS 里加一级 {目标版本: up函数}
     *       2. SAVE_VER + 1
     *     loadSaves() / resumeGame() 一行都不用动。
     *
     *   · 每级 up() 只负责「这一版新增的字段」，且必须幂等：
     *     只在字段非法时补默认值，绝不覆盖合法值。
     *   · 从 d.v 逐级升到 SAVE_VER，中途某一级抛错也不炸整档。
     *   · 未知更高版本（d.v > SAVE_VER）→ 只读不写、不迁移、不允许覆盖。
     *   · 校验和：新档都有 __sum；旧档没有就跳过校验（不误伤）。
     *     有 __sum 但不匹配 → 标 __suspect 提示，仍允许玩家读取。
     *   · __future / __suspect 用「不可枚举属性」挂在内存对象上，
     *     JSON.stringify 不会把它们写回 localStorage。
     * ================================================================== */
    const svObj = v => (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
    const svArr = v => Array.isArray(v) ? v : [];
    const svStr = (v, d) => (typeof v === "string" && v) ? v : (d || "");

    const MIGRATIONS = {
      /* v2：计数与成就 */
      2: d => {d.cnt = svObj(d.cnt); d.ach = svArr(d.ach);},
      /* v3：事件计数 / 冷却 / 后续队列 */
      3: d => {d.evCnt = svObj(d.evCnt); d.evCntWeek = svObj(d.evCntWeek);
        d.evLastWeek = svObj(d.evLastWeek); d.chainQueue = svArr(d.chainQueue);},
      /* v4：标记与挂起事件 */
      4: d => {d.flags = svObj(d.flags); d.pending = svArr(d.pending);},
      /* v5：社团 */
      5: d => {d.club = svStr(d.club, ""); d.clubTried = svArr(d.clubTried);
        d.clubTerm = clampNum(d.clubTerm, -1, 99, -1); d.clubSkipTerm = clampNum(d.clubSkipTerm, -1, 99, -1);},
      /* v6：开局设置与真实度（story / full 归一由 applyStartSetup 负责） */
      6: d => {d.setup = svObj(d.setup);
        d.realism = ["game", "sim", "real"].indexOf(d.realism) >= 0 ? d.realism : "real";},
      /* v7：中考三段结算（生地会考 / 实验分） */
      7: d => {d.zkFull = clampNum(d.zkFull, 0, 999, 0); d.hk = svObj(d.hk);
        d.exp = svObj(d.exp); d.hkDone = !!d.hkDone;
        d.prevExamScore = clampNum(d.prevExamScore, 0, 100, 0);},
      /* v8：剩余时间池 / 要钱次数 / 周末时间表 */
      8: d => {d.stam = clampNum(d.stam, 0, 999, 100); d.stamWeek = Math.round(num(d.stamWeek, -1));
        d.allowWeek = Math.round(num(d.allowWeek, -1)); d.allowCount = clampNum(d.allowCount, 0, 2, 0);
        d.weekendPlan = Array.isArray(d.weekendPlan) ? d.weekendPlan : null;
        d.weekendSaved = Array.isArray(d.weekendSaved) ? d.weekendSaved : null;
        d.weekendLast = Array.isArray(d.weekendLast) ? d.weekendLast : null;},
      /* v9：文具袋 / 图书 / 借书时限。结构交给 bagEnsure() 在运行时补全，
       * 这里只保证字段类型合法，不硬造一袋文具（避免给旧档塞一整套新笔）。 */
      9: d => {
        /* 只建结构、不塞文具：旧档读进来若一支笔都没有，
         * 由 sanitizeState() 的「同学送铅笔头」兜底补上，避免学习锁死。 */
        if (!d.bag || typeof d.bag !== "object" || Array.isArray(d.bag))
          d.bag = {items: [], lent: [], onlineStock: []};
        ["items", "lent", "onlineStock"].forEach(k => {
          if (!Array.isArray(d.bag[k])) d.bag[k] = [];
        });
      },
      /* v10（v1.5 C）：心事状态与长链进度。
       * ★ 老档没有这些字段时给「干净的关闭状态」，不能让玩家读档后
       *   凭空进入一段没头没尾的剧情，也不能让 chainDepth 卡在上限。 */
      10: d => {
        if (!d.romance || typeof d.romance !== "object" || Array.isArray(d.romance))
          d.romance = {on: false, weeks: 0, since: 0, lost: [], pendingNotice: null};
        d.romance.on = !!d.romance.on;
        d.romance.weeks = clampNum(d.romance.weeks, 0, 999, 0);
        d.romance.since = clampNum(d.romance.since, 0, 999, 0);
        if (!Array.isArray(d.romance.lost)) d.romance.lost = [];
        d.romance.pendingNotice = null;   // 换版本不重放旧弹窗
        d.chainDepth = 0;
        d.chainWeek = clampNum(d.chainWeek, -1, 999, -1);
        if (!Array.isArray(d.epicSeen)) d.epicSeen = [];
      }
    };

    /* 内存标记：不可枚举 → 写回 localStorage 时自动消失 */
    function slotFlag(d, k, v) {
      try {Object.defineProperty(d, k, {value: v, enumerable: false, configurable: true, writable: true});}
      catch (e) {d[k] = v;}
      return d;
    }

    /* FNV-1a：只要能发现「档被改过」就够了，不需要密码学强度 */
    function saveChecksum(d) {
      const src = JSON.stringify(d, (k, v) =>
        (k === "__sum" || k === "__future" || k === "__suspect") ? undefined : v);
      let h = 2166136261;
      for (let i = 0; i < src.length; i++) {h ^= src.charCodeAt(i); h = Math.imul(h, 16777619);}
      return (h >>> 0).toString(16).padStart(8, "0");
    }

    /* 把 d 从它自己的版本升到 SAVE_VER。
     * ★ 全量跑 MIGRATIONS（每级都幂等）：既升级旧档，也顺手净化
     *   「版本已是最新但形状被改坏」的档，renderSlots 才不会因 d.ach
     *   不是数组而抛错。合法值一个都不会被覆盖。 */
    function migrateSave(d) {
      const from = clampNum(d.v, 1, SAVE_VER, 1);
      for (let v = 2; v <= SAVE_VER; v++) {
        const up = MIGRATIONS[v];
        if (!up) continue;
        try {up(d);} catch (e) {
          if (typeof console !== "undefined") console.warn("[存档] v" + v + " 迁移跳过", e);
        }
      }
      if (from !== SAVE_VER || d.v !== SAVE_VER) {
        d.v = SAVE_VER;
        d.migratedFrom = from;
        if (typeof console !== "undefined") console.info("[存档] v" + from + " → v" + SAVE_VER + " 迁移完成");
      }
      return d;
    }

    /* 读存档：任何一条坏数据都不许让主菜单打不开 */
    function loadSaves() {
      let raw = null;
      try {raw = JSON.parse(localStorage.getItem(SAVE_KEY));} catch (e) {raw = null;}
      if (!Array.isArray(raw)) raw = [];
      const out = []; let dirty = false;
      for (let i = 0; i < SAVE_SLOTS; i++) {
        let d = isSaveUsable(raw[i]) ? raw[i] : null;
        if (!d) {out.push(null); continue;}
        const ver = clampNum(d.v, 1, 999, 1);
        /* 来自更新版本：原样保留、不迁移、不允许覆盖 */
        if (ver > SAVE_VER) {slotFlag(d, "__future", ver); out.push(d); continue;}
        /* 校验和：旧档没有 __sum 就跳过，不误伤 */
        const suspect = !!(d.__sum && saveChecksum(d) !== d.__sum);
        if (suspect) slotFlag(d, "__suspect", true);
        const old = d.__sum;
        migrateSave(d);
        const sum = saveChecksum(d);
        /* ★ 校验不通过时【不写回】：否则等于承认了手改的内容，
         * 提示也只闪一次。留着旧 __sum，直到玩家自己存一次档才刷新。
         * 迁移仍在内存里执行（幂等），只是不落盘。 */
        if (!suspect && (ver < SAVE_VER || !old || sum !== old)) {d.__sum = sum; dirty = true;}
        out.push(d);
      }
      /* 迁移结果落盘一次，避免每次读档都重跑。
       * ★ 未来档 / 校验异常档用 raw 原样写回 —— 它们不该被这一轮
       *   迁移或补全碰到（「只读不写」要真的做到字节级）。 */
      if (dirty) {
        const toWrite = out.map((d, i) => (d && (d.__future || d.__suspect)) ? raw[i] : d);
        writeSaves(toWrite);
      }
      return out;
    }

    /* 一个存档槽的数据是否还能用（最基本的可读性检查） */
    function isSaveUsable(d) {
      if (!d || typeof d !== "object" || Array.isArray(d)) return false;
      if (typeof d.name !== "string") return false;
      if (!isFinite(d.week) || !isFinite(d.term)) return false;
      if (d.week < 0 || d.term < 0) return false;
      /* 明显乱填的版本号（不是未来档）直接判脏 */
      if (isFinite(d.v) && d.v > SAVE_VER + 50) return false;
      return true;
    }

    /* 写存档：写不进去（隐私模式 / 空间满）也不能崩 */
    function writeSaves(a) {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(a));
        return true;
      } catch (e) {
        if (typeof toast === "function") toast(L("save.fail"));
        return false;
      }
    }

    function saveGame(manual, autoSave) {
      if (!S) return false;
      // 槽号越界（存档结构变动 / 手动改过 localStorage）时拉回 0 号槽
      if (!(slotCur >= 0 && slotCur < SAVE_SLOTS)) slotCur = 0;
      const a = loadSaves();
      /* 未来版本档：只读不写，绝不覆盖 */
      if (a[slotCur] && a[slotCur].__future) {
        if (typeof toast === "function") toast(L("save.futureBlock"));
        return false;
      }
      a[slotCur] = {
        v: SAVE_VER,
        week: S.week, term: S.term, name: S.name, gender: S.gender,
        evCnt: S.evCnt, daoDone: S.daoDone, subj: S.subj, prop: S.prop,
        score: S.score, lastExamScore: S.lastExamScore, bestExam: S.bestExam, zhongkao: S.zhongkao,
        /* v1.4：以前这四项没存档，读档后生地会考成绩与实验分会凭空消失 */
        zkFull: S.zkFull, hk: S.hk, hkDone: S.hkDone, exp: S.exp,
        realism: S.realism,
        buff: [S.studyBuff, S.buffWeeks, S.studyDebuff, S.debuffWeeks],
        cnt: S.cnt, ach: S.ach, over: S.over, dead: S.dead,
        talents: Talent.owned, items: S.items,
        evCntWeek: S.evCntWeek, evCountWeek: S.evCountWeek, evWeekTotal: S.evWeekTotal,
        actQuota: S.actQuota, actCount: S.actCount, cure: S.cure,
        /* v1.4 体力池 / 要钱次数 / 上次考试成绩（缺了读档会重置） */
        stam: S.stam, stamWeek: S.stamWeek, allowWeek: S.allowWeek, allowCount: S.allowCount,
        prevExamScore: S.prevExamScore,
        /* v1.4 C2：周末时间表（不存的话读档安排会丢） */
        weekendPlan: S.weekendPlan, weekendSaved: S.weekendSaved, weekendLast: S.weekendLast,
        /* v1.4 D：文具袋与图书（不存的话读档笔和书会全丢） */
        bag: S.bag,
        // —— 时间系统 ——（不存的话读档会退回周中）
        slot: S.slot, slotPlan: S.slotPlan, slotIdx: S.slotIdx,
        // —— 社团 ——（不存的话读档社团会凭空消失）
        club: S.club, clubCount: S.clubCount, clubTried: S.clubTried,
        clubSkip: S.clubSkip, clubTerm: S.clubTerm, clubSkipTerm: S.clubSkipTerm,
        // —— 事件调度 ——（手机标记、挂起事件、事件冷却都在这里）
        flags: S.flags, pending: S.pending, evLastWeek: S.evLastWeek, chainQueue: S.chainQueue,
        /* v1.5 C：心事、长链进度、已见长链（读档不重放） */
        romance: S.romance, chainDepth: S.chainDepth, chainWeek: S.chainWeek, epicSeen: S.epicSeen,
        // —— 开局设置（难度 + 学期范围）与 v1.1 新增的周标记 ——
        setup: {planId: (GAME_CONFIG.start || {}).planId, difficulty: (GAME_CONFIG.start || {}).difficulty,
          realism: (GAME_CONFIG.start || {}).realism,
          termFrom: (GAME_CONFIG.start || {}).termFrom, termTo: (GAME_CONFIG.start || {}).termTo},
        didStudyWeek: S.didStudyWeek, didSportWeek: S.didSportWeek, didReadWeek: S.didReadWeek,
        didSocialWeek: S.didSocialWeek, didQuizWeek: S.didQuizWeek,
        idleWeeks: S.idleWeeks, stressStreak: S.stressStreak,
        famConflictWeek: S.famConflictWeek, familyMain: S.familyMain,
        time: new Date().toLocaleString(),
        // 周结束自动存档时打标记，主菜单能显示"自动存于第 N 周"
        autoWeek: num(S.week, 0),
        auto: !!autoSave
      };
      a[slotCur].__sum = saveChecksum(a[slotCur]);
      const ok = writeSaves(a);
      if (manual) {toast(ok ? L("save.saved") : L("save.fail")); renderSlots();}
      else if (typeof renderSlots === "function" && autoSave) renderSlots();
      return ok;
    }

    function resumeGame(i) {
      const d = loadSaves()[i]; if (!d) return;
      if (d.__future) {
        if (typeof toast === "function") toast(L("save.futureBlock"));
        return;
      }
      if (typeof clearHudCache === "function") clearHudCache();
      slotCur = i; Talent.owned = d.talents || []; Talent.solve();
      const bf = Array.isArray(d.buff) ? d.buff : [0, 0, 0, 0];
      S = {week: d.week, term: d.term, name: d.name || "无名氏", gender: d.gender || "男", evCnt: d.evCnt || {}, daoDone: d.daoDone, subj: sanitizeSubj(d.subj), prop: sanitizeProp(d.prop), score: d.score, lastExamScore: d.lastExamScore, bestExam: d.bestExam, zhongkao: d.zhongkao,
        zkFull: num(d.zkFull, 0), hk: d.hk || {}, hkDone: !!d.hkDone, exp: d.exp || {},
        realism: ["game", "sim", "real"].indexOf(d.realism) >= 0 ? d.realism : "real",
        studyBuff: bf[0], buffWeeks: bf[1], studyDebuff: bf[2], debuffWeeks: bf[3], cnt: d.cnt, ach: d.ach, over: d.over, dead: d.dead, logs: [], items: d.items || {}, evCntWeek: d.evCntWeek || {}, evCountWeek: d.evCountWeek || 0, evWeekTotal: d.evWeekTotal || 0, actQuota: d.actQuota || 0, actCount: d.actCount || 0, cure: d.cure || {},
        slot: d.slot || "weekday", slotPlan: Array.isArray(d.slotPlan) ? d.slotPlan : ["weekday", "weekend"], slotIdx: clampNum(d.slotIdx, 0, 9),
        stam: d.stam, stamWeek: d.stamWeek, allowWeek: d.allowWeek, allowCount: num(d.allowCount, 0), prevExamScore: d.prevExamScore,
        weekendPlan: Array.isArray(d.weekendPlan) ? d.weekendPlan : null,
        weekendSaved: Array.isArray(d.weekendSaved) ? d.weekendSaved : null,
        weekendLast: Array.isArray(d.weekendLast) ? d.weekendLast : null,
        bag: (d.bag && typeof d.bag === "object") ? d.bag : null,
        club: d.club || "", clubCount: num(d.clubCount, 0), clubTried: Array.isArray(d.clubTried) ? d.clubTried : [], clubSkip: !!d.clubSkip, clubTerm: num(d.clubTerm, -1), clubSkipTerm: num(d.clubSkipTerm, -1),
        flags: d.flags || {}, pending: Array.isArray(d.pending) ? d.pending : [], evLastWeek: d.evLastWeek || {}, chainQueue: Array.isArray(d.chainQueue) ? d.chainQueue : [],
        romance: (d.romance && typeof d.romance === "object") ? d.romance : null,
        chainDepth: num(d.chainDepth, 0), chainWeek: num(d.chainWeek, -1),
        epicSeen: Array.isArray(d.epicSeen) ? d.epicSeen : [],
        // —— v1.1 新增字段 ——
        didStudyWeek: d.didStudyWeek, didSportWeek: d.didSportWeek, didReadWeek: d.didReadWeek,
        didSocialWeek: d.didSocialWeek, didQuizWeek: d.didQuizWeek,
        idleWeeks: num(d.idleWeeks, 0), stressStreak: num(d.stressStreak, 0),
        famConflictWeek: d.famConflictWeek, familyMain: d.familyMain};

      // 开局设置：读档后沿用存档时的难度、真实度与学期范围
      if (d.setup && typeof applyStartSetup === "function") {
        applyStartSetup(d.setup.planId, d.setup.difficulty, d.setup.realism || S.realism);
      }
      /* v1.5 A 批：所有边界统一在 sanitizeState() 里过一遍，
       * 不再散落成一串 clamp。新增系统时也只改那一个函数。 */
      if (typeof sanitizeState === "function") sanitizeState();
      else {ensureSubj(); recalcScore();}
      if (typeof setBackground === "function") setBackground(S.over && S.week > 0 ? "end" : "main");
      document.getElementById("startScreen").classList.add("hidden");
      document.getElementById("gameScreen").classList.remove("hidden");
      document.getElementById("log").innerHTML = "";
      say(L("save.loaded"), "sys");
      /* v1.5 A 批：v9 之前根本没有「文具袋」这个系统。旧档升级进来若
       * 只是补个空袋，学习 / 做题 / 读书三个行动会一起变灰，玩家一进游戏
       * 就得先跑小卖部 —— 这不是兼容，是添堵。直接补发一套开局文具。 */
      if (d.migratedFrom && d.migratedFrom < 9 && typeof bagGiveStart === "function") {
        bagGiveStart();
        say("🎒 旧存档升级：补发了一套文具（笔、橡皮、文具袋）。", "sys");
      }
      if (S.over) {gameOver();} else startWeek();
    }

    /* ==================================================================
     * 创角：v1.4 起改成独立一页（需求 1）
     * ------------------------------------------------------------------
     * 真正的表单在 js/18b-create.js 的 openCreatePage() 里。
     * 这里只负责转交，主菜单 / 结局页上的 onclick="newGameAt(i)" 不用改。
     * ================================================================== */
    function newGameAt(i) {
      if (typeof clearHudCache === "function") clearHudCache();
      if (typeof openCreatePage === "function") {openCreatePage(i); return;}
      if (typeof toast === "function") toast("创角页面未能加载，请刷新重试");
    }
