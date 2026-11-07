/* ==================================================================
 * 内容层 + 引擎层 · 文具袋 / 图书（需求 13、14、15）
 * ------------------------------------------------------------------
 * 设计要点：
 *   · 所有文具（含书）都是 S.bag.items 里的一条，字段统一
 *   · 同一种类有多种型号与数值（铅笔 / 自动铅笔 / 碳素笔 / 钢笔 …）
 *   · 耐久：学习、做题、周末学习安排消耗书写类；运动消耗球拍类；
 *     文具袋本身也磨损，归零进入「散落」（文具不消失，但效率降、易丢）
 *   · 门槛：做题 / 学习必须有可用书写文具；铅笔必须配套橡皮
 *   · 每周结算：袋中文具给学习数值，装饰类给正向收益
 *   · 小卖部固定价；周末上网每周刷新、价格浮动
 *   · 书是特殊文具：有读书进度条，耗体力推进，分阶段反馈；
 *     借来的书有时限，到期归还；自己的书可被借出，到期回来
 *   · 显示：游戏 / 模拟给具体数值，真实只有视觉长度（barHasNumber）
 *
 * ★ 想加文具 / 加书：改本文件顶部的 STATIONERY_DEFS / BOOK_DEFS 即可。
 *   事件里让文具真的变化，用中文指令「文具 丢失 书写」等，见文件末尾
 *   stationeryCmd() 和 docs/HANDOVER.md 坑 48。
 *
 * 维护等级：内容层（表格随便改）/ 引擎层（函数别乱动）
 * ================================================================== */

    /* cat: write 书写 / eraser 橡皮 / bag 文具袋 / sport 球拍 / lab 实验
     *      charm 装饰（不参与学习消耗，但每周给正向收益）/ book 书
     * weekly: 每周按袋中文具结算的「学习数值」（转成最弱科 + 悟性）
     * perk:   每周给的属性收益（漂亮书签之类）
     * need:   使用这支笔必须同时拥有的 cat（铅笔 → 橡皮）
     * cap:    只有 bag 类有，决定文具容纳上限
     */
    const STATIONERY_DEFS = [
      /* —— 书写类（只有这类和橡皮占文具袋格子；同一类有多种型号） —— */
      {id:"pencil_stub", n:"铅笔头", icon:"✏️", cat:"write", dur:8, price:5, weekly:1, need:"eraser", desc:"同学削剩的，短得只够捏住。"},
      {id:"pencil", n:"中华铅笔", icon:"✏️", cat:"write", dur:16, price:9, weekly:1, need:"eraser", desc:"六角杆，笔尾那块橡皮早就用硬了。"},
      {id:"mech_pencil", n:"自动铅笔", icon:"🖊️", cat:"write", dur:24, price:18, weekly:2, need:"eraser", desc:"0.5 的芯，按一下出来一截，写起来很顺。"},
      {id:"gel_pen", n:"碳素笔", icon:"🖊️", cat:"write", dur:20, price:12, weekly:2, desc:"小卖部最畅销的一支，黑得发亮。"},
      {id:"fountain", n:"钢笔", icon:"🖋️", cat:"write", dur:38, price:30, weekly:4, desc:"沉甸甸的，写久了手会酸，但字会变好看。"},
      {id:"brush_pen", n:"软头笔", icon:"🖌️", cat:"write", dur:26, price:22, weekly:3, desc:"做手账和划重点都用得上。"},
      {id:"ballpoint", n:"圆珠笔", icon:"🖊️", cat:"write", dur:28, price:8, weekly:2, desc:"最普通的一支，写到最后总漏一点油。"},
      {id:"highlighter", n:"荧光笔", icon:"🖍️", cat:"write", dur:30, price:14, weekly:2, desc:"划过的地方亮得晃眼，复习时一眼就找到。"},
      {id:"card_pencil", n:"2B 涂卡笔", icon:"✏️", cat:"write", dur:30, price:12, weekly:2, need:"eraser", desc:"机读卡专用，方头，削都不用削。"},
      {id:"marker", n:"记号笔", icon:"🖊️", cat:"write", dur:24, price:16, weekly:1, desc:"写板报用的，气味有点冲。"},
      /* —— 橡皮 —— */
      {id:"eraser", n:"白橡皮", icon:"🧽", cat:"eraser", dur:18, price:4, desc:"越擦越黑，最后总会被掰成两半。"},
      {id:"eraser_big", n:"绘图橡皮", icon:"🧽", cat:"eraser", dur:34, price:10, desc:"软，擦得干净，几乎不掉渣。"},
      {id:"kneaded", n:"可塑橡皮", icon:"🧽", cat:"eraser", dur:26, price:7, desc:"能捏成各种形状，素描课人手一块。"},
      {id:"eraser_pen", n:"笔形橡皮", icon:"🧽", cat:"eraser", dur:22, price:9, desc:"按一下伸出来一截，像支短笔。"},
      /* —— 文具袋（特殊：决定容量，自身有耐久；换袋会顶掉旧袋） —— */
      {id:"bag_cloth", n:"布文具袋", icon:"🎒", cat:"bag", dur:60, price:20, cap:6, desc:"拉链有点涩，但装得下这一学期。"},
      {id:"bag_canvas", n:"帆布大袋", icon:"🎒", cat:"bag", dur:110, price:38, cap:10, desc:"侧袋还能塞一瓶水。"},
      {id:"bag_tin", n:"铁皮笔盒", icon:"📦", cat:"bag", dur:170, price:52, cap:8, desc:"摔在地上会响，全班都回头。"},
      {id:"bag_mesh", n:"透明网纱袋", icon:"🎒", cat:"bag", dur:90, price:28, cap:12, desc:"一眼看见里面有什么，安检时也省事。"},
      {id:"bag_zip", n:"多层笔袋", icon:"🎒", cat:"bag", dur:140, price:44, cap:9, desc:"三层拉链，卷子夹在最后一层。"},
      /* —— 运动器材 —— */
      {id:"pingpong", n:"乒乓球拍", icon:"🏓", cat:"sport", dur:46, price:34, desc:"胶皮边角翘起来一点，不影响打。"},
      {id:"badminton", n:"羽毛球拍", icon:"🏸", cat:"sport", dur:40, price:40, desc:"线是重新穿过的，拍框上贴了名字。"},
      {id:"rope", n:"跳绳", icon:"🪢", cat:"sport", dur:34, price:12, desc:"体育中考那阵子，人手一根。"},
      {id:"shuttlecock", n:"毽子", icon:"🪶", cat:"sport", dur:30, price:6, desc:"课间在走廊踢两下，铃响就收。"},
      {id:"grip", n:"握力器", icon:"💪", cat:"sport", dur:55, price:18, desc:"晚自习捏着玩，手心会发热。"},
      {id:"basketball", n:"篮球", icon:"🏀", cat:"sport", dur:90, price:68, desc:"外场水泥地磨得很快，但还能拍。"},
      {id:"wristband", n:"护腕", icon:"🧤", cat:"sport", dur:40, price:12, desc:"打完球擦一把汗，顺手就套上了。"},
      /* —— 实验 / 尺具 —— */
      {id:"ruler_set", n:"直尺圆规套", icon:"📐", cat:"lab", dur:48, price:16, weekly:1, desc:"几何课没它不行。"},
      {id:"calculator", n:"科学计算器", icon:"🔢", cat:"lab", dur:70, price:60, weekly:2, desc:"考试不让带，平时倒是很好用。"},
      {id:"protractor", n:"量角器", icon:"📏", cat:"lab", dur:40, price:8, weekly:1, desc:"半透明的那种，压在图上刚好。"},
      {id:"lab_notebook", n:"实验记录本", icon:"📓", cat:"lab", dur:60, price:12, weekly:1, desc:"数据都记在格子里，翻回去能看懂。"},
      {id:"circuit_kit", n:"电路实验盒", icon:"🔌", cat:"lab", dur:80, price:55, weekly:3, desc:"小灯泡亮起来的那一下，比答案有意思。"},
      {id:"thermometer", n:"温度计", icon:"🌡️", cat:"lab", dur:50, price:20, weekly:1, desc:"测沸水时别碰杯壁，老师强调过。"},
      /* —— 装饰小物：不参与学习消耗，但每周给一点正向收益 —— */
      {id:"bookmark", n:"漂亮的书签", icon:"🔖", cat:"charm", dur:999, price:10, perk:{心态:2}, desc:"夹在课本里，翻到时心情会好一点。"},
      {id:"sticker", n:"课程表贴纸", icon:"✨", cat:"charm", dur:999, price:8, perk:{效率:1}, desc:"贴在笔盒盖内侧，每周看一眼就知道明天带什么。"},
      {id:"badge_lixing", n:"立行号徽章", icon:"🚩", cat:"charm", dur:999, price:22, perk:{心态:3, "压力":-2}, desc:"校训底下那行小字，摸久了有点发亮。"},
      {id:"notepad", n:"随手小本", icon:"🗒️", cat:"charm", dur:999, price:14, perk:{悟性:1}, desc:"想到什么就记一笔，一学期能写满。"},
      {id:"tape", n:"手账胶带", icon:"🎗️", cat:"charm", dur:999, price:12, perk:{效率:1}, desc:"把错题页边贴一条，翻起来快。"},
      {id:"lamp", n:"小台灯", icon:"💡", cat:"charm", dur:999, price:36, perk:{健康:1, 心态:1}, desc:"熄灯后只能开一会儿，光很暖。"},
      {id:"medal", n:"校运会纪念章", icon:"🏅", cat:"charm", dur:999, price:18, perk:{心态:2, 社交:1}, desc:"没拿名次也有一枚，放在笔袋最外层。"},
      {id:"stress_toy", n:"解压捏捏乐", icon:"🧸", cat:"charm", dur:999, price:15, perk:{"压力":-2}, desc:"月考前几天捏得最勤。"}
    ];

    /* 书 —— 作为「特殊文具」进同一个袋子。
     * progMax  读完需要的进度点
     * stamPer  每 1 点体力推进多少进度（不同书不同）
     * stages   分阶段反馈，at 是进度比例
     * eff      读完后的中文指令
     * ★ 原图书角"读一次立刻给全部效果"改成渐进式，这条需求 14 的核心。
     */
    const BOOK_DEFS = [
      {id:"bk_pingfan", n:"《平凡的世界》", icon:"📕", progMax:120, stamPer:1.5, price:32, dur:999,
        stages:[{at:.25,txt:"读到孙少平在工地上啃黑馍，你把书扣在桌上缓了一会儿。",eff:["心态 +3"]},
                {at:.5,txt:"「生活可以简陋，但不可以粗糙」——你把这句抄在了小本上。",eff:["悟性 +2"]},
                {at:.75,txt:"田晓霞那一段，你读了两遍。",eff:["心态 +4"]},
                {at:1,txt:"合上书，窗外还是那片天，但你觉得能再走一段。",eff:["心态 +12","悟性 +4","压力 -5"]}],
        lore:"苦难中看见光。", desc:"厚得能当枕头，读起来却很快。"},
      {id:"bk_huozhe", n:"《活着》", icon:"📗", progMax:80, stamPer:2.1, price:26, dur:999,
        stages:[{at:.3,txt:"福贵把家产输光那段，你没敢一口气读完。",eff:["心态 +3","压力 -2"]},
                {at:.65,txt:"一页一页，人一个个少了。",eff:["心态 +4"]},
                {at:1,txt:"人是为了活着本身而活着。",eff:["心态 +14","压力 -12","健康 -2"]}],
        lore:"活着本身就有意义。", desc:"薄薄一本，压手。"},
      {id:"bk_jihe", n:"《几何原本》", icon:"📘", progMax:160, stamPer:1.0, price:48, dur:999,
        stages:[{at:.25,txt:"五个公设抄了一遍，第二遍才读懂。",eff:["悟性 +2"]},
                {at:.5,txt:"第一次自己把命题证下来，没人可说，就写在页边。",eff:["学力 数学 +8"]},
                {at:.75,txt:"点、线、面，原来能撑起这么大一栋楼。",eff:["悟性 +2","效率 +1"]},
                {at:1,txt:"合上书再看课本，那些证明忽然变简单了。",eff:["学力 数学 +25","悟性 +4","压力 +6"]}],
        lore:"逻辑之美。", desc:"读得最慢的一本，也最耐用。"},
      {id:"bk_guwen", n:"《古文观止》", icon:"📙", progMax:140, stamPer:1.2, price:36, dur:999,
        stages:[{at:.3,txt:"先抄了三篇，手指有点酸。",eff:["学力 语文 +6"]},
                {at:.6,txt:"「先天下之忧而忧」，早读时正好背到。",eff:["学力 语文 +6","悟性 +2"]},
                {at:1,txt:"文言的节奏进到耳朵里了。",eff:["学力 语文 +20","悟性 +4","压力 +4"]}],
        lore:"文言雅韵。", desc:"注释比正文还密。"},
      {id:"bk_wuli", n:"《物理世界奇遇记》", icon:"📓", progMax:110, stamPer:1.7, price:44, dur:999,
        stages:[{at:.35,txt:"跟着汤普金斯先生进了相对论，脑袋有点晕。",eff:["悟性 +3"]},
                {at:.7,txt:"原来尺子会缩短、钟会变慢。",eff:["学力 物理 +8"]},
                {at:1,txt:"再看课本里的公式，像认识的人了。",eff:["学力 物理 +22","悟性 +4","压力 +5"]}],
        lore:"物理也可以很有趣。", desc:"封面画着一个骑自行车的怪人。"},
      {id:"bk_kunchong", n:"《昆虫记》", icon:"📔", progMax:90, stamPer:2.0, price:25, dur:999,
        stages:[{at:.4,txt:"蹲在花坛边看了一下午蚂蚁。",eff:["心态 +3","学力 生物 +5"]},
                {at:1,txt:"法布尔写得像在给虫子写传记。",eff:["学力 生物 +18","心态 +6"]}],
        lore:"微观世界的大千。", desc:"插图很多，翻得快。"},
      {id:"bk_sudongpo", n:"《苏东坡传》", icon:"📕", progMax:130, stamPer:1.35, price:34, dur:999,
        stages:[{at:.3,txt:"黄州那段，他还在研究怎么煮猪肉。",eff:["心态 +4"]},
                {at:.65,txt:"一蓑烟雨任平生。",eff:["心态 +4","社交 +2"]},
                {at:1,txt:"回头看，考试好像也没那么可怕。",eff:["心态 +10","社交 +5","压力 -5"]}],
        lore:"一蓑烟雨任平生。", desc:"传记里最好读的一本。"},
      {id:"bk_dili", n:"《中国国家地理》", icon:"🗺️", progMax:100, stamPer:1.8, price:36, dur:999,
        stages:[{at:.35,txt:"从大兴安岭翻到南海，一页一个地方。",eff:["学力 地理 +7","悟性 +1"]},
                {at:1,txt:"原来课本上那张图，真的有那么多颜色。",eff:["学力 地理 +22","悟性 +4"]}],
        lore:"大好河山。", desc:"合订本，很重。"},
      {id:"bk_lunyu", n:"《论语》", icon:"📜", progMax:95, stamPer:1.9, price:28, dur:999,
        stages:[{at:.4,txt:"「学而时习之」，早读念了三年，今天才觉得是句实在话。",eff:["心态 +3","悟性 +2"]},
                {at:1,txt:"薄薄一本，能翻很多年。",eff:["心态 +10","悟性 +5","社交 +3"]}],
        lore:"温故而知新。", desc:"口袋本，边角卷了。"},
      {id:"bk_yingyu", n:"《英语晨读》", icon:"📖", progMax:85, stamPer:2.2, price:30, dur:999,
        stages:[{at:.4,txt:"每天早起念一篇，舌头慢慢不打结了。",eff:["学力 英语 +8"]},
                {at:1,txt:"The early bird catches the worm.",eff:["学力 英语 +22","效率 +3","压力 +3"]}],
        lore:"语感在朗读中生长。", desc:"配了磁带，但你已经用不上了。"},
      {id:"bk_zhaohua", n:"《朝花夕拾》", icon:"📗", progMax:105, stamPer:1.6, price:29, dur:999,
        stages:[{at:.35,txt:"长妈妈那些规矩，读着读着笑了。",eff:["心态 +3","学力 语文 +5"]},
                {at:1,txt:"从百草园到三味书屋，原来课本里那篇是这里来的。",eff:["学力 语文 +20","悟性 +3"]}],
        lore:"旧事重提，温软如初。", desc:"鲁迅写得不凶的一本。"},
      {id:"bk_tangshi", n:"《唐诗三百首》", icon:"📜", progMax:115, stamPer:1.4, price:33, dur:999,
        stages:[{at:.3,txt:"早读顺手背了两首，比课文快。",eff:["学力 语文 +6","悟性 +2"]},
                {at:.7,txt:"「行到水穷处，坐看云起时」，抄在了本子扉页。",eff:["心态 +5"]},
                {at:1,txt:"合上书，晚自习的灯好像也成了句诗。",eff:["学力 语文 +22","心态 +6"]}],
        lore:"诗里有山河，也有晚自习。", desc:"翻到哪页都能读下去。"},
      {id:"bk_xiyou", n:"《西游记》", icon:"📕", progMax:150, stamPer:1.25, price:40, dur:999,
        stages:[{at:.25,txt:"大闹天宫那段，一晚上看了三回。",eff:["心态 +4"]},
                {at:.6,txt:"八十一难里，最累的其实不是打妖怪。",eff:["悟性 +3","社交 +2"]},
                {at:1,txt:"取到真经那页反而最安静。",eff:["心态 +10","悟性 +4","压力 -4"]}],
        lore:"路要一步一步走。", desc:"厚，但舍不得跳着看。"},
      {id:"bk_haidi", n:"《海底两万里》", icon:"📘", progMax:125, stamPer:1.45, price:38, dur:999,
        stages:[{at:.35,txt:"鹦鹉螺号的走廊里全是玻璃，外面是鱼。",eff:["悟性 +3","学力 物理 +5"]},
                {at:1,txt:"合上书再看浮力那章，忽然有了画面。",eff:["学力 物理 +20","学力 地理 +8"]}],
        lore:"想象先于公式抵达。", desc:"凡尔纳写的，比课本早了一百年。"},
      {id:"bk_yunnan", n:"《云南风物志》", icon:"🗺️", progMax:95, stamPer:1.85, price:31, dur:999,
        stages:[{at:.4,txt:"翻到抚仙湖那页，图片和周末去看见的一样蓝。",eff:["心态 +4","学力 地理 +6"]},
                {at:1,txt:"原来自己每天走的路，也在别人的地理书里。",eff:["学力 地理 +20","心态 +5"]}],
        lore:"脚下即山河。", desc:"从哀牢山写到元阳梯田。"},
      {id:"bk_chengnan", n:"《城南旧事》", icon:"📙", progMax:100, stamPer:1.7, price:27, dur:999,
        stages:[{at:.4,txt:"英子问的那些问题，你也想过。",eff:["心态 +4","社交 +2"]},
                {at:1,txt:"「爸爸的花儿落了」，合上书坐了一会儿。",eff:["心态 +10","悟性 +3"]}],
        lore:"告别也是长大。", desc:"薄薄一本，后劲很长。"}
    ];

    /* ==================================================================
     * v1.5.3 · 小卖铺货架分组
     * ------------------------------------------------------------------
     * 以前只列 SHOP_STOCK 那 8 件，钢笔、羽毛球拍、计算器、书……全都不
     * 显示，玩家根本不知道有这些东西。现在按组列出【全部】文具和书。
     *
     * 加新文具只要往 STATIONERY_DEFS / BOOK_DEFS 里加一条，会自动归到
     * 对应组出现在货架上，不用再改这张表。要新增分组才动 SHOP_GROUPS。
     * ================================================================== */
    const SHOP_GROUPS = [
      {title:"✏️ 笔", cat:"write", hint:"只有笔和橡皮占文具袋格子"},
      {title:"🧽 橡皮", cat:"eraser", hint:"铅笔类要配一块橡皮才能用"},
      {title:"🎒 文具袋", cat:"bag", hint:"换一只大的，能多装几支笔"},
      {title:"🏓 运动器材", cat:"sport", hint:"有球拍运动时多一点加成"},
      {title:"📐 尺具与实验", cat:"lab", hint:"每周给一点学力"},
      {title:"🔖 小物", cat:"charm", hint:"每周给一点心态、效率这类小收益"},
      {title:"📚 书", cat:"book", hint:"一种书只留一本，读完可以复读"}
    ];

    /* 一组商品 → 一段 HTML。全部拼成单行，避免 nl2br 在标签里插 <br>。 */
    function shopGroupHtml(g) {
      bagEnsure();
      const defs = g.cat === "book" ? BOOK_DEFS.slice()
        : STATIONERY_DEFS.filter(d => d.cat === g.cat);
      if (!defs.length) return "";
      let h = '<div class="shop-group">' + TZ(g.title) +
        '<small>' + TZ(g.hint || "") + '</small></div><div class="shop-grid">';
      defs.forEach(d => {
        const price = num(d.price, 10);
        const ok = bagCanBuy(d.id, price);
        const why = ok ? "" : bagBuyFailWhy(d.id, price);
        const sub = why ? '<span class="si-no">' + TZ(why) + '</span>'
          : TZ(d.desc || d.lore || "");
        h += '<button type="button" class="shop-item' + (ok ? "" : " off") + '"' +
          ' data-buy="' + d.id + '"' + (ok ? "" : " disabled") + '>' +
          '<span class="si-ico">' + (d.icon || "🎒") + '</span>' +
          '<span class="si-main"><b>' + TZ(d.n) + '</b>' +
          (bagOccupies(d) ? '<em>占格子</em>' : '<em>不占格子</em>') +
          '<small>' + sub + '</small></span>' +
          '<span class="si-price">' + price + ' 元</span></button>';
      });
      return h + '</div>';
    }

    const BAG_RULES = {
      wearPerStudy: 2,       // 一次学习扣多少笔耐久
      wearPerSport: 2,       // 一次运动扣多少球拍耐久
      wearPerQuiz: 1,        // 每道题扣多少笔耐久
      wearBagPerAction: 1,   // 每次行动文具袋自身磨损
      weeklyLearnDiv: 2,     // 每 2 点 weekly 折 1 点最弱科学力
      scatterStudyMul: 0.72, // 散落时学习效率
      scatterLostBonus: 0.18,// 散落时文具丢失事件概率加成
      onlineCount: 4,        // 上网每周刷几件
      onlineFloat: 0.25,     // 价格浮动 ±25%
      onlineBookCount: 2     // 其中固定刷几本书
    };

    /* ------------------------------------------------------------------
     * 状态与工具
     * ------------------------------------------------------------------ */

    function statDef(id) {return STATIONERY_DEFS.find(d => d.id === id) || null;}
    function bookDef(id) {return BOOK_DEFS.find(d => d.id === id) || null;}
    function anyDef(id) {return statDef(id) || bookDef(id);}
    function barHasNumber() {
      /* 复用体力条同一套口径：真实模式只有长度，其余给数字 */
      if (typeof realismMode === "function") return realismMode() !== "real";
      return true;
    }
    let BAG_UID = 1;
    function bagUid() {return "u" + (BAG_UID++) + "_" + Math.floor(Math.random() * 10000);}

    /* ==================================================================
     * v1.5.3 · 文具袋的容量口径
     * ------------------------------------------------------------------
     * 需求：只有【笔（write）和橡皮（eraser）】占格子。
     * 书、文具袋本身、运动器材、实验尺具、装饰小物统统不占 ——
     * 它们放在书包、课桌、书架上，不该把笔袋挤满。
     *
     * v1.5.1 时是「书不占格子」，这一版收紧成「只有笔和橡皮占」。
     * 下面几个函数都不调 bagEnsure()（会递归），调用方必须先 bagEnsure()。
     *   bagOccupies  判断一件 / 一个 def 占不占格子
     *   bagIsBook    判别书（cat 或 def 都认，兼容旧档）
     *   bagCount     当前占格件数
     *   bagHasBook   袋里 / 借出去的有没有这一本（防买重、借重、刷天赋）
     * ================================================================== */
    function bagOccupies(x) {
      if (!x) return false;
      /* def 传进来时只有 cat 没有 .def；旧物品则优先用自己存的 cat */
      const c = x.cat || (anyDef(x.def) || {}).cat;
      return c === "write" || c === "eraser";
    }
    function bagIsBook(it) {
      return !!(it && (it.cat === "book" || bookDef(it.def)));
    }
    function bagCount() {
      if (!S || !S.bag || !Array.isArray(S.bag.items)) return 0;
      return S.bag.items.filter(bagOccupies).length;
    }
    /* 耐用品（运动 / 实验 / 装饰）不占格子后，理论上能无限囤。
     * 加一条「同类只留一件」：既符合常理，也防止 weekly / perk 叠加刷数值。
     * 书走 bagHasBook、文具袋走换袋逻辑，都不在这里。 */
    function bagHasDurable(defId) {
      if (!S || !S.bag || !Array.isArray(S.bag.items)) return false;
      const d = statDef(defId);
      if (!d || bagOccupies(d) || d.cat === "bag") return false;
      return S.bag.items.some(it => it && it.def === defId);
    }
    function bagBooks() {
      if (!S || !S.bag || !Array.isArray(S.bag.items)) return [];
      return S.bag.items.filter(bagIsBook);
    }
    function bagHasBook(defId) {
      if (!S || !S.bag) return false;
      const items = Array.isArray(S.bag.items) ? S.bag.items : [];
      const lent = Array.isArray(S.bag.lent) ? S.bag.lent : [];
      return items.some(it => it && it.def === defId) ||
             lent.some(x => x && x.def === defId);
    }

    /* 复读效果：重翻一遍拿到的「别的小收获」。
     * 刻意不用初读那套 stages —— 不推进进度、不抽天赋、不记读书次数，
     * 只给一点属性上的余味。数值本来就小，还要照常花时间和磨笔，
     * 玩家不会因为复读而刷出优势。 */
    const BOOK_REREAD = [
      {txt: "重翻到折了角的那页，上次跳过去的半句，这回看清了。", eff: ["悟性 +3"]},
      {txt: "把喜欢的一段抄进随手小本，字写得比上次慢。", eff: ["心态 +3", "压力 -3"]},
      {txt: "同桌凑过来问你看什么，你顺手把书翻给他看。", eff: ["社交 +4", "心态 +2"]},
      {txt: "照着书里的顺序把笔记重排了一遍，条理清楚了不少。", eff: ["效率 +2", "悟性 +2"]},
      {txt: "读到那句曾经没懂的话，还是没全懂，但没那么急了。", eff: ["悟性 +2", "压力 -3"]},
      {txt: "书角又多一道折。合上时天已经暗了，屋里很安静。", eff: ["心态 +4"]}
    ];

    function bagEnsure() {
      if (!S) return;
      if (!S.bag || typeof S.bag !== "object") S.bag = {};
      const b = S.bag;
      if (!Array.isArray(b.items)) b.items = [];
      if (!Array.isArray(b.lent)) b.lent = [];
      if (!Array.isArray(b.onlineStock)) b.onlineStock = [];
      /* v1.5 A 批：不只判「是不是数字」，还要钉在合法区间里。
       * 0 批诊断里 cap=9999 / bagDur=-99 都是原样保留下来的。 */
      b.cap = clampNum(b.cap, 1, 24, 6);
      b.bagDurMax = clampNum(b.bagDurMax, 1, 9999, 60);
      b.bagDur = clampNum(b.bagDur, 0, b.bagDurMax, b.bagDurMax);
      if (!Number.isFinite(b.onlineWeek)) b.onlineWeek = -1;
      if (typeof b.scattered !== "boolean") b.scattered = false;
      if (!Number.isFinite(b.tickWeek)) b.tickWeek = -1;
      /* 脏数据过滤：def 不存在、耐久非数字或已归零，一律丢掉。
       * v1.5 A 批：dur<=0 的坏笔若留着，bagUsableWrite() 会判它不可用，
       * 但玩家在文具袋里看到一支「还在」的笔，容易以为门禁是 bug。 */
      /* v1.5.3：先分拨、再截断 —— 顺序反了会把不占格子的东西切掉。
       *  · occupying：笔 / 橡皮，唯一按 cap 截断的一拨
       *  · free：书、文具袋、运动、实验、装饰，全部保留
       *  · 书仍做同 def 去重（保留进度最高的、已读完优先）
       * 旧档里曾被旧规则截断丢掉的东西救不回来，但至少从这里起不再丢。 */
      const seenBook = {}, occupying = [], free = [];
      b.items.forEach(it => {
        if (!it || !anyDef(it.def) || !Number.isFinite(it.dur) || it.dur <= 0) return;
        if (bagIsBook(it)) {
          const prev = seenBook[it.def];
          if (!prev) {seenBook[it.def] = it; free.push(it);}
          else if (num(it.prog, 0) > num(prev.prog, 0) || (!!it.finished && !prev.finished)) {
            free[free.indexOf(prev)] = it;
            seenBook[it.def] = it;
          }
        } else if (bagOccupies(it)) occupying.push(it);
        else free.push(it);
      });
      b.items = occupying.slice(0, b.cap).concat(free);
      /* ★ 坑 63：只读档不补全的话，旧存档 / 事件手工塞进来的物品可能
       * 缺 durMax / progMax，条会被算成 0% —— 看起来就是「条空了」。
       * 这里按 def 兜底补齐，且只在字段非法时动，不覆盖正常数值。 */
      b.items.forEach(it => {
        if (!it.uid) it.uid = bagUid();
        const d = anyDef(it.def);
        /* v1.5.3：名字统一成定义表里的【纯文字】。
         * 旧定义把 emoji 写在 n 里（"✏️ 中华铅笔"），面板又单独画一个
         * .bag-ico，于是同一件文具出现两个图标。旧档里存下来的 n 带
         * emoji，这里覆盖掉，读档后自动只剩一个图标。 */
        if (d && d.n) it.n = d.n;
        if (d && d.icon) it.icon = d.icon;
        /* 优先用文具定义里的原始耐久，实在没有才退到「当前值当满值」，
         * 免得把一支快用完的笔补成「全新 100%」。 */
        if (!Number.isFinite(it.durMax) || it.durMax <= 0)
          it.durMax = Math.max(1, num(d && d.dur, Math.max(1, num(it.dur, 20))));
        /* v1.5 A 批：耐久与读书进度都钉死区间（条不会空、也不会爆） */
        it.durMax = clampNum(it.durMax, 1, 9999, 20);
        it.dur = clampNum(it.dur, 0, it.durMax, it.durMax);
        if (it.cat === "book" || (d && Number.isFinite(d.progMax))) {
          if (!Number.isFinite(it.progMax) || it.progMax <= 0) it.progMax = num(d && d.progMax, 100);
          it.progMax = clampNum(it.progMax, 1, 10000, 100);
          it.prog = clampNum(it.prog, 0, it.progMax, 0);
          it.stamPer = clampNum(it.stamPer, 0.1, 20, num(d && d.stamPer, 1.5));
          if (!Array.isArray(it.stagesDone)) it.stagesDone = [];
          /* 旧档若进度已满但没打上 finished，会重复结算「读完」奖励；
           * 复读次数也在这里补齐，不升 SAVE_VER（可选字段，旧版忽略即可）。 */
          if (typeof it.finished !== "boolean")
            it.finished = num(it.prog, 0) >= num(it.progMax, 100);
          it.rereads = clampNum(it.rereads, 0, 9999, 0);
        } else {
          /* 非书类文具不该带读书进度；脏存档里混进来的直接清掉，
           * 免得进度条画出 1e6 这种数值（0 批诊断里抓到过）。 */
          delete it.prog; delete it.progMax; delete it.stamPer; delete it.stagesDone;
        }
      });
    }

    /* 开局随机给一些文具（需求 13）：必给一支笔 + 橡皮 + 一只袋，绝不死锁 */
    function bagGiveStart() {
      bagEnsure();
      const b = S.bag;
      b.items = [];
      b.lent = [];
      b.cap = 6; b.bagDur = 60; b.bagDurMax = 60; b.scattered = false;
      bagAdd("bag_cloth", {silent: true});
      bagAdd(rnd(2) ? "gel_pen" : "pencil", {silent: true});
      bagAdd("eraser", {silent: true});
      if (rnd(3) === 0) bagAdd("bookmark", {silent: true});
      if (rnd(4) === 0) bagAdd(rnd(2) ? "ruler_set" : "rope", {silent: true});
    }

    /* 加一件文具。返回 true / false（袋满） */
    function bagAdd(defId, o) {
      if (!S) return false;
      o = o || {};
      bagEnsure();
      const d = anyDef(defId);
      if (!d) return false;
      const b = S.bag;
      const isBook = !!bookDef(defId);
      /* v1.5.3：运动 / 实验 / 装饰这些耐用品不占格子，但同类只留一件。
       * force（剧情奖励、旧档归还）不拦，免得事件文案说了给、状态却没变。 */
      if (!isBook && !o.force && !o.restore && bagHasDurable(defId)) {
        if (!o.silent) {
          if (typeof toast === "function") toast(`🎒 ${d.n} 已经有一个了，不用再买。`);
          if (typeof say === "function") say(`🎒 ${d.n} 已经有一个了。`, "sys");
        }
        return false;
      }
      /* 同一存档里，一种书同时只能有一本（含借出去、还没还回来的）。
       * 否则买两本《活着》就能读两遍、抽两次天赋 —— 坑 51 的 finished
       * 锁只挡住「同一本重复点」，挡不住「两本一样的书」。 */
      if (isBook && !o.restore && bagHasBook(defId)) {
        if (!o.silent) {
          if (typeof toast === "function") toast(`📚 ${d.n} 已经在书架上了，不用再拿一本。`);
          if (typeof say === "function") say(`📚 书架上已经有 ${d.n} 了，这一本没拿。`, "sys");
        }
        return false;
      }
      if (d.cat === "bag") {
        /* 换文具袋：容量与耐久一起换，散落状态解除 */
        b.cap = num(d.cap, 6); b.bagDur = num(d.dur, 60); b.bagDurMax = num(d.dur, 60);
        b.scattered = false;
        /* 旧袋不留着占格子 */
        b.items = b.items.filter(it => it.cat !== "bag");
      }
      /* 只有笔和橡皮占格子。书、球拍、书签、文具袋本身一律不受容量限制。 */
      const occupies = bagOccupies(d);
      const count = bagCount();
      if (occupies && count >= b.cap && !o.force) {
        if (!o.silent) {
          if (typeof toast === "function") toast(`🎒 笔和橡皮塞满了（${b.cap} 件），先买只大袋子或用掉一些。`);
          if (typeof say === "function") say(`🎒 笔袋塞不下了，${d.n} 没买成。`, "bad");
        }
        return false;
      }
      if (occupies && o.force && count >= b.cap && !o.silent && typeof say === "function") {
        say(`🎒 笔袋已经满了，${d.n} 只能先夹在课本里捧着。`, "sys");
      }
      const it = {
        uid: bagUid(), def: defId, n: d.n, icon: d.icon, cat: isBook ? "book" : d.cat,
        dur: num(d.dur, 20), durMax: num(d.dur, 20),
        borrowed: !!o.borrowed, dueWeek: num(o.dueWeek, 0),
        from: o.from || ""
      };
      if (isBook) {
        it.prog = 0; it.progMax = num(d.progMax, 100); it.stamPer = num(d.stamPer, 1.5);
        it.stagesDone = []; it.finished = false; it.rereads = 0;
      }
      b.items.push(it);
      if (!o.silent && typeof say === "function") say(`🎒 文具袋里多了 ${d.n}${it.borrowed ? `（借的，第 ${it.dueWeek} 周要还）` : ""}。`, "good");
      return true;
    }

    function bagRemove(uid, silent) {
      bagEnsure();
      const b = S.bag, i = b.items.findIndex(x => x.uid === uid);
      if (i < 0) return null;
      const it = b.items.splice(i, 1)[0];
      if (!silent && typeof say === "function") say(`🎒 ${it.n} 不在袋里了。`, "sys");
      return it;
    }

    function bagItems(cat) {
      bagEnsure();
      return S.bag.items.filter(it => (!cat || it.cat === cat) && it.dur > 0);
    }

    /* 有没有「能用」的书写文具：铅笔类必须同时有橡皮 */
    function bagUsableWrite() {
      bagEnsure();
      const hasEraser = bagItems("eraser").length > 0;
      return S.bag.items.filter(it => {
        if (it.cat !== "write" || it.dur <= 0) return false;
        const d = statDef(it.def);
        return !(d && d.need === "eraser") || hasEraser;
      });
    }

    function bagRequireWrite() {return bagUsableWrite().length > 0;}

    /* 学习类行动能不能做（需求 13 的硬门槛） */
    function bagGate(k) {
      if (k === "study" || k === "quiz" || k === "read") {
        if (!bagRequireWrite()) return "✏️ 没有能写字的笔了 —— 学习、做题、读书都先放一放，去小卖部买一支（铅笔要配橡皮）";
      }
      return "";
    }

    /* 别的入口（社团课 / 周末安排 / 做题配置）绕过行动面板时，
     * 用这个统一提示，别静悄悄地把行动吃掉。 */
    function bagGateNotice(k) {
      const msg = (typeof bagGate === "function") ? bagGate(k) : "";
      if (!msg) return false;
      if (typeof toast === "function") toast("✏️ 没有能写字的笔了，先去小卖部买一支");
      if (typeof say === "function") say("✏️ " + msg, "bad");
      if (typeof renderHUD === "function") renderHUD();
      if (typeof offerActions === "function") offerActions();
      return true;
    }

    /* 软性：运动有球拍就给额外加成，没有也能跑（避免死锁） */
    function bagSportBonus() {
      const has = bagItems("sport").length > 0;
      return has ? {健康: 2, 心态: 1} : null;
    }

    /* 报废一件文具，并说清影响（v1.4.1 的提示逻辑抽成公共函数，
     * v1.5 B 批让「文具 消耗 <id>」这类精确指令也能复用同一套反馈）。 */
    function bagBreakItem(it, why) {
      const brokeWrite = (it.cat === "write" || it.cat === "eraser");
      bagRemove(it.uid, true);
      const noPen = brokeWrite && !bagRequireWrite();
      let msg = `🗑️ ${it.n} 用到底了，报废。${why ? "（" + why + "）" : ""}`;
      if (noPen) msg += " 没有能写字的笔了 —— 学习、做题、读书暂时做不了，去小卖部买一支（铅笔要配橡皮）。";
      if (typeof say === "function") say(msg, "bad");   // 会进「这一下的结果」反馈窗
      if (typeof toast === "function") {
        toast(noPen ? "✏️ 笔用完了：学习 / 做题 / 读书暂时做不了" : `🗑️ ${it.n} 报废了`);
      }
    }

    /* 内容作者写 cond 时用：袋里有没有某一件（按 def id，中文名也认）。
     * 例：cond: S => bagHas("pingpong") —— 没带拍子就不抽这条体育课事件。 */
    function bagHas(defId) {
      if (!S) return false;
      bagEnsure();
      return S.bag.items.some(it => it.dur > 0 &&
        (it.def === defId || it.n === defId || (statDef(it.def) || {}).n === defId));
    }

    /* 磨损：按类别挑一件扣耐久，归零报废 */
    function bagWear(cat, n, why) {
      bagEnsure();
      const pool = bagItems(cat);
      if (!pool.length) return;
      const it = pool[rnd(pool.length)];
      it.dur = Math.max(0, num(it.dur, 0) - num(n, 1));
      if (it.dur <= 0) bagBreakItem(it, why);
    }

    /* 文具袋自身磨损 → 散落 */
    function bagWearBag(n) {
      bagEnsure();
      const b = S.bag;
      if (b.scattered) return;
      b.bagDur = Math.max(0, num(b.bagDur, 0) - num(n, 1));
      if (b.bagDur <= 0) {
        b.scattered = true;
        if (typeof say === "function") say("🎒 文具袋的拉链彻底坏了，笔和本子散了一书包。学习效率会变低，也更容易丢东西 —— 买只新袋子吧。", "bad");
        if (typeof toast === "function") toast("🎒 文具散落了！");
      }
    }

    function bagStudyMul() {bagEnsure(); return S.bag.scattered ? num(BAG_RULES.scatterStudyMul, .72) : 1;}
    function bagLostBonus() {bagEnsure(); return S.bag.scattered ? num(BAG_RULES.scatterLostBonus, .18) : 0;}

    /* 每周结算：袋中文具给学习数值 + 装饰类给正向收益 + 借书到期 */
    function bagWeeklyTick() {
      if (!S) return;
      bagEnsure();
      const b = S.bag;
      if (num(b.tickWeek, -1) === num(S.week, 0)) return;   // 一周只结一次
      b.tickWeek = num(S.week, 0);

      /* v1.5.3：按 def 去重。不占格子之后玩家能同时拿好几件同类耐用品，
       * 若照件数累加 weekly / perk，买十个计算器就能每周白刷学力。
       * 同一种只算一次；笔、橡皮这类消耗品多备几支也不重复计收益。 */
      let learn = 0;
      const perk = {}, counted = {};
      b.items.forEach(it => {
        const d = anyDef(it.def);
        if (!d || counted[it.def]) return;
        counted[it.def] = true;
        learn += num(d.weekly, 0);
        if (d.perk) Object.keys(d.perk).forEach(k => {perk[k] = num(perk[k], 0) + num(d.perk[k], 0);});
      });
      if (learn > 0) {
        const gain = Math.max(1, Math.round(learn / num(BAG_RULES.weeklyLearnDiv, 2)));
        const subs = (typeof subjectsOf === "function") ? subjectsOf(S.term) : [];
        if (subs.length) {
          const weak = subs.reduce((a, c) => num(S.subj[a], 30) < num(S.subj[c], 30) ? a : c);
          S.subj[weak] = clampNum(num(S.subj[weak], 30) + gain, 0, SUBJ_CAP);
          if (typeof recalcScore === "function") recalcScore();
        }
        if (typeof say === "function") say(`🎒 一周下来，顺手的文具帮你把【${weakName()}】往前推了 ${gain} 点。`, "good");
      }
      Object.keys(perk).forEach(k => {
        if (perk[k] !== 0 && typeof modProp === "function") modProp(k, perk[k]);
      });
      if (Object.keys(perk).length && typeof say === "function") {
        say("🔖 夹在书里的小东西，也让这一周松快了一点。", "good");
      }

      /* ★ 绝不死锁（坑 49）：没有书写文具 + 钱不够买最便宜的一支笔时，
       * 同学塞给你一套旧的。否则学习/做题/读书三个行动一起禁用，
       * 而这三个又正是攒钱的主要途径，玩家会彻底卡死。 */
      if (!bagRequireWrite() && num(S.prop.经济, 0) < 12) {
        bagAdd("pencil_stub", {silent: true, force: true, from: "同学送的"});
        if (!bagItems("eraser").length) bagAdd("eraser", {silent: true, force: true, from: "同学送的"});
        if (typeof say === "function") say("🎒 同桌看你翻了半天空笔袋，塞来一支短铅笔和半块橡皮：「先用着。」", "good");
      }

      /* 文具袋散落 → 每周更容易丢一件 */
      if (b.scattered && typeof Math.random === "function" && Math.random() < 0.22) {
        const losable = b.items.filter(it => it.cat !== "bag" && !it.borrowed && it.dur < 900);
        if (losable.length) {
          const it = losable[rnd(losable.length)];
          bagRemove(it.uid, true);
          if (typeof say === "function") say(`🎒 散落的书包里，${it.n} 不知道什么时候不见了。`, "bad");
        }
      }
      bookExpire();
    }

    function weakName() {
      const subs = (typeof subjectsOf === "function") ? subjectsOf(S.term) : [];
      return subs.length ? subs.reduce((a, c) => num(S.subj[a], 30) < num(S.subj[c], 30) ? a : c) : "学力";
    }

    /* 借来的书到期归还；借出去的书到期回来 */
    function bookExpire() {
      bagEnsure();
      const b = S.bag, w = num(S.week, 0);
      const back = [];
      b.items.forEach(it => {
        if (it.borrowed && it.dueWeek > 0 && w >= it.dueWeek) back.push(it.uid);
      });
      back.forEach(uid => {
        const it = bagRemove(uid, true);
        if (it && typeof say === "function") say(`📚 ${it.n} 该还了。你把它塞回同学课桌，还有点没读完。`, "sys");
      });
      const returned = [];
      b.lent.forEach(x => {if (w >= num(x.backWeek, 0)) returned.push(x);});
      returned.forEach(x => {
        b.lent = b.lent.filter(y => y !== x);
        /* 正常流程下借出期间买不到同本（bagHasBook 连 lent 一起看）。
         * 旧档若有异常重复，这里沉默收掉，不硬塞出第二本。 */
        if (bagHasBook(x.def)) return;
        bagAdd(x.def, {silent: true, borrowed: false, force: true});
        if (typeof say === "function") say(`📚 同学把 ${anyDef(x.def) ? anyDef(x.def).n : "书"} 还回来了，书角多了一道折。`, "good");
      });
    }

    /* 把书借给同学（需求 15）：真的从袋里拿走，到期回来 */
    function bagLendBook(weeks) {
      bagEnsure();
      const b = S.bag;
      const mine = b.items.find(it => it.cat === "book" && !it.borrowed);
      if (!mine) {if (typeof say === "function") say("你没有能借出去的书。", "sys"); return false;}
      bagRemove(mine.uid, true);
      b.lent.push({def: mine.def, backWeek: num(S.week, 0) + Math.max(1, num(weeks, 3))});
      if (typeof say === "function") say(`📚 你把 ${mine.n} 借出去了，说好 ${Math.max(1, num(weeks, 3))} 周后还。`, "sys");
      return true;
    }

    /* ------------------------------------------------------------------
     * 上网商店：按周号确定性刷新，读档/反复打开都一致
     * ------------------------------------------------------------------ */
    function weekHash(w, salt) {
      let x = (num(w, 0) + 1) * 2654435761 + num(salt, 0) * 40503;
      x = (x ^ (x >>> 13)) * 1274126177;
      return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
    }

    function bagOnlineStock() {
      bagEnsure();
      const b = S.bag, w = num(S.week, 0);
      if (b.onlineWeek === w && b.onlineStock.length) return b.onlineStock;
      const pool = STATIONERY_DEFS.filter(d => d.cat !== "bag" || d.id !== "bag_cloth").slice();
      const books = BOOK_DEFS.slice();
      const picked = [];
      /* 固定刷几本书（需求 14） */
      for (let i = 0; i < num(BAG_RULES.onlineBookCount, 2) && books.length; i++) {
        const k = Math.floor(weekHash(w, 71 + i) * books.length);
        picked.push(books.splice(k, 1)[0].id);
      }
      const want = num(BAG_RULES.onlineCount, 4);
      for (let i = picked.length; i < want && pool.length; i++) {
        const k = Math.floor(weekHash(w, 13 + i * 7) * pool.length);
        picked.push(pool.splice(k, 1)[0].id);
      }
      b.onlineStock = picked.map((id, i) => {
        const d = anyDef(id);
        const f = 1 + (weekHash(w, 200 + i * 11) * 2 - 1) * num(BAG_RULES.onlineFloat, .25);
        return {id, price: Math.max(3, Math.round(num(d.price, 10) * f))};
      });
      b.onlineWeek = w;
      return b.onlineStock;
    }

    /* 能不能买：钱够 + 袋里还有位置（买新文具袋不受容量限制，它是来扩容的）。
     * 以前 disabled 只查钱，袋满时按钮仍可点、点了才报「没买成」，
     * 玩家会一头雾水 —— 现在直接置灰。 */
    function bagCanBuy(id, price) {
      if (!S) return false;
      bagEnsure();
      const d = anyDef(id);
      if (!d) return false;
      if (num(S.prop.经济, 0) < num(price, 0)) return false;
      if (bookDef(id) && bagHasBook(id)) return false;   // 书架里已有
      if (bagHasDurable(id)) return false;               // 耐用品已有一个
      if (bagOccupies(d) && bagCount() >= num(S.bag.cap, 6)) return false;
      return true;
    }

    function bagBuyFailWhy(id, price) {
      if (!S) return "";
      bagEnsure();
      const d = anyDef(id);
      if (num(S.prop.经济, 0) < num(price, 0)) return "钱不够";
      if (bookDef(id) && bagHasBook(id)) return "这本已经在书架上了，读完还能复读，不用再买";
      if (bagHasDurable(id)) return "这个已经有一个了，不用再买";
      if (d && bagOccupies(d) && bagCount() >= num(S.bag.cap, 6))
        return `笔和橡皮塞满了（${num(S.bag.cap, 6)} 件），先买只大袋子或用掉一些`;
      return "没能放进文具袋";
    }

    function bagBuy(id, price, from) {
      bagEnsure();
      const d = anyDef(id);
      if (!d) return false;
      if (num(S.prop.经济, 0) < price) {
        if (typeof toast === "function") toast("钱不够。");
        return false;
      }
      /* 只有笔和橡皮受袋满限制；其余东西和书架上已有的由 bagAdd 挡掉 */
      if (bagOccupies(d) && bagCount() >= S.bag.cap) {
        if (typeof toast === "function") toast(`🎒 笔和橡皮塞满了（${S.bag.cap} 件）。`);
        return false;
      }
      /* 先放货、再扣钱：万一 bagAdd 因「书架已有这本」被拒，
       * 玩家的钱不能白扣。以前顺序反着写，是个静默吞钱的真 bug。 */
      const ok = bagAdd(id, {from: from || ""});
      if (ok && typeof modProp === "function") modProp("经济", -price);
      if (ok) {
        if (typeof say === "function") say(`🛒 花了 ${price} 买了 ${d.n}。`, "good");
        if (typeof renderHUD === "function") renderHUD();
      }
      return ok;
    }

    /* ------------------------------------------------------------------
     * 读书：耗体力推进进度，分阶段反馈
     * ------------------------------------------------------------------ */
    function bookProgressGain(book, stam) {
      /* 推进量 = 体力 × 该书 stamPer × (1 + 效率/250 + 悟性/400 + 天赋) */
      let mul = 1;
      if (S && S.prop) {
        mul += clampNum(num(S.prop.效率, 100) / 250, 0, .6, 0);
        mul += clampNum(num(S.prop.悟性, 60) / 400, 0, .4, 0);
      }
      if (typeof Talent !== "undefined") {
        if (Talent.have("过目不忘")) mul += .30;
        if (Talent.have("融会贯通")) mul += .18;
        if (Talent.have("书虫")) mul += .20;
        if (Talent.have("注意力涣散")) mul -= .18;
        if (Talent.have("厌学")) mul -= .15;
      }
      mul *= bagStudyMul();     // 散落状态也影响读书
      return Math.max(.5, num(stam, 0) * num(book.stamPer, 1.5) * mul);
    }

    /* ==================================================================
     * v1.5.1 · 复读
     * ------------------------------------------------------------------
     * 读完的书不消失，留在书架。再点「读」走这里：不推进进度、
     * 不重复触发 stages、不抽天赋、不记 count("read")，只给一点别的余味。
     * 时间照花、笔照磨、袋身照耗 —— 复读不是免费刷属性的口子。
     * 弹窗自带文本且标 feedback:false：属性变化交给 modProp 的飘字，
     * 真实模式下只飘 ▲▼，不会漏出「悟性 +3」这种数字（坑 75）。
     * ================================================================== */
    function bookReread(it, d, cost) {
      if (typeof bagGate === "function" && bagGate("read")) {
        if (typeof toast === "function") toast("✏️ 没有能写字的笔了，读不了书 —— 去小卖部买一支");
        return;
      }
      if (typeof spendStamina === "function") spendStamina(cost, "复读");
      bagWear("write", 1, "复读划线");
      bagWearBag(1);

      const n = clampNum(it.rereads, 0, 9999, 0);
      const line = BOOK_REREAD[n % BOOK_REREAD.length];
      (line.eff || []).forEach(cmd => {if (typeof runEffectSpec === "function") runEffectSpec(cmd, S);});
      it.rereads = n + 1;
      if (typeof modProp === "function" && n >= BOOK_REREAD.length) {
        /* 翻过一整轮之后只留一点心情，避免复读变成稳定的属性来源 */
        modProp("心态", 1);
      }

      const again = barHasNumber() ? `这是第 ${n + 1} 次重翻。` : "又翻了一遍。";
      const body = `<div style="line-height:1.62">
        <div>${line.txt}</div>
        <div style="margin-top:6px;color:var(--dim);font-size:.85rem">${again} 进度不会再往前走，但合上书时和第一次不一样。</div>
        </div><div style="margin-top:9px">${bookBarHtml(it)}</div>`;
      if (typeof showModal === "function") {
        showModal("再翻一遍", body, [{t: "合上书"}],
          () => {if (typeof openBag === "function") openBag();}, false, true,
          {kind: "free", badge: "📖 复读", feedback: false});
      }
    }

    function bookRead(uid, stam) {
      bagEnsure();
      const it = S.bag.items.find(x => x.uid === uid && x.cat === "book");
      if (!it) return;
      const d = bookDef(it.def);
      if (!d) return;
      const cost = Math.round(clampNum(stam, 1, 30, 5));
      if (typeof canAfford === "function" && !canAfford(cost)) {
        if (typeof toast === "function") toast(`时间不够（需要 ${cost}）。`);
        return;
      }
      /* 已读完 → 复读。放在扣时间之前、时间校验之后，任何入口都绕不过去。 */
      if (it.finished) {bookReread(it, d, cost); return;}
      const gain = bookProgressGain(it, cost);
      it.prog = clampNum(num(it.prog, 0) + gain, 0, num(it.progMax, 100));
      if (typeof spendStamina === "function") spendStamina(cost, "读书");
      bagWear("write", 1, "读书划线");
      bagWearBag(1);

      /* 分阶段反馈：这次跨过的所有阶段一次性给 */
      const fired = [];
      (d.stages || []).forEach((st, i) => {
        const ratio = num(it.prog, 0) / num(it.progMax, 100);
        if (ratio + 1e-6 >= num(st.at, 1) && it.stagesDone.indexOf(i) < 0) {
          it.stagesDone.push(i);
          fired.push(st);
          (st.eff || []).forEach(cmd => {if (typeof runEffectSpec === "function") runEffectSpec(cmd, S);});
        }
      });
      const full = num(it.prog, 0) >= num(it.progMax, 100);
      /* ★ 坑 51：读完之后玩家还可能手滑再点一次「读」。
       * 若只用 prog >= max 判 done，每点一次都会重复 count("read")、
       * 重复抽天赋、重复弹解锁 —— 实测一本书能刷出 4 个天赋。
       * 用 it.finished 锁死，只结算一次。 */
      const done = full && !it.finished;
      let extraLine = "";
      if (done) {
        it.finished = true;
        if (typeof count === "function") count("read");
        /* 教育立场：读书只解锁正面天赋，出身类一律不给（FAMILY_TALENTS）。
         * 也顺便接上「以书入道」成就的 bookTalent 计数 —— 旧图书角
         * 删掉后这个成就一度永远拿不到，体检脚本把它抓出来了。 */
        if (typeof pickGoodTalent === "function" && Math.random() < 0.6) {
          const t = pickGoodTalent(1, 3);
          if (t && typeof gainTalent === "function") {
            const got = gainTalent(t, "读书");
            /* 只有真的解锁了才记「以书入道」的进度 —— 以前无条件 count，
             * 天赋没拿到也算一次，成就比面板还快。 */
            if (got !== false) {
              if (typeof count === "function") count("bookTalent");
              extraLine = `<div style="margin-top:7px;color:var(--gold)">📖 合上书，好像多懂了一点什么 —— 解锁天赋【${t}】。</div>`;
              if (typeof checkAch === "function") checkAch();
            }
          }
        }
      }
      if (typeof modProp === "function") modProp("心态", fired.length ? 1 : 0);

      let body = `<div style="line-height:1.62"><div>你抽了 <b>${cost}</b> 点时间读 ${d.n}，进度往前走了一截。</div>`;
      fired.forEach(st => {body += `<div style="margin-top:7px;color:var(--green)">${st.txt}</div>`;});
      if (!fired.length) body += `<div style="margin-top:6px;color:var(--dim)">还没翻到有意思的地方，但字是一个个读过去了。</div>`;
      if (full) body += `<div style="margin-top:8px;color:var(--gold)">📖 读完了。${TZ(d.lore || "")}</div>`;
      body += extraLine;
      body += `</div><div style="margin-top:9px">${bookBarHtml(it)}</div>`;

      /* 读书是自由操作，自己带结果文本，标 feedback:false */
      if (typeof showModal === "function") {
        showModal("读到哪儿了", body, [{t: done ? "合上书" : "先读到这儿"}],
          () => {if (typeof openBag === "function") openBag();}, false, true,
          {kind: "free", badge: "📖 读书", feedback: false});
      }
      if (typeof renderHUD === "function") renderHUD();
    }

    function bookBarHtml(it) {
      const pct = clampNum(num(it.prog, 0) / num(it.progMax, 100) * 100, 0, 100, 0);
      const show = barHasNumber();
      return `<div class="bagbar book"><i style="width:${pct}%"></i></div>` +
        (show ? `<span style="color:var(--dim);font-size:.8rem">进度 ${Math.round(it.prog)} / ${it.progMax}</span>` : "");
    }

    function bagDurHtml(it) {
      const d = anyDef(it.def);
      const pct = clampNum(num(it.dur, 0) / Math.max(1, num(it.durMax, 1)) * 100, 0, 100, 0);
      const low = pct <= 25 ? " low" : "";
      const show = barHasNumber();
      const infinite = num(d && d.dur, 0) >= 900;
      return `<div class="bagbar${low}"><i style="width:${infinite ? 100 : pct}%"></i></div>` +
        (show ? `<span class="durnum">${infinite ? "常新" : `${Math.round(it.dur)} / ${it.durMax}`}</span>` : "");
    }

    /* ------------------------------------------------------------------
     * 界面：文具袋 / 小卖部 / 上网商店 / 图书角
     * ------------------------------------------------------------------ */

    /* ★ 行动链的收尾回调（坑 50）：
     * takeAction("read") 传进来的 onDone = afterAction(k)。玩家从图书角
     * 一路点到文具袋、小卖部，中间会换好几次 showModal，但只有最后
     * 「关闭」那一次才该收尾。用一个模块级变量把回调带到底，
     * 所有面板的 onClose 统一走 bagFinishPending()。 */
    var BAG_PENDING_DONE = null;
    function bagFinishPending() {
      const f = BAG_PENDING_DONE;
      BAG_PENDING_DONE = null;
      if (typeof f === "function") f();
      else if (typeof ensureActionPanel === "function") ensureActionPanel();
    }

    /* ★ 需求 9「事事有回应」：买文具、买书、借书都是有后果的操作，
     * 不能只往日志栏写一行就完事。这里统一弹一个结果窗，玩家点确认才走。
     * 「继续逛」重开原面板（不收尾），「收好」才 bagFinishPending() 收尾行动链。
     * 顺带把 fbUnlock 攒下的解锁文本即时显示出来，别拖到下一个事件弹窗。 */
    function bagResult(title, text, replayFn) {
      let pend = [];
      try {
        if (typeof FB_PENDING !== "undefined" && Array.isArray(FB_PENDING)) pend = FB_PENDING.splice(0);
      } catch (e) {pend = [];}
      const unlockHtml = pend.length
        ? `<div style="margin-top:8px">${pend.map(x => `<div style="color:var(--gold)">🏆 ${TZ(x.txt || "")}</div>`).join("")}</div>`
        : "";
      const opts = [];
      if (typeof replayFn === "function") opts.push({t: "继续逛", fn: () => {replayFn();}});
      opts.push({t: "收好", fn: () => {}});
      if (typeof showModal === "function") showModal(title,
        `<div style="line-height:1.62">${text}</div>${unlockHtml}`,
        opts, () => {bagFinishPending();}, false, true,
        {kind: "free", badge: "🎒 文具袋", feedback: false});
    }

    function bagHeadHtml() {
      bagEnsure();
      const b = S.bag;
      const cap = num(b.cap, 6);
      const scattered = b.scattered;
      const bagPct = clampNum(num(b.bagDur, 0) / Math.max(1, num(b.bagDurMax, 1)) * 100, 0, 100, 0);
      const bk = bagBooks().length;
      const loose = b.items.filter(it => !bagOccupies(it) && !bagIsBook(it)).length;
      return `<div class="bag-head"><div><b>🎒 文具袋</b>　笔与橡皮 ${bagCount()} / ${cap} 件` +
        (loose ? `　<span style="color:var(--dim)">🎒 另放 ${loose} 件</span>` : "") +
        (bk ? `　<span style="color:var(--dim)">📚 书架 ${bk} 本</span>` : "") + `　` +
        (scattered ? `<span style="color:var(--red)">⚠️ 散落中（学习效率 ×${BAG_RULES.scatterStudyMul}）</span>` :
          `<span style="color:var(--dim)">拉链还好</span>`) + `</div>` +
        `<div class="bagbar"><i style="width:${bagPct}%"></i></div>` +
        (barHasNumber() ? `<span class="durnum">袋身 ${Math.round(b.bagDur)} / ${b.bagDurMax}</span>` : "") +
        `<div class="create-note">${scattered ? "买一只新文具袋就能收好；散落时更容易丢东西。" : "只有笔和橡皮占格子；书、球拍、书签放在书包和书架上。做题、学习需要能写字的笔，铅笔要配橡皮。"}</div></div>`;
    }

    function bagItemHtml(it) {
      const d = anyDef(it.def) || {};
      const tags = [];
      if (it.borrowed) tags.push(`<span class="tagtag warn">借的 · 第 ${it.dueWeek} 周还</span>`);
      if (d.need === "eraser") tags.push(`<span class="tagtag">需橡皮</span>`);
      if (d.weekly) tags.push(`<span class="tagtag">每周 +${d.weekly} 学习</span>`);
      if (d.perk) tags.push(`<span class="tagtag good">每周小收益</span>`);
      const isBook = bagIsBook(it);
      if (!bagOccupies(it)) tags.push(`<span class="tagtag">不占格子</span>`);
      if (it.finished) tags.push(`<span class="tagtag good">已读完 · 可复读</span>`);
      return `<div class="bag-item"><div class="bag-ico">${it.icon || "🎒"}</div><div class="bag-main">
        <div class="bag-name">${it.n}${tags.join("")}</div>
        <div class="bag-desc">${TZ(d.desc || d.lore || "")}</div>
        ${isBook ? bookBarHtml(it) : bagDurHtml(it)}</div>
        <div class="bag-ops">${isBook
          ? `<button class="mini-btn" onclick="bagReadUi('${it.uid}')">${it.finished ? "🔁 复读" : "📖 读"}</button>`
          : (it.cat === "write" || it.cat === "eraser" ? "" : "")}</div></div>`;
    }

    function bagReadUi(uid) {
      bagEnsure();
      /* 读书也要能写字的笔（划线、做笔记）。笔烂了不能绕过文具袋直接读。 */
      if (typeof bagGate === "function" && bagGate("read")) {
        if (typeof toast === "function") toast("✏️ 没有能写字的笔了，读不了书 —— 去小卖部买一支");
        return;
      }
      const it = S.bag.items.find(x => x.uid === uid);
      if (!it) return;
      const left = (typeof staminaLeft === "function") ? staminaLeft() : 0;
      const re = !!it.finished;
      /* 复读档位不写点数，真实模式下也不漏具体数值（坑 75） */
      const reWord = ["翻一小会儿", "翻半下午", "从头再翻一遍"];
      const opts = [5, 10, 20].filter(n => n <= left).map((n, i) => ({
        t: re ? reWord[i] || "再翻一遍" : `读 ${n} 点时间`,
        sub: re ? "重翻一遍，会有点别的小收获" : `预计推进 ${Math.round(bookProgressGain(it, n))} 点进度`,
        fn: () => {bookRead(uid, n);}
      }));
      if (!opts.length) opts.push({t: "时间不够了", disabled: true, fn: () => {}});
      opts.push({t: "返回文具袋", fn: () => {openBag();}});
      const hint = re
        ? "这本已经读完了。再翻一遍不会推进进度，也不会再抽天赋，但会有点别的小收获。"
        : "读得久推进得多，但也要花力气；效率、悟性和天赋会影响推进速度。";
      const sub = (typeof barHasNumber === "function" && barHasNumber())
        ? `当前剩余时间 ${left}。${hint}` : hint;
      if (typeof showModal === "function") showModal(re ? "再翻一遍" : "读多久",
        `<div style="line-height:1.62">${it.n}<br><span style="color:var(--dim);font-size:.85rem">${sub}</span></div>${bookBarHtml(it)}`,
        opts, null, false, true, {kind: "free", badge: re ? "📖 复读" : "📖 读书", feedback: false});
    }

    function openBag() {
      if (!S || S.over) return;
      bagEnsure();
      const b = S.bag;
      let h = bagHeadHtml();
      /* v1.5.3：一个滚动区里分三拨，用标题行隔开。
       * ① 占格子的笔 / 橡皮 ② 不占格子的装备 ③ 书架（读完可复读）
       * 混在一起会让头上「N / cap 件」看着对不上。 */
      const occupying = b.items.filter(it => bagOccupies(it));
      const loose = b.items.filter(it => !bagOccupies(it) && !bagIsBook(it));
      const books = bagBooks();
      h += `<div class="bag-list">`;
      h += `<div class="bag-group">✏️ 笔与橡皮 · 占格子 ${occupying.length} / ${num(b.cap, 6)}</div>`;
      h += occupying.length ? occupying.map(bagItemHtml).join("")
        : `<div style="color:var(--dim);padding:10px">一支能写字的笔都没有 —— 去小卖部买一支，学习、做题、读书都要用。</div>`;
      if (loose.length) {
        h += `<div class="bag-group">🎒 另放的书包 / 课桌 · ${loose.length} 件，不占格子</div>`;
        h += loose.map(bagItemHtml).join("");
      }
      if (books.length) {
        h += `<div class="bag-group">📚 书架 · ${books.length} 本${books.some(x => x.finished) ? "，读完的可以复读" : ""}</div>`;
        h += books.map(bagItemHtml).join("");
      }
      h += `</div>`;
      if (b.lent.length) {
        h += `<div class="create-note">📚 借出去的：${b.lent.map(x => {
          const d = anyDef(x.def); return `${d ? d.n : "书"}（第 ${x.backWeek} 周还）`;
        }).join("、")}</div>`;
      }
      const opts = [
        {t: "🏪 去小卖部", fn: () => {openShop();}},
        {t: "🛒 上网买文具 / 书（周末）", disabled: () => S.slot !== "weekend" && S.slot !== "clubday", fn: () => {openOnlineShop();}},
        {t: "📚 读书角（借一本）", fn: () => {openBookCorner();}},
        {t: "关闭", fn: () => {}}
      ];
      if (typeof showModal === "function") showModal("文具袋", h, opts,
        () => {bagFinishPending();},
        false, true, {kind: "free", badge: "🎒 文具袋", feedback: false});
    }

    /* 小卖铺：全部文具与书，按组陈列，固定价（需求 13 / v1.5.3） */
    function openShop() {
      if (!S || S.over) return;
      bagEnsure();
      const money = Math.round(num(S.prop.经济, 0));
      const body = '<div class="shop-head">货架上摆着这一学期能用到的全部东西。' +
        '<span>手头 ' + money + ' 元 · 笔与橡皮 ' + bagCount() + '/' + num(S.bag.cap, 6) +
        ' 件 · 其它不占格子。固定价，不还价。</span></div><div id="shopList">' +
        SHOP_GROUPS.map(shopGroupHtml).join("") + '</div>';
      const opts = [
        {t: "🛒 上网看看（周末 · 每周刷新）", disabled: () => S.slot !== "weekend" && S.slot !== "clubday", fn: () => {openOnlineShop();}},
        {t: "回文具袋", fn: () => {openBag();}},
        {t: "关闭", fn: () => {}}
      ];
      if (typeof showModal === "function") {
        showModal("🏪 小卖铺", body, opts, () => {bagFinishPending();},
          false, true, {kind: "free", badge: "🏪 小卖铺", feedback: false});
        /* showModal 是同步把 body 写进 DOM 的，调用返回后直接绑事件即可。
         * 商品做成 body 里的按钮（不是 options），才能在中间插分组标题。 */
        bindShopItems();
      }
    }

    /* 点商品 → 先放货再扣钱 → 结果窗 →「继续逛」回到货架。
     * 事件链收尾仍由 bagResult 的「收好」统一走 bagFinishPending()。 */
    function bindShopItems() {
      const box = document.getElementById("shopList");
      if (!box) return;
      box.querySelectorAll("button[data-buy]").forEach(btn => {
        btn.onclick = () => {
          if (btn.disabled) return;
          const id = btn.dataset.buy;
          const d = anyDef(id);
          if (!d) return;
          const price = num(d.price, 10);
          const ok = bagBuy(id, price, "小卖部");
          bagResult(ok ? "买到了" : "没买成",
            ok ? d.icon + " " + TZ(d.n) + " 拿回来了，花了 " + price + " 元。" +
                '<br><span style="color:var(--dim);font-size:.85rem">' + TZ(d.desc || d.lore || "") + '</span>'
               : "没买成：" + TZ(bagBuyFailWhy(id, price)) + "。",
            () => openShop());
        };
      });
    }

    function openOnlineShop() {
      if (!S || S.over) return;
      /* 需求 13：上网买东西是「周末回家」才有的事，周中住校碰不到电脑 */
      if (S.slot !== "weekend" && S.slot !== "clubday") {
        if (typeof toast === "function") toast("🛒 周末回家才能上网买东西。");
        return;
      }
      bagEnsure();
      const stock = bagOnlineStock();
      const d = statDef;
      const opts = stock.map((s, i) => {
        const def = anyDef(s.id);
        if (!def) return null;
        const base = num(def.price, 10);
        const diff = s.price - base;
        const tag = diff > 0 ? `（比店里贵 ${diff}）` : (diff < 0 ? `（比店里便宜 ${-diff}）` : "（同价）");
        const owned = bookDef(s.id) && bagHasBook(s.id);
        return {
          t: `${def.icon} ${def.n}`, sub: owned ? "书架里已经有了，读完可以复读" : `${s.price} 元 ${tag}`,
          disabled: () => !bagCanBuy(s.id, s.price),
          fn: () => {
            const ok = bagBuy(s.id, s.price, "网购");
            bagResult(ok ? "下单了" : "没买成",
              ok ? `${def.icon} ${def.n} 下单成功，花了 ${s.price} 元，过两天就能塞进文具袋。<br><span style="color:var(--dim);font-size:.85rem">${TZ(def.desc || def.lore || "")}</span>`
                 : `没买成：${bagBuyFailWhy(s.id, s.price)}。`,
              () => openOnlineShop());
          }
        };
      }).filter(Boolean);
      opts.push({t: "🏪 去小卖部", fn: () => {openShop();}});
      opts.push({t: "关闭", fn: () => {}});
      if (typeof showModal === "function") showModal("🛒 周末 · 上网买点东西",
        `<div style="line-height:1.62">周末回家，用电脑刷了刷。每周上架的东西不一样，价格也会浮动。<br><span style="color:var(--dim);font-size:.85rem">手头 ${Math.round(num(S.prop.经济, 0))} 元 · 本周第 ${num(S.week, 0) + 1} 周的货。</span></div>`,
        opts, () => {bagFinishPending();},
        false, true, {kind: "free", badge: "🛒 网购", feedback: false});
    }

    /* 图书角：教室后墙，随机三本可借 / 可买（需求 14 获取途径） */
    function openBookCorner(onDone) {
      if (!S || S.over) return;
      bagEnsure();
      BAG_PENDING_DONE = (typeof onDone === "function") ? onDone : null;
      /* 书架里已有的不再摆出来（含借出去、还没还的）—— 一个存档一种书只留一本。 */
      const shuffled = BOOK_DEFS.filter(bk => !bagHasBook(bk.id))
        .sort((a, b) => weekHash(num(S.week, 0), a.id.length * 7) - weekHash(num(S.week, 0), b.id.length * 7));
      const picked = shuffled.slice(0, 3);
      if (!picked.length) {
        const opts = [{t: "回文具袋", fn: () => {openBag();}}, {t: L("modal.cancel"), fn: () => {}}];
        if (typeof showModal === "function") showModal("📚 教室后墙 · 图书角",
          `<div style="line-height:1.62">书架上的书你都收齐了。想再看，回文具袋点「🔁 复读」就行。</div>`,
          opts, () => {bagFinishPending();}, false, true,
          {kind: "free", badge: "📚 图书角", feedback: false});
        return;
      }
      const opts = picked.map(bk => ({
        t: `${bk.icon} ${bk.n}`, sub: `买 ${bk.price} 元 · 读完约需 ${bk.progMax} 进度`,
        disabled: () => !bagCanBuy(bk.id, bk.price),
        fn: () => {
          const ok = bagBuy(bk.id, bk.price, "图书角");
          if (ok) checkAchD();
          bagResult(ok ? "抱回一本" : "没买成",
            ok ? `${bk.icon} ${bk.n} 进了文具袋，花了 ${bk.price} 元。<br><span style="color:var(--dim);font-size:.85rem">${TZ(bk.desc || "")} 在文具袋里点「📖 读」慢慢看。</span>`
               : `没买成：${bagBuyFailWhy(bk.id, bk.price)}。`,
            () => openBookCorner(onDone));
        }
      }));
      opts.push({t: "📚 向同学借一本（3 周后还）", fn: () => {
        const bk = picked[rnd(picked.length)];
        const ok = bagAdd(bk.id, {borrowed: true, dueWeek: num(S.week, 0) + 3, from: "同学", force: true});
        if (ok) checkAchD();
        bagResult(ok ? "借到了" : "没借成",
          ok ? `📚 同学把 ${bk.icon} ${bk.n} 递给你：「三周后还我啊。」<br><span style="color:var(--dim);font-size:.85rem">借来的书有时限，到期会自动还回去 —— 趁早读。</span>`
             : "袋里实在塞不下了。",
          () => openBookCorner(onDone));
      }});
      opts.push({t: L("modal.cancel"), fn: () => {}});
      if (typeof showModal === "function") showModal("📚 教室后墙 · 图书角",
        `<div style="line-height:1.62">没有图书馆，只有后墙那排书架。买下来的书会进文具袋，借来的有时限。<br><span style="color:var(--dim);font-size:.85rem">手头 ${Math.round(num(S.prop.经济, 0))} 元 · 读书要花时间，读到不同阶段会有不同的回响。</span></div>`,
        opts, () => {bagFinishPending();}, false, true, {kind: "free", badge: "📚 图书角", feedback: false});
    }

    function checkAchD() {if (typeof checkAch === "function") checkAch();}

    /* 旧「读书」行动保留：仍然消耗体力，但改成打开图书角。
     * afterAction 链交给 16-flow.js 里的 takeAction 处理。 */

    /* ------------------------------------------------------------------
     * 事件联动指令（需求 15）
     *  文具 丢失 书写        → 真的拿走一支笔
     *  文具 丢失 任意        → 随便丢一件非袋子的
     *  文具 磨损 书写 5      → 扣耐久
     *  文具 获得 gel_pen     → 获得一件
     *  文具 借书 3周         → 借一本有时限的书
     *  文具 借出 3周         → 把自己的书借出去，到期回来
     *  文具 换袋             → 自动给一只新布袋（散落解除）
     * ------------------------------------------------------------------ */
    function stationeryCmd(raw, Sref) {
      const s = String(raw || "").trim();
      if (!s) return false;
      if (!/^文具\s/.test(s)) return false;
      if (!S) return true;
      bagEnsure();

      let m = s.match(/^文具\s+丢失\s+(书写|球拍|实验|任意|装饰|橡皮)$/);
      if (m) {
        const catMap = {书写:"write", 球拍:"sport", 实验:"lab", 装饰:"charm", 橡皮:"eraser", 任意:null};
        const cat = catMap[m[1]];
        let pool = S.bag.items.filter(it => it.cat !== "bag" && (cat === null || it.cat === cat));
        if (cat === "write") pool = pool.filter(it => it.dur > 0);
        if (pool.length) {
          const it = pool[rnd(pool.length)];
          const wasWrite = (it.cat === "write" || it.cat === "eraser");
          bagRemove(it.uid, true);
          /* v1.4.1：丢笔和用坏笔一样要提示，而且要说清影响哪几个行动 */
          const noPen = wasWrite && !bagRequireWrite();
          const txt = `🎒 ${it.n} 真的不见了。` +
            (noPen ? " 没有能写字的笔了 —— 学习、做题、读书暂时做不了，去小卖部买一支。" : "");
          if (typeof say === "function") say(txt, "bad");
          if (typeof toast === "function") {
            toast(noPen ? "✏️ 笔不见了：学习 / 做题 / 读书暂时做不了" : `🎒 ${it.n} 不见了`);
          }
        } else if (typeof say === "function") say("你摸了摸书包，好像本来也没什么可丢的。", "sys");
        return true;
      }
      m = s.match(/^文具\s+磨损\s+(书写|球拍|实验|橡皮)\s*(\d+)?$/);
      if (m) {
        const catMap = {书写:"write", 球拍:"sport", 实验:"lab", 橡皮:"eraser"};
        /* ★ 坑 69：正则捕获的是【字符串】，num() 只认 number 类型，
         * 直接 num(m[2], 2) 写「磨损 书写 9」也永远只扣默认的 2。
         * 所有从指令里读出来的数字都要先 parseInt。 */
        bagWear(catMap[m[1]], m[2] ? parseInt(m[2], 10) : 2, "事件");
        return true;
      }
      m = s.match(/^文具\s+获得\s+(\S+?)(?:\s+(\d+)件)?$/);
      /* ★ 坑 52：事件文案说「书进了文具袋」，但袋满时 bagAdd 会静默
       * 返回 false —— 玩家看到文本，状态却没变，正是需求 9 要治的毛病。
       * 容量只约束「玩家花钱买」，剧情给的东西一律 force 塞进来，
       * 并补一句「塞不下，先捧着」。
       * v1.5 B 批：支持「文具 获得 gel_pen 3件」一次给多件。 */
      if (m) {
        const cnt = clampNum(m[2] ? parseInt(m[2], 10) : 1, 1, 20, 1);
        for (let i = 0; i < cnt; i++) bagAdd(m[1], {from: "事件", force: true});
        return true;
      }

      /* ================================================================
       * v1.5 B 批 · 按具体文具 id 操作的精确指令（需求 3 / 诊断 §7）
       * ----------------------------------------------------------------
       * 旧的「文具 丢失 书写」是随机挑一件，写不出「那支钢笔断了」。
       * 现在内容作者可以直接点名，且这些指令都过同一套报废反馈：
       *
       *   文具 消耗 fountain 6   那支钢笔扣 6 点耐久，归零就报废
       *   文具 移除 gel_pen      拿走一件指定的（不问耐久）
       *   文具 修复 bag_cloth 20 加耐久，不超过上限
       *   文具 补齐 书写         没可用笔时补一支铅笔头（防死锁）
       *
       * id 写在 STATIONERY_DEFS / BOOK_DEFS 里；找不到就给一句中文提示，
       * 不抛错、不影响游戏。可用 bagHas("fountain") 在 cond 里判断。
       * ================================================================ */
      m = s.match(/^文具\s+消耗\s+(\S+)\s*(\d+)?$/);
      if (m) {
        const it = S.bag.items.find(x => x.dur > 0 && x.def === m[1]);
        if (!it) {if (typeof say === "function") say(`🎒 袋里没有「${m[1]}」，这一下没损耗什么。`, "sys"); return true;}
        it.dur = Math.max(0, num(it.dur, 0) - clampNum(m[2] ? parseInt(m[2], 10) : 1, 1, 999, 1));
        if (it.dur <= 0) bagBreakItem(it, "事件");
        else if (typeof say === "function") say(`🎒 ${it.n} 磨损了一点，还能用。`, "sys");
        return true;
      }
      m = s.match(/^文具\s+移除\s+(\S+)$/);
      if (m) {
        const it = S.bag.items.find(x => x.def === m[1]);
        if (it) {
          bagRemove(it.uid, true);
          const noPen = (it.cat === "write" || it.cat === "eraser") && !bagRequireWrite();
          const txt = `🎒 ${it.n} 不在袋里了。` + (noPen ? " 没有能写字的笔了 —— 先去买一支。" : "");
          if (typeof say === "function") say(txt, noPen ? "bad" : "sys");
          if (typeof toast === "function") toast(noPen ? "✏️ 笔没了：学习 / 做题 / 读书暂时做不了" : `🎒 ${it.n} 不在袋里了`);
        }
        return true;
      }
      m = s.match(/^文具\s+修复\s+(\S+)\s*(\d+)?$/);
      if (m) {
        const it = S.bag.items.find(x => x.def === m[1]);
        if (it) {
          it.dur = clampNum(num(it.dur, 0) + clampNum(m[2] ? parseInt(m[2], 10) : 5, 1, 999, 5), 0, num(it.durMax, 20));
          if (typeof say === "function") say(`🎒 ${it.n} 修了修，又能撑一阵。`, "good");
        }
        return true;
      }
      if (/^文具\s+补齐\s+书写$/.test(s)) {
        if (!bagRequireWrite()) {
          bagAdd("pencil_stub", {silent: true, force: true, from: "同学送的"});
          if (!bagItems("eraser").length) bagAdd("eraser", {silent: true, force: true, from: "同学送的"});
          if (typeof say === "function") say("🎒 同桌塞来一支短铅笔：「先用着。」", "good");
        }
        return true;
      }
      m = s.match(/^文具\s+借书\s*(\d+)?周?$/);
      if (m) {
        /* 只从书架上没有的书里挑，避免事件凭空塞出第二本同样的书 */
        const pool = BOOK_DEFS.filter(bk => !bagHasBook(bk.id));
        if (!pool.length) {
          if (typeof say === "function") say("📚 同学手里的书你都看过了，这回没借成。", "sys");
          return true;
        }
        const bk = pool[rnd(pool.length)];
        const wk = m[1] ? parseInt(m[1], 10) : 3;   // 同样是字符串，别交给 num()
        bagAdd(bk.id, {borrowed: true, dueWeek: num(S.week, 0) + Math.max(1, wk), from: "同学", force: true});
        return true;
      }
      m = s.match(/^文具\s+借出\s*(\d+)?周?$/);
      if (m) {bagLendBook(Math.max(1, m[1] ? parseInt(m[1], 10) : 3)); return true;}
      if (/^文具\s+换袋$/.test(s)) {bagAdd("bag_cloth", {from: "事件"}); return true;}
      if (/^文具\s+散落$/.test(s)) {S.bag.scattered = true; S.bag.bagDur = 0; return true;}
      /* v1.5 B 批：把「借来的书」闭环 —— 到期还回去，袋里真的少一本。
       * 内容作者写「文具 归还」就能让借书事件的后续真的发生。 */
      if (/^文具\s+归还$/.test(s)) {
        const borrowed = S.bag.items.filter(it => it.borrowed);
        if (!borrowed.length) {
          if (typeof say === "function") say("🎒 袋里没有借来的书，不用还。", "sys");
          return true;
        }
        borrowed.forEach(it => bagRemove(it.uid, true));
        if (typeof say === "function") say(`🎒 把 ${borrowed.map(x => x.n).join("、")} 还了回去，书桌上空出一块。`, "sys");
        if (typeof toast === "function") toast(`🎒 还了 ${borrowed.length} 本书`);
        return true;
      }
      if (typeof console !== "undefined") console.warn("[内容提示] 没看懂这条文具指令：", s);
      return true;
    }
