/* ==================================================================
 * 内容层 + 引擎层 · 周末时间表（需求 12）
 * ------------------------------------------------------------------
 * 参考 liuenyin/recallbj8z 的周计划：
 *   · 只排周末（周六上午/下午、周日上午/下午），工作日不碰
 *   · 打开时自动带入上次保存的安排
 *   · 可以「清空安排」重排，也可以「恢复上次」撤回本次调整
 *   · 体力付不起的活动在下拉里标灰；结算时付不起的段会跳过并写明原因
 *   · 「保存安排」留到下周继续用
 *   · 收周时显示 完成 N 段 / 跳过 M 段 / 主要属性净变化，
 *     展开可看每个时间段的结果与跳过原因
 *   · 不同时间段对不同类型的安排有额外收益（"根据时间安排获得收益"）
 *
 * ★ 想加活动：往 WEEKEND_ACTS 里加一条即可，run 用中文指令，
 *   语法见 content/templates.md。数值都在这个文件顶部，不用碰引擎。
 *
 * 维护等级：内容层（数值随便改）/ 引擎层（函数别乱动）
 * ================================================================== */

    const WEEKEND_SLOTS = [
      {id: "sat_am", name: "周六上午", icon: "🌤️", boost: "study", boostTxt: "上午脑子最清楚，学习类安排多一点收成。"},
      {id: "sat_pm", name: "周六下午", icon: "☀️", boost: "social", boostTxt: "下午适合出门，和人打交道的安排更划算。"},
      {id: "sun_am", name: "周日上午", icon: "🍃", boost: "rest", boostTxt: "周日上午慢一点，休息类安排恢复得更好。"},
      {id: "sun_pm", name: "周日下午", icon: "🌇", boost: "study", boostTxt: "收心的半天，整理和复盘格外有效。"}
    ];

    /* kind 用于时段加成与地狱难度的「每周学习型安排上限」 */
    const WEEKEND_ACTS = [
      {id: "selfstudy", name: "📖 自习补弱", kind: "study", stam: 16,
        brief: "最弱一科学力 +18，效率 +2，压力 +3",
        run: ["学力 最弱 +18", "效率 +2", "压力 +3", "计数 学习", "提示 你把最弱那科摊开，一道一道啃到了天黑。!good"]},
      {id: "drill", name: "✏️ 刷一套卷子", kind: "study", stam: 20,
        brief: "全科 +1.5%，压力 +5，健康 −2",
        run: ["全科 +1.5%", "压力 +5", "健康 -2", "计数 学习", "提示 一整套管下来，手腕有点酸，但心里有底了。"]},
      {id: "readbook", name: "📚 看课外书", kind: "rest", stam: 10,
        brief: "悟性 +3，心态 +3",
        run: ["悟性 +3", "心态 +3", "计数 读书", "提示 书是上周从图书角借的，读到最后一页才想起来吃饭。!good"]},
      {id: "sleep", name: "😴 补个长觉", kind: "rest", stam: 6,
        brief: "健康 +9，压力 −7，效率 +1",
        run: ["健康 +9", "压力 -7", "效率 +1", "提示 醒来天已经暗了，但整个人是轻的。!good"]},
      {id: "exercise", name: "🏃 去操场跑跑", kind: "rest", stam: 18,
        brief: "健康 +8，压力 −8，心态 +4，计一次运动",
        run: ["健康 +8", "压力 -8", "心态 +4", "计数 运动", "提示 空操场只有风声，跑完三圈，什么都没想。!good"]},
      {id: "friends", name: "🧋 和同学出去", kind: "social", stam: 14,
        brief: "社交 +8，心态 +5，压力 −4，经济 −6",
        run: ["社交 +8", "心态 +5", "压力 -4", "经济 -6", "计数 社交", "提示 一杯奶茶聊了两小时，回去路上天已经黑了。!good"]},
      {id: "family", name: "🍚 帮家里做饭", kind: "social", stam: 10,
        brief: "亲情 +7，心态 +3，效率 −1",
        run: ["亲情 +7", "心态 +3", "效率 -1", "提示 你切菜，爸妈在旁边说话，厨房里全是热气。!good"]},
      {id: "online", name: "💻 上网查资料", kind: "study", stam: 8,
        brief: "悟性 +2，效率 +2，压力 +2",
        run: ["悟性 +2", "效率 +2", "压力 +2", "提示 本来只查一个概念，两个小时后开了十几个标签页。"]},
      {id: "tidydesk", name: "🧹 整理书包与错题", kind: "study", stam: 8,
        brief: "效率 +4，悟性 +1",
        run: ["效率 +4", "悟性 +1", "提示 卷子按科目摞好，抽屉里终于能关上了。!good"]},
      {id: "idle", name: "🌤️ 什么也不排", kind: "rest", stam: 0,
        brief: "心态 +2，压力 −3，不耗时间",
        run: ["心态 +2", "压力 -3", "提示 那半天什么也没做，后来觉得挺好。!good"]}
    ];

    const WEEKEND_DEFAULT = ["sleep", "selfstudy", "friends", "tidydesk"];

    function weekendAct(id) {return WEEKEND_ACTS.find(a => a.id === id) || null;}

    /* 开周时：带入上次保存的安排，没有就用默认四段 */
    function weekendEnsure() {
      if (!S) return;
      const saved = Array.isArray(S.weekendSaved) && S.weekendSaved.length === WEEKEND_SLOTS.length
        ? S.weekendSaved.slice() : WEEKEND_DEFAULT.slice();
      S.weekendPlan = saved.map(id => weekendAct(id) ? id : null);
      /* 打开编辑器之前的那份快照，用于「恢复上次」撤回本次调整 */
      S.weekendLast = saved.slice();
    }

    /* ------------------------------------------------------------------
     * 编辑界面（自由操作，不耗体力、不占行动）
     * ------------------------------------------------------------------ */

    function weekendSummaryHtml() {
      const left = (typeof staminaLeft === "function") ? staminaLeft() : 0;
      let cost = 0, study = 0;
      (S.weekendPlan || []).forEach(id => {
        const a = weekendAct(id);
        if (a) {cost += a.stam; if (a.kind === "study") study++;}
      });
      const rules = (typeof diffRules === "function") ? diffRules() : {};
      const cap = num(rules.weekendStudyMax, 99);
      const warn = study > cap ? `<span style="color:var(--red)"> · 地狱难度每周最多 ${cap} 段学习型安排</span>` : "";
      return `<div class="create-note">预计消耗时间 <b>${cost}</b>（当前 ${left}） · 完成 <b>${(S.weekendPlan || []).filter(Boolean).length}</b> 段${warn}</div>`;
    }

    function weekendSelectHtml(i) {
      const cur = (S.weekendPlan || [])[i] || "";
      const left = (typeof staminaLeft === "function") ? staminaLeft() : 0;
      let h = `<select data-wslot="${i}" onchange="weekendPick(${i},this.value)" style="width:100%;padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--panel2);color:var(--txt);font-size:.9rem">`;
      h += `<option value="">— 空着 —</option>`;
      const noPen = (typeof bagRequireWrite === "function") && !bagRequireWrite();
      WEEKEND_ACTS.forEach(a => {
        /* v1.4.1：学习类安排需要能写字的笔，没笔时下拉里直接标出来 */
        const gateNoPen = a.kind === "study" && noPen;
        const dis = (a.stam > left || gateNoPen) ? " disabled" : "";
        const why = gateNoPen ? "（没有笔）" : (a.stam > left ? "（时间不够）" : "");
        h += `<option value="${a.id}"${cur === a.id ? " selected" : ""}${dis}>${a.name}　⏳${a.stam}${why}</option>`;
      });
      return h + `</select>`;
    }

    function weekendBodyHtml() {
      let h = `<div class="wk-wrap">`;
      WEEKEND_SLOTS.forEach((sl, i) => {
        h += `<div class="wk-row"><div class="wk-slot"><b>${sl.icon} ${sl.name}</b><br><small style="color:var(--dim)">${sl.boostTxt}</small></div>
          <div class="wk-pick">${weekendSelectHtml(i)}</div></div>`;
      });
      h += `<div id="wkSummary">${weekendSummaryHtml()}</div>`;
      h += `<div class="create-note">安排会留到下周继续用。收周时按剩余时间逐段执行，付不起的段会跳过并写明原因。</div></div>`;
      return h;
    }

    function weekendPick(i, id) {
      if (!S || !Array.isArray(S.weekendPlan)) return;
      S.weekendPlan[clampNum(i, 0, WEEKEND_SLOTS.length - 1, 0)] = weekendAct(id) ? id : null;
      const box = document.getElementById("wkSummary");
      if (box) box.innerHTML = weekendSummaryHtml();
    }

    function weekendClear() {
      S.weekendPlan = WEEKEND_SLOTS.map(() => null);
      weekendRefreshEditor();
    }

    function weekendRestore() {
      S.weekendPlan = (Array.isArray(S.weekendLast) ? S.weekendLast : WEEKEND_DEFAULT).slice();
      weekendRefreshEditor();
    }

    function weekendSave() {
      S.weekendSaved = (S.weekendPlan || WEEKEND_DEFAULT).slice();
      S.weekendLast = S.weekendSaved.slice();
      if (typeof toast === "function") toast("🗓️ 周末安排已保存，下周继续用。");
    }

    function weekendRefreshEditor() {
      const box = document.getElementById("wkBody");
      if (box) box.innerHTML = weekendBodyHtml();
    }

    function openWeekend() {
      if (!S || S.over) return;
      if (!Array.isArray(S.weekendPlan)) weekendEnsure();
      showPopup({
        /* 纯编辑界面：标 feedback:false，别在点「保存/清空/关闭」时
         * 又弹一个「发生了什么」（需求 9 只管有后果的选项）。 */
        kind: "free", badge: "🗓️ 周末", title: "周末时间表", feedback: false,
        body: `<div id="wkBody">${weekendBodyHtml()}</div>`,
        options: [
          {t: "保存安排", fn: () => {weekendSave();}},
          {t: "清空安排", fn: () => {weekendClear();}},
          {t: "恢复上次", fn: () => {weekendRestore();}},
          {t: "关闭"}
        ]
      }, () => {if (typeof offerActions === "function") offerActions();});
    }

    /* ------------------------------------------------------------------
     * 结算：preview / apply 共用同一套走法，保证「预览」与「实际」一致
     * ------------------------------------------------------------------ */

    function weekendWalk(apply) {
      const rules = (typeof diffRules === "function") ? diffRules() : {};
      const studyCap = num(rules.weekendStudyMax, 99);
      let left = (typeof staminaLeft === "function") ? staminaLeft() : 0;
      let studyN = 0, done = 0, skipped = 0;
      const lines = [], deltas = {};
      const plan = Array.isArray(S.weekendPlan) ? S.weekendPlan : WEEKEND_DEFAULT;

      /* 从 run 指令里粗略解析属性变化，供预览显示「预计净变化」 */
      const scan = run => {
        (run || []).forEach(cmd => {
          const m = String(cmd).match(/^(心态|经济|健康|效率|悟性|社交|压力|亲情)\s*([+-][\d.]+)$/);
          if (m) deltas[m[1]] = num(deltas[m[1]], 0) + parseFloat(m[2]);
        });
      };

      WEEKEND_SLOTS.forEach((sl, i) => {
        const id = plan[i], a = weekendAct(id);
        if (!a) {
          skipped++;
          lines.push({ok: false, slot: sl.name, txt: "空着 —— 那半天没安排，跳过了。"});
          return;
        }
        /* v1.4.1：笔烂了，学习类安排照样排不进去 —— 写明原因，别静默跳过 */
        if (a.kind === "study" && typeof bagRequireWrite === "function" && !bagRequireWrite()) {
          skipped++;
          lines.push({ok: false, slot: sl.name, txt: `${a.name} —— 没有能写字的笔了，先去小卖部买一支，跳过。`});
          return;
        }
        if (a.kind === "study" && studyN >= studyCap) {
          skipped++;
          lines.push({ok: false, slot: sl.name, txt: `${a.name} —— 本周学习型安排已满 ${studyCap} 段（地狱难度），跳过。`});
          return;
        }
        if (left < a.stam) {
          skipped++;
          lines.push({ok: false, slot: sl.name, txt: `${a.name} —— 时间不够（需要 ${a.stam}，剩 ${left}），跳过。`});
          return;
        }
        left -= a.stam;
        if (a.kind === "study") studyN++;
        done++;
        scan(a.run);
        let extra = "";
        if (sl.boost === a.kind) {
          const bonus = sl.boost === "study" ? "效率 +2" : (sl.boost === "rest" ? "健康 +2" : "社交 +2");
          extra = `；${sl.name}加成（${bonus}）`;
          if (apply) {
            const mm = bonus.match(/^(\S+)\s*([+-]\d+)$/);
            if (mm && typeof modProp === "function") modProp(mm[1], parseFloat(mm[2]));
            deltas[mm ? mm[1] : "健康"] = num(deltas[mm ? mm[1] : "健康"], 0) + 2;
          }
        }
        lines.push({ok: true, slot: sl.name, txt: `${a.name} —— ${a.brief}${extra}`});
        if (apply) {
          if (typeof spendStamina === "function") spendStamina(a.stam, "周末安排");
          if (typeof runEffectSpec === "function") runEffectSpec(a.run, S);
          if (a.kind === "study" && typeof bagWear === "function") {
            bagWear("write", 2, "周末自习"); bagWearBag(1);
          }
          if (a.kind === "rest" && a.id === "exercise" && typeof bagWear === "function") {
            bagWear("sport", 2, "周末运动"); bagWearBag(1);
          }
          say(`🗓️ ${sl.name} · ${a.name}：${a.brief}${extra}`, a.kind === "study" ? "sys" : "good");
        }
      });
      return {done, skipped, lines, deltas};
    }

    function weekendPreview() {return weekendWalk(false);}

    function weekendApply() {
      const r = weekendWalk(true);
      /* 下周继续用这次的安排 */
      S.weekendSaved = (Array.isArray(S.weekendPlan) ? S.weekendPlan : WEEKEND_DEFAULT).slice();
      return r;
    }

    /* 收周弹窗里那一块：完成/跳过数 + 预计净变化 + 可展开逐段 */
    function weekendSettleHtml() {
      if (!S) return "";
      if (!Array.isArray(S.weekendPlan)) weekendEnsure();
      const r = weekendPreview();
      const chips = Object.keys(r.deltas).filter(k => r.deltas[k] !== 0).map(k =>
        `<span class="fb-chip ${r.deltas[k] > 0 ? "good" : "bad"}">${k} ${r.deltas[k] > 0 ? "+" : ""}${r.deltas[k]}</span>`
      ).join("");
      const rows = r.lines.map(l =>
        `<div class="wk-line ${l.ok ? "" : "skip"}">${l.ok ? "✅" : "⏭️"} <b>${l.slot}</b>　${l.txt}</div>`
      ).join("");
      return `<div class="wk-settle"><div class="fb-h">🗓️ 周末安排（收周结算）</div>
        <div>完成 <b style="color:var(--green)">${r.done}</b> 段 · 跳过 <b style="color:var(--dim)">${r.skipped}</b> 段</div>
        ${chips ? `<div class="fb-chips" style="margin-top:6px">${chips}</div><div style="color:var(--dim);font-size:.78rem;margin-top:3px">以上是预计净变化，确认后实际结算会显示在下一屏。</div>` : ""}
        <details style="margin-top:7px"><summary style="cursor:pointer;color:var(--dim);font-size:.85rem">展开看逐段结果与跳过原因</summary>
          <div style="margin-top:6px">${rows}</div></details></div>`;
    }
