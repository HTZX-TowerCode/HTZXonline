# DEV_INDEX.md · 开发者索引

> 给要改引擎、加系统的同学 / AI 看。
> 只想改文案和数字 → 去 `content/README.md`；想抄现成格式 → `content/templates.md`。
> 踩过的坑全集 → `HANDOVER.md` 第 5 节。

---

## 1. 加载顺序就是依赖顺序

`index.html` 里的 `<script src>` 顺序**不能随意调**。数字前缀是层次：

```
00  生成物 / 内容入口   00-docs.js  00b-docs-live.js  00c-messages.js
01  工具与文案          01-utils.js  01b-i18n.js
02  配置与主题          02-config.js  02c-themes.js  02b-time.js
03  天赋与家庭          03-data-talents.js  03b-mood.js  03c-family.js
04  科目
05  内容数据（shop / books / events / clubs / sport / quiz / vacation / travel）
07  事件（通用）
08  事件（校本）
09  固定日程
10~12  成就 / 结局 / 破茧
13~16  引擎（effects → talent → study → flow）
17  界面
18  存档
19  启动点火
```

所有 js 都是**普通 script**（非 module），文件里的 `function xxx()` 直接是全局函数，所以 HTML 里的 `onclick="xxx()"` 能调。
**不要突然改成 ES module**，会全线断掉。

---

## 2. 一次行动的数据流

```
玩家点行动按钮（js/16-flow.js offerActions）
   ↓
执行行动 → studySettle() / allowanceSettle() / ... （js/15-engine-study.js）
   ↓
抽一个事件（js/16-flow.js，按 slot / season / w / dist / cond 过滤）
   ↓
showModal()（js/17-ui.js）
   ↓
玩家点选项 → run 走 js/13-engine-effects.js 的中文指令解释器
   ↓
modProp / count / gainTalent → 改全局 S
   ↓
renderHUD()（js/17-ui.js）+ 提示条 / 飘字 + 文本反馈弹窗
   ↓
连锁判定 → 可能再开一个事件（上限见 GAME_CONFIG.maxEventsPerWeek）
   ↓
本周行动次数用尽 → nextWeek()
   ↓
周结算：遗忘 / 属性回归 / 天赋与成就判定 / 破茧与退化 / 压力连击 / 家庭矛盾
   ↓
autoSave()（js/18-save.js，每周一次）
   ↓
进入下一周（或假期 / 固定日程 / 结局）
```

**任何一处改动都要想清楚下游**：例如给 `run` 加新指令要改 `13-engine-effects.js`；给 `S` 加字段要同时改 `18-save.js` 的序列化与过滤。

---

## 3. 全局状态 `S`

单全局对象，所有函数直接读写。主要字段：

| 字段 | 含义 |
|---|---|
| `week` / `term` / `vac` | 周号 / 学期 0~5 / 假期阶段 |
| `name` / `gender` | 角色 |
| `prop` | 心态 / 经济 / 健康 / 效率 / 悟性 / 社交 / 压力 / 亲情 |
| `subj` | 各科当前学力 |
| `score` / `lastExamScore` / `bestExam` / `zhongkao` | 成绩 |
| `hkLocked` | 生地会考后锁死的成绩 |
| `cnt` / `ach` | 行为累计次数 / 已解锁成就 |
| `evCnt` / `evCntWeek` / `evCountWeek` | 事件计数（含每周上限） |
| `actQuota` / `actCount` | 本周行动额度 |
| `studyBuff` / `buffWeeks` / `studyDebuff` / `debuffWeeks` | 临时加成 |
| `club` / `clubCount` / `clubOff` | 社团 |
| `fixedDone` | 开学弹窗不占周的标记 |
| `items` / `cure` | 道具 / 破茧进度 |
| `over` / `dead` | 结局 |

**改结构必须 `SAVE_VER + 1`，并补 `18-save.js` 的字段过滤**。旧存档带进 NaN 是本项目最容易复发的问题。

---

## 4. 引擎层函数速查（别在这些文件里写内容）

| 想找 | 文件 / 函数 |
|---|---|
| 中文指令怎么解析 | `13-engine-effects.js` 的 `execCmd()` / 文件头指令表 |
| 属性边界与可见性 | `01-utils.js` 的 `modProp` / `PROP_HUD` / `PROP_BLUR` |
| 天赋获取 / 排斥 | `14-engine-talent.js`（排斥数据在 `03-data-talents.js` 的 `inc` 字段） |
| 学习结算 / 难度曲线 / 考试 | `15-engine-study.js` 的 `studySettle` / `difficultyCurve` / `exam` / `studyCfg` |
| 中考折算 | `09-data-fixed.js` 的 `hk()` / `expExam()` / `zhongkao()` |
| 周推进与事件抽取 | `16-flow.js` 的 `startWeek` / `offerActions` / `nextWeek` / `needClubGrab` |
| 弹窗渲染 | `17-ui.js` 的 `showModal` / `nl2br` / `closeModal` |
| HUD 与飘字 | `17-ui.js` 的 `renderHUD` / `toast` / `floatText` |
| 主题应用 | `02c-themes.js` 的 `applyThemeSkin` / `refreshSeason` |
| 存档 | `18-save.js` 的 `save` / `load` / `sanitize*` |
| 文档弹窗 | `00b-docs-live.js` 的 `openDocLive` / `renderDocModal` |

