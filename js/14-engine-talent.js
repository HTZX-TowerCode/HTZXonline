/* ==================================================================
 * 引擎层 · 天赋管理
 * ==================================================================
 * 天赋的拥有、矛盾裁剪、解锁判定、等级上限、悟性消耗。
 *
 * 维护等级：引擎层（一般不动）
 * ============================================================ */

    /* ==================================================================
     * v1.5 B 批 · 天赋排斥统一改成「双向」
     * ------------------------------------------------------------------
     * 数据表里的 inc 大多是单向写的（82 处里 91 条边只有一侧）。
     * 以前 solve() / unlock() 只查「新天赋自己写了谁」，于是：
     *   已有 A（A.inc 里没写 B）→ 获得 B（B.inc 里写了 A）
     *   → 两者同时留在面板上，互斥关系形同虚设。
     *
     * ★ 不把 91 条单向边硬补成对称表 —— 那要内容作者维护两份。
     *   引擎统一按「任一侧写了对方」判定，作者只写一边就够。
     *   js/03d-talent-pick.js 的 talentsConflict() 是同一套口径。
     * ================================================================== */
    function talentPairConflict(a, b) {
      if (!a || !b || a === b) return false;
      const A = TALENTS[a], B = TALENTS[b];
      if (!A || !B) return false;
      return (A.inc || []).indexOf(b) >= 0 || (B.inc || []).indexOf(a) >= 0;
    }

    const Talent = {
      owned: [],
      have(n) {return this.owned.includes(n)},
      solve() {
        /* 等级高的先留；同等级按原有顺序，先到先得。
         * 双向查冲突，避免「只读一侧」漏掉反向排斥。 */
        const sorted = [...this.owned].filter(n => TALENTS[n])
          .sort((a, b) => TALENTS[b].lv - TALENTS[a].lv);
        const kept = [];
        for (const t of sorted) {
          if (kept.some(k => talentPairConflict(k, t))) continue;
          kept.push(t);
        }
        this.owned = kept;
      },
      countByLevel() {
        const c = {};
        this.owned.forEach(t => {const lv = TALENTS[t].lv; c[lv] = (c[lv] || 0) + 1;});
        return c;
      },
      unlock(name) {
        const me = TALENTS[name];
        if (!me) return [false, "没有这个天赋"];
        if (this.have(name)) return [false, "已拥有该天赋"];
        const byLv = this.countByLevel();
        if ((byLv[me.lv] || 0) >= 3) return [false, `Lv.${me.lv} 天赋已达上限(3个)`];
        /* v1.5 B 批：双向找出所有冲突项，而不只是 me.inc。
         * 高等级的冲突项挡住新天赋，低等级的被新天赋取代。 */
        const removed = []; let blocked = null;
        this.owned = this.owned.filter(x => {
          if (!talentPairConflict(name, x)) return true;
          if (!TALENTS[x] || TALENTS[x].lv >= me.lv) {blocked = x; return true;}
          removed.push(x); return false;
        });
        if (blocked) return [false, `已有更高等级矛盾天赋【${blocked}】`];
        this.owned.push(name);
        this.solve();
        return [true, null, removed];
      },
      remove(name) {this.owned = this.owned.filter(x => x !== name); this.solve()}
    };

    /* 返回 true / false，让读书等场景知道「到底解锁成功没有」，
     * 别把成就计数记在一个没拿到的天赋上。 */
    function gainTalent(name, reason) {
      if (Talent.have(name)) return false;
      const t = TALENTS[name];
      if (!t) return false;
      if (t.lv >= 7 && S && S.prop.悟性 < 120 && !(reason || "").includes("悟道")) {
        say(`【${name}】需要极高的悟性（≥120），你尚未触及。`, "bad");
        modProp("悟性", 2);
        return false;
      }
      if (t.lv >= 6 && S && !(reason || "").includes("悟道")) {
        const ok = S.prop.悟性 >= 110 || S.prop.心态 >= 110 || S.prop.健康 >= 110 || S.prop.效率 >= 110;
        if (!ok) {say(`【${name}】的门槛太高，你尚未触及。`, "bad"); modProp("悟性", 2); return false;}
      }
      const cost = t.lv * 5;
      if (S && S.prop.悟性 < cost && !(reason || "").includes("免费")) {
        say(`解锁【${name}】需要 ${cost} 悟性，你悟性不足（当前 ${Math.round(S.prop.悟性)}）。`, "bad");
        return false;
      }
      if (S && !(reason || "").includes("免费")) modProp("悟性", -cost);
      const [ok, msg, removed] = Talent.unlock(name);
      if (ok) {
        if (removed && removed.length) {
          say(`🔄 获得【${name}】后，原有的低等级矛盾天赋【${removed.join("、")}】被取代。`, "sys");
        }
        const gainTxt = `🔓 获得天赋【${name}】(Lv.${t.lv})——${t.desc}${reason ? `(${reason})` : ""}`;
        say(gainTxt, "talent");
        /* 与本次事件文本合在同一个反馈弹窗里确认（需求 9） */
        if (typeof fbUnlock === "function") fbUnlock(gainTxt, "talent");
        toast(`🔓 天赋:${name}`);
        /* 立刻刷新，让新天赋马上出现在左侧面板上，而不是等下一次渲染 */
        if (typeof renderHUD === "function") renderHUD();
      } else {
        /* v1.5 B 批：冲突不再是一句含糊的「有所感悟」。
         * 明确写出挡路的是哪个天赋，并把这份机缘折成悟性。 */
        const conflict = (typeof talentPairConflict === "function")
          ? Talent.owned.find(x => talentPairConflict(name, x)) : null;
        const why = conflict
          ? `与已有天赋【${conflict}】相斥（${msg || "等级更高"}）`
          : (msg || "条件未满足");
        say(`未能获得【${name}】：${why}。这份机缘折成了悟性。`, "bad");
        modProp("悟性", conflict ? 5 : 3);
        if (typeof toast === "function") toast(`🔒 ${name} 与【${conflict || "已有天赋"}】相斥`);
        return false;
      }
      return true;
    }
