/* ==================================================================
 * 引擎层 · 事事有回应（需求 9）
 * ------------------------------------------------------------------
 * 目标：玩家点完任何一个选项，都能立刻看到一个「发生了什么」的弹窗，
 * 点确认才继续。解锁天赋 / 成就的文本和这次选项的文本合在同一个弹窗里，
 * 不另弹一次。
 *
 * 做法：捕获点放在 js/17-ui.js 的 showModal() 按钮点击处 —— 那是所有
 * 弹窗选项的唯一出口。点击前记一份属性快照和日志游标，执行完选项后：
 *   ① 属性数值 diff（哪怕事件一句 say 都没写，也有东西可看）
 *   ② 这段时间内所有 say 出来的文本
 *   ③ 期间解锁的天赋 / 成就（高亮区块）
 *   ④ 体力消耗
 * 合成一个弹窗。弹窗自己标 kind:"feedback"，不会再触发一次捕获。
 *
 * ★ 纯查看类弹窗（天赋图鉴 / 成就 / 主题 / 成绩单 / 做题结果）自带
 *   完整内容，传 meta.feedback:false 跳过。
 *
 * 维护等级：引擎层（一般不动）
 * ============================================================ */

    const FB_TEXT = {
      badge: "这一下的结果",
      title: "发生了什么",
      continue: "知道了，继续",
      stam: "时间 −{0}",
      deltaTitle: "状态变化",
      deltaTitleBlur: "状态有变",
      unlockTitle: "这次解锁",
      empty: "你做了选择。日子照常往前走。",
      none: "没有明显变化。"
    };

    let FB_STATE = null;
    /* 没有正在捕获的弹窗时（破茧 / 蜕变 / 退化也会解锁天赋），
     * 先攒着，等下一个反馈弹窗一起给玩家看，不丢信息。 */
    let FB_PENDING = [];

    function fbBegin(label) {
      if (!S) {FB_STATE = null; return;}
      /* 若上一个弹窗还没收尾（选项里又开了子弹窗），把它的解锁带过来，别丢。 */
      const carry = FB_STATE ? FB_STATE.unlocks.slice() : [];
      FB_STATE = {
        base: S.logs.length,
        snap: Object.assign({}, S.prop),
        stam0: num(S.stam, 0),
        label: label || "",
        unlocks: carry.concat(FB_PENDING.slice())
      };
      FB_PENDING = [];
    }

    function fbUnlock(txt, kind) {
      const item = {txt: String(txt || ""), kind: kind || "talent"};
      if (FB_STATE) FB_STATE.unlocks.push(item);
      else FB_PENDING.push(item);
    }

    /* 属性 diff：只列真正变了且不是隐藏属性的？
     * 全列 —— 数值留给 fbHtml 按真实度决定怎么显示。
     *
     * ★ v1.5 D 批口径修正：以前这里写「真实模式下数值变化是合理反馈」，
     *   但玩家反馈的是「真实模式不该看到具体数值」。
     *   真实模式 = 保持现状（属性五档、条类只有长度），反馈窗也不该破例
     *   把 +7、-3 这种精确数字递到眼前，否则模糊化等于白做。
     *   现在：游戏模式给数字；模拟 / 真实给方向词；经济任何模式都给数字；
     *   条类（时间）按 barShowsNumber() 走，真实模式不给数字。 */
    function fbPropDeltas(f) {
      const out = [];
      for (const k of Object.keys(f.snap)) {
        const a = num(f.snap[k], 0), b = num(S.prop[k], a);
        const d = Math.round(b - a);
        if (d === 0) continue;
        out.push({k, d});
      }
      return out;
    }

    function fbCollect() {
      if (!FB_STATE || !S) {FB_STATE = null; return null;}
      const f = FB_STATE;
      FB_STATE = null;
      return {
        label: f.label,
        logs: S.logs.slice(f.base),
        deltas: fbPropDeltas(f),
        unlocks: f.unlocks.slice(),
        stamSpent: Math.max(0, Math.round(f.stam0 - num(S.stam, 0)))
      };
    }

    function fbHasContent(f) {
      if (!f) return false;
      return !!(f.logs.length || f.deltas.length || f.unlocks.length || f.stamSpent);
    }

    /* 非游戏模式：把「心态 +7」换成「心态 升了」这类方向词。
     * 分三档只为了读起来有轻重，不是给玩家反推数值用的。 */
    function fbBlurWord(d) {
      const a = Math.abs(d);
      if (a >= 12) return d > 0 ? "明显升了" : "明显降了";
      if (a >= 5)  return d > 0 ? "升了" : "降了";
      return d > 0 ? "好了一点" : "差了一点";
    }

    function fbDeltaChip(k, d) {
      const good = d > 0;
      const cls = k === "压力" ? (good ? "bad" : "good") : (good ? "good" : "bad");
      const esc = s => String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      /* 经济是唯一任何模式都给数字的属性（Q3 已定） */
      const numeric = (k === "经济") ||
        (typeof propShowsNumber === "function" && propShowsNumber(k));
      const txt = numeric ? `${k} ${good ? "+" : ""}${d}` : `${k} ${fbBlurWord(d)}`;
      return `<span class="fb-chip ${cls}">${esc(txt)}</span>`;
    }

    function fbHtml(f) {
      const esc = s => String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      if (!fbHasContent(f)) return `<div style="line-height:1.62;color:var(--dim)">${FB_TEXT.empty}</div>`;
      let h = `<div class="fb-wrap">`;

      /* 1. 解锁放最上面，最醒目 */
      if (f.unlocks.length) {
        h += `<div class="fb-block"><div class="fb-h">${FB_TEXT.unlockTitle}</div>`;
        f.unlocks.forEach(u => {
          h += `<div class="fb-unlock ${u.kind === "ach" ? "ach" : "tal"}">${esc(u.txt)}</div>`;
        });
        h += `</div>`;
      }

      /* 2. 事件文本 */
      if (f.logs.length) {
        h += `<div class="fb-block"><div class="fb-h">经过</div>`;
        f.logs.forEach(l => {
          /* 解锁的那句 say 已在「这次解锁」里显示，别再重复一遍 */
          if (f.unlocks.some(u => u.txt === l.txt)) return;
          h += `<div class="fb-line ${esc(l.cls || "")}">${esc(l.txt)}</div>`;
        });
        h += `</div>`;
      }

      /* 3. 状态变化（自动 diff，事件没写文案也看得见）。
       * 只有解锁、没有数值变化时不画这一块，免得多一行「没有明显变化」。 */
      if (f.deltas.length || f.stamSpent) {
        const numericMode = (typeof propShowsNumber === "function")
          ? propShowsNumber("心态") : false;   // 拿一个非经济属性探真实度
        h += `<div class="fb-block"><div class="fb-h">${numericMode ? FB_TEXT.deltaTitle : FB_TEXT.deltaTitleBlur}</div><div class="fb-chips">`;
        f.deltas.forEach(d => {h += fbDeltaChip(d.k, d.d);});
        if (f.stamSpent > 0) {
          const barNum = (typeof barHasNumber === "function") ? barHasNumber() : false;
          const stamTxt = barNum ? `时间 −${f.stamSpent}` : "时间 用掉一些";
          h += `<span class="fb-chip stam">${stamTxt}</span>`;
        }
        h += `</div></div>`;
      }
      h += `</div>`;
      return h;
    }

    /* 弹一个反馈窗，关掉之后才交还控制权 */
    function fbShow(f, onDone) {
      const def = {
        kind: "free",
        badge: FB_TEXT.badge,
        title: FB_TEXT.title,
        body: fbHtml(f),
        options: [{t: FB_TEXT.continue, fn: () => {}}]
      };
      /* 直接调 showModal，并显式标 feedback:false 防止自捕获 */
      showModal(def.title, def.body, def.options,
        () => {if (typeof onDone === "function") onDone();},
        false, false, {kind: "feedback", badge: def.badge, feedback: false});
    }
