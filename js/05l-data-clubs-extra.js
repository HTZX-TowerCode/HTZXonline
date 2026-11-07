/* ==================================================================
 * 内容层 · 社团事件扩充（v1.5 C 批 / 需求 2）
 * ------------------------------------------------------------------
 * 13 个社团各 4 条，共 52 条。原来每社只有 4 条，一年只进一个社团，
 * 20 周里同一条要重复出现 4~5 次 —— 这是后期枯燥的主因。
 * 现在每社 8 条，配合 dist:uniform + minGap，重复率降到约一半。
 *
 * ★ 单独一个文件，不动 05b 原有的 52 条（改坏了可整段回退）。
 * ★ 每条都带「计数 club」，否则社团天赋的累计次数不涨。
 * ★ slot 一律 clubday（周三社团课），别写到周末去。
 *
 * 维护等级：内容层（文案、数值、选项随便改）
 * ================================================================== */

    const CLUB_EVENTS_EXTRA = [
      // ——— guohua ———
      {id: "cl_guohua_5",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "guohua",
        t: "国画社 · 洗笔",
        c: "一节课结束，笔洗里的水黑得看不见底。\n你蹲在水池边涮笔，墨顺着指尖往下淌。",
        opts: [
          {t: "一支支涮干净", stam: 2, run: ["悟性 +3", "效率 +3", "计数 club", "提示 笔锋重新拢起来，明天还能用。!good"]},
          {t: "泡着，先去吃饭", run: ["心态 +3", "计数 club", "提示 回来时笔毛泡得有点开。"]}
        ]},
      {id: "cl_guohua_6",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "guohua",
        t: "国画社 · 题款",
        c: "画完成了，右下角空着一小块。\n老师说：题款也是画的一部分。",
        opts: [
          {t: "练了半页再落笔", stam: 2, run: ["悟性 +6", "效率 +4", "压力 +3", "计数 club", "提示 字歪了一点，但和山很配。!good"]},
          {t: "只写名字和日期", run: ["心态 +3", "计数 club", "提示 干干净净，什么也没多说。"]}
        ]},
      {id: "cl_guohua_7",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "guohua",
        t: "国画社 · 借颜料",
        c: "你的石青用完了，隔壁桌那盒还剩小半块。",
        opts: [
          {t: "开口借", run: ["社交 +5", "悟性 +2", "计数 club", "提示 他把盒子推过来：「用完直接放这儿。」!good"]},
          {t: "拿赭石凑合", run: ["悟性 +3", "效率 -2", "计数 club", "提示 山变成了傍晚的颜色，倒也不难看。"]}
        ]},
      {id: "cl_guohua_8",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "guohua",
        t: "国画社 · 装裱",
        c: "期末展要把画贴到硬纸板上。\n浆糊刷多了，纸角起了一圈皱。",
        opts: [
          {t: "揭了重贴", stam: 3, run: ["悟性 +5", "效率 +5", "健康 -2", "计数 club", "提示 第二遍平了，手指黏了半节课。!good"]},
          {t: "压在书底下等干", run: ["心态 +4", "计数 club", "提示 第二天皱还在，但没人看出来。"]}
        ]},
      // ——— niantu ———
      {id: "cl_niantu_5",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "niantu",
        t: "黏土社 · 烤裂了",
        c: "上周捏的小碗进了烤箱，拿出来时底上裂了一道。",
        opts: [
          {t: "拿泥补上再烤一次", stam: 2, run: ["悟性 +5", "效率 +4", "计数 club", "提示 裂缝成了一道花纹。!good"]},
          {t: "就留着那道裂", run: ["心态 +5", "计数 club", "提示 摆在窗台上，从这边看正好。"]}
        ]},
      {id: "cl_niantu_6",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "niantu",
        t: "黏土社 · 上色",
        c: "一桌子的颜料碟，你那盒白色见底了。",
        opts: [
          {t: "调一点淡灰代替", run: ["悟性 +4", "心态 +3", "计数 club", "提示 阴天的颜色，比白的耐看。"]},
          {t: "等别人用完借", run: ["社交 +4", "压力 +2", "计数 club", "提示 等了十分钟，赶在下课之前涂完了。"]}
        ]},
      {id: "cl_niantu_7",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "niantu",
        t: "黏土社 · 捏校门",
        c: "社团接了个活：给校园开放日做个校门模型。",
        opts: [
          {t: "把「立行号」那三个字也捏出来", stam: 3, run: ["悟性 +7", "效率 +4", "社交 +4", "计数 club", "提示 字小得要凑近才看得清，老师看了很久。!good"]},
          {t: "只做门柱和瓦顶", run: ["悟性 +3", "计数 club", "提示 简单，但稳当。"]}
        ]},
      {id: "cl_niantu_8",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "niantu",
        t: "黏土社 · 送给老师",
        c: "做了个巴掌大的小猫，耳朵还是歪的。",
        opts: [
          {t: "放到办公桌上", run: ["社交 +6", "心态 +5", "计数 club", "提示 第二天它出现在讲台角上。!good"]},
          {t: "自己留着", run: ["心态 +3", "计数 club", "提示 压在笔筒底下，没舍得给人。"]}
        ]},
      // ——— huadeng ———
      {id: "cl_huadeng_5",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "huadeng",
        t: "花灯社 · 扎骨架",
        c: "竹篾刮到手，一道白印，过一会儿才红。\n老师说骨架歪一分，灯就歪一寸。",
        opts: [
          {t: "拆了重扎", stam: 3, run: ["悟性 +6", "效率 +5", "健康 -3", "计数 club", "提示 第二遍正了，手指也贴上了胶布。!good"]},
          {t: "拿细绳绷一绷", run: ["效率 +4", "心态 +2", "计数 club", "提示 远看不出来，近看还有点扭。"]}
        ]},
      {id: "cl_huadeng_6",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "huadeng",
        t: "花灯社 · 记唱词",
        c: "一段花灯调，你总在第三句拐错弯。",
        opts: [
          {t: "散场后留下再唱三遍", stam: 3, run: ["悟性 +6", "压力 +4", "计数 club", "提示 第三遍顺了，走廊里只剩你一个人的声音。!good"]},
          {t: "跟着别人小声哼", run: ["社交 +4", "悟性 +2", "计数 club", "提示 没出错，也没人听见你。"]}
        ]},
      {id: "cl_huadeng_7",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "huadeng",
        t: "花灯社 · 后台",
        c: "演出前十分钟，头套的带子断了一根。",
        opts: [
          {t: "拿别针别上", run: ["效率 +6", "心态 +3", "计数 club", "提示 台上没掉，下台才敢松口气。!good"]},
          {t: "找老师换一顶", run: ["社交 +3", "压力 +3", "计数 club", "提示 换来的那顶有点大，一直往下滑。"]}
        ]},
      {id: "cl_huadeng_8",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "huadeng",
        t: "花灯社 · 下乡演出",
        c: "周末去镇上，戏台搭在晒谷场，风把幕布吹得鼓起来。",
        opts: [
          {t: "站到最前面那排", stam: 4, run: ["社交 +7", "心态 +6", "健康 +2", "计数 club", "提示 台下全是抬头看的人，有老人跟着哼。!good"]},
          {t: "在侧台帮着递道具", run: ["社交 +3", "效率 +4", "计数 club", "提示 一场下来，道具一件没少。"]}
        ]},
      // ——— chorus ———
      {id: "cl_chorus_5",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "chorus",
        t: "合唱团 · 分声部",
        c: "指挥把你从二声部挪到了一声部。\n旁边的人唱得都很稳。",
        opts: [
          {t: "跟着琴练到会", stam: 2, run: ["悟性 +5", "效率 +4", "压力 +3", "计数 club", "提示 第三遍终于没被带跑。!good"]},
          {t: "小声跟着混过去", run: ["心态 +3", "社交 +2", "计数 club", "提示 没出错，也没人注意到你换了位置。"]}
        ]},
      {id: "cl_chorus_6",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "chorus",
        t: "合唱团 · 抢拍",
        c: "钢琴前奏还没完，你提前半拍进了。\n指挥抬了下眼。",
        opts: [
          {t: "数着拍子重来", run: ["悟性 +4", "效率 +5", "计数 club", "提示 这回稳了，指挥点了点头。!good"]},
          {t: "看别人嘴型跟", run: ["社交 +3", "心态 +2", "计数 club", "提示 后半段就再没抢过。"]}
        ]},
      {id: "cl_chorus_7",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "chorus",
        t: "合唱团 · 伴奏没来",
        c: "伴奏的同学生病了，离演出还有两天。",
        opts: [
          {t: "自己用手机放伴奏带", stam: 2, run: ["效率 +6", "心态 +4", "计数 club", "提示 音质一般，但节奏稳住了。!good"]},
          {t: "改成清唱", run: ["社交 +5", "悟性 +3", "压力 +4", "计数 club", "提示 第一句有点虚，第二句就齐了。"]}
        ]},
      {id: "cl_chorus_8",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "chorus",
        t: "合唱团 · 艺术节后台",
        c: "候场时走廊很冷，有人在小声开嗓。",
        opts: [
          {t: "跟着一起开嗓", run: ["社交 +4", "心态 +5", "计数 club", "提示 上台时嗓子是热的。!good"]},
          {t: "安静站着，把词过一遍", run: ["效率 +4", "悟性 +2", "计数 club", "提示 一句没忘。"]}
        ]},
      // ——— recite ———
      {id: "cl_recite_5",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "recite",
        t: "朗诵社 · 念错字",
        c: "稿子上那个字你一直读半边。\n社长没打断，等你念完才说。",
        opts: [
          {t: "查字典，标上拼音重念", stam: 2, run: ["悟性 +6", "效率 +4", "计数 club", "提示 后来再没错过这个字。!good"]},
          {t: "换个顺口的词", run: ["悟性 +2", "心态 +3", "计数 club", "提示 稿子改了一个字，意思没变。"]}
        ]},
      {id: "cl_recite_6",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "recite",
        t: "朗诵社 · 配乐",
        c: "老师拿来两三段音乐，让你挑一段垫在底下。",
        opts: [
          {t: "挑最安静的那段", run: ["心态 +6", "悟性 +3", "计数 club", "提示 念到第二段时，教室后排没人说话。!good"]},
          {t: "不要配乐", run: ["效率 +4", "社交 +2", "计数 club", "提示 只剩声音，反而听得更清。"]}
        ]},
      {id: "cl_recite_7",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "recite",
        t: "朗诵社 · 嗓子哑了",
        c: "连着三天早读带练，早上一开口就哑了。",
        opts: [
          {t: "含着润喉糖，压低音量练", run: ["健康 +3", "效率 +3", "计数 club", "提示 慢一点，反而把气用对了。"]},
          {t: "歇一天，只听别人念", run: ["健康 +6", "心态 +3", "计数 club", "提示 坐着听了一节课，记住了别人的停顿。"]}
        ]},
      {id: "cl_recite_8",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "recite",
        t: "朗诵社 · 升旗稿",
        c: "下周一国旗下的讲话，稿子交到了你手上。",
        opts: [
          {t: "周末对着操场念三遍", stam: 3, run: ["效率 +6", "社交 +4", "压力 +3", "计数 club", "提示 周一风很大，但每一句都送出去了。!good"]},
          {t: "请社长替你", run: ["社交 +3", "心态 +3", "计数 club", "提示 你站在队列里，听他把稿子念完。"]}
        ]},
      // ——— drama ———
      {id: "cl_drama_5",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "drama",
        t: "话剧社 · 忘词",
        c: "第三幕，你一上台把整段词忘了。\n对面的人还保持着那个姿势等你。",
        opts: [
          {t: "顺着意思现编两句", stam: 2, run: ["悟性 +6", "心态 +5", "社交 +4", "计数 club", "提示 台下笑了，戏接上了。!good"]},
          {t: "停三秒，等提词", run: ["压力 +5", "效率 +3", "计数 club", "提示 那三秒比一幕还长，好在没人出声。"]}
        ]},
      {id: "cl_drama_6",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "drama",
        t: "话剧社 · 道具",
        c: "演出用的旧箱子散了，木板掉了一地。",
        opts: [
          {t: "找钉子重新钉好", stam: 3, cond: S => Talent.have("匠心") || Talent.have("道心如铁"), run: ["悟性 +4", "效率 +6", "健康 -2", "计数 club", "提示 钉歪了两颗，但箱子能拎了。!good"]},
          {t: "换成纸盒糊一层", run: ["效率 +3", "心态 +3", "计数 club", "提示 灯一打，看不出来是纸的。"]}
        ]},
      {id: "cl_drama_7",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "drama",
        t: "话剧社 · 灯光",
        c: "追光总慢半拍，人已经走到台中，光才跟上来。",
        opts: [
          {t: "和灯控约好数拍子", run: ["效率 +6", "社交 +4", "计数 club", "提示 第二场就再没慢过。!good"]},
          {t: "自己走慢一点等光", run: ["心态 +3", "效率 +2", "计数 club", "提示 节奏变了，倒更像那场戏该有的样子。"]}
        ]},
      {id: "cl_drama_8",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "drama",
        t: "话剧社 · 谢幕",
        c: "一年一部大戏，灯亮起来，台下全是站起来的人。",
        opts: [
          {t: "站到最边上那个位置", run: ["心态 +8", "社交 +5", "计数 club", "提示 你看见初三的社长在台下擦眼镜。!good"]},
          {t: "先去后台收道具", run: ["效率 +4", "心态 +3", "计数 club", "提示 掌声隔着幕布，闷闷的，也很好听。"]}
        ]},
      // ——— english ———
      {id: "cl_english_5",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "english",
        t: "英语播音配音社 · 录音",
        c: "广播站那支麦有杂音，录了三遍都带沙沙声。",
        opts: [
          {t: "离麦远一点，放轻音量重录", stam: 2, run: ["悟性 +5", "效率 +5", "计数 club", "提示 第四遍干净了，只剩声音。!good"]},
          {t: "留着那点杂音", run: ["心态 +4", "社交 +2", "计数 club", "提示 播出时听着像老收音机，倒也没人提。"]}
        ]},
      {id: "cl_english_6",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "english",
        t: "英语播音配音社 · 绕口令",
        c: "稿子开头一长串辅音，你一快就打结。",
        opts: [
          {t: "拆成三截慢慢拼", stam: 2, run: ["悟性 +6", "效率 +4", "计数 club", "提示 拼回去之后顺得像一句话。!good"]},
          {t: "换一句短的", run: ["效率 +3", "心态 +3", "计数 club", "提示 稿子短了十秒，播出时间刚好。"]}
        ]},
      {id: "cl_english_7",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "english",
        t: "英语播音配音社 · 广播",
        c: "午间英文时段，念到一半你听见食堂那边有人跟着重复。",
        opts: [
          {t: "放慢半拍再念", run: ["社交 +6", "心态 +5", "计数 club", "提示 那边跟着的人也慢了下来。!good"]},
          {t: "照原速念完", run: ["效率 +4", "计数 club", "提示 铃响，广播断了，饭点到了。"]}
        ]},
      {id: "cl_english_8",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "english",
        t: "英语播音配音社 · 配音",
        c: "给一段动画配旁白，画面里的人在雨里跑。",
        opts: [
          {t: "压着嗓子配", run: ["悟性 +6", "心态 +4", "计数 club", "提示 回放时自己都没听出来是自己。!good"]},
          {t: "照平时说话的调子", run: ["社交 +3", "效率 +3", "计数 club", "提示 老师笑了：「这回像本人。」"]}
        ]},
      // ——— basketball ———
      {id: "cl_basketball_5",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "basketball",
        t: "篮球社 · 加练",
        c: "散场后篮下只剩你一个，球砸在板上一下一下地响。",
        opts: [
          {t: "再投五十个", stam: 4, run: ["健康 +6", "效率 +5", "压力 +4", "计数 club", "提示 最后十个连进了，手也抬不起来了。!good"]},
          {t: "捡球回去", run: ["健康 +2", "心态 +3", "计数 club", "提示 天黑得比想象中快。"]}
        ]},
      {id: "cl_basketball_6",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "basketball",
        t: "篮球社 · 判罚",
        c: "分组对抗，一个球压线没看清，两边都说是自己的。",
        opts: [
          {t: "把球给对方", run: ["社交 +6", "心态 +4", "计数 club", "提示 后半场他们传了你三次。!good"]},
          {t: "要求重打一分", run: ["效率 +3", "压力 +3", "计数 club", "提示 重打那分赢了，但谁也没再提这事。"]}
        ]},
      {id: "cl_basketball_7",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "basketball",
        t: "篮球社 · 雨天",
        c: "室外场湿了，改到体育馆，地板有点滑。",
        opts: [
          {t: "收着打，多传球", run: ["健康 +3", "社交 +5", "计数 club", "提示 没人摔，跑动也慢得刚好。"]},
          {t: "照旧突破", run: ["健康 -4", "心态 +4", "计数 club", "提示 摔了一下，爬起来接着打。"]}
        ]},
      {id: "cl_basketball_8",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "basketball",
        t: "篮球社 · 淘汰赛",
        c: "年级赛第二轮，比分咬到最后两分钟。",
        opts: [
          {t: "盯人，把最后一防站住", stam: 4, run: ["健康 +5", "心态 +7", "社交 +4", "计数 club", "提示 哨响时你还保持着那个姿势。!good"]},
          {t: "要球投最后一投", run: ["压力 +5", "社交 +3", "计数 club", "提示 弹框出来了，队友拍了拍你后背。"]}
        ]},
      // ——— cheer ———
      {id: "cl_cheer_5",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "cheer",
        t: "啦啦操社 · 压腿",
        c: "热身时韧带紧得厉害，教练说别硬来。",
        opts: [
          {t: "一点一点往下沉", stam: 3, run: ["健康 +4", "效率 +4", "计数 club", "提示 第二天比昨天低了一指。!good"]},
          {t: "今天先到这儿", run: ["健康 +3", "心态 +3", "计数 club", "提示 坐在垫子上看别人压，也记了动作。"]}
        ]},
      {id: "cl_cheer_6",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "cheer",
        t: "啦啦操社 · 队形",
        c: "八个人总在第三拍错开半步。",
        opts: [
          {t: "在地上贴胶带标位置", run: ["效率 +6", "悟性 +3", "计数 club", "提示 第三拍齐了，胶带后来一直没撕。!good"]},
          {t: "数出声来带节奏", run: ["社交 +5", "心态 +3", "计数 club", "提示 喊到第三遍，后排终于跟上了。"]}
        ]},
      {id: "cl_cheer_7",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "cheer",
        t: "啦啦操社 · 喊口号",
        c: "开幕式彩排，口号喊到一半有人笑场。",
        opts: [
          {t: "重喊一遍，声音再大点", run: ["社交 +6", "心态 +5", "计数 club", "提示 这回没人笑，操场那头都听见了。!good"]},
          {t: "跟着笑完接着喊", run: ["心态 +4", "社交 +3", "计数 club", "提示 笑完反而松了，后半段很顺。"]}
        ]},
      {id: "cl_cheer_8",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "cheer",
        t: "啦啦操社 · 彩排",
        c: "太阳很大，花球被汗浸得有点沉。",
        opts: [
          {t: "整套再走一遍", stam: 4, run: ["健康 +5", "效率 +5", "压力 +3", "计数 club", "提示 收势时八个人站成一条线。!good"]},
          {t: "只过容易错的两小节", run: ["效率 +4", "心态 +2", "计数 club", "提示 省下的时间坐在看台阴影里喝了半瓶水。"]}
        ]},
      // ——— pingpong ———
      {id: "cl_pingpong_5",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "pingpong",
        t: "乒乓球社 · 发球",
        c: "教练说你的发球太直，一板就被人推回来。",
        opts: [
          {t: "练二十分钟侧旋", stam: 3, run: ["悟性 +5", "效率 +5", "计数 club", "提示 球落台后往边上拐，对面愣了一下。!good"]},
          {t: "先把落点练稳", run: ["效率 +4", "心态 +2", "计数 club", "提示 不出彩，但很少失误。"]}
        ]},
      {id: "cl_pingpong_6",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "pingpong",
        t: "乒乓球社 · 捡球",
        c: "一筐球打完，滚了半个馆。",
        opts: [
          {t: "一个个捡回筐里", run: ["健康 +2", "效率 +3", "计数 club", "提示 捡到最后两个时，灯关了一半。"]},
          {t: "叫上对面一起捡", run: ["社交 +5", "心态 +3", "计数 club", "提示 边捡边聊，比刚才那局还热闹。"]}
        ]},
      {id: "cl_pingpong_7",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "pingpong",
        t: "乒乓球社 · 换胶皮",
        c: "拍子胶皮边角翘起来了，一拉能撕下一小条。",
        opts: [
          {t: "去小店买张新的自己粘", stam: 2, run: ["悟性 +4", "效率 +5", "经济 -12", "计数 club", "提示 粘得有点歪，但吃球稳了。!good"]},
          {t: "拿剪刀把翘边修掉", run: ["效率 +3", "心态 +2", "计数 club", "提示 拍面小了一圈，握着倒更顺手。"]}
        ]},
      {id: "cl_pingpong_8",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "pingpong",
        t: "乒乓球社 · 擂台",
        c: "社团课摆了擂台，五球一轮，赢的站着。",
        opts: [
          {t: "上场守到最后", stam: 4, run: ["健康 +5", "社交 +6", "心态 +4", "计数 club", "提示 站了四轮，最后被一个初一新生打下去了。!good"]},
          {t: "在旁边记分", run: ["社交 +3", "效率 +3", "计数 club", "提示 记分板写满了一页，谁赢谁输都清楚。"]}
        ]},
      // ——— weiqi ———
      {id: "cl_weiqi_5",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "weiqi",
        t: "围棋社 · 复盘",
        c: "上午那盘输在角上，社长把棋子重新摆了一遍。",
        opts: [
          {t: "一步步摆到自己走错那手", stam: 2, run: ["悟性 +7", "效率 +4", "计数 club", "提示 看到第三十七手，忽然明白当时急什么。!good"]},
          {t: "只记住那个定式", run: ["悟性 +3", "计数 club", "提示 定式抄在小本上，下次没再用错。"]}
        ]},
      {id: "cl_weiqi_6",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "weiqi",
        t: "围棋社 · 死活题",
        c: "一页六道，第四道怎么摆都差一口气。",
        opts: [
          {t: "把每一种下法都摆一遍", stam: 3, run: ["悟性 +6", "压力 +3", "计数 club", "提示 摆到第九种，那块棋活了。!good"]},
          {t: "先跳过去做后面的", run: ["心态 +3", "效率 +2", "计数 club", "提示 临走前回头看了一眼，还是没想通。"]}
        ]},
      {id: "cl_weiqi_7",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "weiqi",
        t: "围棋社 · 让子",
        c: "社长让你四子，你还是没撑到中盘。",
        opts: [
          {t: "请他再摆一遍哪里薄", run: ["悟性 +6", "社交 +4", "计数 club", "提示 他指了指边上一块：「这儿一直是空的。」!good"]},
          {t: "自己回去打谱", run: ["悟性 +4", "效率 +3", "计数 club", "提示 谱打到第二十手，看出点意思了。"]}
        ]},
      {id: "cl_weiqi_8",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "weiqi",
        t: "围棋社 · 社长要走",
        c: "初三的社长最后一次来社团课，把那副旧棋子留下了。",
        opts: [
          {t: "陪他下完最后一盘", stam: 3, run: ["心态 +7", "社交 +6", "计数 club", "提示 收子时谁也没数目。!good"]},
          {t: "把棋子收进柜子", run: ["效率 +3", "心态 +3", "计数 club", "提示 罐盖上贴了张纸条，写着他的名字。"]}
        ]},
      // ——— photo ———
      {id: "cl_photo_5",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "photo",
        t: "摄影社 · 跑焦",
        c: "运动会百米终点，拍回来一看，人全是虚的。",
        opts: [
          {t: "改用提前对焦，再去拍一组", stam: 3, run: ["悟性 +6", "效率 +5", "健康 +2", "计数 club", "提示 第二组抓住了撞线那一下。!good"]},
          {t: "挑一张最有劲的虚影交上去", run: ["心态 +5", "悟性 +2", "计数 club", "提示 老师说这张倒像在跑。"]}
        ]},
      {id: "cl_photo_6",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "photo",
        t: "摄影社 · 暗房",
        c: "红灯底下，相纸在药水里慢慢浮出人影。",
        opts: [
          {t: "多等十秒再夹出来", run: ["悟性 +5", "效率 +4", "计数 club", "提示 层次比上一张厚了一点。!good"]},
          {t: "按表上的时间夹", run: ["效率 +3", "心态 +2", "计数 club", "提示 稳，但没什么意外。"]}
        ]},
      {id: "cl_photo_7",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "photo",
        t: "摄影社 · 借相机",
        c: "周末想拍红塔山的落日，社里那台相机只剩一台。",
        opts: [
          {t: "登记了借走", stam: 4, run: ["悟性 +5", "心态 +6", "健康 +3", "计数 club", "提示 回来时存储卡满了，天也黑透了。!good"]},
          {t: "用手机拍几张", run: ["效率 +3", "社交 +2", "计数 club", "提示 像素不够，但颜色是对的。"]}
        ]},
      {id: "cl_photo_8",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "photo",
        t: "摄影社 · 运动会",
        c: "一整天扛着相机在操场跑，傍晚才坐下。",
        opts: [
          {t: "把每个社团都拍一张", stam: 4, run: ["社交 +7", "健康 +4", "效率 +3", "计数 club", "提示 展板后来排了整整两栏。!good"]},
          {t: "只拍自己班", run: ["心态 +5", "社交 +3", "计数 club", "提示 张数不多，每张都认得出人。"]}
        ]},
      // ——— coding ———
      {id: "cl_coding_5",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "coding",
        t: "编程社 · 版本",
        c: "改了一晚上，第二天发现跑的是上周那份。",
        opts: [
          {t: "把文件名和日期都写清楚", run: ["效率 +6", "悟性 +3", "计数 club", "提示 之后再没打开错过。!good"]},
          {t: "全删了重写一份", run: ["悟性 +4", "压力 +4", "计数 club", "提示 重写比找快，但少睡了半小时。"]}
        ]},
      {id: "cl_coding_6",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "coding",
        t: "编程社 · 演示",
        c: "市里比赛前，投影仪接不上笔记本。",
        opts: [
          {t: "换根线，先跑起来再说", run: ["效率 +6", "心态 +4", "社交 +3", "计数 club", "提示 评委没看出中间那两分钟。!good"]},
          {t: "围着机器查驱动", run: ["悟性 +4", "压力 +5", "计数 club", "提示 查出来了，演示只剩五分钟。"]}
        ]},
      {id: "cl_coding_7",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "coding",
        t: "编程社 · 队友",
        c: "搭档把接口改了没说，你这边全报错。",
        opts: [
          {t: "坐一起把两边对一遍", stam: 2, run: ["社交 +6", "悟性 +4", "计数 club", "提示 对完发现只差一个字段名。!good"]},
          {t: "各自改各自的", run: ["效率 +3", "压力 +3", "计数 club", "提示 跑通了，但谁也不太想说话。"]}
        ]},
      {id: "cl_coding_8",
        w: 4,
        dist: "uniform",
        minGap: 6,
        slot: "clubday",
        cond: S => S.club === "coding",
        t: "编程社 · 死循环",
        c: "页面一打开就卡住，风扇转得响。",
        opts: [
          {t: "加个条件先跳出来", stam: 2, run: ["悟性 +6", "效率 +5", "计数 club", "提示 退出来那一刻，风扇也慢下来了。!good"]},
          {t: "关掉重开", run: ["心态 +2", "效率 +2", "计数 club", "提示 重开就好了，原因一直没找到。"]}
        ]},
    ];

    /* 并入主事件表（幂等） */
    (function mergeClubEventsExtra() {
      if (typeof EVENTS === "undefined") return;
      CLUB_EVENTS_EXTRA.forEach(e => {if (!EVENTS.some(x => x.id === e.id)) EVENTS.push(e);});
    })();
