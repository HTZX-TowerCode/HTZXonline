/* ==================================================================
 * 引擎层 · 顶部资源条（需求 20）
 * ------------------------------------------------------------------
 * 规格：顶部状态栏要常驻「体力 / 关键资源」。
 * 体力已经在 #actPill 里（03e-stamina.js 画）。这一层再补一格：
 *   钱 + 文具袋件数 / 容量，散落时标红。
 *
 * 由 17-ui.js 的 renderHUD() 末尾调用 updateResPill()。
 * 没有单独定时刷新 —— 属性一变就跟着 HUD 一起刷新，不会脏。
 *
 * 维护等级：引擎层（只改显示，不改数值）
 * ================================================================== */

    function updateResPill() {
      const el = document.getElementById("resPill");
      if (!el || !S) return;
      const money = Math.round(num(S.prop.经济, 0));
      let bagTxt = "🎒 —";
      if (typeof bagEnsure === "function") {
        bagEnsure();
        const n = S.bag.items.length, cap = num(S.bag.cap, 6);
        bagTxt = `🎒 <b>${n}</b>/${cap}`;
        if (S.bag.scattered) bagTxt += ` <span style="color:var(--red)">散落</span>`;
      }
      if (typeof setHudHtml === "function") {
        setHudHtml("resPill", `💰 <b>${money}</b>　${bagTxt}`);
      } else {
        el.innerHTML = `💰 <b>${money}</b>　${bagTxt}`;
      }
      el.title = "手头的钱 / 文具袋里的东西";
    }