---

## 5. 生成物与工具

| 命令 | 作用 | 什么时候跑 |
|---|---|---|
| `node tools/check-content.js` | 内容体检 | **每次改内容** |
| `node tools/sync-docs.js` | `docs/*.md` → `js/00-docs.js` | 只改了三份玩家文档 |
| `node tools/make-single.js` | 全部内联 → `game.html` | **每次改 js / css** |

`make-single.js` 靠**正则**匹配 `<link rel="stylesheet" href="css/...">` 和 `<script src="js/...">`。
挪目录、改引用写法、加 module 属性都会让单文件版悄悄缺内容 —— 挪完一定打开 `game.html` 验一遍。

---

## 6. 红线速查（详细版见 HANDOVER.md 第 4 节）

1. `L("key")` 的 276 处调用点别删（英语模式要接回）
2. `docs/changelog.md` 未经维护者确认不许写
3. 弹窗渲染三处联动：`nl2br()` / `white-space` / 断句接回
4. 生成物不是源码，改完必须重新打包
5. `SAVE_VER` 与脏数据过滤
6. 彩蛋名 `xyf / xiayifu / 夏毅夫 / 夏if` 保留
7. 读书排除 `FAMILY_TALENTS`
8. `--purple` 可能存的是绿色，别按名字改色
9. `seasonPhase()` 季心绑定校历
10. 中考权重与 530 总分
11. `usePhotos: false` 是有意的
12. 矮屏「游戏说明」是折叠不是隐藏
13. 文档「导入 / 更新」按钮已删
14. 全英文文件名 + 启动脚本纯 ASCII
15. 难度与真实度是两个独立维度，别提前混写

---

## 7. 验收清单（每批交付）

```
node tools/check-content.js        → ✅ 全部通过
node tools/make-single.js          → game.html 重新生成
```

- `index.html` 与 `game.html` **两个入口**各开一次，console 无报错
- 分辨率 `1366×768 / 1920×1080 / 2560×1440 / 1280×720 / 1024×640`：横向零溢出、弹窗不超视口
- 改主题 → 卡片对比度（正文 ≥8、描边 ≥3）
- 改数值 → 极端值（全 0 / 全 150 / 全负 / NaN / undefined），无 NaN、结局判定有结果
- 改存档 → 7 种脏数据读档
- 打包 zip 内**无非 ASCII 文件名**

---

## 8. 目录重组时（需求 19 / 后续批次）

如果要把内容真的搬进 `content/`：

1. 先决定哪些文件搬（`data-*.js` 适合，引擎不适合）
2. 同步改 `index.html` 的 `<script src>`
3. 同步改 `tools/make-single.js` 的正则
4. 同步改 `tools/check-content.js` 的 `DATA_FILES` 路径
5. 同步改所有文档里的路径
6. **重跑全部验收**，尤其 `game.html`

> 当前版本采用「`content/` 放索引与模板 + 内容仍在 `js/data-*.js`」的方式：
> 好处是零迁移风险、现有体检与打包脚本不用动；
> 若维护者坚持物理收敛，按上面六步做即可。


---

## v1.4 E 批新增文件（2026-11-07）

| 文件 | 层 | 作用 |
|---|---|---|
| `js/05k-data-minigame-events.js` | 内容 | 小游戏触发事件，并入 `EVENTS` |
| `js/20-minigames.js` | 引擎 | 五子棋（Canvas + AI + 事件链接管） |
| `js/21-audio.js` | 引擎 + 配置 | 背景音乐：8 首合成曲 / 本地导入 / 音量 |
| `js/22-ui-layers.js` | 引擎 | 顶栏资源条 `updateResPill()` |
| `css/08-minigames.css` | 外观 | 棋盘 |
| `css/09-audio.css` | 外观 | 音乐面板 |
| `css/10-layers.css` | 外观 | **分层玻璃**（最后加载，覆盖前面的平面卡片） |
| `tools/check-contrast.js` | 工具 | 主题对比度自检，已挂进 `check-content.js` |

