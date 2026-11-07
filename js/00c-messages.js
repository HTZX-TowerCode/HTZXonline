/* ==================================================================
 * 内容层 · 消息栏（开发者 ↔ 玩家）
 * ==================================================================
 * ★★ 给维护者：要发新消息 / 删旧消息，只改下面这个 MESSAGES 数组。
 *    下面的逻辑一个字都不用动。
 *
 * 每条消息：
 *   id     必填，唯一字符串。删消息时连整项一起删；已读记录会自动清掉
 *          （见 pruneMsgReadIds），不会留垃圾。
 *   date   显示用，建议 YYYY-MM-DD
 *   tag    分类标签：公告 / 更新 / 闲聊 / 活动 …… 随便写
 *   title  列表里显示的一行标题
 *   lines  正文，一行一段。写纯文本即可，不要写 HTML 标签
 *          （渲染时会转义，换行由这里自动处理）
 *   pin    true = 置顶（可选）
 *
 * 已读状态存本机 localStorage，是「全局」的：
 *   不按存档隔离，玩家每次打开网址都能看到同样的未读状态。
 *   清浏览器数据会重置，这是预期行为。
 *
 * 维护等级：内容层（改文案的同学看这里就够了）
 * ================================================================== */

    const MESSAGES = [

      /* ---------------- 第一封信 ---------------- */
      {
        id: "msg-001",
        date: "2026-11-07",
        tag: "公告",
        title: "这里多了一封信",
        pin: true,
        lines: [
          "主菜单多了个「消息」按钮，这里就是我们和你说话的地方。",
          "以后版本更新了什么、修了哪些 bug、哪条玩法改了口径，我们会写在这里；偶尔也会放几句想说的话。",
          "没读过的会标出来，点开就算读过，下次打开还在。",
          "消息不多，但每封都是真的。",
          "—— 红塔中学社团开发组"
        ]
      }

      /* ★ 加新消息：在上面那项的 }, 后面加一个逗号，然后照着抄一块。
       * ★ 删消息：把整块删掉即可，已读记录会自动清理。 */
    ];

    const MSG_READ_KEY = "htzx_msg_read_v1";

    /* ---------------- 已读状态 ---------------- */

    function msgReadIds() {
      try {
        const a = JSON.parse(localStorage.getItem(MSG_READ_KEY) || "[]");
        return Array.isArray(a) ? a.filter(x => typeof x === "string") : [];
      } catch (e) {return [];}
    }

    function saveMsgReadIds(ids) {
      try {localStorage.setItem(MSG_READ_KEY, JSON.stringify(ids));} catch (e) { }
    }

    /* 消息被删掉后，把对应的已读记录也清掉 —— 否则 id 越积越多 */
    function pruneMsgReadIds() {
      const live = MESSAGES.map(m => m.id);
      const kept = msgReadIds().filter(id => live.indexOf(id) >= 0);
      if (kept.length !== msgReadIds().length) saveMsgReadIds(kept);
      return kept;
    }

    function markMsgRead(id) {
      const ids = msgReadIds();
      if (ids.indexOf(id) < 0) {ids.push(id); saveMsgReadIds(ids);}
      renderMsgBadge();
    }

    function isMsgUnread(id) {return msgReadIds().indexOf(id) < 0;}

    function msgUnreadCount() {
      pruneMsgReadIds();
      return MESSAGES.filter(m => isMsgUnread(m.id)).length;
    }

    /* ---------------- 一点小工具 ---------------- */

    function msgEsc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    /* 排序：置顶优先 → 日期新的在前 → 未读在前 */
    function msgSorted() {
      return MESSAGES.slice().sort((a, b) => {
        if (!!b.pin !== !!a.pin) return b.pin ? 1 : -1;
        if (String(b.date) !== String(a.date)) return String(b.date) < String(a.date) ? -1 : 1;
        return (isMsgUnread(b.id) ? 1 : 0) - (isMsgUnread(a.id) ? 1 : 0);
      });
    }

    /* ---------------- 主菜单角标 ---------------- */

    function renderMsgBadge() {
      const badge = document.getElementById("msgBadge");
      if (!badge) return;
      const n = msgUnreadCount();
      badge.textContent = n > 0 ? String(n) : "";
      badge.style.display = n > 0 ? "" : "none";
      const btn = document.getElementById("btnMessages");
      if (btn) btn.setAttribute("aria-label", n > 0 ? `消息，${n} 封未读` : "消息，全部已读");
    }

    /* ---------------- 列表弹窗 ---------------- */

    function openMessages() {
      pruneMsgReadIds();
      const n = msgUnreadCount();

      /* ★ 全部拼成一行、不留换行：showModal 内部会跑 nl2br()，
       * 标签里若夹着换行会被插进 <br>、把属性显示成可见文字
       * （历史上主题卡片出现过一整串 style="..." 的代码块，就是这个原因）。 */
      let html = `<div class="msglist">`;
      if (!MESSAGES.length) {
        html += `<div class="msg-empty">暂时没有消息。</div>`;
      } else {
        msgSorted().forEach(m => {
          const un = isMsgUnread(m.id);
          html += `<button type="button" class="msg-item${un ? " unread" : ""}" onclick="openMessage('${msgEsc(m.id)}')">` +
            `<span class="msg-dot"></span>` +
            `<span class="msg-main"><b>${msgEsc(m.title)}</b>` +
            `<small>${msgEsc(m.date)}　·　${msgEsc(m.tag || "消息")}${un ? "　·　<b class='msg-new'>未读</b>" : ""}</small></span>` +
            `<span class="msg-arrow">›</span></button>`;
        });
      }
      html += `</div><div class="msgfoot">共 ${MESSAGES.length} 封${n ? ` · ${n} 封未读` : " · 全部已读"}</div>`;

      showModal("📬 消息", html,
        [{t: "关闭", fn: () => { }}],
        null, false, true, {kind: "doc", badge: "开发者来信"});
      renderMsgBadge();
    }

    /* ---------------- 详情弹窗 ---------------- */

    function openMessage(id) {
      const m = MESSAGES.find(x => x.id === id);
      if (!m) {if (typeof toast === "function") toast("这封信已经不在了"); return;}

      markMsgRead(id);
      /* 同样拼成一行，不在标签内部留换行 */
      let html = `<div class="msg-detail">` +
        `<div class="msg-meta">${msgEsc(m.date)}　·　${msgEsc(m.tag || "消息")}</div>`;
      (m.lines || []).forEach(line => {html += `<p>${msgEsc(line)}</p>`;});
      html += `</div>`;

      showModal(msgEsc(m.title), html,
        [
          {t: "← 返回消息列表", fn: () => { }},
          {t: "关闭", fn: () => { }}
        ],
        null, false, true, {kind: "doc", badge: "开发者来信"});

      /* opts 的 fn 里重开弹窗会被 showModal 的按钮逻辑覆盖，
       * 所以这里用 afterRender 把「返回列表」接回去。 */
      const btns = document.querySelectorAll("#modalOpts button");
      if (btns[0]) btns[0].onclick = () => {openMessages();};
    }
