# content/ · 内容总入口

> **这里不写代码，只放"去哪改东西"的索引和可以直接抄的模板。**
> 所有游戏里的**文字**和**数值**都在 `../js/` 的 `data-*.js` / `config` 文件里。
> 这个目录是给社团同学（不会编程也能写）的工作台。

---

## 三分钟上手

1. 打开 `../js/`，找下面表格里对应的文件
2. **复制一条现成的**，改文字或数字
3. 存盘，双击 `../index.html` 刷新就能看到
4. 改完跑一次体检（见文末）

**改之前先备份**：把文件复制一份，改名加 `.bak`。改坏了换回来。

---

## 一、总表：想改什么 → 去哪

### 🟢 放心改（纯内容，改错最多不生效，不会崩游戏）

| 想改 | 文件 | 找什么 |
|---|---|---|
| 界面上的所有短文案（按钮、标题、提示） | `js/01b-i18n.js` | `L("key")` 的表，改引号里的中文 |
| 主菜单「游戏说明」那段长文字 | `js/01b-i18n.js` | `about.body` |
| 给玩家发消息 / 删消息 | **`js/00c-messages.js`** | 文件顶部的 `MESSAGES` 数组 |
| 新手介绍 / 鸣谢列表 / 更新日志 | `docs/guide.md` / `credits.md` / `changelog.md` | 直接写 Markdown |
| 通用随机事件 | `js/07-data-events.js` | `EVENTS` 数组 |
| 学校专属事件（15 条） | `js/08-data-events-school.js` | 单独存放，升级游戏本体不会覆盖 |
| 社团名单、抢社团概率、社团事件 | `js/05b-data-clubs.js` + `js/05l-data-clubs-extra.js` | 13 个社团各 8 条 |
| 运动锻炼的连锁事件 | `js/05c-data-sport.js` | 事件 id 以 `sp_` 开头 |
| 做题题库（493 题） | `js/05d-data-quiz.js` + `js/05d2-data-quiz-more.js` | `QUIZ_BANK[科目]` / `QUIZ_EXTRA` / `QUIZ_MORE`，见 **模板 20** |
| 寒暑假事件（5 套 × 12 条） | `js/05e-data-vacation.js` | 按假期分组 |
| 旅游景点（18 个）与文案 | `js/05f-data-travel.js` | `TRAVEL_SPOTS`、`TRAVEL_ROUTES` |
| 节假日事件（8 个） | `js/09-data-fixed.js` | `HOLIDAY_EVENTS` |
| 文具袋 / 小卖铺 / 图书 | `js/05i-data-stationery.js` | 40 种文具 + 16 本书；**只有笔和橡皮占格子**，见模板 19 / 21 |
| 图书角联动事件 | `js/05j-data-stationery-events.js` | 笔丢了、书借出等 15 条 |
| 成就 | `js/10-data-achievements.js` | |
| 结局 | `js/11-data-endings.js` | |
| 破茧（负面天赋消除） | `js/12-data-cures.js` | `CURES` |
| 天赋退化（久不练习会失去） | `js/12-data-cures.js` | `TALENT_DECAY` |
| 天赋库、家庭背景天赋 | `js/03-data-talents.js` | `TALENTS`、`FAMILY_TALENTS` |
| 主题配色、名字、文案 | `js/02c-themes.js` | `THEME_SKINS`、`SEASON_PALETTES` |
| 科目表、卷面满分 | `js/04-data-subjects.js` | |
| 体艺节三届主题 | `js/09-data-fixed.js` | `SPORTS_FEST_THEMES` |
| 固定日程排在第几周 | `js/09-data-fixed.js` | `SPORTS_FEST_WEEK`、`runFixed()` |

### 🟡 谨慎改（数值，改完要跑一遍平衡测试）

| 想改 | 文件 | 字段 |
|---|---|---|
| 学习收益 / 遗忘 / 考试 / 压力四个旋钮 | `js/02-config.js` | `study` |
| 三档难度系数 | `js/02-config.js` | `difficultyTune` |
| 默认难度与学期跨度 | `js/02-config.js` | `start` |
| 每周事件数、连锁概率 | `js/02-config.js` | `chainChance`、`maxEventsPerWeek`、`eventsPerAction` |
| 学习代价（掉健康、涨压力） | `js/02-config.js` | `studyCost` |
| 运动连锁概率 | `js/02-config.js` | `sport.chainChance` |
| 中考折算权重、总分 530 | `js/09-data-fixed.js` | `zhongkao()` |
| 语文 87 分以上的提分曲线 | `js/15-engine-study.js` | 考试公式 |
| 亲情回落、家庭矛盾线 | `js/02-config.js` / `js/03c-family.js` | `family` |
| 屏幕情绪特效开关 | `js/02-config.js` | `mood` |
| 属性哪些可见 / 模糊 | `js/01-utils.js` | `PROP_HUD` / `PROP_HIDDEN` / `PROP_BLUR` |
| 配图总开关 | `js/02-config.js` | `usePhotos`（现为 `false`） |
| 校历月份映射 | `js/02b-time.js` | `TERM_MONTHS` |

