/* ==================================================================
 * 内容层 · 破茧（负面天赋消除表）
 * ==================================================================
 * 每个负面天赋的消除条件与弹窗文案。
 * talent 要消除的天赋 / stat 靠什么行为累积 / need 需要多少次
 * grant 消除后赠送的正面天赋（可留空）/ title 弹窗标题 / text 正文 / poem 诗句。
 *
 * 维护等级：内容层（可加破茧）
 * ============================================================ */

    const CURES = [
      {talent: "厌学", stat: "study", need: 12,
        title: "重新翻开书本",
        text: "你又一次坐回书桌前。起初只是机械地翻页，翻到第三遍，那一行字忽然读通了。\n你把书合上，又翻开，重新看了一遍。",
        poem: "山重水复疑无路，柳暗花明又一村。"},
      {talent: "重度厌学", stat: "study", need: 22,
        title: "与课本和解",
        text: "以前看见课本就反胃。这回你坐下来，翻开，写完了两页练习。\n收拾书包时才发觉，坐下来这件事没费什么劲。",
        poem: "千淘万漉虽辛苦，吹尽狂沙始到金。"},
      {talent: "学习特困生", stat: "study", need: 15,
        title: "困意被你赶走了",
        text: "以前一翻开书，眼皮就重得像挂了铅。\n现在还是会困，但撑过那十分钟，后面就能接着写下去。\n昨晚你写到十点半，自己都没留意。",
        poem: "锲而舍之，朽木不折；锲而不舍，金石可镂。"},
      {talent: "注意力涣散", stat: "study", need: 14,
        title: "把心收了回来",
        text: "窗外有鸟，走廊有人，同桌在转笔。\n它们还在，你这节课抬头了两次，两次都自己低回来了。\n下课铃响时，笔记写到了第三题。",
        poem: "心不在焉，视而不见；心若在焉，万物皆明。"},
      {talent: "拖延症", stat: "study", need: 16, grant: "自律机器",
        title: "今天就把事做完",
        text: "「明天再说吧」这句话，你已经很久没说出口了。\n今天发的卷子，今天就订正完了。\n书包收好，桌上只剩笔盒。",
        poem: "明日复明日，明日何其多。我生待明日，万事成蹉跎。"},
      {talent: "迟钝", stat: "read", need: 8,
        title: "慢一点，也没关系",
        text: "你反应比别人慢半拍。\n那道题你读了三遍，第四遍才看出该从哪儿下手。\n再看类似的题时，你认出它了。",
        poem: "大器晚成，大音希声。"},
      {talent: "网瘾", stat: "rest", need: 10,
        title: "放下了那块屏幕",
        text: "你把手机扣在桌上，屏幕朝下。\n一开始手会痒。后来听见楼下有人打球，你下楼站了一会儿。\n回来时屏幕还是黑的。",
        poem: "偷得浮生半日闲，原来人间亦有味。"},
      {talent: "严重网瘾", stat: "rest", need: 14,
        title: "走出了那片峡谷",
        text: "一天不玩就浑身难受的日子过去了。\n账号还在，头像灰着，你一周没点开过。\n周末下午用来把衣柜收拾了一遍。",
        poem: "一入峡谷深似海，回头是岸亦是春。"},
      {talent: "夜猫子", stat: "rest", need: 8, grant: "晨型人",
        title: "看见了清晨五点",
        text: "五点四十醒了，不是熬夜，是要早起。\n操场上有雾，跑道上有露水，一个人也没有。\n你绕着走了一圈，回教室时灯刚亮。",
        poem: "一日之计在于晨，一年之计在于春。"},
      {talent: "长期失眠", stat: "rest", need: 12,
        title: "终于睡了一个整觉",
        text: "你闭上眼，没数羊，也没翻来覆去。\n再睁开时天已经亮了，窗帘缝里一条光。\n洗漱完才想起，昨晚没想那些事。",
        poem: "夜夜除非，好梦留人睡。"},
      {talent: "多动症", stat: "rest", need: 8,
        title: "学会了安静地坐着",
        text: "这回你坐了整整一节晚自习。\n中间起身接过一次水，回来接着写。\n铃响时那页正好写完。",
        poem: "心猿归正，意马收缰。"},
      {talent: "内耗者", stat: "rest", need: 10,
        title: "不再和自己吵架",
        text: "以前那些没说好的话，能在夜里翻来覆去想半天。\n这回念头刚冒出来，你翻了个身，睡了。\n第二天想起来，只记得要交作业。",
        poem: "抽刀断水水更流，不如放下任东流。"},
      {talent: "玻璃心", stat: "rest", need: 8,
        title: "心长出了一层茧",
        text: "别人那句话，你还是愣了一下。\n只愣了一下，然后接着把笔记抄完。\n放学路上没再想起来。",
        poem: "感时花溅泪，恨别鸟惊心；但使心能定，风过不留痕。"},
      {talent: "暴躁", stat: "rest", need: 8,
        title: "火气慢慢降了下来",
        text: "一点就着的日子过去了。\n今天被人撞了一下，你先把手里的书捡起来，才抬头。\n那三秒够用了。",
        poem: "猝然临之而不惊，无故加之而不怒。"},
      {talent: "深度抑郁", stat: "rest", need: 14,
        title: "心里的灯又亮了",
        text: "不知道从哪天起，早读又能读出声了。\n声音不大，但一句没落。\n同桌递来半块面包，你接了。",
        poem: "沉舟侧畔千帆过，病树前头万木春。"},
      {talent: "社恐", stat: "social", need: 10, grant: "热情",
        title: "先说了第一句",
        text: "以前在人多的地方浑身不自在。\n这回你先问了句「这题你写到哪了」，对方把卷子转过来给你看。\n后来聊到了打铃。",
        poem: "独坐幽篁里，亦有人来听。"},
      {talent: "社交恐惧", stat: "social", need: 15,
        title: "走出了那间教室",
        text: "和同桌说话不紧张了。\n你还是常常一个人待着，只是不再特意避开人。\n今天中午端着盘子坐到了人堆里。",
        poem: "举世皆浊我独清，众人皆醉我独醒；清者自清，醒者从容。"},
      {talent: "考试焦虑", stat: "goodExam", need: 4,
        title: "考场不再发抖",
        text: "发下卷子那一刻手还是有点凉。\n你写了名字，翻开第一页，第一道就会。\n往后四场，都是这样开头。",
        poem: "近乡情更怯，然归途终须至。"},
      {talent: "体弱多病", stat: "sport", need: 8,
        title: "身体慢慢跟上来了",
        text: "以前跑两百米就得扶着膝盖喘。\n这回绕操场跑完三圈才停，站在终点缓了半分钟。\n体育委员在表上给你勾了个数。",
        poem: "千磨万击还坚劲，任尔东西南北风。"},
    ];

    /* ==================================================================
     * 破茧的另一面：天赋退化
     * ------------------------------------------------------------------
     * 「破茧」不只是把负面天赋消掉 —— 放着不用，正面天赋也会悄悄走掉。
     *
     * 字段说明：
     *   talent   会退化掉的天赋
     *   stat     靠什么行为维持（study=学习 / sport=运动 / read=读书 / social=社交）
     *   idle     连续几周没做这件事就开始退化
     *   chance   达到条件后每周的退化概率
     *   grant    退化之后留下的阴影（负面天赋，可留空）
     *   title / text / poem  弹窗文案
     *
     * 想让某条永不退化，把 chance 改成 0 或直接删掉这一条。
     * ================================================================== */

    const TALENT_DECAY = [
      {talent: "过目不忘", stat: "study", idle: 3, chance: 0.30, grant: "",
        title: "背过的东西开始溜走",
        text: "你翻开上周背过的那页，只记得第一行。\n第二行怎么起头，想了半天。\n书角还折着，那页是上周折的。",
        poem: "学如逆水行舟，不进则退。"},
      {talent: "融会贯通", stat: "study", idle: 4, chance: 0.25, grant: "",
        title: "知识之间的线断了",
        text: "老师把两章串起来讲，你接不上。\n明明都学过，放一块儿就对不上了。\n课后借了同桌的笔记补那一段。",
        poem: "问渠那得清如许，为有源头活水来。"},
      {talent: "数学脑", stat: "study", idle: 4, chance: 0.22, grant: "",
        title: "数字不再听话了",
        text: "你盯着那道题，思路卡在第二步。\n以前你几乎不用想，笔就自己往下走了。\n你在旁边重新抄了一遍公式。",
        poem: "刀不磨要生锈，人不学要落后。"},
      {talent: "语感天成", stat: "study", idle: 4, chance: 0.22, grant: "",
        title: "读到一半卡住了",
        text: "那段话你读了三遍，还是没抓住它要说什么。\n语感这种东西，离开阅读一久就自己散了。\n你把那段又默读了两遍。",
        poem: "读书破万卷，下笔如有神；一日不读，笔涩三分。"},
      {talent: "单词机器", stat: "study", idle: 3, chance: 0.28, grant: "",
        title: "单词开始不认识了",
        text: "那个明明背过无数遍的词，此刻看着很陌生。\n你翻到单词表最前面，发现已经很久没往下走了。\n单词表还停在第三单元。",
        poem: "一日曝之，十日寒之，未有能生者也。"},
      {talent: "运筹帷幄", stat: "study", idle: 4, chance: 0.20, grant: "",
        title: "算不动了",
        text: "你在草稿纸上画了半天辅助线，画错了三次。\n以前这种题你扫一眼就有思路。\n最后借了同桌的草稿纸对了一遍。",
        poem: "业精于勤，荒于嬉。"},
      {talent: "博古通今", stat: "study", idle: 5, chance: 0.18, grant: "",
        title: "记不清是哪一年了",
        text: "老师说到一个年代，你脑子里只有模糊的一片。\n那些你曾经如数家珍的年份，正在一个个褪色。\n你翻回前面那页，把年表又抄了一遍。",
        poem: "以铜为镜，可以正衣冠；以史为镜，可以知兴替。"},
      {talent: "格物致知", stat: "study", idle: 4, chance: 0.20, grant: "",
        title: "原理讲不出来了",
        text: "你知道答案，但说不清为什么。\n以前你总要追问一句「为什么会这样」，现在你只是把结论抄下来。\n下课去问了老师一句，回来把理由补在旁边。",
        poem: "纸上得来终觉浅，绝知此事要躬行。"},
      {talent: "笔耕不辍", stat: "study", idle: 3, chance: 0.30, grant: "",
        title: "笔停在半路上",
        text: "你打开本子，写了两行，然后发起了呆。\n一天不写，两天不写，第三天就忘了为什么要写。\n本子合上时，第二行还空着半截。",
        poem: "一日一钱，千日千钱；绳锯木断，水滴石穿。"},
      {talent: "卷王", stat: "study", idle: 5, chance: 0.20, grant: "",
        title: "卷不动了",
        text: "你本该是这个教室里最拼的那个人。\n但连着好几周，你都在放学铃响的第一时间收拾书包。\n同桌收拾得比你还慢，你等了他一会儿。",
        poem: "靡不有初，鲜克有终。"},
      {talent: "学神降世", stat: "study", idle: 6, chance: 0.15, grant: "",
        title: "光环暗了下去",
        text: "没有人宣布，也没有什么仪式。\n只是某天你发现自己不再是那个「一看就会」的人了。\n晚自习你留到最后，把那道题重做了一遍。",
        poem: "天才是百分之一的灵感，加百分之九十九的汗水。"},
      {talent: "运动健将", stat: "sport", idle: 6, chance: 0.15, grant: "",
        title: "跑不动了",
        text: "两百米下来你就开始喘。\n操场还是那个操场，但你的腿已经不记得节奏了。\n你在跑道边站了一会儿，才回教室。",
        poem: "流水不腐，户枢不蠹。"},
      {talent: "钢筋铁骨", stat: "sport", idle: 8, chance: 0.12, grant: "",
        title: "开始容易生病了",
        text: "换季的时候你第一个倒下。\n以前你以为自己天生结实，后来才明白那不过是常年在动。\n校医开了张假条，你折好塞进笔盒。",
        poem: "养身莫善于习动。"},
    ];

    /* 该行为最近一次发生在第几周（用于判定"多久没做了"） */

    function lastDidWeek(stat) {
      if (!S) return -999;
      const map = {study: "didStudyWeek", sport: "didSportWeek", read: "didReadWeek", social: "didSocialWeek"};
      const key = map[stat];
      if (!key) return -999;
      return (S[key] == null) ? -999 : num(S[key], -999);
    }

    /* 连续几周没做这件事 */
    function idleWeeksOf(stat) {
      const last = lastDidWeek(stat);
      if (last < 0) return num(S.week, 0) + 1;      // 从没做过
      return Math.max(0, num(S.week, 0) - last);
    }

    /* 检查是否有天赋该退化，有就弹窗（一次只处理一个，弹完再查下一个） */

    function flushDecay(done) {
      if (!S || S.over || !Array.isArray(TALENT_DECAY)) {done && done(); return;}

      const hit = TALENT_DECAY.find(d =>
        Talent.have(d.talent)
        && idleWeeksOf(d.stat) >= num(d.idle, 99)
        && Math.random() < num(d.chance, 0)
      );
      if (!hit) {done && done(); return;}

      Talent.remove(hit.talent);
      let got = "";
      if (hit.grant && !Talent.have(hit.grant)) {
        gainTalent(hit.grant, "退化·免费");
        if (Talent.have(hit.grant)) got = `<div style="margin-top:5px;color:var(--red)">💧 你留下了阴影【${hit.grant}】</div>`;
      }
      say(`💧 退化：你失去了【${hit.talent}】。`, "talent");
      toast(`💧 退化：${hit.talent} 已消失`, false);
      checkAch();
      renderHUD();

      const body = `<div style="line-height:1.62">
        <div style="color:var(--red);font-size:.9rem">已失去天赋：<b>${hit.talent}</b></div>
        <div style="margin-top:5px;white-space:pre-wrap">${hit.text}</div>
        ${got}
        <div style="margin-top:6px;color:var(--dim);font-size:.82rem;font-style:italic">「${hit.poem}」</div>
      </div>`;
      showPopup({
        kind: "free", badge: "💧 退化", title: hit.title, body: body,
        options: [{t: L("modal.continue")}]
      }, () => flushDecay(done));
    }

    /* 累积「破茧」进度（只加数字，不弹窗） */

    function bumpCure(stat) {
      if (!S || S.over || !stat) return;
      S.cure = S.cure || {};
      for (const c of CURES) {
        if (c.stat !== stat) continue;
        if (!Talent.have(c.talent)) {S.cure[c.talent] = 0; continue;}
        S.cure[c.talent] = clampNum((S.cure[c.talent] || 0) + 1, 0, 999);
      }
    }

    /* 检查是否有天赋可以「破茧」，有就弹窗，弹完继续检查下一个 */

    function flushCure(done) {
      if (!S || S.over) {done && done(); return;}
      S.cure = S.cure || {};
      const hit = CURES.find(c => Talent.have(c.talent) && (S.cure[c.talent] || 0) >= c.need);
      if (!hit) {done && done(); return;}

      S.cure[hit.talent] = 0;
      Talent.remove(hit.talent);
      let got = "";
      if (hit.grant && !Talent.have(hit.grant)) {
        gainTalent(hit.grant, "破茧·免费");
        if (Talent.have(hit.grant)) got = `<div style="margin-top:5px;color:var(--green)">🌱 你同时领悟了新天赋【${hit.grant}】</div>`;
      }
      say(`🌱 破茧：你走出了【${hit.talent}】的阴影。`, "talent");
      toast(`🌱 破茧：${hit.talent} 已消除`, true);
      checkAch();
      renderHUD();

      const body = `<div style="line-height:1.62">
        <div style="color:var(--red);font-size:.9rem">已消除负面天赋：<b>${hit.talent}</b></div>
        <div style="margin-top:5px;white-space:pre-wrap">${hit.text}</div>
        ${got}
        <div style="margin-top:6px;color:var(--dim);font-size:.82rem;font-style:italic">「${hit.poem}」</div>
      </div>`;
      showPopup({
        kind: "free", badge: "🌱 破茧", title: hit.title, body: body,
        options: [{t: "继续走下去"}]
      }, () => flushCure(done));
    }

    /* 天赋面板上显示破茧进度，例如「🌱 5/12」 */

    function cureProgress(name) {
      if (!S || !S.cure || !Talent.have(name)) return "";
      const c = CURES.find(x => x.talent === name);
      if (!c) return "";
      const n = S.cure[name] || 0;
      return n > 0 ? ` <span style="color:var(--green);font-size:.72rem">🌱${n}/${c.need}</span>` : "";
    }

    /* ==================================================================
     * 结局
     * ================================================================== */
