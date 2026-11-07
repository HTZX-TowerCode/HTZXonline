/* ==================================================================
 * 界面层 · 渲染与弹窗
 * ==================================================================
 * 属性面板、天赋面板、行动面板、存档槽、统一弹窗系统。
 * 弹窗分四类：event 事件 / fixed 固定 / free 自由 / ending 结局。
 *
 * 维护等级：界面层（一般不动）
 * ============================================================ */

    function openTalentInfo(name) {
      const t = TALENTS[name];
      if (!t) return;
      const owned = Talent.have(name);
      const lvColor = t.lv >= 6 ? "var(--gold)" : (t.lv >= 4 ? "var(--purple)" : "var(--blue)");
      const incList = t.inc && t.inc.length
        ? t.inc.map(i => `${i} Lv.${TALENTS[i] ? TALENTS[i].lv : "?"}`).join(" · ")
        : "无";

      showModal(L("talent.detail"),
        `<div class="talent-header">
            <span class="talent-name" style="color:${lvColor}">${TZ(name)}</span>
            <span class="talent-lv" style="color:${lvColor}">Lv.${t.lv}</span>
         </div>
         <div class="talent-poem">「${TZ(t.poem) || "——"}」</div>
         <div class="talent-row">
            <div class="talent-section">
               <div class="label">${L("talent.effect")}</div>
               <div class="value">${TZ(t.desc)}</div>
            </div>
            <div class="talent-section">
               <div class="label">${L("talent.status")}</div>
               <div class="value">${owned
          ? `<span style='color:var(--green)'>${L("talent.owned")}</span>`
          : `${L("talent.locked")} · ${TZ(t.hint) || "—"}`}</div>
            </div>
         </div>
         <div class="talent-section inc">
            <div class="label">${L("talent.conflict")}</div>
            <div class="value">${incList}</div>
         </div>`,
        [{t: L("modal.close"), fn: () => { }}], null, false, true);
    }

    /* 天赋图鉴：每个天赋只占一行小卡片，诗句改用 title 悬停显示，
     * 这样 80 个天赋不用拉很长的滚动条。 */

    function openTalentBook() {
      const all = Object.entries(TALENTS);
      const got = all.filter(([n]) => Talent.have(n));
      const lock = all.filter(([n]) => !Talent.have(n));
      let h = `<div style="color:var(--dim);font-size:.8rem;margin-bottom:8px">
        ${L("talent.bookHint", got.length, all.length)}</div>`;
      h += "<div class='talentgrid'>";
      const row = ([name, t], owned) =>
        `<div class="talentitem ${owned ? "c" + t.lv : "lock"}" onclick="openTalentInfo('${name}')" title="${TZ(t.poem) || ""}">
          <b>${owned ? "🏆" : "🔒"} ${TZ(name)}</b><span class="tlv">Lv.${t.lv}</span>
          <div class="tdesc">${TZ(t.desc)}</div>
        </div>`;
      got.sort((a, b) => b[1].lv - a[1].lv).forEach(x => {h += row(x, true);});
      lock.sort((a, b) => a[1].lv - b[1].lv).forEach(x => {h += row(x, false);});
      h += "</div>";
      showModal(L("talent.book"), h, [{t: L("modal.close"), fn: () => { }}], null, false, true);
    }

    /* v1.4 D 批：openShop() / useItem() 已迁到 js/05i-data-stationery.js。
     * 小卖部只卖文具，旧消耗品与「使用道具」流程一起删掉。
     * 千万别在这里再定义一次 openShop —— 本文件在 05i 之后加载，
     * 会把那边的新实现覆盖掉。 */

    const STAT_COLOR = {心态: "#ffb4d1", 经济: "#d9b3ff", 健康: "#7ee0c0", 效率: "#b388ff", 悟性: "#c9a7ff", 社交: "#ffb86b", 压力: "#ff7aa2", 亲情: "#ffd08a"};

    /* ==================================================================
     * 属性面板
    /* ==================================================================
     * 属性面板
     * ------------------------------------------------------------------
     * v1.1 起只显示四项：心态 / 经济 / 健康 / 压力。
     *   经济 —— 显示具体数值（钱本来就该数得清）
     *   其余 —— 只显示「极低 / 较低 / 中 / 较高 / 极高」+ 五格刻度条
     * 效率 / 悟性 / 社交 / 亲情 仍在后台实时计算，但面板上一律不出现。
     * ================================================================== */

    function renderStatPanel() {
      /* v1.4：游戏模式把八项属性全部摊开，其余两档仍是四项 */
      const all = Object.keys(PROP_RANGE);
      const list = all.filter(k => (typeof propVisible === "function") ? propVisible(k) : true);
      let h = "<div class='statgrid'>";
      for (const k of list) {
        const v = fixProp(k, S.prop[k]); S.prop[k] = v;
        h += `<div class="stat compact">${statRowHtml(k, v)}</div>`;
      }
      h += "</div>";
      return h;
    }

    /* 单条属性：给数字还是给档位，由 propShowsNumber() 决定。
     * 经济永远给数字；游戏模式全部给数字；其余给五档文字 + 刻度。 */
    function statRowHtml(k, v) {
      const name = propName(k);
      const color = STAT_COLOR[k] || "var(--gold)";

      if (propShowsNumber(k)) {
        // 经济按 0~300 映射到条长；其余属性 0~150
        const pct = (k === "经济")
          ? clampNum(v / 300 * 100, 0, 100, 0)
          : clampNum(v / 150 * 100, 0, 100, 0);
        return `<div class="stathead"><span>${name}</span><b class="num">${Math.round(v)}</b></div>
          <div class="bar"><i style="width:${pct}%;background:${color}"></i></div>`;
      }

      // 五档文字 + 五格刻度
      const lv = propLevel(v);
      const text = propLevelText(k, v);
      const tone = propPolarity(k) > 0 ? lv : (4 - lv);   // 压力反向配色
      let segs = "";
      for (let i = 0; i < 5; i++) {
        segs += `<i class="${i <= lv ? "on" : ""}"></i>`;
      }
      return `<div class="stathead"><span>${name}</span><b class="lv t${tone}">${text}</b></div>
        <div class="segbar t${tone}">${segs}</div>`;
    }

    /* ==================================================================
     * v1.4 学科常驻面板（仅「游戏」真实度显示）
     * ------------------------------------------------------------------
     * 早期版本删掉过学科分数板块；游戏模式要求「所有数值可见」，
     * 所以这里把当前各科【学力】摊开。真实 / 模拟模式仍只在考试里见分。
     * ================================================================== */
    function renderSubjMini() {
      const box = document.getElementById("subjMini");
      if (!box) return;
      if (typeof realismMode !== "function" || realismMode() !== "game") {
        box.classList.add("hidden"); box.innerHTML = ""; return;
      }
      const subs = (typeof subjectsOf === "function") ? subjectsOf(S.term) : [];
      if (!subs.length) {box.classList.add("hidden"); return;}
      box.classList.remove("hidden");
      box.innerHTML = `<div class="tag-title">📊 学力 <span style="color:var(--dim);font-size:.72rem">游戏模式 · 数值可见</span></div>`
        + `<div class="subjmini">` + subs.map(k => {
          const v = clampNum(S.subj[k], 0, SUBJ_CAP);
          const pct = clampNum(v / 400 * 100, 0, 100, 0);
          return `<div class="sjrow"><span>${TZ(k)}</span><div class="bar"><i style="width:${pct}%;background:${STAT_COLOR[k] || "var(--blue)"}"></i></div><b>${Math.round(v)}</b></div>`;
        }).join("") + `</div>`;
    }

    function renderHUD() {
      if (!S) return;
      /* 四季主题：周推进了，季节配色跟着走（内部只在必要时改，不会每帧重算） */
      if (typeof refreshSeason === "function") refreshSeason(true);
      document.getElementById("hudGrade").textContent = `${S.name}(${genderName(S.gender)}) · ${gradeName()}`;
      /* 体力条统一在下面「本周行动进度」那一格渲染，别在这里提前清空
       * —— 那会把 actNow / actMax 两个 span 一起删掉，后面的渲染会报 null。 */
      /* 周数显示：
       *  · 平时 —— 全局连续周（S.week 从 0 起，显示成第 1~120 周）
       *  · 假期 —— 假期不计入周数，这里改成显示「❄️ 寒假 / 🌞 暑假」，
       *             不再出现「第 N 周」的字样（用户要求：假期隐藏对周的描述） */
      const vacEl = document.getElementById("hudWeekText");
      if (typeof inVacation === "function" && inVacation() && vacEl) {
        const isWin = S.vac.kind === "winter";
        vacEl.textContent = isWin ? "❄️ 寒假" : "🌞 暑假";
        vacEl.classList.add("vac-pill");
      } else if (vacEl) {
        vacEl.textContent = L("hud.week", num(S.week, 0) + 1);
        vacEl.classList.remove("vac-pill");
      }
      const termEl = document.getElementById("hudTerm");
      if (termEl) termEl.textContent = (typeof inVacation === "function" && inVacation()) ? (S.vac.name || "") : termName();
      // 属性栏：按真实度决定显示几项、给数字还是给档位
      setHudHtml("statPanel", renderStatPanel());
      if (typeof renderSubjMini === "function") renderSubjMini();
      /* 顶栏标一下当前真实度与难度，玩家随时知道自己在哪一档 */
      const modePill = document.getElementById("modePill");
      if (modePill && typeof realismMode === "function" && typeof diffKey === "function") {
        const rm = (GAME_CONFIG.REALISM_MODES || []).find(x => x.id === realismMode());
        const df = (GAME_CONFIG.DIFFICULTIES || []).find(x => x.id === diffKey());
        modePill.textContent = `${rm ? rm.name : "真实"} · ${df ? df.name : "困难"}`;
      }
      document.getElementById("talentCount").textContent = Talent.owned.length;
      setHudHtml("talentPanel", Talent.owned.length ?
        [...Talent.owned].sort((a, b) => TALENTS[b].lv - TALENTS[a].lv).map(t => `<span class="badge c${TALENTS[t].lv}" title="${TZ(TALENTS[t].desc)}" onclick="openTalentInfo('${t}')">${TZ(t)} Lv.${TALENTS[t].lv}${cureProgress(t)}</span>`).join("") : `<span style='color:var(--dim)'>${L("hud.noTalent")}</span>`);
      /* v1.4 D 批：这一格改成「文具袋」摘要。点开看详细列表与耐久。 */
      if (typeof bagEnsure === "function") bagEnsure();
      const bagCount = (S.bag && Array.isArray(S.bag.items)) ? S.bag.items.length : 0;
      const bagCap = (S.bag && num(S.bag.cap, 6)) || 6;
      document.getElementById("itemCount").textContent = bagCount;
      const bagScatter = !!(S.bag && S.bag.scattered);
      setHudHtml("itemPanel",
        `<span class="badge" style="cursor:pointer" onclick="openBag()">🎒 文具袋 ${bagCount}/${bagCap}</span>` +
        (bagScatter ? `<span class="badge" style="color:var(--red)">⚠️ 散落</span>` : "") +
        (bagCount ? (S.bag.items.slice(0, 3).map(it => `<span class="badge" title="${TZ((anyDef(it.def)||{}).desc||"")}">${it.icon||"🎒"} ${TZ(it.n)}</span>`).join("")) : `<span style='color:var(--dim)'>${L("hud.noItem")}</span>`));
      document.getElementById("lastExam").textContent = S.lastExamScore || "—";
      const r = S.zhongkao >= 0 ? S.zhongkao : (S.lastExamScore || 0);
      document.getElementById("rankNow").textContent = r ? L("hud.rankVal", Math.max(1, Math.round(clampNum(100 - r, 1, 100)))) : "—";
      // 静态标签（语言切换后要重刷）
      setText("talentLabel", L("hud.talent"));
      setText("talentHint", L("hud.talentHint"));
      setText("itemLabel", "文具袋");
      setText("scoreLabel", L("hud.score"));
      setText("lastExamLabel", L("hud.lastExam"));
      setText("rankLabel", L("hud.rank"));
      setText("actLabel", L("hud.act"));
      setText("evLabel", L("hud.ev"));
      setText("btnShop", "🏪 小卖铺");
      setText("btnTalentBook", L("hud.talentBook"));
      setText("btnAch", L("hud.ach"));
      setText("btnTheme", L("hud.theme"));
      setText("btnSave", L("hud.save"));
      setText("btnHome", L("hud.home"));

      /* v1.4 E 批（需求 20）：顶部状态栏常驻关键资源，跟着 HUD 一起刷 */
      if (typeof updateResPill === "function") updateResPill();
      // 氛围特效：压力红雾 / 心态灰暗 / 健康发虚 / 经济见底
      if (typeof updateMood === "function") updateMood();
      if (typeof moodWhisper === "function") moodWhisper();

      // 本周行动进度 → v1.4 体力池：这一格改画体力条（次数已无意义）
      const ap = document.getElementById("actPill");
      if (ap) {
        ap.style.display = "";
        if (typeof staminaPillHtml === "function") setHudHtml("actPill", staminaPillHtml());
      }

      // 本周事件进度
      const quota = Math.min(num(GAME_CONFIG.maxEventsPerWeek, 4), 8);
      const now = clampNum(S.evWeekTotal, 0, quota);
      const dots = document.getElementById("evDots");
      if (dots) setHudHtml("evDots", quota ? Array.from({length: quota}, (_, i) => `<span class="dot${i < now ? " on" : ""}"></span>`).join("") : "");
      const pill = document.getElementById("evPill");
      if (pill) pill.style.display = quota ? "" : "none";

      // 顶栏：时间（月份 + 季节 + 时段）与社团
      const tp = document.getElementById("hudTime");
      if (tp && typeof nowTimeText === "function") tp.textContent = nowTimeText();
      const cp = document.getElementById("clubPill");
      if (cp) {
        const cn = (typeof clubName === "function") ? clubName() : "";
        cp.classList.toggle("hidden", !cn);
        document.getElementById("hudClub").textContent = cn || "—";
      }

      // 弹窗处理中：暂时锁住自由面板，避免弹窗互相覆盖
      ["btnShop", "btnTalentBook", "btnAch"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {el.disabled = popupBusy; el.classList.toggle("busy-lock", popupBusy);}
      });
      setTimeout(ensureActionPanel, 0);
    }

    function renderSlots() {
      const a = loadSaves(), box = document.getElementById("slotList"); box.innerHTML = "";
      a.forEach((d, i) => {
        const el = document.createElement("div"); el.className = "slot";
        if (d && d.__future) {
          /* v1.5 A 批：来自更新版本的档只读不写。这里绝不能碰
           * d.ach / d.zhongkao 等字段 —— 新版本的结构我们不知道。 */
          el.innerHTML = `<div class="info"><b>${L("save.slot", i + 1)} · ${d.name || L("save.anon")}</b><br><span style='color:var(--red)'>${L("save.future", d.__future)}</span></div>
      <div><button class="btn" onclick="delSave(${i})">${L("save.delete")}</button></div>`;
        } else if (d) {
          // 自动存档时记下是哪一周，主菜单能显示"已存到第 N 周"，玩家知道进度被记住了
          const autoTag = (d.auto && d.autoWeek != null) ? ` · <span style='color:var(--green)'>${L("save.auto")} ${L("hud.week", d.autoWeek)}</span>` : "";
          const suspect = d.__suspect ? `<span style='color:var(--red)'>${L("save.suspect")}</span> · ` : "";
          const migrated = d.migratedFrom ? `<span style='color:var(--dim)'>${L("save.migrated", d.migratedFrom)}</span> · ` : "";
          const achN = Array.isArray(d.ach) ? d.ach.length : 0;
          el.innerHTML = `<div class="info"><b>${L("save.slot", i + 1)} · ${d.name || L("save.anon")}(${genderName(d.gender)})</b> · ${L("grade." + (Math.min(2, Math.floor(d.term / 2)) + 1))} ${L("hud.week", d.week)}${d.over ? ` · <span style='color:var(--red)'>${L("save.over")}</span>` : ""}${autoTag}<br>${suspect}${migrated}${L("save.info", d.zhongkao < 0 ? "—" : d.zhongkao, achN, d.time)}</div>
      <div><button class="btn green" onclick="resumeGame(${i})">${L("save.resume")}</button><button class="btn" onclick="if(confirm('${L("save.confirmOver")}'))newGameAt(${i})">${L("save.restart")}</button><button class="btn" onclick="delSave(${i})">${L("save.delete")}</button></div>`;
        } else {
          el.innerHTML = `<div class="info"><b>${L("save.slot", i + 1)}</b> · ${L("save.empty")}</div><div><button class="btn primary" onclick="newGameAt(${i})">${L("save.new")}</button></div>`;
        }
        box.appendChild(el);
      });
    }

    function delSave(i) {if (!confirm(L("save.confirmDel"))) return; const a = loadSaves(); a[i] = null; writeSaves(a); renderSlots();}

    /* ------------------------------------------------------------------
     * 统一弹窗层：一切「需要玩家点击选择」的界面都是弹窗，弹窗就是事件
     *   kind 说明：
     *     event  随机事件 —— 消耗本周行动额度
     *     fixed  固定事件 —— 开学/考试/运动会/假期副本
     *     free   自由操作 —— 小卖铺/道具/读书角/图鉴/成就，不消耗任何额度
     *     ending 结局
     * 同一时刻只会有一个弹窗，处理完才排下一个（避免弹窗互相覆盖）
     * ------------------------------------------------------------------ */

    let popupBusy = false;

    function badgeText(kind) {
      if (!S) return "";
      if (kind === "event") return L("badge.event", clampNum(S.evWeekTotal, 0, 99), GAME_CONFIG.maxEventsPerWeek);
      if (kind === "fixed") return L("badge.fixed");
      if (kind === "free") return L("badge.free");
      if (kind === "ending") return L("badge.ending");
      return "";
    }

    function hideModalRaw() {
      const m = document.getElementById("modalMask");
      m.classList.add("hidden");
      m.classList.remove("gmk-standalone");
    }

    /* 把换行转成 <br>，但只转「真正在文字中间」的那些换行。
     *
     * 规则（逐字符扫描，跟踪是否处在 <...> 标签内部）：
     *   ① 标签内部的换行 —— 原样保留，绝不转换（转了就毁标签）
     *   ② 标签之间、元素之间的换行 —— 直接丢掉（那是 HTML 源码排版）
     *   ③ 文字与文字之间的换行 —— 转成 <br>（这是文案作者真实的换行）
     */
    function nl2br(src) {
      if (typeof src !== "string") return src;
      if (!src.includes("\n")) return src;
      let out = "", inTag = false;
      for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (c === "<") {inTag = true; out += c; continue;}
        if (c === ">") {inTag = false; out += c; continue;}
        if (c !== "\n") {out += c; continue;}
        if (inTag) {out += c; continue;}          // ① 标签内：保留
        // 前后跳过空白，看紧邻的是什么
        let j = i - 1; while (j >= 0 && /[ \t\r]/.test(src[j])) j--;
        let k = i + 1; while (k < src.length && /[ \t\r]/.test(src[k])) k++;
        const prev = j >= 0 ? src[j] : "";
        const next = k < src.length ? src[k] : "";
        // ② 挨着标签边界（或开头/结尾）的换行：丢掉
        if (prev === ">" || next === "<" || prev === "" || next === "") continue;
        out += "<br>";                            // ③ 文字中间：转 <br>
      }
      return out;
    }

    function showModal(title, body, opts, onClose, lock, showClose, meta) {
      const m = document.getElementById("modalMask");
      const modalEl = document.getElementById("modalBox") || m.querySelector(".modal");
      const kind = (meta && meta.kind) || "free";
      /* 主菜单纯玩的小游戏：遮罩压到几乎不透明，背后主菜单不再透出来，
       * 屏幕里只剩这一局棋。每次 showModal 重设，关掉时 hideModalRaw 清掉。 */
      m.classList.toggle("gmk-standalone", !!(meta && meta.standalone));
      /* ★ v1.4 E 批：把 onClose 存在遮罩上，让「选项里再开的小游戏」
       * 能接住事件链的下一条（见 20-minigames.js）。
       * 不存的话，棋盘结束时玩家点完就卡住，事件链断了。 */
      m._onClose = (typeof onClose === "function") ? onClose : null;
      popupBusy = true;
      m.classList.remove("hidden");
      modalEl.classList.remove("k-event", "k-fixed", "k-ending", "k-free");
      modalEl.classList.add("k-" + kind);
      if (title === L("talent.detail")) modalEl.classList.add("talent-modal");
      else modalEl.classList.remove("talent-modal");
      document.getElementById("modalTitle").textContent = title === L("talent.detail") ? "" : title;

      const badge = document.getElementById("modalBadge");
      const bt = (meta && meta.badge) || badgeText(kind);
      if (bt) {badge.textContent = bt; badge.className = "pop-badge k-" + kind; badge.style.display = "";}
      else badge.style.display = "none";

      const media = document.getElementById("modalMedia");
      if (media) {
        // 配图总开关关掉时，弹窗里也不显示任何图片
        if (meta && meta.img && (typeof photosOn === "function" ? photosOn() : true)) {
          media.innerHTML = `<img src="${meta.img}" alt="" onerror="this.parentNode.style.display='none'">`;
          media.style.display = "";
        } else {media.innerHTML = ""; media.style.display = "none";}
      }

      const closeX = document.getElementById("modalCloseX");
      if (showClose) closeX.style.display = ""; else closeX.style.display = "none";
      closeX.onclick = () => closeModal(onClose);

      const b = document.getElementById("modalBody");
      /* 正文里的手动换行（事件文案常写 \n）要变成 <br>。
       * 以前靠弹窗整体的 white-space:pre-wrap 兜着 —— 但那样会把
       * 模板字符串里的缩进换行也一起渲染出来，窗口凭空长出一大截空行。
       *
       * 现在用 nl2br() 精确处理：只有「夹在真实文字之间」的换行才转 <br>，
       * 标签内部的换行（模板字符串为了好看做的缩进）必须原样保留 ——
       * 否则 <button ...\n style="..."> 会在标签中间被插入 <br>，
       * 标签结构被破坏，属性内容会直接显示成文字（曾经让主题卡片上
       * 出现一整串 style="--c1:#8a2b9c;..." 的代码块）。 */
      const html = nl2br(body);
      if (typeof html === "string" && html.includes("<")) b.innerHTML = html; else b.textContent = html;
      const ob = document.getElementById("modalOpts"); ob.innerHTML = "";
      const list = opts || [{t: L("modal.continue"), fn: () => { }}];
      let anyEnabled = false;
      list.forEach(o => {
        const btn = document.createElement("button"); btn.className = "btn primary optbtn";
        btn.innerHTML = o.sub ? `<b>${o.t}</b><br><small>${o.sub}</small>` : `<b>${o.t}</b>`;
        const dis = typeof o.disabled === "function" ? o.disabled(S) : o.disabled;
        if (dis) btn.disabled = true; else anyEnabled = true;
        btn.onclick = () => {
          /* ★ v1.4「事事有回应」（需求 9）：这里是所有弹窗选项的唯一出口。
           * 点击前开一次捕获（属性快照 + 日志游标），选项执行完后把
           * 「事件文本 + 数值变化 + 期间解锁的天赋/成就 + 体力消耗」
           * 合成一个反馈弹窗，玩家点确认才继续。
           *   · kind:"feedback" 是反馈窗自己，不再自捕获
           *   · meta.feedback:false 用于成绩单 / 做题结果 / 纯查看类，
           *     它们自带完整内容，不必再套一层。 */
          const noFb = !!(meta && (meta.kind === "feedback" || meta.feedback === false));
          const cap = !noFb && typeof fbBegin === "function" && !!S;
          if (cap) fbBegin(o.t || "");
          popupBusy = false;              // 先释放当前弹窗
          o.fn && o.fn(S);                // 若它内部又开了新弹窗，popupBusy 会重新变 true
          if (!popupBusy) {               // 没有新弹窗 → 收尾并交还控制权
            const f = cap && typeof fbCollect === "function" ? fbCollect() : null;
            hideModalRaw();
            if (f && typeof fbHasContent === "function" && fbHasContent(f)) {
              fbShow(f, () => {setTimeout(ensureActionPanel, 0); onClose && onClose();});
            } else {
              setTimeout(ensureActionPanel, 0);
              onClose && onClose();
            }
          }
          /* 选项内部又开了子弹窗：这次不弹反馈，FB_STATE 留着，
           * 子弹窗点击时 fbBegin() 会把未展示的解锁继承过去，不丢信息。 */
          renderHUD();
        };
        ob.appendChild(btn);
      });
      if (!anyEnabled) {
        const btn = document.createElement("button"); btn.className = "btn primary optbtn";
        btn.textContent = L("modal.continue");
        btn.onclick = () => closeModal(onClose);
        ob.appendChild(btn);
      }
      m._lock = lock;

      // 内容区滚动提示：没滚到底就在底部加一道渐隐
      setupScrollFade(document.getElementById("modalBody"));
    }

    /* 滚动提示：给可滚动的内容区挂上/摘掉渐隐
     * 滚动条被隐藏之后，玩家需要知道"下面还有内容"。 */
    function setupScrollFade(el) {
      if (!el) return;
      const update = () => {
        const room = el.scrollHeight - el.clientHeight;
        const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
        el.classList.toggle("fade", room > 4 && !atEnd);
        el.classList.toggle("at-end", room <= 4 || atEnd);
      };
      el.onscroll = update;
      // 内容刚塞进去时尺寸还没算出来，下一帧再量一次
      update();
      setTimeout(update, 0);
      setTimeout(update, 120);
    }

    function closeModal(onClose) {
      /* X 按钮 / ESC 关闭时，丢掉还没用上的捕获，别污染下一次弹窗 */
      if (typeof fbCollect === "function") fbCollect();
      hideModalRaw();
      popupBusy = false;
      setTimeout(ensureActionPanel, 0);
      renderHUD();
      onClose && onClose();
    }

    /* 语义化入口：def = {kind, title, body, img, options:[{t,sub,disabled,fn}], showClose, lock} */

    function showPopup(def, onResolve) {
      showModal(def.title, def.body, def.options, () => onResolve && onResolve(),
        def.lock, def.showClose, {kind: def.kind || "free", img: def.img, badge: def.badge});
      /* 选项里带 id 的（如旅游地图的「出发」按钮）：
       * 先按 id 挂到按钮上，再执行 afterRender ——
       * 顺序不能反，否则 afterRender 里按 id 取按钮时取不到，禁用状态就设不上。 */
      if (def.options) {
        def.options.forEach((o, i) => {
          if (!o.id) return;
          const bs = document.querySelectorAll("#modalOpts button");
          if (bs[i]) bs[i].id = o.id;
        });
      }
      /* afterRender：弹窗已经画到页面上之后再执行的回调。
       * 旅游地图要靠它给景点按钮挂点击事件 —— 元素得先存在才能挂。 */
      if (typeof def.afterRender === "function") {
        try {def.afterRender();} catch (e) {console.warn("afterRender:", e);}
      }
    }

    /* ==================================================================
     * 做题（本周行动）
     * ------------------------------------------------------------------
     * 消耗一次行动，出一道「当前年级 + 当前科目」范围内的题。
     * 答对：该科学力加成（随年级放大），心态小涨
     * 答错：该科小幅倒扣，压力小涨 —— 做错题也是有代价的
     * 题库见 js/05d-data-quiz.js 的 QUIZ_BANK。
     * ================================================================== */

    /* ==================================================================
     * 做题（本周行动）· v1.4 需求 11
     * ------------------------------------------------------------------
     * 先在配置窗里选「科目 + 1~5 道」，再逐题作答，最后给一张汇总。
     *   · 科目只在「本年级真正开设」的科目里给（quizSubjectsAvailable）
     *   · 题目 g ≤ 当前年级，不会超纲
     *   · 体力 = 8 + 7×题数（quizStamCost），付不起的题数直接禁用
     *   · 答对本科目加学力，答错扣三成半；题量越大，总收益与总代价都越大
     * 所有弹窗标 feedback:false —— 它们自带结果/讲解/汇总，不再套一层反馈窗。
     * ================================================================== */

    function openQuiz(done) {
      /* 做题必须能写字。笔报废后不能绕过行动面板直接进配置窗。 */
      if (typeof bagGate === "function" && bagGate("quiz")) {
        if (typeof toast === "function") toast("✏️ 没有能写字的笔了，做不了题 —— 去小卖部买一支");
        if (typeof offerActions === "function") offerActions();
        return;
      }
      const subs = (typeof quizSubjectsAvailable === "function") ? quizSubjectsAvailable() : [];

      // 该年级一道题都抽不出：退化成一次普通学习，不浪费行动
      if (!subs.length) {
        say(L("quiz.none"), "sys");
        studySettle("quiz");
        S.actCount = (S.actCount || 0) + 1;
        S.didQuizWeek = num(S.week, 0);
        count("quiz");
        renderHUD();
        if (typeof done === "function") done();
        return;
      }

      const cfg = {sub: subs[rnd(subs.length)], n: 1};
      const meta = {kind: "free", badge: "✏️ 做题", feedback: false};
      const stamOf = n => (typeof quizStamCost === "function") ? quizStamCost(n) : (8 + 7 * n);
      const poolN = sub => {
        const g = clamp(Math.floor(clampNum(S.term, 0, 9, 0) / 2), 0, 2);
        const bank = (QUIZ_BANK[sub] || []).filter(x => num(x.g, 0) <= g);
        return bank.length;
      };

      const bodyHtml = () => {
        const left = (typeof staminaLeft === "function") ? staminaLeft() : 999;
        let h = `<div class="quizcfg"><div class="qcfg-label">选科目（本年级开设的才列出来）</div><div class="qcfg-row">`;
        subs.forEach(s2 => {
          h += `<button type="button" class="namechip${cfg.sub === s2 ? " sel" : ""}" data-qsub="${s2}">${TZ(s2)}<small style="opacity:.65"> ${poolN(s2)} 题</small></button>`;
        });
        h += `</div><div class="qcfg-label">做几道（读题越久，耗的时间越多）</div><div class="qcfg-row">`;
        for (let n = 1; n <= 5; n++) {
          const c = stamOf(n), afford = (typeof canAfford === "function") ? canAfford(c) : true;
          h += `<button type="button" class="namechip${cfg.n === n ? " sel" : ""}" data-qn="${n}" ${afford ? "" : "disabled style='opacity:.4'"} title="时间 −${c}">${n} 道 <small style="opacity:.65">⚡${c}</small></button>`;
        }
        h += `</div><div class="create-note">当前剩余时间 <b>${left}</b>。本次共 <b>${cfg.n}</b> 道 ${TZ(cfg.sub)}，消耗时间 <b>${stamOf(cfg.n)}</b>；剩余时间会在周末折算成健康。</div></div>`;
        return h;
      };

      const bind = () => {
        const box = document.getElementById("quizCfgBody");
        if (!box) return;
        box.querySelectorAll("button[data-qsub]").forEach(b => {
          b.onclick = () => {cfg.sub = b.dataset.qsub; box.innerHTML = bodyHtml(); bind();};
        });
        box.querySelectorAll("button[data-qn]").forEach(b => {
          b.onclick = () => {
            cfg.n = clampNum(parseInt(b.dataset.qn, 10), 1, 5, 1);
            box.innerHTML = bodyHtml(); bind();
          };
        });
      };

      showPopup({
        kind: "free", badge: "✏️ 做题 · 配置", title: "今晚做哪几道",
        body: `<div id="quizCfgBody">${bodyHtml()}</div>`,
        options: [
          {
            t: "开始做题 →",
            fn: () => {
              const qs = (typeof pickQuizOf === "function") ? pickQuizOf(cfg.sub, cfg.n) : [];
              if (!qs.length) {toast("这个科目当前年级没有合适的题，换一科试试。"); return;}
              if (typeof spendStamina === "function") spendStamina(stamOf(qs.length), "做题");
              runQuizSeries(qs, 0, [], done, meta);
            }
          },
          {t: "算了，返回"}
        ],
        afterRender: bind
      }, () => {if (typeof offerActions === "function") offerActions();});
    }

    /* 逐题作答：一次一题，答完显示讲解再进下一题，最后给汇总 */
    function runQuizSeries(qs, idx, results, done, meta) {
      if (idx >= qs.length) {quizSummary(qs, results, done, meta); return;}
      const q = qs[idx];
      const grad = clamp(Math.floor(clampNum(S.term, 0, 9, 0) / 2), 0, 2);
      const bonus = Math.round(14 + grad * 8);          // 初一 14 → 初三 30
      const penalty = -Math.max(4, Math.round(bonus * 0.35));

      const nextAfterResult = (ok) => {
        results.push({q, ok, delta: ok ? bonus : penalty});
        const whyLine = q.why ? `<div style="margin-top:5px;color:var(--dim);font-size:.85rem">${L("quiz.why")} ${q.why}</div>` : "";
        const tail = `<div style="margin-top:8px;color:var(--dim);font-size:.85rem">第 ${idx + 1} / ${qs.length} 题</div>`;
        showModal("这一题", `<div style="line-height:1.62">
          <div>${q.q}</div>
          <div style="margin-top:5px;color:${ok ? "var(--green)" : "var(--red)"}">${ok ? L("quiz.correct") : L("quiz.incorrect")}</div>
          <div style="margin-top:4px">${L("quiz.answer")} <b>${q.type === "choice" ? q.opts[q.ansIndex] : q.ans}</b></div>
          ${whyLine}${tail}</div>`,
          [{t: idx + 1 < qs.length ? "下一题 →" : "看看总成绩"}],
          () => {runQuizSeries(qs, idx + 1, results, done, meta);},
          false, false, meta);
      };

      if (q.type === "choice") {
        const opts = q.opts.map((o, i) => ({
          t: o,
          fn: () => {
            const ok = (i === q.ansIndex);
            if (ok) {modProp("心态", 2); say(L("quiz.right", TZ(q.sub), bonus), "good");}
            else {modProp("心态", -1); modProp("压力", 1); say(L("quiz.wrong", TZ(q.sub), Math.abs(penalty)), "bad");}
            nextAfterResult(ok);
          }
        }));
        showModal(L("quiz.title", TZ(q.sub)), `<div style="line-height:1.62">${q.q}</div>
          <div style="margin-top:6px;color:var(--dim);font-size:.82rem">${L("quiz.tip")}　·　第 ${idx + 1}/${qs.length} 题</div>`,
          opts, null, false, false, meta);
        return;
      }

      // 填空题
      const bodyHtml = `<div style="line-height:1.62">${q.q}</div>
        <div style="margin-top:5px"><input id="quizInput" type="text" autocomplete="off" placeholder="${L("quiz.placeholder")}"
          style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--line);background:var(--panel2);color:var(--txt);font-size:.95rem"></div>
        <div style="margin-top:6px;color:var(--dim);font-size:.82rem">${L("quiz.fillTip")}　·　第 ${idx + 1}/${qs.length} 题</div>`;
      showModal(L("quiz.title", TZ(q.sub)), bodyHtml, [
        {t: L("quiz.submit"), fn: () => {
          const el = document.getElementById("quizInput");
          const val = el ? el.value : "";
          const ok = (typeof quizMatch === "function") ? quizMatch(val, q.ans) : false;
          if (ok) {modProp("心态", 2); say(L("quiz.right", TZ(q.sub), bonus), "good");}
          else {modProp("心态", -1); modProp("压力", 1); say(L("quiz.wrong", TZ(q.sub), Math.abs(penalty)), "bad");}
          nextAfterResult(ok);
        }},
        {t: L("quiz.giveup"), fn: () => {
          say(L("quiz.giveupLog", TZ(q.sub)), "sys");
          nextAfterResult(false);
        }}
      ], null, false, false, meta);

      setTimeout(() => {
        const el = document.getElementById("quizInput");
        if (!el) return;
        el.focus();
        el.onkeydown = (e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          const btn = document.querySelector("#modalOpts button");
          if (btn && !btn.disabled) btn.click();
        };
      }, 60);
    }

    /* 汇总：把学力变化一次性结算，再交还行动链 */
    function quizSummary(qs, results, done, meta) {
      const right = results.filter(r => r.ok).length;
      const bySub = {};
      results.forEach(r => {
        bySub[r.q.sub] = num(bySub[r.q.sub], 0) + r.delta;
      });
      Object.keys(bySub).forEach(sub => {
        S.subj[sub] = clamp(num(S.subj[sub], 30) + bySub[sub], 0, SUBJ_CAP);
      });
      recalcScore();
      S.actCount = (S.actCount || 0) + 1;
      S.didQuizWeek = num(S.week, 0);
      S.didStudyWeek = num(S.week, 0);      // 做题也算碰过学习，避免天赋退化
      /* v1.4 D 批：做题按题数磨损笔与袋身 */
      if (typeof bagWear === "function") {
        bagWear("write", qs.length * num((typeof BAG_RULES !== "undefined" ? BAG_RULES.wearPerQuiz : 1), 1), "做题");
        bagWearBag(1);
      }
      count("quiz");
      renderHUD();

      const chips = Object.keys(bySub).map(sub =>
        `<span class="fb-chip ${bySub[sub] >= 0 ? "good" : "bad"}">${TZ(sub)} ${bySub[sub] >= 0 ? "+" : ""}${bySub[sub]}</span>`
      ).join("");
      const verdict = right === qs.length ? "全对。这一晚没白坐。"
        : (right === 0 ? "一道没对，但错题比空着强。" : `对了 ${right} 道，错的那些正好是下周该补的。`);
      showModal("做完了", `<div style="line-height:1.62">
        <div>共 <b>${qs.length}</b> 道 ${TZ(qs[0].sub)}，答对 <b style="color:var(--green)">${right}</b> 道。</div>
        <div style="margin-top:6px;color:var(--dim)">${verdict}</div>
        <div class="fb-chips" style="margin-top:9px">${chips}</div></div>`,
        [{t: "收好卷子"}], () => {if (typeof done === "function") done();},
        false, false, meta);
    }

    function toast(t, isAch) {
      const d = document.createElement("div");
      d.className = "toast" + (isAch ? " ach-toast" : "");
      d.textContent = t;
      document.getElementById("toastBox").appendChild(d);
      setTimeout(() => d.remove(), 2600);
    }

    function openAch() {
      let h = "<div class='achlist'>";
      for (const [id, a] of Object.entries(ACHIEVEMENTS)) {
        const got = S && S.ach.includes(id);
        h += `<div class="achitem ${got ? "" : "lock"}"><b>${got ? "🏆" : "🔒"} ${TZ(a.n)}</b><br><span style="color:var(--dim)">${TZ(a.d)}</span></div>`;
      }
      showModal(L("ach.title"), h + "</div>", [{t: L("modal.close"), fn: () => { }}], null, false, true, {kind: "free"});
    }

    function toStart() {
      saveGame(false);
      if (typeof setBackground === "function") setBackground("main");
      if (typeof clearMood === "function") clearMood();   // 主菜单不该带着红雾
      document.getElementById("gameScreen").classList.add("hidden");
      document.getElementById("startScreen").classList.remove("hidden");
      renderSlots();
      if (typeof renderStartExtras === "function") renderStartExtras();
    }
