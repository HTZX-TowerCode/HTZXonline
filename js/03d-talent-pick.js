/* ==================================================================
 * 内容层 · 开局自选天赋 / 天赋扩充 / 蜕变（v1.4 需求 5、6）
 * ==================================================================
 * 这个文件在 js/03-data-talents.js 之后加载：
 *   · 直接往 TALENTS 里追加新天赋（对象可变，不用改原文件）
 *   · 直接往 TALENT_DECAY 里追加退化条目（数组可变）
 *
 * ★ 排斥表不用另建 —— 每个天赋自带的 `inc` 字段就是 incompatible 清单。
 *   但 inc 大多是单向的（A 写了 B、B 不一定写 A），所以校验时【两边都要查】。
 *
 * ★ 额度公式（维护者原话）：
 *     正面天赋 Lv 之和 − 负面天赋 Lv 之和 ≤ 额度
 *   游戏模式 6 点，模拟模式 4 点，家庭背景天赋【计入】额度。
 *   选一个负面天赋会降低左值 —— 等于「用短板换更多长处」，这是设计的一部分。
 *   若随机到的家庭天赋本身就超过额度，玩家可以再选一个负面天赋把它压回来。
 *
 * 维护等级：内容层（可加天赋、可改额度）
 * ================================================================== */

    /* ==================================================================
     * 一、补充天赋（10 个：6 正 / 4 负）
     * ------------------------------------------------------------------
     * 效果不是纯文案 —— 对应的数值钩子写在 js/15-engine-study.js：
     *   studySettle() / weeklySettle() / exam() 里各有一小段认这些名字。
     * 加新天赋时也照着在那里补一行，否则只是个好看的空壳。
     * ================================================================== */
    Object.assign(TALENTS, {
      "晨读书声": {lv: 3, inc: ["夜猫子", "熬夜冠军", "厌学"], desc: "语文/英语学习 +12%，心态每周 +1", hint: "早读课总第一个到", poem: "读书之乐乐何如，绿满窗前草不除。"},
      "错题本": {lv: 3, inc: ["拖延症", "学习特困生"], desc: "学习收益 +6%，悟性每周 +1", hint: "红笔订正，一道不落", poem: "前事不忘，后事之师。"},
      "草稿纸上的演算": {lv: 4, inc: ["迟钝", "学习特困生", "上课走神"], desc: "数学学习 +18%，考试噪声减小", hint: "一张草稿纸写满整道题", poem: "纸上得来终觉浅，绝知此事要躬行。"},
      "操场晨光": {lv: 3, inc: ["体弱多病", "长期失眠"], desc: "健康每周 +5，运动收益 +15%", hint: "天刚亮就绕着跑道走", poem: "清晨入古寺，初日照高林。"},
      "一手好字": {lv: 2, inc: ["注意力涣散", "多动症"], desc: "语文考试 +6%，心态每周 +2", hint: "板书常被老师拍照", poem: "字如其人，笔下有风。"},
      "问不停": {lv: 4, inc: ["社恐", "高冷", "社交恐惧"], desc: "悟性每周 +3，社交每周 +2", hint: "下课总追着老师问", poem: "敏而好学，不耻下问。"},
      "偏科到极点": {lv: 3, inc: ["融会贯通", "偏科怪才", "知行合一"], desc: "最弱科学习收益 -25%", hint: "有一科怎么都学不进去", poem: "术业有专攻，可惜专错了方向。"},
      "考前抱佛脚": {lv: 3, inc: ["自律机器", "静水流深", "笔耕不辍"], desc: "平时学习收益 -12%，但大考前一周突击有效", hint: "平时不烧香", poem: "临阵磨枪，不快也光。"},
      "丢三落四": {lv: 2, inc: ["匠心", "自律机器", "过目不忘"], desc: "每周有概率丢一点钱", hint: "笔、饭卡、作业本，总少一样", poem: "顾此失彼，忙中常错。"},
      "上课走神": {lv: 3, inc: ["道心如铁", "心如止水", "草稿纸上的演算"], desc: "学习收益 -15%，效率每周 -3", hint: "窗外一只鸟能看半节课", poem: "心不在焉，视而不见。"}
    });

    /* 新天赋也进随机池，这样事件 / 读书 / 破茧都能碰到它们。
     * 真实模式（不开放自选）仍走原来的 rollStartTalents()。 */
    if (typeof TALENT_DECAY !== "undefined") {
      TALENT_DECAY.push(
        {talent: "晨读书声", stat: "read", idle: 5, chance: 0.20, grant: "",
          title: "早读的声音远了",
          text: "你还是会在早读时翻开书，只是不再读出声。\n那些曾经顺口就能背下的句子，读起来忽然有点生。\n声音是要天天出声才留得住的。",
          poem: "三日不读，口生荆棘。"},
        {talent: "草稿纸上的演算", stat: "study", idle: 4, chance: 0.22, grant: "",
          title: "草稿纸空了",
          text: "你盯着题干，脑子里却不再自动铺开那张草稿纸。\n一步一步写下来这个习惯，原来也会忘。\n算式还在，只是没人替你动笔了。",
          poem: "拳不离手，曲不离口。"},
        {talent: "问不停", stat: "social", idle: 6, chance: 0.18, grant: "",
          title: "不再追问了",
          text: "老师说完了，你点点头，把没懂的那句咽了回去。\n以前你会举手问到对方换三种讲法。\n好奇是要说出口才活着的。",
          poem: "疑而不问，其惑终不解。"},
        {talent: "操场晨光", stat: "sport", idle: 6, chance: 0.16, grant: "",
          title: "天亮得越来越晚",
          text: "闹钟响的时候你翻了个身，又睡了过去。\n操场上的雾还在，只是没人在那圈跑道上数圈数了。\n晨光不等人，但也不催人。",
          poem: "闻鸡起舞，贵在不辍。"}
      );
    }

    /* ==================================================================
     * 二、正 / 负面判定
     * ------------------------------------------------------------------
     * BAD_TALENTS 定义在 js/06-data-books.js（本文件之后加载）。
     * 这里的函数都是玩家点开页面时才调用，那时全都加载完了；
     * 仍给一份兜底清单，防止单独跑体检脚本时取不到。
     * ================================================================== */
    const BAD_TALENT_FALLBACK = [
      "厌学", "重度厌学", "学习特困生", "注意力涣散", "拖延症", "迟钝",
      "网瘾", "严重网瘾", "夜猫子", "长期失眠", "多动症", "内耗者",
      "玻璃心", "暴躁", "深度抑郁", "社恐", "社交恐惧", "考试焦虑", "体弱多病",
      "家徒四壁", "单亲家庭", "留守少年", "偏食",
      "偏科到极点", "考前抱佛脚", "丢三落四", "上课走神"
    ];

    function badTalentList() {
      return (typeof BAD_TALENTS !== "undefined" && Array.isArray(BAD_TALENTS))
        ? BAD_TALENTS.concat(["偏科到极点", "考前抱佛脚", "丢三落四", "上课走神"])
        : BAD_TALENT_FALLBACK;
    }

    function isBadTalent(n) {return badTalentList().indexOf(n) >= 0;}

    function talentLv(n) {return (TALENTS[n] && num(TALENTS[n].lv, 1)) || 1;}

    /* ==================================================================
     * 三、开局自选：额度与互斥
     * ================================================================== */
    const TALENT_PICK_BUDGET = {game: 6, sim: 4};
    const TALENT_PICK_POOL_SIZE = 20;

    function pickBudget(mode) {return num(TALENT_PICK_BUDGET[mode], 4);}

    /* 已选清单的「点数」= Σ正面 Lv − Σ负面 Lv */
    function pickCost(names) {
      return (names || []).reduce((a, n) => a + (isBadTalent(n) ? -talentLv(n) : talentLv(n)), 0);
    }

    /* ★ 双向查 inc —— 单向写在表里，两边都要问 */
    function talentsConflict(a, b) {
      if (!a || !b || a === b) return false;
      const A = TALENTS[a], B = TALENTS[b];
      if (!A || !B) return false;
      return (A.inc || []).indexOf(b) >= 0 || (B.inc || []).indexOf(a) >= 0;
    }

    /* 返回与 name 冲突的已选项（没有则空数组） */
    function conflictsWith(name, chosen) {
      return (chosen || []).filter(x => talentsConflict(name, x));
    }

    /* 抽 20 个候选：排除家庭背景类，保证正负都有 */
    function rollTalentCandidates() {
      const fam = (typeof FAMILY_TALENTS !== "undefined") ? FAMILY_TALENTS : [];
      const all = Object.keys(TALENTS).filter(n => fam.indexOf(n) < 0);
      const shuffled = all.slice().sort(() => Math.random() - 0.5);
      const bad = shuffled.filter(isBadTalent);
      const good = shuffled.filter(n => !isBadTalent(n));
      const needBad = Math.min(4, bad.length);
      const out = bad.slice(0, needBad).concat(good.slice(0, TALENT_PICK_POOL_SIZE - needBad));
      /* 池子不够时把剩下的补回来 */
      for (const n of shuffled) {if (out.length >= TALENT_PICK_POOL_SIZE) break; if (out.indexOf(n) < 0) out.push(n);}
      return out.slice(0, TALENT_PICK_POOL_SIZE);
    }

    /* 家庭背景天赋：游戏模式自选，模拟模式随机，真实模式不开放 */
    function familyPickMode(mode) {
      if (mode === "game") return "choose";
      if (mode === "sim") return "random";
      return "none";
    }

    function rollFamilyTalent() {
      const fam = (typeof FAMILY_TALENTS !== "undefined") ? FAMILY_TALENTS : [];
      return fam.length ? fam[rnd(fam.length)] : "";
    }

    /* ==================================================================
     * 四、蜕变（需求 6 的「蜕变」）
     * ------------------------------------------------------------------
     * 破茧 = 消掉负面天赋；退化 = 久不练习失去正面天赋；
     * 蜕变 = 正面天赋练到一定程度，升级成更高阶的同一路天赋。
     *
     * 字段：from / stat（看 S.cnt 里哪个计数）/ need / into / 文案
     * 触发点挂在 16-flow.js 的 afterAction() 链里（flushCure 之后）。
     * ================================================================== */
    const TALENT_EVOLVE = [
      {from: "晨读书声", stat: "read", need: 14, into: "语感天成",
        title: "读着读着，字自己有了声音",
        text: "你早已不需要刻意读出声了。\n一段文字拿在手里，哪里顿、哪里转，身体比脑子先知道。\n那些早读课一遍遍念过的句子，最后长成了语感。",
        poem: "读书百遍，其义自见。"},
      {from: "错题本", stat: "quiz", need: 16, into: "融会贯通",
        title: "错题本变薄了",
        text: "你翻回第一页，发现那些红笔标注的题，现在看一眼就知道错在哪。\n后来你不再抄错题了 —— 不是懒，是它们之间本来就连着。\n一法通，万法通。",
        poem: "温故而知新，可以为师矣。"},
      {from: "草稿纸上的演算", stat: "study", need: 24, into: "数学脑",
        title: "草稿纸装进了脑子里",
        text: "你还是会在纸上写，但更多时候，步骤在落笔前就已经排好了。\n一张张草稿纸叠起来，最后变成了不用纸也能走完的那条路。",
        poem: "操千曲而后晓声，观千剑而后识器。"},
      {from: "操场晨光", stat: "sport", need: 14, into: "运动健将",
        title: "跑道记住了你",
        text: "你不再需要闹钟。天蒙蒙亮，人就已经在操场上了。\n一圈、两圈，呼吸自己找到了节奏。\n身体把这件事记了下来，比脑子记得牢。",
        poem: "流水不腐，户枢不蠹。"},
      {from: "一手好字", stat: "study", need: 18, into: "静水流深",
        title: "字慢了下来，人也慢了下来",
        text: "以前你练的是横平竖直，后来练的是坐得住。\n一页字写完，心里那些毛躁的东西也跟着落了地。\n字是静出来的，人也是。",
        poem: "非淡泊无以明志，非宁静无以致远。"},
      {from: "问不停", stat: "social", need: 16, into: "七窍玲珑",
        title: "问题问到了别人心里",
        text: "你还是爱问，只是不再只问「这道题怎么做」。\n你开始问对方为什么这么想、卡在哪一步。\n问得多了，别人还没开口，你大概就猜到了。",
        poem: "心有灵犀一点通。"}
    ];

    /* 检查是否有天赋该蜕变，有就弹窗，弹完继续查下一个（一次只处理一个） */
    function flushEvolve(done) {
      if (!S || S.over || !Array.isArray(TALENT_EVOLVE)) {done && done(); return;}
      const cnt = S.cnt || {};
      const hit = TALENT_EVOLVE.find(e =>
        Talent.have(e.from) && num(cnt[e.stat], 0) >= num(e.need, 9999)
        && !!TALENTS[e.into] && !Talent.have(e.into)
      );
      if (!hit) {done && done(); return;}

      /* 先移除旧天赋，再用「免费 + 悟道」理由绕过 gainTalent 的门槛。
       * 蜕变是练出来的，不该再收一次悟性、也不该被 Lv6 门槛挡住。 */
      Talent.remove(hit.from);
      gainTalent(hit.into, "蜕变·免费·悟道");
      /* unlock 可能因「同等级天赋已达 3 个」被拒 —— 蜕变是练出来的，
       * 不该被这个上限卡住，所以兜底直接写进 owned。 */
      if (!Talent.have(hit.into)) {
        Talent.owned.push(hit.into);
        Talent.solve();
      }
      say(`✨ 蜕变：【${hit.from}】化作【${hit.into}】。`, "talent");
      toast(`✨ 蜕变：${hit.into}`, true);
      if (typeof checkAch === "function") checkAch();
      if (typeof renderHUD === "function") renderHUD();

      const body = `<div style="line-height:1.62">
        <div style="color:var(--green);font-size:.9rem">${hit.from} → <b>${hit.into}</b> Lv.${talentLv(hit.into)}</div>
        <div style="margin-top:5px;white-space:pre-wrap">${hit.text}</div>
        <div style="margin-top:6px;color:var(--dim);font-size:.82rem;font-style:italic">「${hit.poem}」</div>
      </div>`;
      showPopup({
        kind: "free", badge: "✨ 蜕变", title: hit.title, body: body,
        options: [{t: "继续走下去"}]
      }, () => flushEvolve(done));
    }
