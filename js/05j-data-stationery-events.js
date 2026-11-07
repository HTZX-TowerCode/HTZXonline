/* ==================================================================
 * 内容层 · 文具 / 图书联动事件（需求 15）
 * ------------------------------------------------------------------
 * 这三条事件里的变化不是文案，**真的会改 S.bag**：
 *   · bag_pen_lost     笔丢了 → 一支书写文具真的消失
 *   · bag_borrow_book  向同学借书 → 袋里多一本有到期日的书
 *   · bag_lend_book    同学借走我的书 → 书真的移出，到期回来
 * 用的都是 stationeryCmd() 里的中文指令，见 js/05i-data-stationery.js。
 *
 * ★ 散落状态下「笔丢了」的概率会抬高（bagLostBonus），
 *   由事件 w 权重动态计算，见下方 cond 里的写法。
 *
 * 维护等级：内容层（同学可直接改文案与 run 指令）
 * ================================================================== */

    const STATIONERY_EVENTS = [
      {
        id: "bag_pen_lost", w: 6, dist: "uniform", minGap: 11, slot: "weekday",
        cond: S => (typeof bagItems === "function") && bagItems("write").length > 0,
        t: "笔不见了",
        c: "自习课低头要写，手伸进笔袋摸了个空。\n同桌说他也没看见，前排回头问：「是不是滚到讲台底下去了？」",
        opts: [
          {t: "把书包倒出来找一遍", stam: 3,
            run: ["文具 丢失 书写", "压力 +3", "效率 -1", "提示 找到了橡皮、半张草稿纸，笔是真的没了。!bad"]},
          {t: "算了，先借支笔把课上完", stam: 1,
            run: ["文具 丢失 书写", "社交 +3", "心态 -2", "提示 同桌把备用笔推过来，没多问。"]},
          {t: "下课去小卖部再买一支", stam: 2,
            run: ["文具 丢失 书写", "经济 -12", "提示 回来时新笔已经插在袋里，旧的那支再也没出现。"]}
        ]
      },
      {
        id: "bag_scatter", w: 4, dist: "uniform", minGap: 14, slot: "weekend",
        cond: S => (typeof bagEnsure === "function") && (() => {bagEnsure(); return !S.bag.scattered && num(S.bag.bagDur, 60) < 28;})(),
        t: "拉链卡住了",
        c: "回家路上书包侧着拎了一路，到家才发现拉链崩开半边。\n笔、橡皮、书签散在车厢座位底下，捡回来时少了一两样。",
        opts: [
          {t: "攒钱买只新的", stam: 2,
            run: ["文具 散落", "提示 拉链彻底合不上了，东西只能先捧着。!bad"]},
          {t: "拿针线把拉链缝回去", stam: 5,
            run: ["文具 磨损 书写 4", "效率 +2", "亲情 +2", "提示 缝得歪歪扭扭，但还能再撑一阵。"]}
        ]
      },
      {
        id: "bag_borrow_book", w: 6, dist: "uniform", minGap: 10, slot: "weekday",
        cond: S => (typeof subjectsOf === "function") && num(S.term, 0) >= 0,
        t: "同学书桌上那本",
        c: "课间路过，看见同学桌角压着一本你惦记了好久的书，书角已经卷了。\n他抬头：「想看？拿去，记得还。」",
        opts: [
          {t: "借，说好三周后还", stam: 1,
            run: ["文具 借书 3周", "社交 +4", "心态 +3", "提示 书进了文具袋，扉页上写着别人的名字。!good"]},
          {t: "只翻两页就放回去", stam: 2,
            run: ["悟性 +3", "提示 那两页后来总在早读时冒出来。"]},
          {t: "问问能不能干脆卖给我", stam: 1,
            run: ["经济 -20", "文具 借书 5周", "社交 -1", "提示 他不肯卖，只把书往你这边推了推：「先看五周。」!sys"]}
        ]
      },
      {
        id: "bag_lend_book", w: 5, dist: "uniform", minGap: 12, slot: "weekday",
        cond: S => (typeof bagEnsure === "function") && (() => {bagEnsure(); return S.bag.items.some(it => it.cat === "book" && !it.borrowed);})(),
        t: "「借我看几天」",
        c: "后排的同学指了指你袋里那本：「这本我找了好久，借我几天行不行？」\n你有点犹豫 —— 自己还没读完。",
        opts: [
          {t: "借吧，说好三周", stam: 1,
            run: ["文具 借出 3周", "社交 +6", "心态 +2", "提示 书从袋里拿走了，那个位置空了一小块。!good"]},
          {t: "等我读完再说", stam: 0,
            run: ["社交 -2", "效率 +1", "提示 他「哦」了一声，你当晚多读了十页。"]},
          {t: "干脆送他", stam: 1,
            run: ["文具 丢失 任意", "社交 +8", "心态 +4", "提示 「真给我啊？」他把书抱得很紧。!good"]}
        ]
      },
      {
        id: "bag_bookmark", w: 4, dist: "uniform", minGap: 13, slot: "weekend",
        cond: S => num(S.prop.经济, 0) >= 12,
        t: "文具店新到的书签",
        c: "校门口那家小店进了一盒书签，压在玻璃板底下。\n有一枚是玉溪的云，颜色淡得刚好。",
        opts: [
          {t: "买下来夹进课本", stam: 1,
            run: ["文具 获得 bookmark", "经济 -10", "心态 +3", "提示 夹在课本第 38 页，后来翻到总要多看两眼。!good"]},
          {t: "看看就走", stam: 0,
            run: ["提示 那枚云后来被别人买走了，你记了挺久。"]}
        ]
      },
      {
        id: "bag_pingpong_class", w: 5, dist: "uniform", minGap: 10, slot: "weekday",
        cond: S => (typeof bagItems === "function"),
        t: "体育课要自带球拍",
        c: "体育老师提前一天说了：「明天乒乓球，自己带拍子，没带的去借或者站边上看。」\n你翻了翻书包。",
        opts: [
          {t: "袋里有拍子，直接去", stam: 4,
            cond: S => bagHas("pingpong") || bagHas("badminton"),
            run: ["文具 磨损 球拍 2", "健康 +6", "心态 +4", "压力 -5", "计数 运动", "提示 打了三局，出了一身汗，什么都没想。!good"]},
          {t: "没带，向同学借一副", stam: 5,
            run: ["社交 +4", "健康 +3", "压力 -2", "计数 运动", "提示 借来的拍子柄有点滑，但也打得很高兴。"]},
          {t: "站边上看了一节课", stam: 2,
            run: ["心态 -3", "效率 +2", "提示 你把明天要默的单词在心里过了一遍。"]}
        ]
      },

      /* ==================================================================
       * v1.5 B 批 · 新增 9 条联动（6 → 15 条）
       * ------------------------------------------------------------------
       * 用的都是「精确指令」：点名某一件文具，状态跟着文案一起变。
       * 前三条还带 needTalent / noTalent，天赋对文具事件也生效。
       * ================================================================== */
      {
        id: "bag_fountain_leak", w: 5, dist: "uniform", minGap: 12, slot: "weekday",
        cond: S => bagHas("fountain"),
        t: "钢笔漏墨了",
        c: "打开笔袋，钢笔帽里全是墨，手指一捏就黑了一片。\n同桌递来纸巾，说这支笔上周就有点漏。",
        opts: [
          {t: "拆开洗一洗，接着用", stam: 3,
            cond: S => Talent.have("匠心"),
            run: ["文具 修复 fountain 12", "效率 +2", "提示 洗了三遍，出水顺了，手上也干净了。!good"]},
          {t: "擦干净，先凑合写", stam: 1,
            run: ["文具 消耗 fountain 6", "压力 +2", "提示 卷子上还是洇了两个墨点。"]},
          {t: "算了，换回碳素笔", stam: 1,
            run: ["文具 移除 fountain", "文具 获得 gel_pen", "心态 -2", "提示 那支钢笔收进了抽屉最里面。"]}
        ]
      },
      {
        id: "bag_badminton_invite", w: 5, dist: "uniform", minGap: 11, slot: "weekend",
        cond: S => bagHas("badminton"),
        t: "楼下有人喊打球",
        c: "周六下午，楼下有人仰着头喊你名字，手里拎着一副球拍。\n你那只拍子挂在门后，线是上个月重新穿的。",
        opts: [
          {t: "带上拍子下去", stam: 5,
            run: ["文具 消耗 badminton 3", "健康 +7", "社交 +5", "压力 -6", "计数 运动", "提示 打到天暗，谁也没提作业。!good"]},
          {t: "只打半小时", stam: 3,
            run: ["文具 消耗 badminton 1", "健康 +3", "社交 +2", "提示 上楼时腿有点软。"]},
          {t: "隔着窗说今天不打了", stam: 0,
            run: ["心态 -2", "效率 +2", "提示 拍子还挂在门后，线没松。"]}
        ]
      },
      {
        id: "bag_calculator_lent", w: 4, dist: "uniform", minGap: 14, slot: "weekday",
        cond: S => bagHas("calculator"),
        t: "「计算器借我一下」",
        c: "数学课前，前排回头：「我那块电池没电了，借我用一节课。」\n你犹豫了一下——自己下节课也要用。",
        opts: [
          {t: "借，下课记得要回来", stam: 1,
            run: ["文具 移除 calculator", "社交 +4", "压力 +2", "提示 一节课都心不在焉，总往他桌上看。"]},
          {t: "借，但先说清考试不让带", stam: 1,
            run: ["文具 消耗 calculator 2", "社交 +3", "悟性 +2", "提示 他笑了笑：「知道，就平时用。」!good"]},
          {t: "说自己也正要用", stam: 0,
            run: ["社交 -2", "效率 +2", "提示 他「哦」了一声转回去，你那节课算得格外仔细。"]}
        ]
      },
      {
        id: "bag_compass_prick", w: 4, dist: "uniform", minGap: 13, slot: "weekday",
        cond: S => bagHas("ruler_set"),
        t: "圆规扎了一下",
        c: "几何课画辅助线，针尖滑出去，在食指上扎了个小点。\n血珠冒出来，同桌小声「嘶」了一下。",
        opts: [
          {t: "捏着手指继续画", stam: 1,
            run: ["文具 消耗 ruler_set 4", "效率 +3", "健康 -2", "提示 图还是画完了，铅笔痕有点抖。"]},
          {t: "去水龙头冲一下", stam: 2,
            run: ["健康 +2", "心态 +1", "提示 回来时老师已经讲下一题了。"]},
          {t: "把圆规收进袋底", stam: 1,
            run: ["文具 移除 ruler_set", "心态 -2", "提示 后来那半学期，圆都是拿瓶盖描的。"]}
        ]
      },
      {
        id: "bag_tin_drop", w: 4, dist: "uniform", minGap: 14, slot: "weekday",
        cond: S => bagHas("bag_tin"),
        t: "笔盒摔在地上了",
        c: "起身太急，铁皮笔盒从桌沿翻下去，「哐」的一声全班都回头。\n盖子歪了一点，扣不上。",
        opts: [
          {t: "蹲下来把边掰回去", stam: 3,
            cond: S => Talent.have("匠心") || Talent.have("道心如铁"),
            run: ["文具 修复 bag_tin 40", "效率 +2", "提示 掰了两次，盖子终于又「咔」地合上。!good"]},
          {t: "先凑合用，放学再弄", stam: 1,
            run: ["文具 修复 bag_tin 10", "压力 +2", "提示 一整天开笔盒都得两只手。"]},
          {t: "换回布袋子", stam: 2,
            run: ["文具 换袋", "心态 +2", "提示 布袋子轻得多，就是拉链有点涩。"]}
        ]
      },
      {
        id: "bag_notepad_full", w: 4, dist: "uniform", minGap: 15, slot: "weekend",
        cond: S => bagHas("notepad"),
        t: "小本写满最后一页",
        c: "随手记了大半个学期，最后一页也满了。\n前面写着哪天默单词、哪天借了谁的书，还有几页只画了格子。",
        opts: [
          {t: "去文具店再买一本", stam: 2,
            run: ["文具 移除 notepad", "文具 获得 notepad", "经济 -14", "悟性 +3", "提示 新本子第一页，你先写了日期。!good"]},
          {t: "从中间撕掉些旧页接着用", stam: 2,
            run: ["文具 消耗 notepad 3", "效率 +2", "提示 撕到那页借书记录时，停了一下。"]},
          {t: "夹进抽屉，先不买了", stam: 0,
            run: ["文具 移除 notepad", "心态 -1", "提示 之后想到什么，就写在草稿纸角上。"]}
        ]
      },
      {
        id: "bag_sticker_fade", w: 4, dist: "uniform", minGap: 15, slot: "weekend",
        t: "课程表贴纸翘边了",
        c: "贴在笔盒盖内侧那张课程表，边角翘起来一小块。\n周三那格被手指摸得发白。",
        opts: [
          {t: "去小店再买一张", stam: 1,
            run: ["文具 获得 sticker", "经济 -8", "效率 +2", "提示 新贴纸压得平平整整，看着挺舒服。!good"]},
          {t: "用透明胶把翘边粘住", stam: 2,
            run: ["效率 +1", "心态 +1", "提示 胶带有点黄，但那格还能看清。"]},
          {t: "撕掉算了", stam: 0,
            run: ["文具 移除 sticker", "心态 -2", "提示 盖内侧留了一小块胶印，擦不掉。"]}
        ]
      },
      {
        id: "bag_book_overdue", w: 5, dist: "uniform", minGap: 12, slot: "weekday",
        cond: S => (typeof bagEnsure === "function") && (() => {bagEnsure(); return S.bag.items.some(it => it.borrowed);})(),
        t: "扉页上那个名字",
        c: "翻到夹着书签的那页，看见扉页上写着别人的名字。\n借的时候说好三周，算下来就是这两天。",
        opts: [
          {t: "今天带去还了", stam: 1,
            run: ["文具 归还", "社交 +4", "心态 +2", "提示 他接过去翻了翻：「看完啦？」!good"]},
          {t: "再留两天，把最后一章抄完", stam: 3,
            run: ["学力 语文 +6", "压力 +3", "提示 抄到晚自习铃响，第二天还是还了。"]},
          {t: "装作忘了", stam: 0,
            run: ["社交 -4", "压力 +4", "提示 之后几天，路过他座位都绕着走。!bad"]}
        ]
      },
      {
        id: "bag_eraser_split", w: 5, dist: "uniform", minGap: 12, slot: "weekday",
        cond: S => bagHas("eraser") || bagHas("eraser_big"),
        t: "橡皮掰成了两半",
        c: "擦错一个字，手上劲大了点，橡皮从中间断成两截。\n一半滚到过道，被后排捡起来放讲台上了。",
        opts: [
          {t: "捡回来，小的那半接着用", stam: 1,
            run: ["文具 消耗 eraser 8", "效率 +1", "提示 小半块捏不住，但还能擦干净。"]},
          {t: "顺手把笔袋理一遍", stam: 2,
            run: ["文具 补齐 书写", "效率 +3", "心态 +2", "提示 笔、橡皮、尺子各归各位，看着清爽。!good"]},
          {t: "下课去买块新的", stam: 2,
            run: ["文具 移除 eraser", "文具 获得 eraser_big", "经济 -10", "提示 新的软，擦得干净，几乎不掉渣。"]}
        ]
      }
    ];

    /* 并入主事件表（幂等），与 05g-data-family.js 同一写法 */
    (function mergeStationeryEvents() {
      if (typeof EVENTS === "undefined") return;
      STATIONERY_EVENTS.forEach(e => {
        if (!EVENTS.some(x => x.id === e.id)) EVENTS.push(e);
      });
    })();

    /* 散落状态下「笔丢了」更容易出现：在事件抽取权重里加一点。
     * 不改引擎的通用权重表，只在这里挂一个钩子，由 pickEvent 读取。 */
    function bagEventWeightBoost(id) {
      if (id === "bag_pen_lost" && typeof bagLostBonus === "function") return bagLostBonus();
      return 0;
    }
