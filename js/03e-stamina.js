/* ==================================================================
 * 引擎层 · 体力池（需求 8）
 * ------------------------------------------------------------------
 * v1.4 起一周不再是「固定选 1~2 次行动」，而是一个体力池：
 *   · 开周时把体力补满（上限受健康 / 天赋 / 难度影响）
 *   · 每个行动、每个事件选项都标了自己的体力消耗，付不起就不能选
 *   · 玩家随时可以点「进入下一周」收手
 *   · 收手 / 体力耗尽时，没用完的体力按天赋折算成健康
 *
 * ★ 想调数值，改下面 STAMINA 一个对象就够了，不用碰引擎。
 * ★ 事件里想让某个选项更累，写 stam: 8（不写就用 eventDefault）。
 *
 * 维护等级：配置层（数值随便改）/ 引擎层（函数别乱动）
 * ============================================================ */

    const STAMINA = {
      base: 100, min: 60, max: 160,

      /* 各行动的体力消耗。allowance 固定 0 —— 开口要钱不该耗体力。
       * quiz 是「基础 + 每道题」，见 quizStamCost()。 */
      actCost: {
        study: 22, quiz: 8, sport: 26, rest: 8, social: 16,
        fun: 14, allowance: 0, read: 18, club: 20
      },
      quizPerItem: 7,          // 做题：8 + 7×题数（1 道 15，5 道 43）

      eventDefault: 2,        // 事件选项没写 stam 时的默认值
      eventAllowStam0: true,  // 允许纯对话选项写 stam: 0（真的不耗体力）

      /* 剩余体力 → 健康：left × restToHp × 天赋倍率 */
      restToHp: 0.12,

      /* 天赋对「每周体力上限」的修正 */
      talentBonus: {
        "钢筋铁骨": 16, "天行健": 14, "运动健将": 10, "操场晨光": 8, "佛系少年": 5,
        "体弱多病": -16, "长期失眠": -10, "熬夜冠军": -8, "深度抑郁": -6, "挑灯夜读": -5
      },
      /* 天赋对「剩余体力折健康」的倍率 */
      hpTalentMul: {
        "钢筋铁骨": 1.6, "运动健将": 1.5, "天行健": 1.4, "佛系少年": 1.3,
        "体弱多病": 0.6, "长期失眠": 0.7
      }
    };

    /* 本周体力上限 */
    function staminaMax() {
      let v = STAMINA.base;
      if (S && S.prop) v += Math.round(clampNum((num(S.prop.健康, 100) - 100) / 8, -20, 20, 0));
      const T = (typeof Talent !== "undefined") ? Talent : {have: () => false};
      for (const [n, d] of Object.entries(STAMINA.talentBonus)) if (T.have(n)) v += d;
      const rules = (typeof diffRules === "function") ? diffRules() : {};
      if (num(rules.staminaPenalty, 0)) v -= num(rules.staminaPenalty, 0);
      return Math.round(clamp(v, STAMINA.min, STAMINA.max));
    }

    function staminaLeft() {
      return clampNum(S && S.stam, 0, staminaMax(), 0);
    }

    function quizStamCost(n) {
      return num(STAMINA.actCost.quiz, 8) + num(STAMINA.quizPerItem, 7) * clampNum(n, 1, 5, 1);
    }

    function actStamCost(k, quizN) {
      if (k === "quiz") return quizStamCost(quizN || 1);
      return num(STAMINA.actCost[k], 10);
    }

    /* 「要零花钱」不耗体力，次数用完后本周就不能再开口。
     * 亲情 <100 一周 1 次，≥100 一周最多 2 次（需求 10）。 */
    function allowanceAvailable() {
      if (!S) return false;
      const max = num(S.prop.亲情, 80) >= 100 ? 2 : 1;
      return num(S.allowCount, 0) < max;
    }

    /* 某个事件选项要花多少体力 */
    function optionStamCost(o) {
      let v = (o && o.stam != null) ? o.stam : STAMINA.eventDefault;
      if (typeof v === "function") v = v(S);
      v = num(v, STAMINA.eventDefault);
      if (!STAMINA.eventAllowStam0 && v < 1) v = 1;
      return Math.round(clampNum(v, 0, 99));
    }

    function canAfford(v) {return staminaLeft() >= Math.max(0, num(v, 0));}

    function spendStamina(v, why) {
      const c = Math.max(0, Math.round(num(v, 0)));
      if (!S || c <= 0) return 0;
      const real = Math.min(c, staminaLeft());
      S.stam = clampNum(num(S.stam, 0) - real, 0, 999);
      if (typeof renderHUD === "function") renderHUD();
      return real;
    }

    /* 剩下这点体力还够不够做「最便宜的一件事」——不够就自动收周 */
    function cheapestActionCost() {
      const costs = Object.entries(STAMINA.actCost)
        .filter(([k]) => k !== "quiz" && k !== "allowance")
        .map(([, v]) => num(v, 99));
      return Math.min.apply(null, costs.concat([quizStamCost(1)]));
    }

    /* 剩余体力折成健康的具体结算放在 finishWeekWithStamina() 里，
     * 那里要先弹说明窗、再由选项去改健康，好让「事事有回应」能捕获到
     * 这次健康变化。这里不再留一个没人调用的重复实现。 */

    /* 玩家主动点「进入下一周」/ 体力自然耗尽 —— 只走一次。
     * ★ 收周本身也走一次弹窗 + 反馈（需求 9「事事有回应」）：
     *   先说明剩余体力怎么折成健康，玩家点确认，反馈窗显示健康 +N，
     *   最后才真正 afterWeek() 推进到新的一周。 */
    function finishWeekWithStamina(byPlayer) {
      if (!S || S.over) return;
      const left = staminaLeft();
      let mul = 1;
      const T = (typeof Talent !== "undefined") ? Talent : {have: () => false};
      for (const [n, m] of Object.entries(STAMINA.hpTalentMul)) if (T.have(n)) mul *= m;
      const hp = Math.round(left * num(STAMINA.restToHp, 0.12) * mul);
      const ap = document.getElementById("actionPanel");
      if (ap) ap.innerHTML = "";

      const line = hp > 0
        ? `这周还剩 <b>${left}</b> 点时间没用完。你没再往日程里塞东西，好好歇了歇。`
        : (byPlayer ? "你把这一周收了尾，没再安排别的。" : "时间用完了，这一周到此为止。");
      /* ★ 周末时间表结算（需求 12）：先给预览，点确认才真正执行。
       * 执行放在选项 fn 里，这样 showModal 的反馈捕获能把时间表的
       * 数值变化一并收进「这一下的结果」，不用再单独弹一窗。 */
      const wkHtml = (typeof weekendSettleHtml === "function") ? weekendSettleHtml() : "";
      showPopup({
        kind: "free", badge: "周末", title: "这一周就到这里",
        body: `<div style="line-height:1.62">${line}
          <span style="color:var(--dim);font-size:.85rem"><br>没用完的时间会按身体底子折算成健康。</span></div>${wkHtml}`,
        options: [{
          t: "➡️ 进入下一周",
          fn: () => {
            if (typeof weekendApply === "function") weekendApply();
            /* 文具周结算也放进选项 fn，反馈窗才会把它的变化一并收进来 */
            if (typeof bagWeeklyTick === "function") bagWeeklyTick();
            if (hp > 0 && typeof modProp === "function") modProp("健康", hp);
            say(hp > 0
              ? `🛌 剩 ${left} 点时间，歇了歇。健康 +${hp}`
              : (byPlayer ? "这一周就到这里吧。" : "时间用完，这一周结束。"),
              hp > 0 ? "good" : "sys");
          }
        }]
      }, () => {
        /* 新的一周由 startWeek() 按 stamWeek 补满体力，这里不用手工置 0 */
        renderHUD();
        afterWeek();
      });
    }

    /* 顶栏那一格：真实模式只有长度，游戏/模拟给数字 */
    function staminaPillHtml() {
      const mx = staminaMax(), lv = staminaLeft();
      const pct = mx > 0 ? clampNum(lv / mx * 100, 0, 100, 0) : 0;
      const showNum = (typeof barHasNumber === "function") ? barHasNumber() : false;
      const low = pct <= 25 ? " stam-low" : "";
      return `<span class="nowrap">⏳ 剩余时间</span><span class="stambar${low}"><i style="width:${pct}%"></i></span>` +
        (showNum ? `<span class="stam-num"> <b>${lv}</b>/<b>${mx}</b></span>` : "");
    }

    /* 按钮上的小字：让"这一下要花多少"在点之前就看得见。
     * v1.5 D 批：真实模式下选项上也不给具体数值（Q6「各选项不存在具体
     * 数值反馈」）。改成按占本周时间的比例给三档词，付不起的按钮照旧
     * 由 canAfford() 置灰，玩家仍然判断得出能不能做。 */
    function stamLabel(v) {
      const c = Math.round(num(v, 0));
      if (c <= 0) return `<span class="stamtag free">不耗时间</span>`;
      const showNum = (typeof barHasNumber === "function") ? barHasNumber() : false;
      if (showNum) return `<span class="stamtag">时间 −${c}</span>`;
      const mx = Math.max(1, (typeof staminaMax === "function") ? staminaMax() : 100);
      const ratio = c / mx;
      const word = ratio >= 0.32 ? "大半天" : (ratio >= 0.16 ? "挺费时间" : "花点时间");
      return `<span class="stamtag">${word}</span>`;
    }