### 🔴 别动（引擎，改错会全局崩）

| 文件 | 为什么 |
|---|---|
| `js/00-docs.js` | **生成物**，由 `sync-docs.js` 写出，手改会被覆盖 |
| `js/13-engine-effects.js` | 中文指令解释器，所有事件的 `run: [...]` 都靠它 |
| `js/14-engine-talent.js` | 天赋引擎 |
| `js/15-engine-study.js` | 学习/考试/成绩结算 |
| `js/16-flow.js` | 周推进与事件抽取（814 行，最大） |
| `js/17-ui.js` | 弹窗渲染、HUD、飘字 |
| `js/18-save.js` | 存档结构与字段过滤 |
| `js/19-boot.js` | 启动点火 |
| `js/00b-docs-live.js` | 文档弹窗（换行处理极易出错） |
| `js/02c-themes.js` 里的插值函数 | 改配色只改 `THEME_SKINS` / `SEASON_PALETTES` 的色值 |

---

## 二、不会编程也能写：中文指令

事件里「选了之后会发生什么」用中文写，不用会 JS：

```js
opts: [
  {t: "一起捡几片", run: ["心态 +6", "悟性 +2", "提示 你把最完整的一片夹进了课本。"]},
  {t: "匆匆走过",   run: ["压力 -2"]},
]
```

指令全集在 `js/13-engine-effects.js` 文件头，常用的有：

| 写法 | 意思 |
|---|---|
| `心态 +6` / `压力 -2` | 改属性 |
| `语文 +12` | 改某科学力 |
| `学力 全科 +5` | 全科一起改 |
| `提示 一句话` | 写一句旁白 |
| `记 学习 1` | 记次数（用来解锁成就 / 破茧） |
| `给天赋 专注` | 获得天赋 |
| `去天赋 厌学` | 移除天赋 |
| `加成 学习 0.1 2周` | 临时加成 |

写错指令**体检会报出来**，不会静默失效。

---

## 三、可复制模板

见 **`templates.md`** —— 加事件、改概率、加题目、加天赋、加成就、发消息、加主题、加景点、加节假日，每类都有能直接抄的完整例子。

---

## 四、改完必做

```
cd tools
node check-content.js        # 内容体检：指令、题库答案、天赋引用、消息 id
cd ..
node tools/sync-docs.js      # 只改了 docs/*.md 才跑
node tools/make-single.js    # 每次都要跑，重新生成 game.html
```

看到「✅ 全部通过」才算完。**两个入口都要验**：`index.html` 和 `game.html`。

---

## 五、特别提醒

- **更新日志 `docs/changelog.md` 未经维护者确认不许写** （**2026-11-07 维护者已确认并落盘，本条对 v1.4 这轮已执行完毕**；下一位接手新产品周期时仍照此流程）
- **全英文文件名**，启动脚本内容纯 ASCII
- 改主题配色要跑对比度（正文 ≥8、描边 ≥3）
- 改任何内容后 `game.html` 必须重新打包，不然单文件版还是旧的
- 每批改动前**整目录复制一份备份**

更细的开发说明见 `../docs/DEV_INDEX.md`，踩过的坑见 `../docs/HANDOVER.md` 第 5 节。


---

## v1.4 D 批新增（文具袋 / 图书）

| 文件 | 改什么 | 等级 |
|---|---|---|
| `js/05i-data-stationery.js` 顶部 `STATIONERY_DEFS` | 加文具：id / n / icon / cat / dur / price / weekly / perk / need / cap | 放心改 |
| `js/05i-data-stationery.js` 顶部 `BOOK_DEFS` | 加书：progMax / stamPer / stages（at 递增、末条必须是 1）/ lore | 放心改 |
| `js/05i-data-stationery.js` `SHOP_GROUPS` | 小卖铺分哪些组；**全部文具与书自动上架** | 放心改 |
| `js/05i-data-stationery.js` `BAG_RULES` | 磨损速度、散落惩罚、上网刷新数量与浮动 | 放心改 |
| `js/05j-data-stationery-events.js` | 文具联动事件（用「文具 xxx」指令） | 放心改 |
| `js/05i-data-stationery.js` 下半部分函数 | 引擎逻辑 | 别动 |