加载顺序不能变：CSS 到 `10-layers.css` 收尾；JS 顺序是 `05k → … → 17-ui → 20 → 21 → 22 → 19-boot`。`20-minigames.js` 依赖 `17-ui.js` 的 `showModal`，`22-ui-layers.js` 被 `17-ui.js` 的 `renderHUD()` 调用（函数提升 + 运行时调用，所以放后面也没问题），但**别把它挪到 `index.html` 的引用之外**。

`make-single.js` 靠正则自动内联，新增文件只要在 `index.html` 里挂了就会进 `game.html`，不用改打包脚本。

**CSS 变量守卫**（坑 63）：`check-content.js` 的 `checkCssColorVars()` 会检查所有 `var(--glow*)` 是否包在 `rgb()`/`rgba()` 里。三元组变量当颜色直接用会导致整条声明失效、进度条变空，详见 `HANDOVER.md` 坑 63。

**v1.4.2**：`js/20-minigames.js` 的 `openGomoku()` 现在分「主菜单纯玩」和「游戏内」两种模式，判定函数是 `gmkStandalone()`（按 `gameScreen` 是否可见，**不能用 `!!S`** —— `toStart()` 不清 S）。从主菜单也能点的自由入口，务必在 `S===null` 和「从游戏回主菜单」两种状态下各测一遍；`showModal` 的 `o.fn` 里抛异常会吞掉 `hideModalRaw()`，表现就是弹窗卡死。

**v1.4.3 性能**：`check-content.js` 的 `checkRenderPerf()` 是性能红线守卫。整站卡顿的三个根因（多个全屏特效层、常驻 backdrop-filter、日志 DOM 无限增长）与优化前后帧率见 `HANDOVER.md` 坑 67。以后加视觉效果，先想清楚会不会每帧重算整屏。

**v1.5 A 批**：`check-content.js` 新增 `checkSaveFramework()`（存档迁移表、未来档只读、边界净化、统一扣钱、README 口径）。改存档结构只需在 `js/18-save.js` 加一级 `MIGRATIONS` 并 `SAVE_VER + 1`；读档边界统一在 `js/01-utils.js` 的 `sanitizeState()`。详见 `HANDOVER.md` 坑 68。

**v1.5 B 批**：`check-content.js` 新增 `checkLogicLinks()`（天赋 gate/boost、双向排斥、精确文具指令、联动事件 15 条）。天赋影响事件写在 `js/16-flow.js` 的 `eventAllowed()`/`eventWeight()`；排斥统一在 `js/14-engine-talent.js` 的 `talentPairConflict()`；文具指令在 `js/05i-data-stationery.js` 的 `stationeryCmd()`。详见 `HANDOVER.md` 坑 69/70 与 `content/templates.md` 模板 13/14。

**v1.5 C 批**：`check-content.js` 新增 `checkCBatch()`（社团 52 / 随机池 30 / 长链 41 层、6 层通道、心事闭环、静态禁词）。长链引擎在 `js/16-flow.js` 的 `runEventChain()`、`buildEventDef()`；心事在 `js/05o-data-romance.js`；存档升到 **v10**。新增内容文件三个，都要同步 `index.html` 与 `DATA_FILES`。详见 `HANDOVER.md` 坑 71~74 与 `content/templates.md` 模板 15/16。

**v1.5 D 批**：`check-content.js` 新增 `checkDBatch()`（耐久条 12px、三处真实度数值收敛、406 条文案无代码块、四类文案无 AI 味套话）。数值出口共五处，见 `content/templates.md` 模板 18；文案句式禁例见模板 17。详见 `HANDOVER.md` 坑 75~77。

**v1.5.1**：`check-content.js` 新增 `checkBookRules()`（一种书一本 / 复读分流 / 先放货再扣钱）。
**v1.5.3**：容量口径收紧为「只有 `write` / `eraser` 占格子」
**v1.5.4**：`check-content.js` 新增 `checkGomokuShape()`（棋盘宽高同源 / 禁 `max-height` / 禁在 `gmkFit` 里用 `getBoundingClientRect()` / 矮屏下限）。见 `HANDOVER.md` 坑 82。，新增 `bagOccupies()` / `bagHasDurable()`；小卖铺改 `SHOP_GROUPS` 全量分类陈列；`checkBookRules()` 增加图标重复、耐用品唯一、周结算去重、分组完整性守卫。容量判定统一走 `bagCount()`。

**v1.5.2 题库**：新增 `js/05d2-data-quiz-more.js`（`QUIZ_MORE`，228 题），须排在
`js/05d-data-quiz.js` 之后加载 —— 它把题 push 进已有的 `QUIZ_BANK`。
`index.html` 与 `tools/check-content.js` 的 `DATA_FILES` 两处都要同步加一行，
`make-single.js` 不用改（按 `index.html` 的顺序自动内联）。
体检新增：重复题干报错、每科每年级 ≥15 道、总数 ≥450、挂载顺序检查。
