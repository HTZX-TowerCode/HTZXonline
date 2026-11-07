/* ==================================================================
 * 内容层 · 文档实时更新
 * ==================================================================
 * 三份文档（新手介绍 / 更新日志 / 鸣谢列表）的内容在 docs/*.md 里，
 * 跑一次
 *   node tools/sync-docs.js   （或双击 sync-docs.bat）
 * 就会写进 js/00-docs.js，游戏里刷新即可看到。
 *
 * 读取分两层：
 *   ① 网络层：用 start-server.bat 起服务时，直接 fetch docs/*.md，改完刷新即生效
 *   ② 兜底层：双击打开时浏览器不让读 .md，就用 js/00-docs.js 里打包好的那份
 *
 * ★ v1.5 A 批：本地导入与本地缓存已彻底移除，不再从玩家本机的
 *   localStorage 里读文档。旧版本遗留的缓存会在启动时清掉。
 *
 * 维护等级：内容层（改文案的同学看这里就够了）
 * ================================================================== */

    const LIVE_DOCS = [
      {key: "guide", file: "guide.md", title: "新手介绍"},
      {key: "changelog", file: "changelog.md", title: "更新日志"},
      {key: "credits", file: "credits.md", title: "鸣谢列表"}
    ];

    const DOCS_CACHE_KEY = "htzx_docs_v1";


    /* 极简 Markdown → HTML（和 tools/sync-docs.js 保持同一套规则）
     *
     * 两个「把文档变短」的关键处理：
     *   ① 软换行合并：源文件里一句话被拆成两行写 → 合成一个 <p>
     *   ② 断句接回：一句话被空行拆成两段 → 接回一个 <p>
     *      （判断依据：上一段不是以 。？！…」』） 结尾，说明话没说完）
     * 写完 md 直接刷新就能看到，不用跑同步脚本。
     */
    function mdToHtml(src) {
      const lines = String(src == null ? "" : src).replace(/\r\n/g, "\n").split("\n");
      const out = [];
      let inList = false, inTable = false;

      const inline = t => String(t)
        .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>");

      /* 一段话是否「说完了」 */
      const ENDS = /[。！？!?.…）)】」』》”"'〉]\s*$/;

      /* 记住最后一个 <p> 的位置；插入标题 / 列表 / 表格后清空，
       * 防止段落跨过结构性元素去拼接 */
      let lastParaIdx = -1;
      function pushHtml(h) {
        out.push(h);
        lastParaIdx = /^<p>/.test(h) ? out.length - 1 : -1;
      }

      const closeList = () => {if (inList) {pushHtml("</ul>"); inList = false;}};
      const closeTable = () => {if (inTable) {pushHtml("</table>"); inTable = false;}};

      let paraBuf = [];
      const flushPara = () => {
        if (!paraBuf.length) return;
        let t = paraBuf[0];
        for (let k = 1; k < paraBuf.length; k++) {
          const prev = paraBuf[k - 1], cur = paraBuf[k];
          // 英文/数字之间补空格；中文直接连上，不凭空插空格
          const needSpace = /[A-Za-z0-9.,;:!?]$/.test(prev) && /^[A-Za-z0-9]/.test(cur);
          t += (needSpace ? " " : "") + cur;
        }
        paraBuf = [];
        if (lastParaIdx >= 0) {
          const prev = out[lastParaIdx].replace(/^<p>/, "").replace(/<\/p>$/, "");
          /* ★ 整段就是一个元素（如整行加粗 **玉溪市红塔中学**）时不能接 ——
           *   它结尾是 ">" 而不是标点，会被误判成"话没说完"，
           *   和下一行拼在一起那句话就重复了。 */
          const prevText = prev.replace(/<[^>]+>/g, "");
          const endsWithTag = />$/.test(prev);
          if (!endsWithTag && !ENDS.test(prevText)) {
            const needSpace = /[A-Za-z0-9.,;:!?]$/.test(prev) && /^[A-Za-z0-9]/.test(t);
            pushHtml(`<p>${inline(prev + (needSpace ? " " : "") + t)}</p>`);
            return;
          }
        }
        pushHtml(`<p>${inline(t)}</p>`);
      };

      for (let raw of lines) {
        const line = raw.trim();
        if (!line) {flushPara(); closeList(); closeTable(); continue;}

        if (/^\|(.+)\|$/.test(line)) {
          flushPara();
          const cells = line.slice(1, -1).split("|").map(c => c.trim());
          if (!inTable) {pushHtml('<table class="mdtable">'); inTable = true;}
          if (cells.every(c => /^[-: ]+$/.test(c))) continue;
          pushHtml("<tr>" + cells.map(c => `<td>${inline(c)}</td>`).join("") + "</tr>");
          continue;
        }
        closeTable();

        if (/^---+$/.test(line)) {flushPara(); closeList(); pushHtml('<hr class="mdhr">'); continue;}

        let m;
        if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
          flushPara(); closeList();
          const lv = Math.min(6, m[1].length + 1);
          pushHtml(`<h${lv}>${inline(m[2])}</h${lv}>`);
          continue;
        }
        if ((m = line.match(/^>\s?(.*)$/))) {
          flushPara(); closeList();
          pushHtml(`<blockquote>${inline(m[1])}</blockquote>`);
          continue;
        }
        if (/^([-*])\s+/.test(line)) {
          flushPara();
          if (!inList) {pushHtml("<ul>"); inList = true;}
          pushHtml(`<li>${inline(line.replace(/^([-*])\s+/, ""))}</li>`);
          continue;
        }
        closeList();
        paraBuf.push(line);
      }
      flushPara(); closeList(); closeTable();
      return out.join("");
    }

    /* ---------------- 取一份文档的正文 ---------------- */

    async function fetchDocMd(key) {
      const d = LIVE_DOCS.find(x => x.key === key);
      if (!d) return null;
      // 用 http 打开时才能 fetch；file:// 下会抛异常，直接回落
      if (location.protocol === "file:") return null;
      try {
        const r = await fetch("docs/" + d.file, {cache: "no-store"});
        if (!r.ok) return null;
        return await r.text();
      } catch (e) {return null;}
    }

    /* 打开一份文档：优先网络（起本地服务时） → 兜底 00-docs.js */

    async function openDocLive(key) {
      const d = LIVE_DOCS.find(x => x.key === key);
      if (!d) {if (typeof toast === "function") toast(L("doc.missing")); return;}
      const md = await fetchDocMd(key);
      if (!md && typeof GAME_DOCS !== "undefined" && GAME_DOCS[key]) {
        renderDocModal(key, d.title, GAME_DOCS[key].html, "builtin");
        return;
      }
      if (!md) {if (typeof toast === "function") toast(L("doc.missing")); return;}
      renderDocModal(key, d.title, mdToHtml(md), "net");
    }

    function renderDocModal(key, title, html, from) {
      const srcNote = from === "net" ? L("doc.srcNet") : L("doc.srcBuiltin");
      showModal(title,
        `<div class="markdown">${html}</div>
         <div class="docfoot">${srcNote}</div>`,
        [
          {t: L("doc.close"), fn: () => { }}
        ], null, false, true, {kind: "doc"});
    }

    /* ==================================================================
     * v1.5 A 批 · 本地导入与缓存已彻底移除
     * ------------------------------------------------------------------
     * 维护者明确要求「把所有本地导入关掉」。现在只剩两层：
     *   ① 起本地服务（start-server.bat）→ fetch docs/*.md，改完刷新即生效
     *   ② 双击 index.html → 用 js/00-docs.js 里打包好的那份
     * 保留 dropDocCache() 只为清掉旧版本遗留在 localStorage 的缓存，
     * 免得它一直盖住新文档。需要恢复导入见 git 历史。
     * ============================================================ */
    function dropDocCache() {
      try {localStorage.removeItem(DOCS_CACHE_KEY);} catch (e) { }
    }
    dropDocCache();