改完跑 `cd tools && node check-content.js`，会自动查：文具 id 重复、价格/耐久非法、书的 stages 是否递增且收尾、每个 `SHOP_GROUPS` 分组都有商品、三类联动指令是否齐全。


---

## v1.4 E 批新增（小游戏 / 音乐 / 界面分层）

| 文件 | 改什么 | 等级 |
|---|---|---|
| `js/05k-data-minigame-events.js` | 小游戏触发事件（写「小游戏 五子棋」） | 放心改 |
| `js/20-minigames.js` 顶部 `GMK_SCORE` / `GMK_DEFENSE` / `GMK_REWARD` | AI 强度、胜负属性反馈 | 放心改 |
| `js/21-audio.js` 顶部 `AUDIO_TRACKS` | 内置曲：id / n / tag / bpm / wave / gain / echo / pad / notes（MIDI 音高，0 = 休止） | 放心改 |
| `css/10-layers.css` 顶部 `--glass-*` / `--tint-top` | 四层玻璃透明度、叠白强度、圆角阴影 | 放心改 |
| `js/22-ui-layers.js` 的 `updateResPill()` | 顶栏资源条显示哪些资源 | 谨慎改 |
| `js/20-minigames.js` 的 `gmkFinish()` / `js/21-audio.js` 播放函数 | 事件链与播放逻辑 | 别动 |

改完跑 `cd tools && node check-content.js`（会自动附带 `check-contrast.js`）。改主题配色后**必须**看对比度那段输出，正文 ≥8 / 次要 ≥5 / 描边 ≥3 才算过。

**加触发事件的最小例子**（照抄进 `js/05k-data-minigame-events.js` 的 `MINIGAME_EVENTS`）：

```js
{
  id: "gmk_after_exam", w: 3, minGap: 16, slot: "weekend",
  t: "考完试的那张空桌",
  c: "教室只剩几个人，有人把棋盘往桌上一摊。",
  opts: [
    {t: "下一局", stam: 4, run: ["小游戏 五子棋"]},
    {t: "先收拾书包", stam: 1, run: ["心态 +2", "提示 棋盘收进柜子的声音很轻。"]}
  ]
}
```

`stam` 是这一选项消耗的体力；`run` 里的中文指令由 `js/13-engine-effects.js` 转发。加完 id 不要和已有事件重复，体检会查。


---

## 改 CSS 时的一条硬规矩（坑 63）

`--glow` / `--glow2` / `--brand-rgb` 存的是 **rgb 三元组**（`"169, 95, 198"`），不是颜色。写颜色必须包一层：

```css
/* ✅ 对 */
background: rgb(var(--glow2, 192, 138, 232));
box-shadow: 0 0 12px rgba(var(--glow), .3);

/* ❌ 错：浏览器展开成 169, 95, 198，整条属性被丢弃，条就「空了」 */
background: var(--glow2, var(--gold));
```

`cd tools && node check-content.js` 会自动扫出这类误用。上次它波及耐久条、读书进度条、体力条、地图圆点共 10 处，表现是「只有低耐久的红条看得见」。


---

## v1.4.1 · 两处口径

- **「体力」对外叫「剩余时间」**，`S.stam` / `STAMINA` / 事件字段 `stam` / CSS 类 `.stambar` 都没改。想加新行动，还是在 `js/03e-stamina.js` 的 `STAMINA.actCost` 里定价；界面文案写「时间 −N」。
- **文具门禁**：`bagGate(k)` 挡 study / quiz / read。新增会消耗笔的行动入口时，记得也调 `bagGateNotice(k)`，否则玩家能绕过行动面板。`tools/check-content.js` 会查。


---

## 性能红线（坑 67，别加回来）

- **不要给顶栏 / 弹窗加 `backdrop-filter: blur`**。`--panel` 是不透明色，模糊的是被遮住的区域，纯浪费，实测弹窗掉到 26fps。
- **氛围特效保持单个全屏层**（`css/05-mood.css`）。四种效果用四段渐变 + `--mood-*` 变量控制，别拆成多个 `::before/::after`，更别用 `mix-blend-mode`。
- **无限动画只动 `opacity` / `transform`**。动 `text-shadow`、`background-position` 会每帧重绘；天赋面板常驻，这类动画会一直烧 CPU。
- **`say()` 的日志 DOM 上限别删**，`S.logs` 也别裁（反馈系统拿数组长度当游标）。滚动必须合到下一帧。
- 新增常刷新的面板走 `setHudHtml(id, html)`，别直接 `innerHTML =`。

