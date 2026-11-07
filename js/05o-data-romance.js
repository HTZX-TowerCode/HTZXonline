/* ==================================================================
 * 内容层 + 轻引擎 · 「心事」状态（v1.5 C 批 / 需求 8 之恋爱口径）
 * ------------------------------------------------------------------
 * 设计口径（已拍板）：
 *   · 可以谈，玩家在事件里自己看得懂；
 *   · 游戏整体不鼓励：持续状态下心态掉得快、学习收益打七折，
 *     几周后还会暂时失去一个心态类或学习类天赋；
 *   · 可以收心，收心后丢掉的天赋会自己回来；
 *   · **任何静态介绍都不出现相关字眼** —— 新手介绍 / 更新日志 /
 *     鸣谢 / 主菜单 / 成就 / 天赋说明 / 消息栏一律不提。
 *     成就叫「一张纸条」，天赋叫「心里住了一个人」，desc 只写效果。
 *   · 游戏内即时弹窗属于「反馈」，不是介绍，会写清丢了什么、怎么找回。
 *
 * 状态放在 S.romance：
 *   {on:bool, weeks:int, since:int, lost:[天赋名], recoverAt:int,
 *    pendingNotice:{type,t}}
 * 存档 v10 负责迁移与净化，老档读进来是干净的关闭状态。
 *
 * 维护等级：内容层（事件文案与数值可改）/ 引擎函数别乱动
 * ================================================================== */

    /* 会被暂时放下的天赋：只取心态类与学习类，不碰家庭背景、身体、社交 */
    const ROMANCE_LOSS_POOL = [
      "心态大师", "静水流深", "道心如铁", "佛系少年", "心如明镜", "心如止水",
      "过目不忘", "融会贯通", "卷王", "错题本", "知行合一", "学神降世",
      "笔耕不辍", "挑灯夜读", "晨读书声", "一手好字", "问不停", "自律机器"
    ];

    function romanceSanitize() {
      if (!S) return;
      const r = S.romance;
      if (!r || typeof r !== "object" || Array.isArray(r)) {
        S.romance = {on: false, weeks: 0, since: 0, lost: [], recoverAt: 0, pendingNotice: null};
        return;
      }
      r.on = !!r.on;
      r.weeks = clampNum(r.weeks, 0, 999, 0);
      r.since = clampNum(r.since, 0, 999, 0);
      r.recoverAt = clampNum(r.recoverAt, 0, 999, 0);
      if (!Array.isArray(r.lost)) r.lost = [];
      r.lost = r.lost.filter(x => typeof x === "string" && TALENTS[x]).slice(0, 12);
      if (!r.pendingNotice || typeof r.pendingNotice !== "object") r.pendingNotice = null;
      else if (["lost", "back"].indexOf(r.pendingNotice.type) < 0) r.pendingNotice = null;
    }

    function romanceOn() {return !!(S && S.romance && S.romance.on);}

    function romanceStart() {
      if (!S || romanceOn()) return false;
      romanceSanitize();
      const r = S.romance;
      r.on = true; r.weeks = 0; r.since = num(S.week, 0); r.recoverAt = 0;
      if (!Array.isArray(S.epicSeen)) S.epicSeen = [];
      /* 一局只开一次头，收心之后不再重复递那张纸 */
      if (S.epicSeen.indexOf("rm_first") < 0) S.epicSeen.push("rm_first");
      /* 心态类天赋：让「有点走神」这件事在天赋面板上也成立，
       * 但描述只写效果、不写来源。拿不到就跳过，不强行顶掉别的。 */
      if (typeof gainTalent === "function" && !Talent.have("心里住了一个人"))
        gainTalent("心里住了一个人", "免费");
      return true;
    }

    function romanceEnd() {
      if (!S) return false;
      romanceSanitize();
      const r = S.romance;
      if (!r.on) return false;
      r.on = false;
      r.weeks = 0;
      /* 收心之后过 4 周，暂时放下的东西会自己回来 */
      r.recoverAt = num(S.week, 0) + 4;
      if (typeof Talent !== "undefined" && Talent.have("心里住了一个人")) Talent.remove("心里住了一个人");
      if (typeof say === "function") say("你把那点走神收了起来。桌上的书重新摊开。", "sys");
      return true;
    }

    /* 学习收益：持续状态下打七折（需求「谈了学习会掉很快」） */
    function romanceStudyMul() {return romanceOn() ? 0.70 : 1;}

    /* 每周结算：心态掉得快，压力与效率也跟着受影响。
     * 由 js/15-engine-study.js 的 weeklySettle() 末尾调用。 */
    function romanceWeekly() {
      if (!S) return;
      romanceSanitize();
      const r = S.romance, wk = num(S.week, 0);
      if (r.on) {
        r.weeks++;
        if (typeof modProp === "function") {
          /* -9 是压过 weeklySettle 里 rnd(31)-15 随机漫步的：
           * 那个随机项期望是 0、单周能到 +15，只扣 6 会被盖过去，
           * 连跑三周心态反而可能涨。数值上要让「掉得快」是确定的。 */
          modProp("心态", -9);
          modProp("压力", 5);
          modProp("效率", -2);
        }
        /* 第 3 周：暂时放下一个心态 / 学习类天赋。
         * 只丢一次，不反复刮玩家的面板。 */
        if (r.weeks >= 3 && !r.lost.length) romanceLoseTalent();
      } else if (r.recoverAt && wk >= r.recoverAt && r.lost.length) {
        romanceReturn();
      }
    }

    function romanceLoseTalent() {
      if (!S || typeof Talent === "undefined") return;
      const owned = Talent.owned.filter(t => ROMANCE_LOSS_POOL.indexOf(t) >= 0);
      if (!owned.length) return;                    // 没有可放下的就不硬造
      const t = owned[rnd(owned.length)];
      Talent.remove(t);
      S.romance.lost.push(t);
      S.romance.pendingNotice = {type: "lost", t};
      if (typeof say === "function") say(`【${t}】暂时不在了。`, "bad");
    }

    function romanceReturn() {
      if (!S || typeof Talent === "undefined") return;
      const t = S.romance.lost.shift();
      if (!t || !TALENTS[t]) return;
      /* 直接还回去（本来就是玩家的），不走 gainTalent 的悟性门槛；
       * solve() 会处理与这期间新获得天赋的排斥。 */
      if (!Talent.have(t)) Talent.owned.push(t);
      Talent.solve();
      S.romance.recoverAt = 0;
      S.romance.pendingNotice = {type: "back", t};
      if (typeof renderHUD === "function") renderHUD();
    }

    /* 新周开端弹一次说明窗。
     * 返回 true 表示「我弹了，后面的流程由我接」，false 表示照常走。
     * 这个弹窗是【即时反馈】，不是静态介绍 —— 会写清丢了什么、怎么找回。 */
    function romanceNotice(next) {
      if (!S || !S.romance || !S.romance.pendingNotice) return false;
      const n = S.romance.pendingNotice;
      S.romance.pendingNotice = null;
      const lost = n.type === "lost";
      const body = lost
        ? `<div style="line-height:1.7">这几周你总在走神。以前顺手就能做到的事，现在要想一想才做得出来。<br><br>
             <b style="color:var(--gold)">【${n.t}】暂时不在了。</b><br><br>
             它不是没了 —— 把心收回来，过几周它会自己回来。</div>`
        : `<div style="line-height:1.7">桌上的书重新摊开，笔也顺手了。<br><br>
             <b style="color:var(--green)">【${n.t}】回来了。</b><br><br>
             不是忽然变厉害，只是那点分神终于过去了。</div>`;
      if (typeof showPopup === "function") {
        showPopup({
          kind: "free", badge: lost ? "🌧 这几周" : "🌤 慢慢回来",
          title: lost ? "有些东西先放下了" : "又捡起来了",
          body,
          options: [{t: "知道了", fn: () => {}}]
        }, () => {if (typeof next === "function") next();});
      }
      return true;
    }

    /* ==================================================================
     * 相关事件 —— 文案照常写校园里的那点事，但不给任何「玩法说明」。
     * 事件里用「心事 开始 / 心事 收心」两条中文指令改状态。
     * ================================================================== */
    const ROMANCE_EVENTS = [
      {
        id: "rm_first", w: 4, dist: "decay", decay: 0.25, slot: ["weekday", "weekend"],
        minTerm: 1, minGap: 18,
        cond: S => !romanceOn() && num(S.prop.社交, 0) >= 70 && !(S.epicSeen || []).includes("rm_first"),
        t: "课桌里那张纸",
        c: "晚自习前回教室，课本里夹着一张折得很整齐的纸。\n字不多，只说下周的月考加油，末尾画了个歪歪扭扭的太阳。\n你抬头看了一眼，讲台前没人往这边看。",
        opts: [
          {t: "把纸收进课本最里层", stam: 1,
            run: ["心事 开始", "心态 +8", "社交 +5", "压力 -3",
                  "提示 后来那一页你翻得比别的页都慢。!good"]},
          {t: "夹回原处，当作没看见", stam: 0,
            run: ["计数 纸条", "心态 +3", "悟性 +2", "提示 第二天它不见了，你也没问。"]},
          {t: "折好放进抽屉", stam: 1,
            run: ["压力 +3", "效率 +2", "提示 抽屉一开一合，那张纸一直在里面。"]}
        ]
      },
      {
        id: "rm_walk", w: 4, dist: "uniform", minGap: 12, slot: "weekend",
        cond: S => romanceOn(),
        t: "绕远的那条路",
        c: "周末返校，你没走平时那条穿过操场的近路。\n绕到教学楼后面，多花了七八分钟，只为经过那间教室的窗。\n窗里在扫地，一个人也没有。",
        opts: [
          {t: "站一会儿再走", stam: 2,
            run: ["心态 +4", "压力 +4", "效率 -3", "提示 上课铃响时才发觉书包还没放下。"]},
          {t: "折回去走近路", stam: 1,
            run: ["效率 +3", "心态 -2", "提示 到教室时早读刚开头，正好赶上。"],
           },
          {t: "下次不绕了", stam: 0,
            run: ["心事 收心", "效率 +5", "压力 -4", "提示 你把那条路从习惯里划掉了。!good"]}
        ]
      },
      {
        id: "rm_exam", w: 4, dist: "uniform", minGap: 14, slot: "weekday",
        cond: S => romanceOn(),
        t: "卷子发下来的时候",
        c: "月考卷子发下来，第一道选择题你读了三遍。\n窗外的云走得慢，铅笔尖停在选项上没动。\n同桌翻页的声音把你拉了回来。",
        opts: [
          {t: "从头再读一遍", stam: 2,
            run: ["压力 +5", "效率 -2", "提示 交卷时最后两题还是空的。!bad"]},
          {t: "先跳过去做后面", stam: 1,
            run: ["效率 +2", "心态 -3", "提示 后面写得顺，回头补那道题时铃响了。"]},
          {t: "放学把卷子重新做一遍", stam: 3,
            run: ["心事 收心", "学力 最弱 +12", "压力 +3", "提示 台灯下重做，其实都会。!good"]}
        ]
      },
      {
        id: "rm_after", w: 3, dist: "uniform", minGap: 16, slot: "weekend",
        cond: S => !romanceOn() && S.romance && Array.isArray(S.romance.lost) && S.romance.lost.length > 0,
        t: "草稿纸的角上",
        c: "整理书包时翻出一沓旧草稿纸。\n边角上有些不是公式的东西，画得很轻，擦过一半。\n你把那几张单独抽出来，压在了新本子底下。",
        opts: [
          {t: "留着吧", stam: 0,
            run: ["心态 +3", "悟性 +2", "提示 压平了，也没再看第二眼。"]},
          {t: "顺手夹进书里", stam: 1,
            run: ["效率 +2", "提示 翻到时会慢半拍，但不耽误往下读。"]}
        ]
      }
    ];

    /* 并入主事件表（幂等） */
    (function mergeRomanceEvents() {
      if (typeof EVENTS === "undefined") return;
      ROMANCE_EVENTS.forEach(e => {if (!EVENTS.some(x => x.id === e.id)) EVENTS.push(e);});
    })();
