/* ==================================================================
 * 创角独立页（v1.4 需求 1、2、3、4、5、7）
 * ==================================================================
 * 点「新开存档」后从主菜单切到这一整页，不再是弹窗。
 * 这一页收集：姓名 / 性别 / 真实度 / 难度 / 起始学期 / 生地成绩 / 自选天赋，
 * 然后一次性交给 applyStartSetup() + newGame()。
 *
 * ★ 彩蛋名（xyf / xiayifu / 夏毅夫 / 夏if）仍在 isBannedName() 里拦着，
 *   自定义输入框保留了，所以拦截逻辑不能删。
 *
 * ★★ v1.4 交互修复：骨架只画一次，之后所有点击走「局部 patch」。
 *   以前每个 cpSet / cpPickName / cpToggleTalent 都调 renderCreate() 整页
 *   innerHTML 重建 —— 所有 .card 的 fadeInUp 入场动画会重播一遍（卡片一起
 *   抖，玩家反馈「点一下刷新一下，有点鬼畜」），自定义输入框还会失焦、
 *   滚动位置跳。现在只替换被点中的那一小块，页面本身不动。
 *
 * ★ 传给页面的 HTML 全部拼成不带标签内换行的字符串 —— 见 HANDOVER 坑 2
 *   （曾经让主题卡片上冒出一整串 style= 代码）。
 *
 * 维护等级：界面层
 * ================================================================== */

    /* 用 var 而非 let：页面里的 oninput="CP.name=..." 是内联事件处理器，
     * 它需要能从 window 上取到这个对象（全局 let 不挂 window）。 */
    var CP = null;   // 当前创角页的状态，关掉页面就置空

    /* ------------------------------------------------------------------
     * 打开 / 关闭
     * ------------------------------------------------------------------ */

    function openCreatePage(i) {
      const plans = GAME_CONFIG.TERM_PLAN || [];
      const st = GAME_CONFIG.start || {};
      CP = {
        slot: clampNum(i, 0, 2, 0),
        name: "",
        gender: "男",
        names: [],
        realism: ["game", "sim", "real"].indexOf(st.realism) >= 0 ? st.realism : "real",
        difficulty: ["easy", "normal", "hard", "hell"].indexOf(st.difficulty) >= 0 ? st.difficulty : "hard",
        planId: plans.some(p => p.id === st.planId) ? st.planId : (plans[0] ? plans[0].id : "t0"),
        hkBio: 60, hkGeo: 60,
        family: "",
        candidates: [],
        chosen: [],
        msg: ""
      };
      CP.names = cpRollNames(CP.gender);
      CP.candidates = (typeof rollTalentCandidates === "function") ? rollTalentCandidates() : [];
      cpSyncFamily();
      const cs = document.getElementById("createScreen");
      if (cs) cs.classList.remove("hidden");
      const ss = document.getElementById("startScreen");
      if (ss) ss.classList.add("hidden");
      renderCreate();          // 只在这里画一次骨架
      if (cs) cs.scrollTop = 0;
    }

    function closeCreatePage() {
      CP = null;
      const cs = document.getElementById("createScreen");
      if (cs) {cs.classList.add("hidden"); cs.innerHTML = "";}
      const ss = document.getElementById("startScreen");
      if (ss) ss.classList.remove("hidden");
      if (typeof renderSlots === "function") renderSlots();
    }

    /* 从姓名库抽 5 个不重复的名字（保留自定义输入框，见需求 1 Q10） */
    function cpRollNames(gender) {
      const pool = (NAME_POOL && NAME_POOL.zh) ? NAME_POOL.zh : {male: [], female: []};
      const src = (gender === "女" ? pool.female : pool.male).slice();
      const out = [];
      while (out.length < 5 && src.length) {
        const k = rnd(src.length);
        out.push(src[k]); src.splice(k, 1);
      }
      return out;
    }

    /* 家庭背景天赋：游戏模式自选（默认给一个）、模拟模式随机、真实模式不用 */
    function cpSyncFamily(force) {
      if (!CP) return;
      const mode = (typeof familyPickMode === "function") ? familyPickMode(CP.realism) : "none";
      if (mode === "none") {CP.family = ""; return;}
      if (mode === "random" || !CP.family || force) {
        CP.family = (typeof rollFamilyTalent === "function") ? rollFamilyTalent() : "";
      }
    }

    /* ------------------------------------------------------------------
     * 交互 —— 全部只改状态 + 局部 patch，不重建整页
     * ------------------------------------------------------------------ */

    /* 小工具：按 id 往一个容器里塞 HTML；找不到就安静跳过 */
    function cpInto(id, html) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    }

    /* 按钮组选中态：只切 class，不重画 DOM */
    function cpMark(containerId, attr, val) {
      const box = document.getElementById(containerId);
      if (!box) return;
      box.querySelectorAll("button[data-v]").forEach(b => {
        b.classList.toggle("sel", b.dataset.v === String(val));
      });
    }

    function cpSet(key, val) {
      if (!CP) return;
      CP[key] = val;

      if (key === "gender") {
        CP.names = cpRollNames(val); CP.name = "";
        cpInto("cpNames", htmlNames());
        const inp = document.getElementById("cpNameInput");
        if (inp) inp.value = "";
        cpInto("cpGender", htmlGender());
        return;
      }
      if (key === "realism") {
        CP.chosen = []; CP.msg = ""; cpSyncFamily();
        cpMark("cpRealism", "v", val);
        /* 真实度会决定「有没有自选天赋」和额度 —— 这两块必须整体换内容，
         * 但仍只替换那个 section，不动页面其它部分。 */
        cpIntoTalent();
        cpPatchFoot();
        return;
      }
      if (key === "difficulty") {
        CP.msg = "";
        cpMark("cpDiff", "v", val);
        cpInto("cpHellNote", htmlHellNote());
        return;
      }
      if (key === "planId") {
        CP.msg = "";
        cpMark("cpPlan", "v", val);
        cpInto("cpHkSlot", htmlHkSection());   // 会考后开局才出现输入框
        return;
      }
      /* 其它字段（理论上不会有）：只同步底部 */
      cpPatchFoot();
    }

    function cpPickName(n) {
      if (!CP) return;
      CP.name = n;
      cpMark("cpNames", "n", n);
      const inp = document.getElementById("cpNameInput");
      if (inp) inp.value = n;      // 输入框与 chips 同步，但不重建输入框
    }

    function cpRerollNames() {
      if (!CP) return;
      CP.names = cpRollNames(CP.gender);
      CP.name = "";
      cpInto("cpNames", htmlNames());
      const inp = document.getElementById("cpNameInput");
      if (inp) inp.value = "";
    }

    function cpRerollCandidates() {
      if (!CP) return;
      CP.candidates = (typeof rollTalentCandidates === "function") ? rollTalentCandidates() : [];
      CP.chosen = []; CP.msg = "已重抽 20 个候选天赋。";
      cpPatchTalent();
    }

    /* 当前选中的全部天赋（家庭背景 + 自选），用于额度与互斥校验 */
    function cpAllTalents() {
      if (!CP) return [];
      return [CP.family].concat(CP.chosen).filter(n => !!n && !!TALENTS[n]);
    }

    function cpCost() {return (typeof pickCost === "function") ? pickCost(cpAllTalents()) : 0;}

    function cpBudget() {return (typeof pickBudget === "function") ? pickBudget(CP ? CP.realism : "real") : 0;}

    /* 点一个候选天赋：查互斥 → 查额度 → 加入 / 取消 */
    function cpToggleTalent(n) {
      if (!CP || !TALENTS[n]) return;
      const idx = CP.chosen.indexOf(n);
      if (idx >= 0) {CP.chosen.splice(idx, 1); CP.msg = ""; cpPatchTalent(); return;}

      // 家庭背景天赋也算进互斥（双向查 inc）
      const c = (typeof conflictsWith === "function") ? conflictsWith(n, cpAllTalents()) : [];
      if (c.length) {
        CP.msg = `【${n}】与【${c[0]}】互斥，不能同时选。`;
        cpPatchTalent(); return;
      }
      const bad = (typeof isBadTalent === "function") ? isBadTalent(n) : false;
      const lv = TALENTS[n].lv;
      const nextCost = cpCost() + (bad ? -lv : lv);
      if (!bad && nextCost > cpBudget()) {
        CP.msg = `额度不够（${nextCost} / ${cpBudget()}）。可以先选一个负面天赋腾出空间，或取消某个正面天赋。`;
        cpPatchTalent(); return;
      }
      CP.chosen.push(n);
      CP.msg = "";
      cpPatchTalent();
    }

    function cpSetFamily(n) {
      if (!CP || !TALENTS[n]) return;
      const cf = (typeof conflictsWith === "function") ? conflictsWith(n, CP.chosen) : [];
      if (cf.length) {CP.msg = `【${n}】与【${cf[0]}】互斥。`; cpPatchTalent(); return;}
      CP.family = n; CP.msg = ""; cpPatchTalent();
    }

    function cpRerollFamily() {
      if (!CP) return;
      cpSyncFamily(true);
      CP.msg = ""; cpPatchTalent();
    }

    /* ------------------------------------------------------------------
     * 片段渲染：每块都能单独重画
     * ------------------------------------------------------------------ */

    function htmlNames() {
      return CP.names.map(n =>
        `<button type="button" data-n="${cpEsc(n)}" class="namechip${CP.name === n ? " sel" : ""}" onclick="cpPickName('${cpEsc(n)}')">${n}</button>`
      ).join("");
    }

    function htmlGender() {
      return `<label><input type="radio" name="cpGender" value="男" ${CP.gender === "男" ? "checked" : ""} onchange="cpSet('gender','男')"> 男</label><label><input type="radio" name="cpGender" value="女" ${CP.gender === "女" ? "checked" : ""} onchange="cpSet('gender','女')"> 女</label>`;
    }

    function htmlRealism() {
      return (GAME_CONFIG.REALISM_MODES || []).map(m =>
        `<button type="button" data-v="${m.id}" class="optbtn${CP.realism === m.id ? " sel" : ""}" onclick="cpSet('realism','${m.id}')"><b>${m.name}</b><small>${m.sub}</small></button>`
      ).join("");
    }

    function htmlDiff() {
      return (GAME_CONFIG.DIFFICULTIES || []).map(d =>
        `<button type="button" data-v="${d.id}" class="optbtn${CP.difficulty === d.id ? " sel" : ""}" onclick="cpSet('difficulty','${d.id}')"><b>${d.name}</b><small>${d.sub}</small></button>`
      ).join("");
    }

    function htmlHellNote() {
      return CP.difficulty === "hell"
        ? `<div class="create-note" style="color:var(--red)">地狱：健康低于 10 立即结束；心态低于 20 时学习类行动不可用；小卖部价格翻倍。</div>`
        : "";
    }

    function htmlPlan() {
      return (GAME_CONFIG.TERM_PLAN || []).map(p => {
        const wk = Math.max(1, (6 - p.from)) * 20;
        return `<button type="button" data-v="${p.id}" class="optbtn${CP.planId === p.id ? " sel" : ""}" onclick="cpSet('planId','${p.id}')"><b>${p.label}</b><small>约 ${wk} 周</small></button>`;
      }).join("");
    }

    function htmlHkSection() {
      const plan = (GAME_CONFIG.TERM_PLAN || []).find(p => p.id === CP.planId);
      if (!plan || plan.from < 4) return "";
      return `<section class="card create-card"><div class="tag-title">④ 补填生地会考成绩</div>
        <div class="hk-row"><label>生物（卷面 90）<input type="number" id="cpHkBio" min="0" max="90" value="${CP.hkBio}" oninput="CP.hkBio=this.value"></label><label>地理（100）<input type="number" id="cpHkGeo" min="0" max="100" value="${CP.hkGeo}" oninput="CP.hkGeo=this.value"></label></div>
        <div class="create-note">你从生地会考之后开始，这两科已经考完、成绩锁死，中考会直接按权重折进去。生物实验操作的 10 分视作当时已拿满。</div></section>`;
    }

    function htmlBudget() {
      const cost = cpCost(), budget = cpBudget();
      return `<span>额度 <span class="budget${cost > budget ? " over" : ""}">${cost} / ${budget}</span></span><span style="color:var(--dim)">${CP.realism === "game" ? "游戏模式 · 6 点" : "模拟模式 · 4 点"}</span><span class="mini-btn" onclick="cpRerollCandidates()">🎲 重抽候选</span>`;
    }

    function htmlFamily() {
      const mode = (typeof familyPickMode === "function") ? familyPickMode(CP.realism) : "none";
      let h = `<div class="create-label">家庭背景（计入额度）${mode === "random" ? " · 本局随机" : " · 自选一个"}</div>`;
      if (mode === "choose") {
        h += `<div class="namechips">`;
        (FAMILY_TALENTS || []).forEach(n => {
          const cf = (typeof conflictsWith === "function") ? conflictsWith(n, CP.chosen) : [];
          h += `<button type="button" class="namechip${CP.family === n ? " sel" : ""}${cf.length ? " conflict" : ""}" ${cf.length ? `title="与【${cf[0]}】互斥"` : ""} onclick="cpSetFamily('${n}')">${n} <small style="opacity:.7">Lv.${TALENTS[n].lv}</small></button>`;
        });
        h += `</div>`;
      } else {
        h += `<div class="create-note">本局家庭背景：<b style="color:var(--gold)">${CP.family || "—"}</b>（Lv.${TALENTS[CP.family] ? TALENTS[CP.family].lv : "?"}） <span class="mini-btn" onclick="cpRerollFamily()">换一个</span></div>`;
      }
      return h;
    }

    function htmlCandidates() {
      return CP.candidates.map(n => {
        if (!TALENTS[n]) return "";
        const bad = (typeof isBadTalent === "function") ? isBadTalent(n) : false;
        const sel = CP.chosen.indexOf(n) >= 0;
        const cf = sel ? [] : ((typeof conflictsWith === "function") ? conflictsWith(n, cpAllTalents()) : []);
        const cls = `tpick${bad ? " bad" : ""}${sel ? " sel" : ""}${cf.length ? " conflict" : ""}`;
        return `<button type="button" class="${cls}" ${cf.length ? `title="与【${cf[0]}】互斥"` : ""} onclick="cpToggleTalent('${n}')"><b>${bad ? "▽" : "△"} ${n} Lv.${TALENTS[n].lv}</b><small>${TALENTS[n].desc}</small></button>`;
      }).join("");
    }

    function htmlMsg() {
      const cls = CP.msg ? (CP.msg.indexOf("额度") >= 0 || CP.msg.indexOf("互斥") >= 0 ? " warn" : " ok") : "";
      return `<div class="pick-msg${cls}">${cpEsc(CP.msg)}</div>`;
    }

    /* 自选天赋整块（真实度切换时才整体替换） */
    function htmlTalentSection() {
      if (CP.realism !== "game" && CP.realism !== "sim") {
        return `<section class="card create-card wide"><div class="tag-title">⑤ 天赋</div><div class="create-note">真实模式不开放开局自选。天赋会在一次次选择里长出来，也可能因为久不练习而退化。</div></section>`;
      }
      return `<section class="card create-card wide"><div class="tag-title">⑤ 开局自选天赋 <span style="color:var(--dim);font-size:.72rem">正面 Lv 之和 − 负面 Lv 之和 ≤ 额度</span></div>
        <div class="pickbar" id="cpBudgetBar">${htmlBudget()}</div>
        <div id="cpFamilyBox">${htmlFamily()}</div>
        <div class="create-label">候选天赋（20 个，正面白色 / 负面红色，可多选）</div><div class="talentpick" id="cpCandidateBox">${htmlCandidates()}</div>
        <div id="cpMsgBox">${htmlMsg()}</div>
        <div class="create-note">选负面天赋会降低已用点数 —— 想带更多长处，就得接受一块短板。互相矛盾的天赋按排斥规则自动挡住。</div></section>`;
    }

    /* 局部刷新：天赋区内部（最常用，点一次只动这几块） */
    function cpPatchTalent() {
      cpInto("cpBudgetBar", htmlBudget());
      cpInto("cpFamilyBox", htmlFamily());
      cpInto("cpCandidateBox", htmlCandidates());
      cpInto("cpMsgBox", htmlMsg());
      cpPatchFoot();
    }

    /* 真实度切换：天赋整块结构变了，只换那个 slot */
    function cpIntoTalent() {
      cpInto("cpTalentSlot", htmlTalentSection());
    }

    function cpPatchFoot() {
      const over = (CP.realism !== "real") && cpCost() > cpBudget();
      const tip = document.getElementById("cpFootTip");
      if (tip) tip.innerHTML = over
        ? `<span style="color:var(--red)">已用点数超过额度，取消一个正面天赋、或补一个负面天赋再开始。</span>`
        : `确认后即进入第 1 周。每周结束时会自动存档。`;
      const btn = document.getElementById("cpStartBtn");
      if (btn) btn.disabled = !!over;
    }

    function cpPatchMsg() {
      cpInto("cpMsgBox", htmlMsg());
      cpPatchFoot();
    }

    /* ------------------------------------------------------------------
     * 骨架：整个页面只画这一次
     * ------------------------------------------------------------------ */

    function renderCreate() {
      if (!CP) return;
      const box = document.getElementById("createBody");
      if (!box) return;
      const h = [];
      h.push(`<div class="create-wrap">`);

      h.push(`<div class="create-head"><button class="btn" onclick="closeCreatePage()">← 返回主菜单</button><h1>新建存档</h1><div class="create-sub">选好名字与这一局的规则。真实度管「看得见什么」，难度管「数值有多狠」，两者互不影响。</div></div>`);
      h.push(`<div class="create-grid">`);

      /* —— 姓名 —— */
      h.push(`<section class="card create-card"><div class="tag-title">① 姓名</div>`);
      h.push(`<div class="name-input-row"><input type="text" id="cpNameInput" maxlength="8" placeholder="自己起一个名字" value="${cpEsc(CP.name)}" oninput="CP.name=this.value"><span class="mini-btn" onclick="cpRerollNames()">🎲 换一批</span></div>`);
      h.push(`<div class="namechips" id="cpNames">${htmlNames()}</div>`);
      h.push(`<div class="gender-row" id="cpGender">${htmlGender()}</div>`);
      h.push(`<div class="create-note">不想自己起名字，点上面五个里任意一个就行。</div></section>`);

      /* —— 真实度 + 难度 —— */
      h.push(`<section class="card create-card"><div class="tag-title">② 真实度 · 难度</div>`);
      h.push(`<div class="create-label">真实度（管显示）</div><div class="optgrid c3" id="cpRealism">${htmlRealism()}</div>`);
      h.push(`<div class="create-label">难度（管数值）</div><div class="optgrid c2" id="cpDiff">${htmlDiff()}</div>`);
      h.push(`<div id="cpHellNote">${htmlHellNote()}</div>`);
      h.push(`</section>`);

      /* —— 起始学期 —— */
      h.push(`<section class="card create-card"><div class="tag-title">③ 从哪个学期开始</div><div class="optgrid c3" id="cpPlan">${htmlPlan()}</div><div class="create-note">不管从哪一学期开始，终点都是<b>初三下毕业中考</b>。从中间年级开局时，各科会按那个年级应有的水平起步。</div></section>`);

      /* —— 生地成绩（会考后开局才出现，用 slot 占位） —— */
      h.push(`<div id="cpHkSlot">${htmlHkSection()}</div>`);

      /* —— 自选天赋（真实模式换成说明，用 slot 占位） —— */
      h.push(`<div id="cpTalentSlot">${htmlTalentSection()}</div>`);

      h.push(`</div>`);   // create-grid

      /* —— 底部 —— */
      const over = (CP.realism !== "real") && cpCost() > cpBudget();
      h.push(`<div class="card create-foot"><div class="foot-tip" id="cpFootTip">${over ? `<span style="color:var(--red)">已用点数超过额度，取消一个正面天赋、或补一个负面天赋再开始。</span>` : `确认后即进入第 1 周。每周结束时会自动存档。`}</div><button class="btn" onclick="closeCreatePage()">返回</button><button class="btn primary" id="cpStartBtn" ${over ? "disabled" : ""} onclick="cpCreate()">开始这一局 →</button></div>`);
      h.push(`</div>`);

      /* ★ 一次性塞进 DOM。之后所有点击都走 cpPatch*，不再碰这里。
       * 这里不是 showModal，不经过 nl2br，但仍保持标签内不留换行的习惯。 */
      box.innerHTML = h.join("");
    }

    /* 文本转义（名字可能由玩家自定义输入） */
    function cpEsc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    /* ------------------------------------------------------------------
     * 确认创建
     * ------------------------------------------------------------------ */

    function cpCreate() {
      if (!CP) return;
      const nm = String(CP.name || "").trim() || L("save.anon");

      /* 彩蛋：作者的名字不能用来建存档（自定义输入框还在，所以必须留着） */
      if (typeof isBannedName === "function" && isBannedName(nm)) {
        toast(L("cc.bannedToast"));
        const inp = document.getElementById("cpNameInput");
        if (inp) {inp.value = ""; inp.focus();}
        CP.name = "";
        cpMark("cpNames", "n", "");
        return;
      }

      /* 生地成绩：只有起点在会考之后才用 */
      const plan = (GAME_CONFIG.TERM_PLAN || []).find(p => p.id === CP.planId);
      let hk = null;
      if (plan && plan.from >= 4) {
        hk = {
          生物: clampNum(parseFloat(CP.hkBio), 0, 90, 60),
          地理: clampNum(parseFloat(CP.hkGeo), 0, 100, 60)
        };
      }

      /* 天赋：真实模式走随机池，其余用选好的清单 */
      let talents = null;
      if (CP.realism === "game" || CP.realism === "sim") {
        talents = cpAllTalents();
        if (cpCost() > cpBudget()) {
          CP.msg = "已用点数超过额度，先调整一下天赋。"; cpPatchMsg(); return;
        }
        /* 最后再查一遍双向互斥，防止改真实度 / 换家庭后残留冲突 */
        for (let i = 0; i < talents.length; i++) {
          for (let j = i + 1; j < talents.length; j++) {
            if (typeof talentsConflict === "function" && talentsConflict(talents[i], talents[j])) {
              CP.msg = `【${talents[i]}】与【${talents[j]}】互斥，不能同时带进这一局。`;
              cpPatchMsg(); return;
            }
          }
        }
      }

      /* 把这一页的选择落到全局，再开局 */
      applyStartSetup(CP.planId, CP.difficulty, CP.realism, {hk, talents});
      slotCur = CP.slot;

      newGame(nm, CP.gender, {hk, talents});
      if (typeof setBackground === "function") setBackground("main");

      const cs = document.getElementById("createScreen");
      if (cs) {cs.classList.add("hidden"); cs.innerHTML = "";}
      document.getElementById("startScreen").classList.add("hidden");
      document.getElementById("gameScreen").classList.remove("hidden");
      document.getElementById("log").innerHTML = "";
      say(L("cc.begin", nm), "sys");
      CP = null;
      startWeek();
    }