`cd tools && node check-content.js` 会自动查这些。改完想确认性能，用真实 rAF 帧间隔测（别开 `--disable-frame-rate-limit`）。


---

## 存档与边界（v1.5 A 批）

- **改存档结构**：只改 `js/18-save.js` 的 `MIGRATIONS`（加一级）和 `SAVE_VER`（+1）。
  每级 up 函数必须**幂等**——只在字段非法时补默认值，别覆盖玩家数据。
- **别删** `__future` 的「只读不写」、`slotFlag()` 的不可枚举标记、`raw[i]` 原样写回。
  新版存档在旧版游戏里打开，不能被悄悄覆盖。
- **别删** 旧档 `migratedFrom < 9` 补发文具那段：v9 前没有文具袋，不补会让学习 / 做题 / 读书一起变灰。
- **加新数值字段**：在 `js/01-utils.js` 的 `sanitizeState()` 里补一行 clamp，别散落 `||` 兜底。
  这个函数只在读档时跑一次，放进 `renderHUD()` 会拖慢帧率。
- **花钱一律 `spendMoney()`**，别直接写 `S.prop.经济 = ...`（Q7 不允许欠钱）。
- **`mergeXxxEvents` 是 IIFE 立即执行函数**，按「零引用」扫描会命中但不能删——删了事件池就空了。

`cd tools && node check-content.js` 会自动查上面这些（`checkSaveFramework`）。


---

## 天赋与事件的联动（v1.5 B 批）

- 事件数据里可直接写 `needTalent` / `noTalent` / `talentBoost`，见 `templates.md` **模板 13**。
- **成就计数唯一来源的事件只能用 `talentBoost`**（竞赛选拔、图书角、体艺节排练、
  季节冬、志愿服务、深夜台灯）。挂 `needTalent` 会让没天赋的玩家永远拿不到成就。
- 天赋 `inc` 是**单向写**的，引擎 `talentPairConflict()` 双向查。别把 91 条边补成对称表，
  内容作者只写一侧就够。
- 文具精确指令见 **模板 14**。**从指令正则读出的数字必须 `parseInt`**（坑 69）。
- `tools/check-content.js` 的 `checkLogicLinks()` 会自动查以上各项。


---

## v1.5 C 批新增内容

- **社团事件** `js/05l-data-clubs-extra.js`：13 社各补 4 条，每社共 8 条。
  加社团事件照抄同文件任意一条，**必须带「计数 club」**，否则社团天赋累计不涨。
- **随机事件 + 长链** `js/05m-data-events-extra.js`：`EXTRA_EVENTS` 30 条日常；
  `EPIC_EVENTS` 5 条主线 / 41 层。写长链看 `templates.md` **模板 15** ——
  后续层 `w:0`、`epic:true`、**不要写 cond**、第 1 层 `once:true`。
- **心事** `js/05o-data-romance.js`：指令与静态禁词口径见 **模板 16**。
  状态在 `S.romance`，存档 v10；改数值只动 `romanceWeekly()` 与 `romanceStudyMul()`。
- 三个新文件都要在 `index.html` 挂 script、`tools/check-content.js` 的 `DATA_FILES` 里登记。


---

## v1.5 D 批 · 写文案前先看这里

- **段尾别加总结句**，写完具体动作就停。对照 `templates.md` **模板 17** 的坏例/好例表。
- 破茧 / 退化文案在 `js/12-data-cures.js`，结局在 `js/11-data-endings.js`，
  校本事件在 `js/08-data-events-school.js`。`poem` 古诗保留，不要一起删。
- **真实模式不许出现具体数值**：改数字显示先过 `templates.md` **模板 18** 的五处出口清单。
- 主菜单「游戏说明」在 `js/01b-i18n.js` 的 `about.body`，不是 HTML，也不是 `docs/guide.md`。
  改完要跑 `node tools/sync-docs.js && node tools/make-single.js`。
- 文具耐久 / 读书进度条在 `css/07-bag.css` 的 `.bagbar`，现在是 **12px**，别改回去。
- `tools/check-content.js` 的 `checkDBatch()` 会扫代码块残留与 AI 味套话，改完文案必跑。


**v1.5.1 图书**：一种书一个存档只留一本，读完点「🔁 复读」有别的小收益。
**v1.5.3 容量**：只有**笔（write）和橡皮（eraser）**占格子；书、球拍、尺具、书签、文具袋本身一律不占。
容量一律用 `bagCount()`，别用 `items.length`；加复读效果改 `BOOK_REREAD`。
详见 `templates.md` **模板 19 / 21** 与 `HANDOVER.md` 坑 79 / 81。
