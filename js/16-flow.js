/* ==================================================================
 * 引擎层 · 主循环
 * ==================================================================
 * 一周的完整流程：开周 → 选行动 → 弹事件 → 结算 → 下一周。
 * 事件链（一次一弹、连锁概率）也在这里。
 *
 * 维护等级：引擎层（一般不动）
 * ============================================================ */

    /* 本学期第几周：1~20（v1.2 起每学期 20 周）。
     * S.week 是全局连续周（0 起，0~119），除以 20 得到学期、取余得到周次。 */
    function weekInTerm() {return (S.week % WEEKS_PER_TERM) + 1}

    function gradeName() {return L("grade." + (Math.min(2, Math.floor(S.term / 2)) + 1))}

    function termName() {return (S.term % 2 === 0) ? L("term.up") : L("term.down")}

    function nextWeek() {
      if (S.over) return;
      /* 本周收尾：再判定一次成就。
       * 这是个兜底 —— 固定的日程（月考、体艺节、开学）不一定都调了 checkAch，
       * 加上这一句，任何在本周达成条件的成就都会在本周结束时就解锁，
       * 不会拖到下一周的第一次行动才跳出来。 */
      if (typeof checkAch === "function") checkAch();
      /* v1.4 D 批：每周结算文具（学习数值 / 装饰收益 / 散落丢失 /
       * 借书到期 / 借出的书归还）。tickWeek 保证一周只跑一次，
       * 收周弹窗里已跑过就不会重复。 */
      if (typeof bagWeeklyTick === "function") bagWeeklyTick();
      /* 周存档点：这一周的所有结算（属性、天赋、成就、破茧/退化、
       * 压力连击、家庭矛盾）都走完之后，才把「下周开始」的状态写进存档。
       * 读档回来正好回到新周的开端，不会丢任何已结算的内容。 */
      S.week++;
      saveGame(false, true);
      startWeek();
    }

    function ensureActionPanel() {
      if (!S || S.over || popupBusy) return;   // 有弹窗正在处理时不补行动面板
      const panel = document.getElementById("actionPanel");
      if (!panel) return;
      if (panel.innerHTML !== "") return;
      const wit = weekInTerm();
      const fixed = fixedEventOf(S.term, wit);
      /* 本周的固定事件已经跑过了（比如开学）→ 照常出行动面板，
       * 否则那一周就被凭空吃掉了。 */
      if (!fixed || S.fixedDone) offerActions();
    }

    function startWeek() {
      if (S) {
        S.evWeekTotal = 0;           // 新的一周：事件计数清零
        S.clubOff = false;           // 本周还没「逃社团」
        S.fixedDone = false;         // 本周的固定日程还没跑
        S.evCountWeek = 0;
        S.evCntWeek = {};
        S.actCount = 0;
        S.actQuota = 0;
        /* v1.5 C 批：长链深度每周从头算；队列若因读档残留也一并清掉，
         * 免得上周的剧情半截蹦到这周来。 */
        S.chainDepth = 0;
        if (num(S.chainWeek, -1) !== num(S.week, 0)) {
          S.chainQueue = [];
          S.chainWeek = num(S.week, 0);
        }
        /* 读旧存档（v8 及以前没有 S.bag）时补齐文具袋结构 */
        if (typeof bagEnsure === "function") bagEnsure();
        /* ★ v1.4 体力池（需求 8）：只在「新的一周」把体力补满。
         * 用 S.stamWeek 记周号，读档回到同一周时保留剩余体力 ——
         * 否则每读一次档就白送一次满体力。 */
        if (num(S.stamWeek, -1) !== num(S.week, 0)) {
          S.stam = (typeof staminaMax === "function") ? staminaMax() : 100;
          S.stamWeek = num(S.week, 0);
        }
        if (S.stam == null) S.stam = (typeof staminaMax === "function") ? staminaMax() : 100;
        /* 要零花钱的每周次数：换周清零（亲情 <100 一周 1 次，≥100 一周 2 次） */
        S.allowCount = (num(S.allowWeek, -1) === num(S.week, 0)) ? num(S.allowCount, 0) : 0;
        S.allowWeek = num(S.week, 0);
        /* 周末时间表：带入上次安排（需求 12） */
        if (typeof weekendEnsure === "function") weekendEnsure();
        flushPending();              // 清掉过期的后续事件
        // 生成本周的时段序列（周中 → 周末，顺序固定；数量可动态增减）
        S.slotPlan = buildWeekSlots();
        S.slotIdx = 0;
        S.slot = S.slotPlan[0];
        S.actQuota = S.slotPlan.length;
      }
      const wit0 = weekInTerm();
      if (S && !fixedEventOf(S.term, wit0)) S.actQuota = num(S.slotPlan && S.slotPlan.length, actionQuota());
      renderHUD();
      if (S.over) return;
      /* 中考：跑完玩家选的那几个学期就考（默认跑满六年制 → 6 个学期）。
       * 只玩初一 / 只玩初三时，endTerm() 会提前收口。 */
      const last = (typeof endTerm === "function") ? endTerm() : (TERMS - 1);
      /* 中考：跑完玩家选的那几个学期就考。
       * S.term 在假期结束时 +1，超出 endTerm() 说明最后一个学期也读完了。 */
      if (S.term > last) {return zhongkao();}
      const wit = weekInTerm();
      const wi = weekInfo(S.week, S.term);
      /* 周头：S.week 内部从 0 起，玩家看到的是第 1~120 周 */
      say(L("flow.weekHead", num(S.week, 0) + 1, gradeName(), termName(), wi.month, wi.seasonIcon, wi.season), "week-head");
      const fixed = fixedEventOf(S.term, wit);
      const goWeek = () => {if (fixed) runFixed(fixed); else offerActions();};
      /* v1.5 C 批：心事状态变化的说明窗优先于本周日程。
       * romanceNotice 返回 true 时由它自己接住后续流程（点确认再走）。 */
      if (typeof romanceNotice === "function" && romanceNotice(goWeek)) return;
      goWeek();
    }

    /* 是否需要抢社团
     * ------------------------------------------------------------------
     * 规则：
     *   1. 只在「上学期」开放（初一上 / 初二上 / 初三上，term 0 / 2 / 4）
     *   2. 窗口是每学期第 3~5 周的周末
     *   3. 整个窗口只弹一次 —— 抢不上就这一年没有社团
     *   4. 已经选中过「不报了」的，这一年不再问
     * ================================================================== */
    function needClubGrab() {
      if (!S) return false;
      const term = clampNum(S.term, 0, 9, 0);
      if (term % 2 !== 0) return false;               // 只有上学期
      if (S.clubTerm === term) return false;          // 这一年已经处理过了
      if (S.clubSkipTerm === term) return false;      // 这一年主动放弃了
      const wit = weekInTerm();
      if (wit < 3 || wit > 5) return false;           // 第 3~5 周
      if (S.slot !== "weekend") return false;
      return true;
    }

    function showClubGrab() {
      S.clubTerm = clampNum(S.term, 0, 9, 0);     // 这一年只问这一次
      const wi = weekInfo(S.week, S.term);
      const cur0 = (typeof CLUB_MAP !== "undefined") ? CLUB_MAP[S.club] : null;
      showPopup({
        kind: "free",
        badge: "🎉 社团 · 周末",
        title: CLUB_GRAB_EVENT.t,
        body: `<div style="line-height:1.62">${String(CLUB_GRAB_EVENT.c).replace(/\n/g, "<br>")}
          ${cur0 ? `<br><span style="color:var(--green);font-size:.85rem">你现在是「${cur0.n}」的成员 —— 可以续留，也可以换一个。</span>` : ""}
          <br><span style="color:var(--dim);font-size:.85rem">${wi.month}月 · ${wi.seasonIcon}${wi.season} · ${gradeName()}上学期 · 报名窗口只有这一次</span></div>`,
        options: (typeof buildClubGrabOpts === "function") ? buildClubGrabOpts() : [{t: "知道了", fn: () => {ensureActionPanel();}}]
      }, () => {ensureActionPanel();});
    }

    function offerActions() {
      // 开学第 3~5 周的周末：抢社团（红塔中学特色，手慢无，每学年上学期一次）
      if (needClubGrab()) {showClubGrab(); return;}

      // 周三社团课：行动选项换成社团专属的
      if (S.slot === "clubday") {offerClubActions(); return;}

      const acts = [
        {k: "study", t: L("act.study")},
        {k: "quiz", t: L("act.quiz")},
        {k: "sport", t: L("act.sport")},
        {k: "rest", t: L("act.rest")},
        {k: "social", t: L("act.social")},
        {k: "fun", t: L("act.fun")},
        {k: "allowance", t: L("act.allowance")},
        {k: "read", t: L("act.read")},
      ];

      const box = document.getElementById("actionPanel");
      const slot = SLOT_MAP[S.slot] || SLOTS[0];
      /* v1.4 地狱难度：心态过低时，学习类行动不可用（先把自己稳住） */
      const rules = (typeof diffRules === "function") ? diffRules() : {};
      const mindLocked = !!(rules.mindLock && S.prop.心态 < rules.mindLock);
      const head = mindLocked
        ? `<span style="color:var(--red);font-size:.76rem"> · 心态过低，学习类行动暂不可用</span>` : "";
      /* ★ 体力池：标题不再写「第几次/共几次」，改提示剩余体力 */
      const left = (typeof staminaLeft === "function") ? staminaLeft() : 0;
      const mx = (typeof staminaMax === "function") ? staminaMax() : 100;
      /* ★ v1.4.1：笔报废时给一条常驻横幅，把「学习 / 做题 / 读书做不了」
       * 明说出来 —— 按钮被禁用只靠 title 提示，手机上等于没有。 */
      const gateBanner = (typeof bagRequireWrite === "function" && !bagRequireWrite())
        ? `<div class="gate-banner">✏️ 没有能写字的笔了 —— 学习、做题、读书暂时做不了，去小卖部买一支（铅笔要配橡皮）</div>`
        : "";
      box.innerHTML = `<div class='tag-title'>${slot.icon} ${slotName(slot)} · ${L("act.title")}
        <span class="stam-hint">⏳ ${left}/${mx}</span>${head}</div>${gateBanner}`;
      const grid = document.createElement("div");
      grid.className = "actgrid";
      const LEARN_ACTS = ["study", "quiz", "read"];

      /* 要零花钱：不耗体力，但亲情 <100 每周 1 次、≥100 每周最多 2 次。
       * 次数用完后这个选项直接消失（需求 10）。 */
      const fam = num(S.prop.亲情, 80);
      const allowMax = fam >= 100 ? 2 : 1;
      const allowLeft = allowMax - num(S.allowCount, 0);

      acts.forEach(a => {
        if (a.k === "allowance" && allowLeft <= 0) return;
        const cost = (typeof actStamCost === "function") ? actStamCost(a.k) : 10;
        const afford = (typeof canAfford === "function") ? canAfford(cost) : true;
        const b = document.createElement("button"); b.className = "btn";
        b.innerHTML = `<b>${a.t}</b>${(typeof stamLabel === "function") ? stamLabel(cost) : ""}`;
        b.dataset.actKey = "act." + a.k;      // 记住文案键，切语言时原地改字
        if (mindLocked && LEARN_ACTS.indexOf(a.k) >= 0) {
          b.disabled = true;
          b.title = `心态低于 ${rules.mindLock}，先休息一下`;
        } else if (!afford) {
          b.disabled = true;
          b.title = `时间不足（需要 ${cost}，剩余 ${left}）`;
        } else if (typeof bagGate === "function" && bagGate(a.k)) {
          /* v1.4 D 批（需求 13）：没有能写字的笔，学习/做题/读书不可选。
           * ★ v1.4.1：title 只有鼠标悬停才看得到，手机上等于没提示。
           *   把原因直接写在按钮里，玩家一眼就知道为什么灰了。 */
          b.disabled = true;
          b.title = bagGate(a.k);
          b.innerHTML += `<small class="gate-note">⚠️ 笔用完了，去小卖部买一支</small>`;
        }
        b.onclick = () => takeAction(a.k); grid.appendChild(b);
      });
      box.appendChild(grid);

      /* 🗓️ 周末时间表：自由操作，不耗体力、不占行动 */
      const wkBtn = document.createElement("button");
      wkBtn.className = "btn";
      wkBtn.innerHTML = `<b>🗓️ 周末时间表</b><span class="stamtag free">自由操作</span>`;
      wkBtn.onclick = () => {if (typeof openWeekend === "function") openWeekend();};
      box.appendChild(wkBtn);

      /* ★ 进入下一周：玩家随时可以收手，没用完的体力折算成健康 */
      const endBtn = document.createElement("button");
      endBtn.className = "btn endweek-btn";
      endBtn.innerHTML = `<b>➡️ 进入下一周</b><small>剩余 ${left} 点时间会折算成健康</small>`;
      endBtn.onclick = () => {if (typeof finishWeekWithStamina === "function") finishWeekWithStamina(true);};
      box.appendChild(endBtn);
      // 道具不在这里重复列出 —— 用道具请点顶部「🎒 道具」按钮
      renderHUD();
    }

    /* 周三社团课的行动选项
     * 社团活动只在周三下午发生，这里的选项和平时不一样。 */
    function offerClubActions() {
      const c = CLUB_MAP[S.club];
      const box = document.getElementById("actionPanel");
      const doneN = num(S.actCount, 0), allN = num(S.actQuota, 1);
      const slot = SLOT_MAP[S.slot] || SLOTS[0];
      box.innerHTML = `<div class='tag-title'>${slot.icon} ${slotName(slot)}${allN > 1 ? `（${doneN + 1}/${allN}）` : ""}</div>`;

      const grid = document.createElement("div");
      grid.className = "actgrid";

      const mk = (t, sub, fn, key, subKey, actK) => {
        const b = document.createElement("button");
        b.className = "btn";
        const cost = (typeof actStamCost === "function") ? actStamCost(actK || "club") : 20;
        const tag = (typeof stamLabel === "function") ? stamLabel(cost) : "";
        b.innerHTML = `<b>${t}</b>${sub ? `<br><small>${sub}</small>` : ""}${(sub ? "<br>" : "") + tag}`;
        if (key) b.dataset.actKey = key;
        if (subKey) b.dataset.actSubKey = subKey;
        if (typeof canAfford === "function" && !canAfford(cost)) {
          b.disabled = true; b.title = "时间不足";
        } else if (typeof bagGate === "function" && bagGate(actK || "club")) {
          /* 「不去社团」实际是回教室自习（study），笔没了也不能学 */
          b.disabled = true;
          b.title = bagGate(actK || "club");
          b.innerHTML += `<small class="gate-note">⚠️ 笔用完了，去小卖部买一支</small>`;
        }
        b.onclick = fn;
        grid.appendChild(b);
      };

      mk(`${c ? c.icon : "🎪"} ${L("act.club")}`, c ? TZ(c.n) : "", () => takeAction("club"), "act.club", null, "club");
      /* ★ v1.3：选了「不去社团」，本周就不该再有社团里的任何活动。
       * 以前这里只是走一次普通学习，但通用事件池里仍然可能抽到
       * cond 为「已加入该社团」的社团事件 —— 人没去，故事却发生在社团教室里。
       * 打上 S.clubOff 标记，事件抽取时直接跳过所有 cl_ 开头的事件。 */
      mk(L("act.clubSkip"), L("act.clubSub"), () => {S.clubOff = true; takeAction("study");}, "act.clubSkip", "act.clubSub", "study");
      mk(L("act.clubRest"), L("act.restSub"), () => {S.clubOff = true; takeAction("rest");}, "act.clubRest", "act.restSub", "rest");
      mk(L("act.clubSocial"), L("act.socialSub"), () => {S.clubOff = true; takeAction("social");}, "act.clubSocial", "act.socialSub", "social");

      box.appendChild(grid);
      const wkBtn = document.createElement("button");
      wkBtn.className = "btn";
      wkBtn.innerHTML = `<b>🗓️ 周末时间表</b><span class="stamtag free">自由操作</span>`;
      wkBtn.onclick = () => {if (typeof openWeekend === "function") openWeekend();};
      box.appendChild(wkBtn);
      const endBtn = document.createElement("button");
      endBtn.className = "btn endweek-btn";
      endBtn.innerHTML = `<b>➡️ 进入下一周</b><small>剩余 ${(typeof staminaLeft === "function") ? staminaLeft() : 0} 点时间折算成健康</small>`;
      endBtn.onclick = () => {if (typeof finishWeekWithStamina === "function") finishWeekWithStamina(true);};
      box.appendChild(endBtn);
      renderHUD();
    }

    /* 切换语言后，把行动按钮上的字原地换成新语言
     * （不能重新 offerActions —— 那会重置本周的行动进度） */


    /* 本周可以选几次行动（按学期取配置） */

    function actionQuota() {
      const cfg = GAME_CONFIG.actionsPerWeek;
      const v = cfg[Math.min(cfg.length - 1, Math.max(0, clampNum(S.term, 0, 5)))];
      return Math.max(1, Math.round(num(v, 1)));
    }

    /* 推进到下一个时段（周中 → 周末），返回是否还有时段 */
    function advanceSlot() {
      if (!Array.isArray(S.slotPlan) || !S.slotPlan.length) {
        S.slotPlan = buildWeekSlots(); S.slotIdx = 0; S.slot = S.slotPlan[0];
        S.actQuota = S.slotPlan.length;
        return true;
      }
      S.slotIdx = clampNum(S.slotIdx + 1, 0, S.slotPlan.length - 1);
      if (S.slotIdx >= S.slotPlan.length - 1) S.slotIdx = S.slotPlan.length - 1;
      S.slot = S.slotPlan[S.slotIdx];
      return S.slotIdx < S.slotPlan.length - 1 || S.actCount < S.actQuota;
    }


    /* 一次「本周行动」：结算 → 1 个事件弹窗 → 可能连锁 1~2 个 → 收尾 */

    function takeAction(k) {
      /* 兜底：万一周三社团课 / 节假日等别的入口也调用了学习类行动 */
      const rules0 = (typeof diffRules === "function") ? diffRules() : {};
      if (rules0.mindLock && ["study", "quiz", "read"].indexOf(k) >= 0 && S.prop.心态 < rules0.mindLock) {
        toast(`心态低于 ${rules0.mindLock}，先休息一下`);
        offerActions();
        return;
      }
      /* ★ 文具门禁兜底（v1.4.1）：社团课的「不去社团」、周末安排、
       * 事件指令等入口会直接调 takeAction("study")，不走上面那段
       * 按钮禁用逻辑。以前笔没了照样能学，等于门禁形同虚设。
       * 必须在扣时间之前拦住，且要给玩家看得见的提示。 */
      if (typeof bagGateNotice === "function" && bagGateNotice(k)) return;

      /* ★ 时间池（需求 8）：付不起就不让做。
       * 「做题」特殊 —— 题数要等配置弹窗里选好才知道花多少，
       * 所以由 openQuiz() 在确认后扣，这里先不预扣。 */
      if (k !== "quiz" && typeof canAfford === "function") {
        const cost = actStamCost(k);
        if (!canAfford(cost)) {
          toast(`时间不够了（需要 ${cost}，还剩 ${staminaLeft()}）`);
          offerActions();
          return;
        }
        spendStamina(cost, k);
      }
      /* 要零花钱不耗体力，但占本周的次数额度 */
      if (k === "allowance") {
        S.allowWeek = num(S.week, 0);
        S.allowCount = num(S.allowCount, 0) + 1;
      }
      document.getElementById("actionPanel").innerHTML = "";
      if (k === "read") {openBookCorner(() => afterAction(k)); return;}
      // 「做题」：先弹一道题，答完才算这一周的行动结算完毕
      if (k === "quiz") {openQuiz(() => afterAction(k)); return;}
      // 「运动锻炼」：先结算身体收益，再按概率连锁运动类事件
      if (k === "sport") {sportSettle(() => runSportChain(() => afterAction(k))); return;}
      // 「向父母要零花钱」不产生学力，走单独的结算（弹完再走事件链）
      if (k === "allowance") {allowanceSettle(() => runEventChain(() => afterAction(k))); return;}
      // 「去社团活动」：走社团专属事件（周三社团课）
      if (k === "club") {
        S.actCount = (S.actCount || 0) + 1;
        S.evCntWeek = {};
        S.evCountWeek = 0;
        say(L("flow.clubLog", clubName() || L("flow.club")), "sys");
        renderHUD();
        runClubEvent(() => afterAction(k));
        return;
      }
      studySettle(k);
      say(L("flow.actionLog", (S.actCount || 0) + 1, S.actQuota || 1, actionName(k), Math.round(num(S.score, 0))), "sys");
      S.actCount = (S.actCount || 0) + 1;
      S.evCntWeek = {};
      S.evCountWeek = 0;
      renderHUD();
      runEventChain(() => afterAction(k));
    }

    /* ==================================================================
     * 运动锻炼的连锁事件
     * ------------------------------------------------------------------
     * 运动完之后，按配置概率从 SPORT_EVENTS 里抽 1~2 条运动类事件。
     * 抽不到就安静收尾 —— 运动本身已经给了身体上的收益。
     * ================================================================== */

    function runSportChain(done) {
      const cfg = (GAME_CONFIG && GAME_CONFIG.sport) || {};
      const chances = [num(cfg.chainChance && cfg.chainChance[0], 0.7), num(cfg.chainChance && cfg.chainChance[1], 0.35)];
      if (typeof pickSportEvent !== "function") {done(); return;}

      let i = 0;
      const step = () => {
        if (S.over || i >= chances.length) {done(); return;}
        if ((S.evWeekTotal || 0) >= GAME_CONFIG.maxEventsPerWeek) {done(); return;}
        if (Math.random() >= chances[i]) {done(); return;}
        const ev = pickSportEvent();
        if (!ev) {done(); return;}
        i++;
        S.evCntWeek[ev.id] = true;
        S.evCnt[ev.id] = (S.evCnt[ev.id] || 0) + 1;
        if (!S.evLastWeek) S.evLastWeek = {};
        S.evLastWeek[ev.id] = num(S.week, 0);
        S.evWeekTotal = (S.evWeekTotal || 0) + 1;
        S.evCountWeek = (S.evCountWeek || 0) + 1;
        renderHUD();
        showPopup(defOf(ev, "🏃 运动 · 连锁"), () => showEventResult(step));
      };
      step();
    }

    /* 周三社团课：保证出一个本社团的事件
     * 优先从本社团的事件里挑；实在没有（比如全都冷却中）就走普通事件链。 */
    function runClubEvent(done) {
      const mine = EVENTS.filter(e => e.id && e.id.indexOf("cl_") === 0
        && CLUB_MAP[S.club] && e.id.indexOf("cl_" + S.club) === 0
        && (!e.cond || e.cond(S)) && eventAllowed(e) && !S.evCntWeek[e.id]);
      let ev = null;
      if (mine.length) {
        const total = mine.reduce((a, e) => a + Math.max(0.1, eventWeight(e)), 0);
        let r = Math.random() * total;
        for (const e of mine) {r -= Math.max(0.1, eventWeight(e)); if (r <= 0) {ev = e; break;} }
        if (!ev) ev = mine[0];
      }
      if (!ev) {runEventChain(done); return;}
      S.evCntWeek[ev.id] = true;
      S.evCnt[ev.id] = (S.evCnt[ev.id] || 0) + 1;
      if (!S.evLastWeek) S.evLastWeek = {};
      S.evLastWeek[ev.id] = num(S.week, 0);
      S.evWeekTotal = (S.evWeekTotal || 0) + 1;
      S.evCountWeek = (S.evCountWeek || 0) + 1;
      renderHUD();
      showPopup(defOf(ev, "🎪 社团活动"), () => showEventResult(done));
    }

    /* 行动结束：先结算「破茧」进度，再决定是继续选行动还是结束本周 */

    function afterAction(k) {
      const cont = () => {
        if (S.over) return;
        /* ★ 体力池：还付得起「最便宜的一件事」就继续留在本周，
         * 玩家自己决定何时收手；体力见底则自动收周（剩余折健康）。 */
        if (typeof staminaLeft === "function" && (
            (staminaLeft() > 0 && canAfford(cheapestActionCost())) ||
            (typeof allowanceAvailable === "function" && allowanceAvailable()))) {
          advanceSlot();               // 周中做完 → 进入周末（仍按时段轮转）
          offerActions();
        } else if (typeof finishWeekWithStamina === "function") {
          finishWeekWithStamina(false);
        } else afterWeek();
      };
      /* 顺序：破茧（消负面）→ 蜕变（正面升级）→ 退化（久不练习失去）。
       * 三者都可能弹窗，一次只弹一个，弹完才轮到下一个。 */
      flushCure(() => {
        const afterEvolve = () => {
          if (typeof flushDecay === "function") flushDecay(cont);
          else cont();
        };
        if (typeof flushEvolve === "function") flushEvolve(afterEvolve);
        else afterEvolve();
      });
    }

    /* 事件链：一次只弹一个；保底 1 个，之后按概率连锁，最多 maxChainEvents 个 */

    let resultBase = 0;

    function runEventChain(done) {
      let fired = 0;
      const step = () => {
        if (S.over) return done();
        /* ================================================================
         * v1.5 C 批 · 剧情长链（需求 4）
         * ----------------------------------------------------------------
         * 以前「排队后续事件」和随机事件共用 maxEventsPerWeek=3 的配额，
         * 结果 6 层链最多只能走 3 层就被截掉，后面几层永远见不到。
         *
         * 现在：只要 S.chainQueue 里还有后续，就走【独立通道】
         *   · 不占随机事件配额、不参与连锁概率
         *   · 用 S.chainDepth 计深度，上限 GAME_CONFIG.epicMaxDepth（6）
         *   · 链一断（队列空了）立刻把深度清零，下一条链从头算
         * ================================================================ */
        const queued = Array.isArray(S.chainQueue) && S.chainQueue.length > 0;
        const depthMax = Math.max(1, num(GAME_CONFIG.epicMaxDepth, 6));
        if (queued) {
          if (num(S.chainDepth, 0) >= depthMax) {
            S.chainQueue.length = 0;
            S.chainDepth = 0;
            return done();
          }
        } else {
          S.chainDepth = 0;
          if ((S.evWeekTotal || 0) >= GAME_CONFIG.maxEventsPerWeek) return done();
          const maxHere = Math.max(1, GAME_CONFIG.eventsPerAction) + Math.max(0, GAME_CONFIG.maxChainEvents);
          if (fired >= maxHere) return done();
          // 保底事件放完后，按概率决定是否连锁
          if (fired >= Math.max(1, GAME_CONFIG.eventsPerAction)) {
            const idx = fired - Math.max(1, GAME_CONFIG.eventsPerAction);
            const p = num(GAME_CONFIG.chainChance[idx], 0);
            if (Math.random() >= p) return done();
          }
        }
        const def = buildEventDef();          // 现场挑选（能感知上一条事件带来的变化）
        if (!def) return done();              // 没有可用事件，直接收尾
        fired++;
        if (queued) S.chainDepth = num(S.chainDepth, 0) + 1;
        else {
          S.evCountWeek = (S.evCountWeek || 0) + 1;
          S.evWeekTotal = (S.evWeekTotal || 0) + 1;
        }
        renderHUD();
        showPopup(def, () => showEventResult(step));
      };
      step();
    }

    /* 挑一个随机事件，包装成统一的弹窗定义 */

    /* ==================================================================
     * 单个事件的概率控制
     * ------------------------------------------------------------------
     * 写在事件定义里的可选字段（不写就用全局默认）：
     *   w: 5          基础权重，数字越大越常见
     *   once: true    一生只出现一次
     *   maxTimes: 3   最多出现 3 次，之后永不再出现
     *   decay: 0.5    每出现一次，权重乘以 0.5（0.5 = 减半）
     *   decayFloor: 0.1  衰减到原权重的 10% 就不再降了
     *   minTerm: 4    最早第几学期才出现（0=初一上，4=初三上）
     *   maxTerm: 5    最晚第几学期还会出现
     *
     * 例：
     *   {id: "x", w: 6, once: true,   ...}   // 很常见，但只出现一次
     *   {id: "y", w: 4, decay: 0.3,   ...}   // 出现一次后概率降到三成
     *   {id: "z", w: 5, maxTimes: 2,  ...}   // 最多出现两次
     * ================================================================== */

    /* 全局默认衰减（事件自己没写 decay 时用这个） */

    const EVENT_DECAY_STEP = 0.2;    // 每出现一次衰减 20%
    const EVENT_DECAY_MAX = 3;       // 最多衰减 3 次
    const EVENT_DECAY_FLOOR = 0.4;   // 最低不低于原权重的 40%

    /* 该事件此刻是否还能出现
     * ------------------------------------------------------------------
     * 依次检查：是否进池 → 次数/年级 → 时段 → 季节/月份 → 最小间隔
     * ================================================================== */

    function eventAllowed(e) {
      if (num(e.w, 1) <= 0) return false;              // w:0 = 不走随机池（由固定日程调用）
      /* 本周选了「不去社团」→ 社团教室里发生的事一律不该出现 */
      if (S && S.clubOff && /^cl_/.test(e.id || "")) return false;
      const n = S.evCnt[e.id] || 0;
      if (e.once && n >= 1) return false;
      if (e.maxTimes != null && n >= e.maxTimes) return false;
      if (e.minTerm != null && clampNum(S.term, 0, 9) < e.minTerm) return false;
      if (e.maxTerm != null && clampNum(S.term, 0, 9) > e.maxTerm) return false;

      /* ================================================================
       * v1.5 B 批 · 天赋对事件发生条件的影响（需求 3 / 诊断 §7）
       * ----------------------------------------------------------------
       * 以前事件只能靠 cond 看属性 / 社团 / 计数，天赋完全不参与抽选。
       * 现在内容作者可以直接在数据里写：
       *   needTalent: "过目不忘"        有这个天赋才会出现
       *   needTalent: ["晨型人","晨读书声"]  任意一个即可
       *   noTalent:   "社恐"           有这个天赋就绝不出现
       *   noTalent:   ["高冷","社恐"]  任意一个命中就屏蔽
       * 两者可同时写；needTalentAny:false 时改成「全部都要」。
       *
       * ★ 只影响「会不会抽到」，不影响选项数值 —— 数值表保持单一来源。
       * ★ cond 仍然生效，天赋 gate 是它之前的一层快速过滤。
       * ================================================================ */
      if (typeof Talent !== "undefined" && (e.needTalent || e.noTalent)) {
        const list = v => Array.isArray(v) ? v : (v ? [v] : []);
        const need = list(e.needTalent), no = list(e.noTalent);
        if (no.some(t => Talent.have(t))) return false;
        if (need.length) {
          const hit = e.needTalentAny === false ? need.every(t => Talent.have(t)) : need.some(t => Talent.have(t));
          if (!hit) return false;
        }
      }

      // 时段：周中住校的事不会跑到周末去，反之亦然
      // slot 可以写成单个 "weekday"，也可以写成数组 ["weekday","clubday"]
      const slot = e.slot || "any";
      if (slot !== "any" && S.slot) {
        const arr = Array.isArray(slot) ? slot : [slot];
        if (arr.indexOf(S.slot) < 0) return false;
      }

      // 季节 / 月份
      if (e.season || e.months) {
        const w = weekInfo(S.week, S.term);
        if (e.season) {
          const arr = Array.isArray(e.season) ? e.season : [e.season];
          if (arr.indexOf(w.season) < 0) return false;
        }
        if (e.months) {
          const arr = Array.isArray(e.months) ? e.months : [e.months];
          if (arr.indexOf(w.month) < 0) return false;
        }
      }

      // 最小间隔（让事件均匀地铺开，而不是扎堆）
      const gap = num(e.minGap, num(GAME_CONFIG.eventDist && GAME_CONFIG.eventDist.minGap, 0));
      if (gap > 0 && n > 0) {
        const last = (S.evLastWeek && S.evLastWeek[e.id] != null) ? num(S.evLastWeek[e.id], 0) : null;
        if (last != null && (num(S.week, 0) - last) < gap) return false;
      }
      return true;
    }

    /* 该事件此刻的有效权重
     * ------------------------------------------------------------------
     * dist 决定它「怎么分布在整个游戏里」：
     *   uniform 均匀 —— 距上次出现越久，权重越高（适合社团这类常驻事件）
     *   decay   衰减 —— 每出现一次权重 ×decay（适合一次性强的事件）
     *   front   前期多 —— 游戏前期概率高
     *   back    后期多 —— 游戏后期概率高
     * 另外：被「挂起」的事件（raiseEvent）权重会临时放大
     * ================================================================== */

    function eventWeight(e) {
      const n = S.evCnt[e.id] || 0;
      const w0 = num(e.w, 1);
      const cfg = GAME_CONFIG.eventDist || {};
      const mode = e.dist || cfg.mode || "decay";
      let w = w0;

      if (mode === "uniform") {
        const last = (S.evLastWeek && S.evLastWeek[e.id] != null) ? num(S.evLastWeek[e.id], 0) : null;
        if (last == null) w = w0 * 1.6;                       // 从没出现过 → 优先
        else {
          const gap = Math.max(0, num(S.week, 0) - last);
          const target = Math.max(2, num(e.minGap, 4));
          w = w0 * clampNum(gap / target, 0.15, 1.8);
        }
      } else if (mode === "decay") {
        const d = (e.decay != null) ? e.decay : num(cfg.decay, 0.5);
        const fl = (e.decayFloor != null) ? e.decayFloor : num(cfg.decayFloor, 0.15);
        w = w0 * Math.max(fl, Math.pow(clampNum(d, 0, 1, 0.5), n));
      } else if (mode === "front" || mode === "back") {
        /* v1.5 B 批：以前写死 /150（三年 150 周的旧校历），
         * 现在一学期 20 周共 120 周，front/back 曲线要按本局真实长度算。 */
        const total = Math.max(1, num(GAME_CONFIG.totalWeeks,
          (typeof WEEKS_PER_TERM !== "undefined" && typeof TERMS !== "undefined") ? WEEKS_PER_TERM * TERMS : 120));
        const prog = clampNum(S.week, 0, total) / total;
        w = w0 * (mode === "front"
          ? clampNum(1.4 - prog * 1.2, 0.15, 1.4)
          : clampNum(0.3 + prog * 1.3, 0.3, 1.6));
      }

      w *= pendingMult(e.id);      // 被挂起的后续事件，概率临时放大
      /* ================================================================
       * v1.5 B 批 · 天赋对事件概率的柔和影响
       * ----------------------------------------------------------------
       * needTalent / noTalent 是硬开关（在 eventAllowed 里），适合
       * 「人设上根本说不通」的场景；talentBoost 是不切断内容链的加权：
       *   talentBoost: {"过目不忘": 1.7, "书香门第": 1.6}
       * 有对应天赋时权重乘上倍数，没有也照样能抽到。
       *
       * ★ 竞赛选拔 / 图书角这类【成就计数的唯一来源】必须用 talentBoost，
       *   挂 needTalent 会让没天赋的玩家永远拿不到成就（D 批踩过一次）。
       * ================================================================ */
      if (e.talentBoost && typeof Talent !== "undefined") {
        let mul = 1;
        for (const t in e.talentBoost) if (Talent.have(t)) mul *= num(e.talentBoost[t], 1);
        w *= clampNum(mul, 0.2, 6, 1);
      }
      /* v1.4 D 批：文具袋散落时，「笔不见了」这类事件更容易出现 */
      if (typeof bagEventWeightBoost === "function") w += bagEventWeightBoost(e.id);
      return Math.max(0, w);
    }

    /* 执行一个选项：基础效果 + 条件分支 + 后续安排 */

    function execOption(o) {
      resultBase = S.logs.length;
      /* ★ 不同事件选项消耗不同体力（事件里可写 stam: N，不写用默认值）。
       * 付不起的选项在 defOf() 里就已经禁用，正常不会走到这里。 */
      if (typeof spendStamina === "function") {
        spendStamina(optionStamCost(o), "事件选项");
      }
      runEffectSpec(o.run, S);

      // 条件分支：按顺序判断，命中第一个就执行并停止
      if (Array.isArray(o.branch) && o.branch.length) {
        for (const b of o.branch) {
          const ok = (typeof b.cond === "function") ? !!b.cond(S) : true;
          if (!ok) continue;
          runEffectSpec(b.run, S);
          if (b.say) say(b.say, b.cls || "");
          break;
        }
      }

      // 后续安排
      if (o.flag) setFlag(o.flag, true);
      if (Array.isArray(o.flags)) o.flags.forEach(f => setFlag(f, true));
      if (o.unflag) setFlag(o.unflag, false);
      if (o.raise) {
        const list = Array.isArray(o.raise) ? o.raise : [o.raise];
        list.forEach(r => {
          if (!r || !r.id) return;
          raiseEvent(r.id, r.weeks, r.mult, r.slot);
        });
      }
      if (o.next) {
        if (!Array.isArray(S.chainQueue)) S.chainQueue = [];
        /* v1.5 C 批：next 可以写单个 id，也可以写数组（一层里连着排两段）。
         * 排队顺序即播放顺序；链深度统一由 runEventChain 计。 */
        const nx = Array.isArray(o.next) ? o.next : [o.next];
        nx.filter(Boolean).forEach(id => S.chainQueue.push(id));
      }
      checkAch();
    }

    /* 标记（flag）：让"有没有带手机"这类状态能被后续事件读到 */

    function setFlag(k, v) {
      if (!S.flags) S.flags = {};
      S.flags[k] = !!v;
    }

    function hasFlag(k) {
      return !!(S.flags && S.flags[k]);
    }

    function buildEventDef() {
      if ((S.evWeekTotal || 0) >= GAME_CONFIG.maxEventsPerWeek) return null;

      // 优先弹「排队等着的后续事件」
      if (Array.isArray(S.chainQueue) && S.chainQueue.length) {
        const id = S.chainQueue.shift();
        /* 后续事件也可能在 SCHOOL_EVENTS / SPORT_EVENTS 等子池里，
         * 不只是 EVENTS —— 长链会跨池引用。 */
        const all = EVENTS.concat(
          (typeof SCHOOL_EVENTS !== "undefined") ? SCHOOL_EVENTS : [],
          (typeof SPORT_EVENTS !== "undefined") ? SPORT_EVENTS : [],
          (typeof EPIC_EVENTS !== "undefined") ? EPIC_EVENTS : []);
        let q = all.find(e => e.id === id);
        if (q && (!q.cond || q.cond(S)) && q.opts && q.opts.length) {
          S.evCntWeek[id] = true;
          S.evCnt[id] = (S.evCnt[id] || 0) + 1;
          if (!S.evLastWeek) S.evLastWeek = {};
          S.evLastWeek[id] = num(S.week, 0);
          return defOf(q, q.epic ? "📖 长链 · 后续" : "⚡ 事件 · 后续");
        }
      }

      let pool = EVENTS.filter(e => !e.cond || e.cond(S));
      pool = pool.filter(e => eventAllowed(e));               // 时段/季节/次数/间隔
      pool = pool.filter(e => !S.evCntWeek[e.id]);            // 同一事件每周最多 1 次
      const fresh = pool.filter(e => (S.evCnt[e.id] || 0) < 2);
      if (fresh.length > 0) pool = fresh;                      // 优先没见过的
      if (!pool.length) return null;
      const effW = e => Math.max(0.1, eventWeight(e));
      const total = pool.reduce((s, e) => s + effW(e), 0);
      let r = Math.random() * total, ev = pool[0];
      for (const e of pool) {r -= effW(e); if (r <= 0) {ev = e; break;} }
      S.evCntWeek[ev.id] = true;
      S.evCountWeek++;
      S.evCnt[ev.id] = (S.evCnt[ev.id] || 0) + 1;
      if (!S.evLastWeek) S.evLastWeek = {};
      S.evLastWeek[ev.id] = num(S.week, 0);
      return defOf(ev, "");
    }

    /* 把一个事件定义包装成弹窗定义 */

    function defOf(ev, badge) {
      const slot = SLOT_MAP[S.slot] || SLOTS[0];
      /* 单亲 / 留守家庭：事件里爸爸妈妈的称呼要统一，不能一会妈一会爸。
       * 双亲家庭 famText 原样返回，不做任何改动。 */
      const F = (typeof famText === "function") ? famText : (x => x);
      /* 标题与正文支持写成函数 —— 需要按玩家状态变化时用
       * （例如「初三的学长」对初三玩家不成立，得换成同级同学）。
       * 写字符串的照旧，完全向后兼容。 */
      const body = (typeof ev.c === "function") ? ev.c(S) : ev.c;
      const title = (typeof ev.t === "function") ? ev.t(S) : ev.t;
      return {
        kind: "event",
        title: F(title),
        body: F(body),
        img: ev.img,
        badge: badge || "",
        slotNote: slot.icon + slot.name,
        options: ev.opts.filter(o => true).map(o => {
          const cost = (typeof optionStamCost === "function") ? optionStamCost(o) : 0;
          const tag = (typeof stamLabel === "function") ? stamLabel(cost) : "";
          const sub0 = F(o.sub || "");
          return {
            t: F(o.t),
            sub: (sub0 ? sub0 + "<br>" : "") + tag,
            disabled: !!(o.cond && !o.cond(S)) ||
              (typeof canAfford === "function" && !canAfford(cost)),
            fn: () => {execOption(o);}
          };
        })
      };
    }

    /* 事件结果：同一个弹窗原地变成结果，玩家点「继续」才进下一个 */

    function showEventResult(next) {
      /* ★ v1.4「事事有回应」（需求 9）：反馈弹窗已由 showModal() 的
       * 选项出口统一负责 —— 文本、数值变化、解锁天赋/成就合在一个弹窗里。
       * 这里只负责把控制权交还事件链，不再二次弹窗（否则会连点两次）。 */
      if (typeof next === "function") next();
    }

    /* ==================================================================
     * 「遗憾离场」：压力连续爆表若干周
     * ------------------------------------------------------------------
     * v1.1 起不再"压力一到 100 就崩"，而是给玩家三周的自救窗口：
     *   第 1 周 → 记一笔，日志里提醒
     *   第 2 周 → 黄牌警告（弹窗）
     *   第 3 周 → 遗憾离场
     * 中间任何一周把压力压回阈值以下，计数立刻清零。
     * ================================================================== */

    function burnCfg() {
      const b = (GAME_CONFIG && GAME_CONFIG.burnout) || {};
      return {at: num(b.stressAt, 100), weeks: Math.max(0, num(b.weeks, 3))};
    }

    function checkBurnout(done) {
      const c = burnCfg();
      if (c.weeks <= 0 || !S || S.over) {done(); return;}
      const hot = num(S.prop.压力, 0) >= c.at;

      if (!hot) {S.stressStreak = 0; done(); return;}

      S.stressStreak = num(S.stressStreak, 0) + 1;

      if (S.stressStreak >= c.weeks) {
        S.dead = "压力";
        say(L("burn.over"), "bad");
        gameOver();
        return;
      }

      // 还没到：给一次明确的警告（最后一次警告用弹窗，别让玩家莫名其妙就结束）
      const left = c.weeks - S.stressStreak;
      say(L("burn.warn", S.stressStreak, left), "bad");
      if (left <= 1) {
        showPopup({
          kind: "free",
          badge: L("burn.badge"),
          title: L("burn.warnTitle"),
          body: `<div style="line-height:1.7">${L("burn.warnBody", left)}</div>`,
          options: [{t: L("modal.continue")}]
        }, done);
      } else done();
    }

    /* ==================================================================
     * 亲情过低 → 家庭矛盾
     * ================================================================== */

    function checkFamilyConflict(done) {
      if (typeof shouldFamilyConflict !== "function" || typeof buildFamilyConflict !== "function") {done(); return;}
      if (!shouldFamilyConflict()) {done(); return;}
      say(L("fam.conflictLog"), "bad");
      showPopup(buildFamilyConflict(), done);
    }

    function afterWeek() {
      /* v1.4：四档难度 + 地狱硬规则（健康 < 10 立即结束） */
      const dk = (typeof diffKey === "function") ? diffKey() : "hard";
      const rules = (typeof diffRules === "function") ? diffRules() : {};
      const easy = (typeof isEasyMode === "function") ? isEasyMode() : false;
      const brokeNeed = {easy: 12, normal: 8, hard: 5, hell: 3}[dk] || 8;

      if (S.prop.健康 <= 0 || (rules.hpEnd && S.prop.健康 < rules.hpEnd)) {S.dead = "健康"; return gameOver();}
      if (S.prop.心态 <= 0) {S.dead = "心态"; return gameOver();}
      if (S.prop.经济 <= 0 && S.term >= 2) {count("brokeWeek"); if (S.cnt.brokeWeek >= brokeNeed) {S.dead = "经济"; return gameOver();} }

      weeklySettle();
      if (rules.hpEnd && S.prop.健康 < rules.hpEnd) {S.dead = "健康"; return gameOver();}
      const burst = easy ? 7 : (dk === "hell" ? 20 : 15);
      if (S.prop.压力 >= 100) {modProp("心态", -burst); say(L("flow.stressBurst", burst), "bad");}
      if (S.prop.健康 < 30) say(L("flow.healthWarn"), "bad");
      if (S.prop.心态 < 30) say(L("flow.mindWarn"), "bad");
      if (S.prop.压力 >= 80 && !Talent.have("不吃压力")) {modProp("效率", -3);}
      checkAch();

      if (S.prop.健康 <= 0) {S.dead = "健康"; return gameOver();}
      if (S.prop.心态 <= 0) {S.dead = "心态"; return gameOver();}

      renderHUD();

      // 压力连续爆表 → 遗憾离场（判定要在进下一周之前）
      checkBurnout(() => {
        if (S.over) return;
        // 亲情过低 → 家庭矛盾
        checkFamilyConflict(() => {
          if (S.over) return;
          if (!S.over) {nextWeek();}
        });
      });
    }

    function checkAch() {
      for (const [id, a] of Object.entries(ACHIEVEMENTS)) {
        if (S.ach.includes(id)) continue;
        if (a.c(S)) {
          S.ach.push(id);
          const achTxt = `🏆 达成成就【${a.n}】——${a.d}`;
          say(achTxt, "ach");
          if (typeof fbUnlock === "function") fbUnlock(achTxt, "ach");
          toast(`🏆 成就:${a.n}`, true);
          if (a.unlock) gainTalent(a.unlock, "成就奖励·免费");
        }
      }
    }

    /* ==================================================================
     * v1.3 中考结算
     * ------------------------------------------------------------------
     * 三块分数拼起来才是中考总分（满分 530）：
     *   ① 初三当期科目：语数英(100) + 物(90+实验10) + 化(90+实验10) + 史政(100)
     *   ② 生地：初二下「生地会考」时考完并锁死，之后不再变动
     *   ③ 实验操作：生物 / 物理 / 化学各 10 分，第 14 周的实验考试拿
     * 然后按权重折算：语数英 100%，物 50%，史政 40%，生 40%，地化 30%
     * ================================================================== */
    function zhongkao() {
      count("zhongkao");
      /* 中考考哪几科，按「本局最后一个学期」算，而不是当前已经越界的 S.term。
       * 否则只玩初一的局，会拿初三的科目表去考（科目凭空多出物理化学）。 */
      const last = (typeof endTerm === "function") ? endTerm() : clampNum(S.term, 0, TERMS - 1);
      if (S.term !== last) S.term = last;
      const p = S.prop;
      for (const k in PROP_RANGE) p[k] = fixProp(k, p[k]);
      ensureSubj();
      const diff = difficultyCurve(S.week, S.term);
      const W = examWeights();

      /* 生地：优先用会考锁死的成绩；没参加过会考（例如只玩初三）就用当前学力估 */
      const paperOf = (sub, term4Exam) => {
        const fm = (typeof fullMarkOf === "function") ? fullMarkOf(sub) : 100;
        if (S.hk && typeof S.hk[sub] === "number") return clampNum(S.hk[sub], 0, fm, 0);
        if (typeof examScoreOf === "function" && typeof S.subj[sub] === "number") {
          const t0 = S.term; if (term4Exam != null) S.term = term4Exam;
          const v = examScoreOf(sub, p, diff, W);
          S.term = t0;
          return clampNum((typeof toPaperScore === "function") ? toPaperScore(sub, v) : v, 0, fm, 0);
        }
        return Math.round(fm * 0.6);
      };

      /* 实验操作分（各 10 分，补考也能拿满，但过程要付出代价） */
      const expOf = sub => ((S.exp && typeof S.exp[sub] === "number") ? clampNum(S.exp[sub], 0, 10, 0) : 0);

      const rows = [];
      let total = 0, full = 0;
      const push = (sub, paper, exp, w) => {
        const fm = (typeof fullMarkOf === "function") ? fullMarkOf(sub) : 100;
        const raw = clampNum(paper, 0, fm, 0) + clampNum(exp, 0, 10, 0);   // 卷面 + 实验
        const got = raw * w;                                              // 折算后得分
        const top = (fm + (sub === "生物" || sub === "物理" || sub === "化学" ? 10 : 0)) * w;
        total += got; full += top;
        const pct = top > 0 ? got / top : 0;
        const color = pct >= 0.9 ? "var(--green)" : (pct >= 0.6 ? "var(--gold)" : "var(--red)");
        rows.push(`<div class="subjrow"><span style="width:4.2em">${TZ(sub)}${exp ? `<small style="color:var(--green)">+${exp}</small>` : ""}</span>`
          + `<div class="bar"><i style="width:${Math.round(pct * 100)}%;background:${color}"></i></div>`
          + `<b style="color:${color};width:3.2em;text-align:right">${got.toFixed(1)}</b>`
          + `<small style="width:3.2em;color:var(--dim)">/${Math.round(top)}</small>`
          + `<small style="width:3em;color:var(--dim);text-align:right">${Math.round(w * 100)}%</small></div>`);
      };

      const cur = subjectsOf(S.term) || [];
      for (const sub of cur) {
        if (sub === "生物" || sub === "地理") continue;      // 生地走会考成绩
        const paper = (typeof examScoreOf === "function")
          ? clampNum((typeof toPaperScore === "function") ? toPaperScore(sub, examScoreOf(sub, p, diff, W)) : examScoreOf(sub, p, diff, W), 0, fullMarkOf(sub), 0)
          : 60;
        push(sub, paper, expOf(sub), (typeof ZK_WEIGHT !== "undefined" ? ZK_WEIGHT[sub] : 1) || 1);
      }
      // 生地：会考锁死的成绩（生物再 + 实验 10 分）
      push("生物", paperOf("生物", 3), expOf("生物"), 0.4);
      push("地理", paperOf("地理", 3), 0, 0.3);

      S.zhongkao = Math.round(clampNum(total, 0, full, 0));
      S.zkFull = Math.round(full);
      S.lastExamScore = full > 0 ? Math.round(total / full * 100) : 0;
      say(`🎓 中考总分 ${S.zhongkao} / ${S.zkFull}`, "exam");
      checkAch();
      saveGame(false, true);      // 中考分数算出来就立刻落盘

      /* 成绩单：把折算过程摊开给玩家看 */
      const body = `<div style="line-height:1.62">
        <div style="color:var(--dim);font-size:.82rem">卷面分 + 实验分，再按中考权重折算</div>
        ${rows.join("")}
        <div style="margin-top:8px;text-align:right;color:var(--gold)">中考总分：<b style="font-size:1.2rem">${S.zhongkao}</b> / ${S.zkFull}</div>
      </div>`;
      showModal("🎓 中考成绩单", body, [{t: "查看结局", fn: () => gameOver()}], null, false, false, {kind: "fixed"});
    }

    function gameOver() {
      S.over = true;
      saveGame(false, true);      // 结局也要落盘，否则读档会退回结局前
      const end = ENDINGS.find(e => e.c(S)) || ENDINGS[ENDINGS.length - 1];
      const sc = GAME_CONFIG.school;
      setBackground("end");            // 结局画面切到「立行号」列车背景
      if (typeof clearMood === "function") clearMood();   // 结局不该再被红雾盖住
      renderHUD();
      const talentList = Talent.owned.length ? Talent.owned.map(t => `${TZ(t)}(Lv.${TALENTS[t].lv})`).join("、") : L("end.none");
      const achList = S.ach.length ? S.ach.map(id => TZ(ACHIEVEMENTS[id].n)).join("、") : L("end.none");
      let reasonLine = "";
      if (S.zhongkao < 0) {
        if (S.dead === "健康") reasonLine = L("end.reasonHealth");
        else if (S.dead === "心态") reasonLine = L("end.reasonMind");
        else if (S.dead === "经济") reasonLine = L("end.reasonMoney");
        else if (S.dead === "压力") reasonLine = L("end.reasonStress");
      }
      showModal(L("end.title"),
        `<div class="endcard"><div class="big">${end.icon}</div><h2 style="color:var(--gold)">${TZ(end.n)}</h2><p style="margin-top:6px;line-height:1.62">${TZ(end.t)}</p>
     ${reasonLine ? `<p style="margin-top:5px;color:var(--red);font-weight:bold">${reasonLine}</p>` : ""}
     <p style="margin-top:7px;color:var(--dim);font-size:.9rem">「${sc.motto}」<br>
      <span style="font-size:.82rem">${L("end.arrival", sc.train)}</span></p>
     <p style="margin-top:5px;color:var(--dim)">${L("end.stat", S.week, S.zhongkao < 0 ? "—" : S.zhongkao, Talent.owned.length, S.ach.length, Object.keys(ACHIEVEMENTS).length)}</p>
     <div style="margin-top:7px;font-size:.85rem;color:var(--dim);text-align:left;line-height:1.6">
       <b style="color:var(--purple)">${L("end.talents")}:</b>${talentList}<br>
       <b style="color:#ffb86b">${L("end.ach")}:</b>${achList}
     </div></div>`,
        [{
          t: L("end.back"), fn: () => {setBackground("main"); toStart();}
        }, {t: L("end.restart"), fn: () => {setBackground("main"); newGameAt(slotCur);}}], null, true, false, {kind: "ending"});
    }
