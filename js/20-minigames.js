/* ==================================================================
 * 引擎层 · 内置小游戏（需求 17）
 * ------------------------------------------------------------------
 * 先做五子棋一个，跑通再扩象棋 / 围棋。
 *
 * 触发方式：
 *   ① 事件选项里写中文指令「小游戏 五子棋」（见 05k-data-minigame-events.js）
 *   ② 游戏内顶栏「♟️ 棋摊」按钮（自由操作，不耗体力）
 *
 * ★ 为什么用 showModal 而不是自己盖一层遮罩：
 *   事件链是 `showPopup(def, () => showEventResult(step))`，那个 onClose
 *   就是「下一条事件」。五子棋必须把它接过来，结束时再交还，
 *   否则事件链会断在这里，玩家点完棋就卡住。
 *   17-ui.js 的 showModal 会把 onClose 存在 modalMask._onClose 上，
 *   openGomoku() 读它，结果窗再传回去 —— 一条链完整走完。
 *
 * ★ 选项 fn 里再调 showModal 会把 popupBusy 重新置 true，
 *   外层那次点击就不会提前收尾，棋盘自然接管。这是刻意的。
 *
 * ★ v1.4.2：主菜单那个「摆一局五子棋」是**纯玩** —— 没有存档、不接
 *   事件链、不写属性 / 日志 / 成就，结果窗也只有一个「收好棋子」。
 *   判断依据是「游戏屏是否可见」，不是 !!S：玩家从游戏回主菜单后
 *   toStart() 并不会清掉 S，只看 S 会把主菜单误判成游戏内。
 *
 * ★ v1.5.4：棋盘严格正方形。CSS 的 max-height 曾把高度单独压掉，
 *   矮屏上变成扁矩形；现在宽高都取同一个 --gmk-side，gmkFit() 再兜底。
 *
 * 维护等级：引擎层（别改 AI 评分以外的东西）
 * ================================================================== */

    const GMK_SIZE = 13;
    const GMK_WIN = 5;
    /* 局面评分：活四 ≫ 冲四 > 活三 > 眠三 > 活二。
     * 想让 AI 更强就调大 defense（防守权重），想让玩家更容易赢就调小。 */
    const GMK_SCORE = {5: 100000, 4: 12000, 3: 900, 2: 70, 1: 6};
    const GMK_DEFENSE = 0.82;   // AI 对自己「堵玩家」的重视程度（<1 = 偶尔漏防）
    const GMK_NOISE = 0.22;     // 从评分前 5 里随机挑一个的概率，别让 AI 像机器

    let GMK = null;

    /* 结果数值：胜负都给一点东西，输了也不是白下 */
    const GMK_REWARD = {
      win:  {心态: 8, 悟性: 4, 社交: 3, 压力: -5, txt: "赢了", cls: "good"},
      lose: {心态: -2, 悟性: 3, 社交: 3, 压力: 2, txt: "输了", cls: "bad"},
      draw: {心态: 2, 悟性: 2, 社交: 2, txt: "和棋", cls: "sys"},
      give: {心态: -3, 社交: 1, txt: "认输", cls: "sys"}
    };

    function gmkBoardHtml(standalone) {
      return `<div class="gmk-wrap">
        <div class="gmk-status" id="gmkStatus">你执黑先手。点交叉点落子。</div>
        <canvas id="gmkCanvas" width="416" height="416" aria-label="五子棋棋盘"></canvas>
        <div class="gmk-note">♟️ 十三路 · 先连成五子者胜　<span style="color:var(--dim)">${standalone
          ? "随手摆一局，不记入任何存档。" : "周末和同学摆的一局，输赢都不记分。"}</span></div>
      </div>`;
    }

    /* 是不是「主菜单纯玩」。★ 不能只看 S —— 从游戏回主菜单后 S 还在。 */
    function gmkStandalone() {
      const gs = document.getElementById("gameScreen");
      return !(typeof S !== "undefined" && S && !S.over && gs && !gs.classList.contains("hidden"));
    }

    /* 入口。事件指令和顶栏按钮都走这里。 */
    function openGomoku() {
      const standalone = gmkStandalone();   // 主菜单 = 纯玩，不碰存档
      const mask = document.getElementById("modalMask");
      /* 只有游戏内、且当前真的有弹窗（事件选项里触发）才继承事件链；
       * 纯玩时强制 null，免得把上一次的 _onClose 带进主菜单。 */
      const resume = (!standalone && mask && !mask.classList.contains("hidden") && typeof mask._onClose === "function")
        ? mask._onClose : null;

      GMK = {board: [], turn: 1, over: false, resume, standalone, aiBusy: false};
      for (let i = 0; i < GMK_SIZE; i++) GMK.board.push(new Array(GMK_SIZE).fill(0));

      const opts = [
        {t: "🔄 重新摆一局", fn: () => {gmkReopen(resume, standalone);}},
        {t: standalone ? "🏳️ 不下了" : "🏳️ 认输离场", fn: () => {gmkFinish("give", resume);}}
      ];
      if (typeof showModal === "function") {
        showModal(standalone ? "♟️ 摆一局五子棋" : "♟️ 周末棋摊", gmkBoardHtml(standalone),
          opts, resume, false, false,
          {kind: "free", badge: standalone ? "♟️ 纯玩" : "♟️ 五子棋", feedback: false, standalone: standalone});
        gmkBind();
      }
    }

    function gmkReopen(resume, standalone) {
      /* 在选项 fn 里再开一次 showModal，popupBusy 会重新为 true，
       * 外层不会提前收尾；棋盘弹窗继续持有同一个 resume。 */
      GMK = {board: [], turn: 1, over: false, resume, standalone, aiBusy: false};
      for (let i = 0; i < GMK_SIZE; i++) GMK.board.push(new Array(GMK_SIZE).fill(0));
      if (typeof showModal === "function") {
        showModal(standalone ? "♟️ 摆一局五子棋" : "♟️ 周末棋摊", gmkBoardHtml(standalone), [
          {t: "🔄 重新摆一局", fn: () => {gmkReopen(resume, standalone);}},
          {t: standalone ? "🏳️ 不下了" : "🏳️ 认输离场", fn: () => {gmkFinish("give", resume);}}
        ], resume, false, false,
          {kind: "free", badge: standalone ? "♟️ 纯玩" : "♟️ 五子棋", feedback: false, standalone: standalone});
        gmkBind();
      }
    }

    /* ==================================================================
     * v1.5.4 · 棋盘在任何屏幕上都是正方形（JS 兜底）
     * ------------------------------------------------------------------
     * CSS 已经把宽高都取同一个 --gmk-side，但浏览器缩放、系统字体放大、
     * 开发者工具改变视口、横竖屏切换仍可能让某一维被额外限制。
     * 这里读【布局尺寸】，取宽高里较小的那个同时赋给两边 ——
     * 宁可整体小一点，也绝不让棋盘变扁。
     * 每次先清内联 px，让 CSS 按当前视口重新算，否则窗口从大变小时
     * 上一次算出来的旧 px 不会跟着缩回去。
     *
     * ★ 坑：绝不能用 getBoundingClientRect()。弹窗有 pop 入场动画
     *   （transform: scale(.85)→1），动画期间 rect 是【缩放后】的值，
     *   写进内联样式后棋盘会永久小一圈 —— 1366×768 本该 353px 只剩
     *   255px，横屏 812×375 更是缩到 92px。clientWidth/clientHeight
     *   是布局尺寸，不受 transform 影响。
     * ================================================================== */
    let GMK_FIT_BOUND = false;
    function gmkFit() {
      const cv = document.getElementById("gmkCanvas");
      if (!cv) return;
      cv.style.width = ""; cv.style.height = "";
      const w = cv.clientWidth, h = cv.clientHeight;   // 布局尺寸，忽略 transform
      const side = Math.round(Math.min(w, h));
      if (side > 0) {cv.style.width = side + "px"; cv.style.height = side + "px";}
    }
    function gmkBindFit() {
      if (GMK_FIT_BOUND) return;
      GMK_FIT_BOUND = true;
      window.addEventListener("resize", () => {
        if (document.getElementById("gmkCanvas")) {gmkFit(); if (typeof gmkDraw === "function") gmkDraw();}
      });
      /* 手机地址栏收起 / 横竖屏：visualViewport 比 window.resize 更准 */
      if (window.visualViewport) window.visualViewport.addEventListener("resize", () => {
        if (document.getElementById("gmkCanvas")) gmkFit();
      });
    }

    function gmkBind() {
      const cv = document.getElementById("gmkCanvas");
      if (!cv) return;
      cv.onclick = e => {
        if (!GMK || GMK.over || GMK.aiBusy || GMK.turn !== 1) return;
        const r = cv.getBoundingClientRect();
        const cell = cv.width / (GMK_SIZE + 1);
        const x = Math.round((e.clientX - r.left) * (cv.width / r.width) / cell - 1);
        const y = Math.round((e.clientY - r.top) * (cv.height / r.height) / cell - 1);
        if (x < 0 || y < 0 || x >= GMK_SIZE || y >= GMK_SIZE || GMK.board[y][x]) return;
        GMK.board[y][x] = 1;
        gmkDraw();
        if (gmkCheck(1, x, y)) {gmkFinish("win", GMK.resume); return;}
        if (gmkFull()) {gmkFinish("draw", GMK.resume); return;}
        GMK.turn = 2;
        GMK.aiBusy = true;
        gmkStatus("同学低头想了想……");
        setTimeout(gmkAI, 260);
      };
      gmkBindFit();
      gmkFit();
      gmkDraw();
    }

    function gmkStatus(t) {
      const el = document.getElementById("gmkStatus");
      if (el) el.textContent = t;
    }

    /* 画棋盘：格子取自 CSS 变量，九套主题自动适配 */
    function gmkDraw() {
      const cv = document.getElementById("gmkCanvas");
      if (!cv || !GMK) return;
      const c = cv.getContext("2d");
      const cs = getComputedStyle(document.documentElement);
      const lineC = cs.getPropertyValue("--line").trim() || "#6b5a7a";
      const txtC = cs.getPropertyValue("--txt").trim() || "#f2ecf7";
      const glow = cs.getPropertyValue("--glow2").trim() || "192,138,232";
      const gold = cs.getPropertyValue("--gold").trim() || "#d7b45a";
      const W = cv.width, cell = W / (GMK_SIZE + 1);

      c.clearRect(0, 0, W, W);
      c.fillStyle = "rgba(255,255,255,.035)";
      c.fillRect(0, 0, W, W);
      c.strokeStyle = lineC; c.lineWidth = 1; c.globalAlpha = .55;
      for (let i = 1; i <= GMK_SIZE; i++) {
        c.beginPath(); c.moveTo(cell, i * cell); c.lineTo(GMK_SIZE * cell, i * cell); c.stroke();
        c.beginPath(); c.moveTo(i * cell, cell); c.lineTo(i * cell, GMK_SIZE * cell); c.stroke();
      }
      c.globalAlpha = 1;
      /* 星位 */
      c.fillStyle = lineC;
      [[3, 3], [3, 9], [9, 3], [9, 9], [6, 6]].forEach(([x, y]) => {
        c.beginPath(); c.arc((x + 1) * cell, (y + 1) * cell, 2.6, 0, 7); c.fill();
      });
      /* 棋子 */
      for (let y = 0; y < GMK_SIZE; y++) for (let x = 0; x < GMK_SIZE; x++) {
        const v = GMK.board[y][x]; if (!v) continue;
        const px = (x + 1) * cell, py = (y + 1) * cell, r = cell * .40;
        c.beginPath(); c.arc(px, py, r, 0, 7);
        const g = c.createRadialGradient(px - r * .3, py - r * .35, r * .1, px, py, r);
        if (v === 1) {g.addColorStop(0, "#5a5f6e"); g.addColorStop(1, "#14161d");}
        else {g.addColorStop(0, "#ffffff"); g.addColorStop(1, "rgba(" + glow + ",.75)");}
        c.fillStyle = g; c.fill();
        c.strokeStyle = v === 1 ? "rgba(255,255,255,.16)" : gold;
        c.lineWidth = 1; c.stroke();
      }
      /* 最后一手标一下 */
      if (GMK.last) {
        c.strokeStyle = gold; c.lineWidth = 1.6;
        c.beginPath(); c.arc((GMK.last[0] + 1) * cell, (GMK.last[1] + 1) * cell, cell * .16, 0, 7); c.stroke();
      }
      c.fillStyle = txtC;
    }

    /* 四个方向数连子，返回「连长 / 两端是否开放」 */
    function gmkLine(bd, x, y, dx, dy, who) {
      let n = 1, openA = false, openB = false;
      let cx = x + dx, cy = y + dy;
      while (cx >= 0 && cy >= 0 && cx < GMK_SIZE && cy < GMK_SIZE && bd[cy][cx] === who) {n++; cx += dx; cy += dy;}
      if (cx >= 0 && cy >= 0 && cx < GMK_SIZE && cy < GMK_SIZE && bd[cy][cx] === 0) openA = true;
      cx = x - dx; cy = y - dy;
      while (cx >= 0 && cy >= 0 && cx < GMK_SIZE && cy < GMK_SIZE && bd[cy][cx] === who) {n++; cx -= dx; cy -= dy;}
      if (cx >= 0 && cy >= 0 && cx < GMK_SIZE && cy < GMK_SIZE && bd[cy][cx] === 0) openB = true;
      return {n, open: (openA ? 1 : 0) + (openB ? 1 : 0)};
    }

    function gmkCheck(who, x, y) {
      const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      return dirs.some(([dx, dy]) => gmkLine(GMK.board, x, y, dx, dy, who).n >= GMK_WIN);
    }

    function gmkFull() {
      return GMK.board.every(row => row.every(v => v !== 0));
    }

    /* 给「假设在 (x,y) 落 who」打一个分：四个方向的连子价值相加 */
    function gmkPointScore(bd, x, y, who) {
      if (bd[y][x]) return -1;
      const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      let s = 0;
      for (const [dx, dy] of dirs) {
        const {n, open} = gmkLine(bd, x, y, dx, dy, who);
        if (n >= GMK_WIN) s += GMK_SCORE[5];
        else if (n <= 4) {
          let v = GMK_SCORE[n] || 1;
          if (open === 2) v *= 2.2;
          else if (open === 1) v *= .55;
          else v *= .12;
          s += v;
        }
      }
      /* 越靠中间越值钱，避免 AI 开局往角落下 */
      const mid = (GMK_SIZE - 1) / 2;
      s += (mid - Math.abs(x - mid) - Math.abs(y - mid)) * .6;
      return s;
    }

    function gmkAI() {
      if (!GMK || GMK.over) return;
      const bd = GMK.board;
      const cand = [];
      for (let y = 0; y < GMK_SIZE; y++) for (let x = 0; x < GMK_SIZE; x++) {
        if (bd[y][x]) continue;
        /* 只考虑已有棋子周围两格，省掉大片空地的计算 */
        let near = false;
        for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) {
          const yy = y + dy, xx = x + dx;
          if (yy >= 0 && xx >= 0 && yy < GMK_SIZE && xx < GMK_SIZE && bd[yy][xx]) {near = true; break;}
        }
        if (!near) continue;
        const atk = gmkPointScore(bd, x, y, 2);
        const def = gmkPointScore(bd, x, y, 1);
        cand.push({x, y, s: atk + def * GMK_DEFENSE});
      }
      if (!cand.length) {GMK.aiBusy = false; GMK.turn = 1; return;}
      cand.sort((a, b) => b.s - a.s);
      const pick = (Math.random() < GMK_NOISE) ? cand[rnd(Math.min(5, cand.length))] : cand[0];
      bd[pick.y][pick.x] = 2;
      GMK.last = [pick.x, pick.y];
      GMK.aiBusy = false;
      gmkDraw();
      if (gmkCheck(2, pick.x, pick.y)) {gmkFinish("lose", GMK.resume); return;}
      if (gmkFull()) {gmkFinish("draw", GMK.resume); return;}
      GMK.turn = 1;
      gmkStatus("轮到你了。");
    }

    /* 结束 → 结果窗（有文本、要点确认）→ 点确认才改属性 → 交还事件链
     *
     * ★ 坑 66：主菜单纯玩时 S 可能是 null。以前这里无条件 modProp()，
     *   抛 "Cannot read properties of null (reading 'prop')"，异常打断
     *   showModal 的收尾（hideModalRaw 没执行），玩家点「收好棋子」
     *   就永远卡在结果窗上。而且就算玩家是从游戏回主菜单（S 还在），
     *   纯玩也不该偷偷改存档。所以 standalone 一律不碰任何状态。 */
    function gmkFinish(result, resume) {
      if (!GMK || GMK.over) return;
      GMK.over = true;
      const standalone = !!GMK.standalone;
      const r = GMK_REWARD[result] || GMK_REWARD.draw;
      const TXT = {
        win:  "你连成了一线。同学盯着棋盘看了两秒，把棋子推回盒里：「下周再来。」<br><span style=\"color:var(--dim)\">赢棋这种小事，居然能让一整周都轻一点。</span>",
        lose: "他落下一子，五颗白子连在一起。你复盘了两步，发现刚才那手该先堵。<br><span style=\"color:var(--dim)\">输了，但好像记住了点什么。</span>",
        draw: "棋盘满了，谁也没连成五子。两人对着看了会儿，一起收了棋子。",
        give: "你把棋子一推：「不下了。」同学没追问，只是把棋盘叠好收进柜子。"
      };
      /* 纯玩：不结算、不显示数值框，结果窗里只有这一局本身 */
      const mods = standalone ? [] : Object.keys(r).filter(k => ["心态", "悟性", "社交", "压力", "健康", "效率", "经济"].includes(k));
      const modTxt = mods.map(k => `${k} ${r[k] > 0 ? "+" : ""}${r[k]}`).join(" · ");
      const settle = standalone ? "" : `<div style="margin-top:9px;padding:7px 10px;background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:9px">
          <b>${r.txt}</b>　<span style="color:var(--${r.cls === "good" ? "green" : r.cls === "bad" ? "red" : "dim"})">${modTxt}</span>
        </div>`;
      const body = `<div style="line-height:1.72">${TXT[result] || TXT.draw}${settle}</div>`;
      if (typeof showModal === "function") {
        showModal(standalone ? "♟️ 收好棋子" : "♟️ 棋局结束", body, [{
          t: "收好棋子", fn: () => {
            /* 主菜单纯玩：什么都不写，点了就回主菜单 */
            if (standalone) return;
            mods.forEach(k => {if (typeof modProp === "function") modProp(k, r[k]);});
            if (typeof say === "function") say(`♟️ 五子棋${r.txt}。${modTxt}`, r.cls === "good" ? "good" : "sys");
            if (typeof count === "function") count("gomoku");
            if (typeof checkAch === "function") checkAch();
            if (typeof renderHUD === "function") renderHUD();
          }
        }], standalone ? null : resume, false, false,
          {kind: "free", badge: standalone ? "♟️ 纯玩" : "♟️ 五子棋", feedback: false, standalone: standalone});
      }
    }
