/* ==================================================================
 * 内容层 · 随机事件扩充（v1.5 C 批 / 需求 2）
 * ------------------------------------------------------------------
 * 30 条校园日常，专门补「后期反复抽到同一条」的空档。
 * 全部 dist:uniform + minGap，和社团扩充一起把 120 周的重复率压下来。
 * ★ 不写 cond 硬门槛（除年级/季节/once），避免把池子切得太碎。
 *
 * 维护等级：内容层（随便改）
 * ================================================================== */

    const EXTRA_EVENTS = [
      {id: "ex_morning_read",
        w: 4,
        dist: "uniform",
        minGap: 9,
        slot: "weekday",
        t: "早读",
        c: "铃响前十分钟，教室里只有翻书声。\n你昨晚那篇课文还没背下来。",
        opts: [
          {t: "站起来小声背", stam: 2, run: ["悟性 +4", "效率 +3", "健康 -1", "提示 背到第三遍，窗外的天亮了一点。!good"]},
          {t: "先抄一遍再背", stam: 2, run: ["效率 +4", "悟性 +2", "文具 磨损 书写 2", "提示 抄完手有点酸，字倒是记住了。"]},
          {t: "趴一会儿", run: ["健康 +3", "心态 +2", "效率 -2", "提示 老师进门时你刚好抬起头。"]}
        ]},      {id: "ex_canteen_line",
        w: 4,
        dist: "uniform",
        minGap: 10,
        slot: "weekday",
        t: "食堂排队",
        c: "队伍拐了两个弯，前面有人在讲上周的球赛。",
        opts: [
          {t: "接着听", stam: 1, run: ["社交 +5", "心态 +3", "提示 轮到你时，红烧的刚好没了。"]},
          {t: "背两个单词", stam: 1, run: ["悟性 +3", "效率 +2", "提示 打饭时脑子里还转着那两个词。"]}
        ]},      {id: "ex_blackboard",
        w: 4,
        dist: "uniform",
        minGap: 14,
        slot: "weekday",
        t: "黑板报约稿",
        c: "宣传委员拿着粉笔站在后黑板前，还空着右上角一块。",
        opts: [
          {t: "接下那块", stam: 3, run: ["社交 +6", "悟性 +3", "压力 +3", "提示 画了三节课，粉笔灰落了一袖子。!good"]},
          {t: "帮忙递粉笔", stam: 1, run: ["社交 +3", "心态 +2", "提示 没留名字，但那块板后来很好看。"]}
        ]},      {id: "ex_seat_change",
        w: 4,
        dist: "uniform",
        once: true,
        minGap: 20,
        slot: "weekday",
        t: "换了座位",
        c: "班主任按身高重排，你从第三排挪到了靠窗。",
        opts: [
          {t: "把桌面擦干净再摆书", stam: 1, run: ["效率 +4", "心态 +3", "提示 窗边能看见操场一角，光也好。!good"]},
          {t: "先跟新同桌打个招呼", stam: 1, run: ["社交 +5", "心态 +3", "提示 他把靠窗那半边让给了你。"]}
        ]},      {id: "ex_uniform_zip",
        w: 4,
        dist: "uniform",
        minGap: 16,
        slot: "weekday",
        season: ["秋", "冬"],
        t: "校服拉链",
        c: "跑操前拉链卡在半截，怎么拽都不动。",
        opts: [
          {t: "拿铅笔芯蹭两下", stam: 1, run: ["效率 +4", "文具 消耗 pencil_stub 1", "提示 顺了，正好赶上整队。!good"]},
          {t: "敞着去跑", run: ["健康 -2", "心态 +3", "提示 风灌了一路，倒也没人说什么。"]}
        ]},      {id: "ex_umbrella",
        w: 4,
        dist: "uniform",
        minGap: 13,
        slot: "weekday",
        season: ["春", "夏"],
        t: "雨天借伞",
        c: "放学雨没停，你没带伞。走廊上有人在收伞。",
        opts: [
          {t: "问同学借", stam: 1, run: ["社交 +5", "心态 +3", "提示 伞不大，两个人肩膀都湿了半边。!good"]},
          {t: "等雨小一点", run: ["悟性 +3", "健康 -2", "提示 等了二十分钟，雨真的斜着变小了。"]}
        ]},      {id: "ex_weekly_journal",
        w: 4,
        dist: "uniform",
        minGap: 12,
        slot: "weekend",
        t: "周记本",
        c: "周记本发下来，上周那页只写了个日期。",
        opts: [
          {t: "把这周真发生的事写上去", stam: 2, run: ["悟性 +5", "心态 +4", "提示 写了半页，没用什么漂亮话。!good"]},
          {t: "补一段景物凑够行数", stam: 1, run: ["效率 +3", "悟性 +2", "提示 老师批了个「阅」，没多写。"]}
        ]},      {id: "ex_chalk_dust",
        w: 4,
        dist: "uniform",
        minGap: 15,
        slot: "weekday",
        t: "粉笔灰",
        c: "值日擦黑板，粉笔灰扬起来，落了一讲台。",
        opts: [
          {t: "先洒点水再擦", stam: 2, run: ["效率 +4", "健康 +2", "提示 灰没起来，黑板也干净。!good"]},
          {t: "直接拍掉", stam: 1, run: ["健康 -2", "心态 +2", "提示 咳了两声，袖子白了一片。"]}
        ]},      {id: "ex_run_lag",
        w: 4,
        dist: "uniform",
        minGap: 14,
        slot: "weekday",
        t: "跑操掉队",
        c: "绕操场三圈，第二圈鞋带散了。",
        opts: [
          {t: "出列系好再追上", stam: 3, run: ["健康 +4", "效率 +3", "提示 追到队尾时，第三圈刚好开始。!good"]},
          {t: "踩着鞋带跑完", stam: 2, run: ["健康 -4", "心态 +4", "提示 没摔，但最后半圈是跳着走的。"]}
        ]},      {id: "ex_late",
        w: 4,
        dist: "uniform",
        minGap: 18,
        slot: "weekday",
        t: "迟到",
        c: "早读铃响过一分钟，你还在楼梯拐角。",
        opts: [
          {t: "从后门轻轻进去", stam: 1, run: ["压力 +3", "效率 +2", "提示 老师抬了下眼，没说什么。"]},
          {t: "在门口喊报告", stam: 1, run: ["社交 +3", "心态 -2", "压力 +2", "提示 全班都回头了，那分钟特别长。"]}
        ]},      {id: "ex_eye_exercise",
        w: 4,
        dist: "uniform",
        minGap: 16,
        slot: "weekday",
        t: "眼保健操",
        c: "广播里的口令放到第三节，值周生在门口记名字。",
        opts: [
          {t: "认真按完四节", stam: 1, run: ["健康 +3", "效率 +2", "提示 睁眼时黑板上的字清楚了一点。"]},
          {t: "眯着眼睛看窗外", run: ["心态 +3", "效率 -2", "提示 操场上有人在搬桌子，看了整整四节。"]}
        ]},      {id: "ex_water_room",
        w: 4,
        dist: "uniform",
        minGap: 12,
        slot: "weekday",
        season: ["秋", "冬"],
        t: "水房打水",
        c: "晚自习前水房排了队，热水壶咕嘟咕嘟响。",
        opts: [
          {t: "帮前排也提一壶", stam: 2, run: ["社交 +5", "心态 +3", "提示 后来他总替你占靠墙那个位置。!good"]},
          {t: "打完就走", stam: 1, run: ["效率 +2", "健康 +1", "提示 壶盖没拧紧，一路滴到教室。"]}
        ]},      {id: "ex_rank_sheet",
        w: 4,
        dist: "uniform",
        minTerm: 1,
        minGap: 20,
        slot: "weekday",
        t: "月考排名",
        c: "成绩条贴在教室后墙，边角卷起来一点。",
        opts: [
          {t: "从头看到尾", stam: 1, run: ["悟性 +3", "压力 +4", "效率 +2", "提示 看清了自己那一行，也看清了前后。"]},
          {t: "只看自己那行", stam: 1, run: ["心态 +3", "效率 +2", "提示 折好夹进书里，没再看第二眼。"]}
        ]},      {id: "ex_new_teacher",
        w: 4,
        dist: "uniform",
        once: true,
        minGap: 22,
        slot: "weekday",
        t: "换了老师",
        c: "这节课进来的是位新老师，粉笔拿在左手。",
        opts: [
          {t: "把笔记格式改过来", stam: 2, run: ["效率 +5", "悟性 +3", "提示 两节课后就跟上了她的节奏。!good"]},
          {t: "先听一节再说", run: ["心态 +3", "悟性 +2", "提示 下课铃响，黑板上留了满满一板。"]}
        ]},      {id: "ex_subject_rep",
        w: 4,
        dist: "uniform",
        once: true,
        minGap: 24,
        slot: "weekday",
        t: "当课代表",
        c: "课代表转学了，老师点到你的名字。",
        opts: [
          {t: "接下收作业这摊事", stam: 2, run: ["社交 +6", "效率 +4", "压力 +3", "提示 一周下来，谁没交你比谁都清楚。!good"]},
          {t: "推给同桌", run: ["社交 +2", "心态 +2", "提示 他答应得挺爽快，你松了口气。"]}
        ]},      {id: "ex_chalk_writing",
        w: 4,
        dist: "uniform",
        minGap: 15,
        slot: "weekday",
        t: "粉笔字",
        c: "板书抄到一半，粉笔断了两截。",
        opts: [
          {t: "换半截接着写", stam: 1, run: ["效率 +3", "悟性 +2", "提示 字小了一圈，但没漏内容。"]},
          {t: "借同桌的记号笔补", run: ["社交 +3", "效率 +2", "提示 颜色不一样，反倒好找。"]}
        ]},      {id: "ex_bike_tire",
        w: 4,
        dist: "uniform",
        minGap: 20,
        slot: "weekend",
        t: "自行车爆胎",
        c: "周末返校，推到半路后轮瘪了。",
        opts: [
          {t: "推到修车摊补胎", stam: 3, run: ["经济 -8", "健康 +2", "效率 +3", "提示 到校门时晚自习刚打铃。!good"]},
          {t: "锁在路边走过去", stam: 4, run: ["健康 +3", "压力 +3", "提示 走了四十分钟，鞋底磨得有点热。"]}
        ]},      {id: "ex_power_cut",
        w: 4,
        dist: "uniform",
        once: true,
        minGap: 26,
        slot: "weekday",
        t: "晚自习停电",
        c: "灯一下全灭了，走廊里有人「哇」了一声。",
        opts: [
          {t: "摸出小本把白天没想完的题接着算", stam: 2, run: ["悟性 +5", "效率 +3", "提示 借着应急灯算完，来电时刚好收笔。!good"]},
          {t: "和同桌小声说话", stam: 1, run: ["社交 +5", "心态 +4", "提示 那十分钟比一整节晚自习都短。"]}
        ]},      {id: "ex_week_duty",
        w: 4,
        dist: "uniform",
        minGap: 22,
        slot: "weekday",
        t: "值周生",
        c: "这周轮到你们班值周，早到半小时站在校门口。",
        opts: [
          {t: "认真记每一个迟到的", stam: 2, run: ["效率 +4", "压力 +3", "社交 +2", "提示 记了三行，最后一个是隔壁班的熟人。"]},
          {t: "站到边上帮着指路", stam: 2, run: ["社交 +5", "心态 +3", "提示 有家长问食堂怎么走，你指了两次。!good"]}
        ]},      {id: "ex_paper_review",
        w: 4,
        dist: "uniform",
        minGap: 12,
        slot: "weekday",
        t: "试卷讲评",
        c: "卷子发回来，老师从最后一道大题往前讲。",
        opts: [
          {t: "把错的地方用红笔标出来", stam: 2, run: ["悟性 +5", "效率 +4", "文具 消耗 gel_pen 2", "提示 红笔迹后来比原题还显眼。!good"]},
          {t: "只听，不动笔", run: ["心态 +3", "效率 -2", "提示 听懂了，但下次还是同一个地方卡住。"]}
        ]},      {id: "ex_wrong_book",
        w: 4,
        dist: "uniform",
        minGap: 14,
        slot: "weekend",
        t: "错题本",
        c: "翻到第一页，那道题现在看已经不难了。",
        opts: [
          {t: "在旁边写一句为什么当时错", stam: 2, run: ["悟性 +6", "效率 +3", "提示 写完发现，错的其实不是计算。!good"]},
          {t: "翻过去看下一页", stam: 1, run: ["效率 +3", "心态 +2", "提示 后面还有半本，慢慢来。"]}
        ]},      {id: "ex_deskmate_eraser",
        w: 4,
        dist: "uniform",
        minGap: 16,
        slot: "weekday",
        t: "同桌的橡皮",
        c: "同桌那块橡皮被掰成了两半，一半推到了你这边。",
        opts: [
          {t: "收下，回头带块新的", stam: 1, run: ["社交 +5", "心态 +3", "文具 获得 eraser", "提示 第二天你把新的放在了他桌角。!good"]},
          {t: "用一下就还回去", run: ["社交 +2", "效率 +2", "提示 擦得挺干净，还是还了。"]}
        ]},      {id: "ex_gate_parent",
        w: 4,
        dist: "uniform",
        minGap: 18,
        slot: "weekend",
        t: "校门口等家长",
        c: "周五放学，校门口挤满了人，有人在举着伞找孩子。",
        opts: [
          {t: "慢慢往外走，边走边看", stam: 1, run: ["心态 +4", "亲情 +2", "提示 走到第三棵树下才看见自家的车。"]},
          {t: "先在传达室写完作业", stam: 2, run: ["效率 +4", "悟性 +2", "提示 天暗下来时，门口已经空了。"]}
        ]},      {id: "ex_midterm_push",
        w: 4,
        dist: "uniform",
        minGap: 22,
        slot: "weekday",
        t: "期中动员",
        c: "黑板上写了倒计时，班主任在讲台前站了很久。",
        opts: [
          {t: "把要复习的科目列成一张单子", stam: 2, run: ["效率 +6", "悟性 +3", "压力 +2", "文具 消耗 notepad 2", "提示 单子贴在笔盒盖内侧，每天看一眼。!good"]},
          {t: "听完就算", run: ["心态 +3", "效率 -2", "提示 铃一响，大家又低头写自己的了。"]}
        ]},      {id: "ex_return_bus",
        w: 4,
        dist: "uniform",
        minGap: 12,
        slot: "weekend",
        t: "返校的车",
        c: "周日下午的车挤得满满的，书包只能抱在膝盖上。",
        opts: [
          {t: "把要交的作业再清点一遍", stam: 1, run: ["效率 +4", "压力 -2", "提示 数到最后一本，心就放下了。!good"]},
          {t: "靠窗看一路", stam: 1, run: ["心态 +4", "健康 +2", "提示 田埂往后退，天慢慢暗了。"]}
        ]},      {id: "ex_winter_water",
        w: 4,
        dist: "uniform",
        minGap: 18,
        slot: "weekday",
        season: ["冬"],
        t: "冬天的热水",
        c: "水房那排龙头只有两个出热水，手冻得握不住杯。",
        opts: [
          {t: "排队等", stam: 2, run: ["健康 +3", "心态 +2", "提示 捧着杯子回教室，一路都是暖的。!good"]},
          {t: "接了凉水就走", stam: 1, run: ["健康 -3", "效率 +2", "提示 喝了一口，彻底醒了。"]}
        ]},      {id: "ex_desk_carve",
        w: 4,
        dist: "uniform",
        once: true,
        minGap: 24,
        slot: "weekday",
        t: "课桌刻字",
        c: "换座位后发现桌角有人刻了极小的一行字，得凑近才看得清。",
        opts: [
          {t: "拿纸拓下来", stam: 1, run: ["悟性 +4", "心态 +3", "提示 拓片上那行字，像是好几年前留的。"]},
          {t: "用书压住那一角", run: ["效率 +2", "心态 +2", "提示 后来再没人注意过那儿。"]}
        ]},      {id: "ex_magazine",
        w: 4,
        dist: "uniform",
        minGap: 16,
        slot: "weekday",
        t: "传阅的杂志",
        c: "一本卷了边的杂志传到手上，已经翻到中间了。",
        opts: [
          {t: "看完再传给下一个人", stam: 2, run: ["悟性 +4", "社交 +3", "提示 里面有篇讲红塔山旧事的，你多看了两遍。!good"]},
          {t: "直接传走", stam: 0, run: ["效率 +2", "社交 +2", "提示 传到哪儿去了，后来也没问。"]}
        ]},      {id: "ex_radio_song",
        w: 4,
        dist: "uniform",
        minGap: 20,
        slot: "weekday",
        season: ["春", "夏"],
        t: "广播站点歌",
        c: "午间广播有人点了首歌，说是送给初三的。",
        opts: [
          {t: "停下来听完", stam: 1, run: ["心态 +5", "压力 -3", "提示 歌放完，操场上一时没人说话。!good"]},
          {t: "接着做题", stam: 1, run: ["效率 +3", "悟性 +2", "提示 旋律飘过去，笔没停。"]}
        ]},      {id: "ex_grad_photo",
        w: 4,
        dist: "uniform",
        once: true,
        minTerm: 4,
        minGap: 30,
        slot: "weekday",
        t: "毕业照",
        c: "初三下，操场上摆好了拍照的架子，一班一班轮。",
        opts: [
          {t: "站到最边上，把校服拉平", stam: 2, run: ["心态 +8", "社交 +5", "提示 快门按下去时，有人喊了句什么。!good"]},
          {t: "帮着搬凳子", stam: 2, run: ["社交 +4", "健康 +2", "效率 +3", "提示 照片里没有你，但架子上每排都齐。"]}
        ]},
    ];

    (function mergeExtraEvents() {
      if (typeof EVENTS === "undefined") return;
      EXTRA_EVENTS.forEach(e => {if (!EVENTS.some(x => x.id === e.id)) EVENTS.push(e);});
    })();


/* ==================================================================
 * 内容层 · 长链事件（v1.5 C 批 / 需求 4）
 * ------------------------------------------------------------------
 * 5 条主线，最长 6 层；每层 2~3 个分支，不同选项指向不同收束，
 * 也会在中途汇合 —— 不是一条线走到底。
 *
 *   A 一张没交的报名表  6 层 · 竞赛线
 *   B 山顶那封信        5 层 · 校史线
 *   C 旧楼的电闸        6 层 · 校园线
 *   D 校刊约稿          5 层 · 写作线
 *   E 操场边那棵树      4 层 · 时间线
 *
 * 规则（重要）：
 *   · 只有第 1 层 w>0 且 once:true —— 从随机池开一次头。
 *   · 后续层 w:0、epic:true，只能由上一层的 next 排队弹出。
 *   · **后续层不要写 cond** —— 排队分支不跑 eventAllowed，
 *     写了条件一旦不满足，链会无声断掉。
 *   · next 可写单个 id，也可写数组（一层排两段）。
 *   · 深度上限 GAME_CONFIG.epicMaxDepth = 6，由 16-flow.js 统一把关。
 *
 * 维护等级：内容层（加层就加一个 epic(...)，别动引擎）
 * ================================================================== */

    const EPIC_EVENTS = [
      {id: "ep_form_1",
        w: 4,
        dist: "uniform",
        once: true,
        minTerm: 1,
        minGap: 0,
        slot: "weekday",
        t: "一张没交的报名表",
        c: "楼梯口贴了竞赛班选拔的通知，报名表在讲台角上放了一叠。\n你拿了一张，折了两折夹进课本。",
        opts: [
          {t: "填了，放学前交上去", stam: 2, next: "ep_form_2a", run: ["效率 +3", "压力 +2", "提示 交完那一叠里少了最上面一张。!good"]},
          {t: "先放抽屉，再想想", stam: 1, next: "ep_form_2b", run: ["心态 +2", "效率 +2", "提示 抽屉一开一合，那张纸一直在。"]},
          {t: "不交了，把表放回去", stam: 1, run: ["心态 +3", "效率 -2", "提示 那一叠后来被别人拿空了。"]}
        ]},      {id: "ep_form_2a",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "名单贴出来了",
        c: "公示栏前围了一圈人。你的名字在第三行，后面跟着集训时间。",
        opts: [
          {t: "去找老师问清楚集训怎么排", stam: 2, next: "ep_form_3a", run: ["社交 +4", "效率 +3", "提示 老师翻了翻本子：「周三下午，先来听一节。」"]},
          {t: "先自己找两本书看", stam: 2, next: "ep_form_3b", run: ["悟性 +5", "效率 +2", "提示 书角上写着上一届谁借过。"]}
        ]},      {id: "ep_form_2b",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "抽屉里那张纸",
        c: "周末整理书包，报名表从课本里滑出来，边角已经起毛。",
        opts: [
          {t: "还是交了吧", stam: 2, next: "ep_form_3a", run: ["心态 +4", "效率 +3", "压力 +2", "提示 周一早读前塞进了办公室门缝。!good"]},
          {t: "扔进废纸篓", stam: 1, run: ["心态 +2", "效率 -2", "提示 纸落下去的时候很轻。"]}
        ]},      {id: "ep_form_3a",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "集训第一课",
        c: "教室在旧楼四层，黑板上一整面都是没见过的符号。\n下课铃响时，你只抄了半页。",
        opts: [
          {t: "留下来把后半节补完", stam: 3, next: "ep_form_4a", run: ["悟性 +7", "效率 +4", "压力 +4", "健康 -2", "提示 值日生关灯时你才收笔。!good"]},
          {t: "先回去，明天再说", stam: 1, next: "ep_form_4c", run: ["健康 +2", "心态 +2", "效率 -2", "提示 那半页空白一直夹在笔记本里。"]}
        ]},      {id: "ep_form_3b",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "图书馆那排架子",
        c: "最下面一层压着几本旧教材，封面上盖了图书室的章。",
        opts: [
          {t: "借两本回去", stam: 2, next: "ep_form_4b", run: ["悟性 +6", "文具 借书 4周", "效率 +2", "提示 借阅本上，上一个名字是三年前的。!good"]},
          {t: "站着翻完", stam: 1, run: ["悟性 +3", "健康 -2", "提示 腿站麻了，只记住了其中一章。"]}
        ]},      {id: "ep_form_4a",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "第一次模拟赛",
        c: "题目比月考长，最后一题写到铃响还剩两行。",
        opts: [
          {t: "考完留在教室对答案", stam: 3, next: "ep_form_5a", run: ["悟性 +6", "压力 +5", "效率 +3", "提示 对了三道，错的那道恰好是最后两行。!good"]},
          {t: "不看，直接回家", stam: 1, next: "ep_form_5b", run: ["心态 +4", "健康 +3", "提示 卷子折起来塞进袋底，一周没打开。"]}
        ]},      {id: "ep_form_4b",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "笔记攒了半本",
        c: "自己看的那些，慢慢攒成了半本笔记，字越写越小。",
        opts: [
          {t: "拿去给老师看一眼", stam: 2, next: "ep_form_5a", run: ["社交 +5", "悟性 +4", "效率 +3", "提示 他翻到中间那页，停了几秒：「这个想法可以。」!good"]},
          {t: "自己留着", stam: 1, run: ["心态 +4", "效率 +2", "提示 本子合上时，边角已经卷了。"]}
        ]},      {id: "ep_form_4c",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "那半页空白",
        c: "第二天回去，黑板擦干净了，笔记本上那半页还是空的。",
        opts: [
          {t: "借同学的补齐", stam: 2, next: "ep_form_5b", run: ["社交 +5", "悟性 +3", "提示 补完发现，后半节其实就讲了一件事。"]},
          {t: "空着就空着", stam: 1, run: ["心态 +2", "效率 -2", "提示 后来翻到那页，还是能想起那天没听懂的地方。"]}
        ]},      {id: "ep_form_5a",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "市里那场比赛",
        c: "通知单上写着周六上午，集合地点在校门口。\n名额只有一个。",
        opts: [
          {t: "去", stam: 4, next: "ep_form_6", run: ["压力 +5", "健康 -2", "效率 +4", "提示 上车时天还没全亮。!good"]},
          {t: "把名额让出去", stam: 1, run: ["社交 +6", "心态 +4", "效率 -3", "提示 那天你在教室做了一套自己的卷子。"]}
        ]},      {id: "ep_form_5b",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "成绩条",
        c: "成绩条从袋底翻出来，折痕压得很深。",
        opts: [
          {t: "贴回桌上", stam: 1, next: "ep_form_6", run: ["效率 +4", "悟性 +3", "提示 每次抬头都看得见那两行空白。"]},
          {t: "折好收进抽屉", stam: 1, run: ["心态 +4", "压力 -3", "提示 和上学期那些纸放在了一起。"]}
        ]},      {id: "ep_form_6",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "回学校那天",
        c: "从赛场回来，旧楼四层的灯还亮着。\n黑板上换了一整面新东西。",
        opts: [
          {t: "进去坐下，接着抄", stam: 3, run: ["悟性 +8", "效率 +6", "心态 +5", "提示 这回你把整页都抄完了。!good"]},
          {t: "在门口站一会儿再走", stam: 1, run: ["心态 +6", "压力 -4", "提示 里面有人抬头，冲你点了下头。"]},
          {t: "回自己教室", stam: 1, run: ["效率 +3", "健康 +3", "提示 晚自习的铃刚好响。"]}
        ]},      {id: "ep_letter_1",
        w: 3,
        dist: "uniform",
        once: true,
        minGap: 0,
        slot: "weekend",
        t: "山顶那封信",
        c: "爬红塔山秋游，石缝里有个压扁了的纸包，外面缠了细铁丝。",
        opts: [
          {t: "拆开看", stam: 2, next: "ep_letter_2a", run: ["悟性 +4", "心态 +3", "提示 里头是一张没寄出去的信，字被雨水洇过一半。"]},
          {t: "照原样放回去", stam: 1, next: "ep_letter_2b", run: ["心态 +3", "效率 +2", "提示 石缝合上，像什么也没发生过。"]}
        ]},      {id: "ep_letter_2a",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekend",
        t: "没寄出去的字",
        c: "能认出来的只有落款和一个地名，收信人那栏糊成了一团。",
        opts: [
          {t: "拿回教室慢慢辨", stam: 2, next: "ep_letter_3a", run: ["悟性 +6", "效率 +3", "提示 对着台灯看了两晚，认出了半个校名。"]},
          {t: "交给班主任", stam: 1, next: "ep_letter_3b", run: ["社交 +5", "心态 +3", "提示 老师把纸压在玻璃板底下，没多问。"]}
        ]},      {id: "ep_letter_2b",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekend",
        t: "又路过那道石缝",
        c: "两周后再上山，石缝还是那样，纸包却不见了。",
        opts: [
          {t: "在旁边坐一会儿", stam: 1, next: "ep_letter_3b", run: ["心态 +5", "压力 -3", "提示 风从塔那头过来，很凉。"]},
          {t: "下山", stam: 1, run: ["健康 +3", "效率 +2", "提示 台阶数到一半就忘了数。"]}
        ]},      {id: "ep_letter_3a",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "半个校名",
        c: "认出来的那半个校名，和校史墙上的旧照片对上了。",
        opts: [
          {t: "去校史墙核对", stam: 3, next: "ep_letter_4a", run: ["悟性 +7", "效率 +4", "提示 照片底下那行小字，和信上的笔迹很像。!good"]},
          {t: "先抄下来，不急着问", stam: 2, next: "ep_letter_4b", run: ["悟性 +4", "心态 +3", "提示 抄在小本最后一页，压平了。"]}
        ]},      {id: "ep_letter_3b",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "玻璃板底下",
        c: "那张纸在老师办公桌的玻璃板底下压了一周，边角翘起来。",
        opts: [
          {t: "问老师后来怎么样了", stam: 1, next: "ep_letter_4b", run: ["社交 +6", "悟性 +3", "提示 他说：「那时候的信，好多都没寄出去。」"]},
          {t: "不再提", stam: 1, run: ["心态 +3", "压力 -2", "提示 后来玻璃板底下换了张课程表。"]}
        ]},      {id: "ep_letter_4a",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "照片里的人",
        c: "校史墙第三排，一张黑白合影，前排有人手里也捏着个纸包。",
        opts: [
          {t: "把日期记下来", stam: 2, next: "ep_letter_5", run: ["悟性 +6", "效率 +4", "提示 日期和信上那个秋天对得上。"]},
          {t: "拍一张存着", stam: 1, next: "ep_letter_5", run: ["效率 +3", "社交 +2", "提示 照片有点反光，但人还在。"]}
        ]},      {id: "ep_letter_4b",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekend",
        t: "小本最后一页",
        c: "抄下来的那半行字，被夹在小本最后一页，翻到时总慢半拍。",
        opts: [
          {t: "照着那个地名写封信", stam: 2, next: "ep_letter_5", run: ["悟性 +5", "心态 +6", "压力 -3", "提示 没寄，写完压在同一页底下。"]},
          {t: "把那页折个角", stam: 1, next: "ep_letter_5", run: ["心态 +4", "效率 +2", "提示 折角后来一直没摊平。"]}
        ]},      {id: "ep_letter_5",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekend",
        t: "又一个秋天",
        c: "第二年秋天再上山，塔下的叶子落了一层。\n石缝空着，风比上次大。",
        opts: [
          {t: "把自己的纸条压进去", stam: 2, run: ["心态 +8", "悟性 +4", "提示 缠了细铁丝，学上一个人的样子。!good"]},
          {t: "什么也不留，站一会儿", stam: 1, run: ["心态 +6", "压力 -4", "提示 下山时天还亮着。"]}
        ]},      {id: "ep_switch_1",
        w: 4,
        dist: "uniform",
        once: true,
        minGap: 0,
        slot: "weekday",
        t: "旧楼的电闸",
        c: "旧楼四层总跳闸，晚自习一停电，走廊就有人起哄。\n电闸箱在楼梯拐角，锁扣是坏的。",
        opts: [
          {t: "找总务处报修", stam: 1, next: "ep_switch_2a", run: ["效率 +4", "社交 +3", "提示 登记本上已经有三条同一样的字。"]},
          {t: "自己把闸推上去", stam: 2, next: "ep_switch_2b", run: ["效率 +5", "健康 -2", "提示 「啪」一声，四层全亮了。"]}
        ]},      {id: "ep_switch_2a",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "登记本",
        c: "总务处的登记本翻到这周，旧楼四层已经写了三回。",
        opts: [
          {t: "把前三回的日期抄下来", stam: 2, next: "ep_switch_3a", run: ["悟性 +5", "效率 +3", "提示 三回都在周三，都在晚自习第二节。"]},
          {t: "合上本子回去", stam: 1, run: ["心态 +2", "效率 -2", "提示 那晚没再跳，第二天又跳了。"]}
        ]},      {id: "ep_switch_2b",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "又跳了",
        c: "推上去不到十分钟，「啪」地又黑了。\n这回连应急灯都没亮。",
        opts: [
          {t: "摸黑下楼找总闸", stam: 3, next: "ep_switch_3a", run: ["健康 -3", "效率 +4", "悟性 +3", "提示 台阶数错了两级，但找到了。"]},
          {t: "站在原地等", stam: 1, run: ["心态 +3", "压力 +3", "提示 有人打着手电从楼下上来。"]}
        ]},      {id: "ep_switch_3a",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "都是周三",
        c: "三回都在周三，都在同一节课。\n那节课四层只有竞赛班在用。",
        opts: [
          {t: "去问那间教室用了什么电器", stam: 2, next: "ep_switch_4a", run: ["社交 +5", "悟性 +4", "提示 角落里一台旧投影仪，插头烫手。"]},
          {t: "把规律写给总务老师", stam: 2, next: "ep_switch_4b", run: ["效率 +5", "社交 +3", "提示 他看了看本子：「行，我让人来看看。」"]}
        ]},      {id: "ep_switch_4a",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "烫手的插头",
        c: "投影仪是上届留下的，风扇转起来像风吹纸。",
        opts: [
          {t: "拔掉，先不用它", stam: 2, next: "ep_switch_5a", run: ["效率 +5", "压力 +3", "提示 那晚四层的灯一次没跳。!good"]},
          {t: "接着用，讲完这节再说", stam: 1, next: "ep_switch_5b", run: ["悟性 +4", "健康 -2", "提示 讲到一半又黑了，这回大家没起哄。"]}
        ]},      {id: "ep_switch_4b",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "来修的人",
        c: "师傅扛着梯子上来，拆开电闸箱看了看，又合上了。",
        opts: [
          {t: "在旁边扶着梯子", stam: 3, next: "ep_switch_5a", run: ["社交 +5", "健康 +2", "效率 +3", "提示 他边拧螺丝边说：「线老了，不怪你们。」"]},
          {t: "回教室等着", stam: 1, next: "ep_switch_5b", run: ["心态 +3", "效率 +2", "提示 灯亮起来时，全班「哦」了一声。"]}
        ]},      {id: "ep_switch_5a",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "换线那周",
        c: "旧线抽出来，新线穿进去，四层停了两天课。",
        opts: [
          {t: "去帮忙搬桌子", stam: 3, next: "ep_switch_6", run: ["健康 +3", "社交 +5", "效率 +3", "提示 桌子从四层挪到三层，又挪回来。"]},
          {t: "趁停课把笔记补完", stam: 2, next: "ep_switch_6", run: ["悟性 +5", "效率 +4", "提示 两天补完了一整章。!good"]}
        ]},      {id: "ep_switch_5b",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "后来还是跳",
        c: "期末前又跳了一次，这回没人起哄，各自摸出小灯。",
        opts: [
          {t: "把自己的小灯借给前排", stam: 1, next: "ep_switch_6", run: ["社交 +6", "心态 +4", "提示 那一小片亮着，够写两行字。"]},
          {t: "就着走廊的光收书包", stam: 1, next: "ep_switch_6", run: ["效率 +3", "心态 +2", "提示 早点走，也没什么不好。"]}
        ]},      {id: "ep_switch_6",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "四层的灯",
        c: "毕业前最后一次上旧楼四层，灯是亮的，电闸箱换了新锁扣。",
        opts: [
          {t: "在楼梯拐角站一会儿", stam: 1, run: ["心态 +7", "压力 -4", "提示 那声「啪」再也想不起来是什么时候没有的。!good"]},
          {t: "上楼把那间教室再看一眼", stam: 2, run: ["悟性 +5", "社交 +3", "提示 投影仪还在角落，插头早拔了。"]}
        ]},      {id: "ep_mag_1",
        w: 4,
        dist: "uniform",
        once: true,
        minGap: 0,
        slot: "weekday",
        t: "校刊约稿",
        c: "校刊编辑在走廊拦住你：「这期想找人写点校园里的东西，八百字。」",
        opts: [
          {t: "接下", stam: 1, next: "ep_mag_2a", run: ["压力 +3", "效率 +3", "提示 稿纸给了两张，截止日写在右上角。"]},
          {t: "说再想想", stam: 1, next: "ep_mag_2b", run: ["心态 +2", "社交 +2", "提示 她把稿纸塞进你手里：「想想也行，别弄丢。」"]}
        ]},      {id: "ep_mag_2a",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekend",
        t: "写什么",
        c: "两张稿纸摊在桌上，第一行的格子空了一整晚。",
        opts: [
          {t: "写操场边那棵树", stam: 2, next: "ep_mag_3a", run: ["悟性 +5", "心态 +4", "提示 从动笔到收尾只用了一节晚自习。"]},
          {t: "写晚自习的灯", stam: 2, next: "ep_mag_3b", run: ["悟性 +4", "效率 +3", "提示 写着写着，抬头看了看窗外。"]}
        ]},      {id: "ep_mag_2b",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekend",
        t: "稿纸在袋底",
        c: "稿纸被课本压了三天，右上角那个日期一天比一天近。",
        opts: [
          {t: "今晚就写", stam: 3, next: "ep_mag_3a", run: ["压力 +4", "效率 +4", "提示 台灯下写到十一点，字越写越挤。"]},
          {t: "去说不写了", stam: 1, run: ["社交 +3", "心态 +3", "提示 编辑「哦」了一声，把稿纸收了回去。"]}
        ]},      {id: "ep_mag_3a",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekend",
        t: "第一稿",
        c: "八百字写满了，读一遍，觉得前半段太用力。",
        opts: [
          {t: "删掉前三行", stam: 2, next: "ep_mag_4a", run: ["悟性 +5", "效率 +4", "提示 从第四行开始，反倒顺了。!good"]},
          {t: "原样交上去", stam: 1, next: "ep_mag_4b", run: ["心态 +3", "社交 +2", "提示 交完就后悔了，但没好意思要回来。"]}
        ]},      {id: "ep_mag_3b",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekend",
        t: "写到灯那句",
        c: "写到「四层的灯一次没跳」，笔停了很久。",
        opts: [
          {t: "就停在这儿，收尾", stam: 2, next: "ep_mag_4a", run: ["心态 +6", "悟性 +4", "提示 最后一句比前面都短。"]},
          {t: "再补一段解释", stam: 2, next: "ep_mag_4b", run: ["效率 +3", "压力 +3", "提示 补完读了一遍，又把那段划掉了。"]}
        ]},      {id: "ep_mag_4a",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "编辑改了几个字",
        c: "清样贴出来，你的名字排在第三栏，有两处被红笔改过。",
        opts: [
          {t: "去问为什么改", stam: 1, next: "ep_mag_5", run: ["社交 +5", "悟性 +5", "提示 她说：「你原来那句更好，但版面放不下。」"]},
          {t: "照清样读一遍", stam: 1, next: "ep_mag_5", run: ["心态 +5", "效率 +3", "提示 改过的两处，读起来确实更轻。"]}
        ]},      {id: "ep_mag_4b",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "没登上的那版",
        c: "这期出来了，第三栏是别人的稿子。\n编辑在走廊上远远说了句「下期还找你」。",
        opts: [
          {t: "把原稿收进抽屉", stam: 1, next: "ep_mag_5", run: ["心态 +4", "悟性 +3", "提示 稿纸边角已经软了。"]},
          {t: "当场重写一版", stam: 3, next: "ep_mag_5", run: ["效率 +5", "压力 +4", "提示 这回第一行就没空着。!good"]}
        ]},      {id: "ep_mag_5",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "下一期",
        c: "新一期的约稿又贴出来了，这回没写题目，只留了一行空白。",
        opts: [
          {t: "领一张稿纸", stam: 1, run: ["心态 +7", "悟性 +5", "社交 +3", "提示 右上角还是那个日期格式。!good"]},
          {t: "路过时看一眼就走", stam: 1, run: ["心态 +4", "效率 +2", "提示 空白留着，也挺好。"]}
        ]},      {id: "ep_tree_1",
        w: 3,
        dist: "uniform",
        once: true,
        minGap: 0,
        slot: "weekday",
        t: "操场边那棵树",
        c: "跑道拐角那棵树被风刮断了一根枝，断口很白。",
        opts: [
          {t: "去找园艺师傅", stam: 1, next: "ep_tree_2a", run: ["社交 +4", "效率 +3", "提示 他说明天来锯平，不然会劈到树干。"]},
          {t: "捡一截断枝回去", stam: 1, next: "ep_tree_2b", run: ["悟性 +3", "心态 +4", "提示 断枝搁在窗台上，一周就干透了。"]}
        ]},      {id: "ep_tree_2a",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "锯平那天",
        c: "师傅带了手锯，断口修成一个斜面，说这样雨水不会积。",
        opts: [
          {t: "在旁边看着", stam: 1, next: "ep_tree_3", run: ["悟性 +5", "效率 +3", "提示 木屑落了一地，很快被风吹散。"]},
          {t: "帮忙把断枝搬走", stam: 2, next: "ep_tree_3", run: ["健康 +3", "社交 +4", "提示 两个人抬着，比想象中沉。"]}
        ]},      {id: "ep_tree_2b",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekend",
        t: "窗台上那截",
        c: "断枝在窗台上搁了一个学期，皮裂开一道细缝。",
        opts: [
          {t: "拿来做书签", stam: 2, next: "ep_tree_3", run: ["悟性 +4", "心态 +5", "文具 获得 bookmark", "提示 夹在课本里，翻到时会慢半拍。!good"]},
          {t: "扔进花坛", stam: 1, next: "ep_tree_3", run: ["心态 +3", "效率 +2", "提示 下过一场雨，就找不着了。"]}
        ]},      {id: "ep_tree_3",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "又一年春天",
        c: "开春再跑过那个拐角，断口边上冒了一圈新芽。",
        opts: [
          {t: "绕过去看一眼", stam: 1, next: "ep_tree_4", run: ["心态 +6", "悟性 +4", "提示 新芽比去年那根枝还绿。"]},
          {t: "照旧跑过去", stam: 1, next: "ep_tree_4", run: ["健康 +4", "效率 +2", "提示 步子没停，眼角扫到了一点绿。"]}
        ]},      {id: "ep_tree_4",
        w: 0,
        dist: "uniform",
        epic: true,
        minGap: 0,
        slot: "weekday",
        t: "毕业前最后一圈",
        c: "体考完那天，绕着操场又走了一圈，走到拐角慢下来。",
        opts: [
          {t: "在树下站一会儿", stam: 1, run: ["心态 +8", "压力 -5", "提示 风过来，叶子响了一阵。!good"]},
          {t: "拍张照", stam: 1, run: ["社交 +4", "悟性 +3", "提示 照片里树只占了半边，跑道很长。"]}
        ]},
    ];

    (function mergeEpicEvents() {
      if (typeof EVENTS === "undefined") return;
      EPIC_EVENTS.forEach(e => {if (!EVENTS.some(x => x.id === e.id)) EVENTS.push(e);});
    })();
