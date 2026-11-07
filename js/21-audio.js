/* ==================================================================
 * 引擎层 · 背景音乐（需求 18）
 * ------------------------------------------------------------------
 * 口径（已与维护者确认）：
 *   · 「Night cursing」找不到就搁置，不乱认曲名
 *   · 不放仓库外的音频链接、不联网 —— 双击 index.html 离线也能播
 *   · 默认曲目用 Web Audio API **程序化生成**的短循环，
 *     不引入任何版权音频文件，也不占包体积
 *   · 支持本地导入任意浏览器能解码的格式（mp3 / ogg / wav / m4a / flac …）
 *   · 音量可调，设置写入 localStorage
 *
 * ★ 浏览器不允许「页面一打开就出声」，所以默认始终是暂停，
 *   玩家点一次「▶ 播放」才真正启动 AudioContext。
 *   导入的本地文件只在本次会话有效（blob URL 刷新即失效）。
 *
 * 想加一首内置曲：在 AUDIO_TRACKS 里照抄一份，改 notes / bpm / wave。
 * notes 用 MIDI 音高（60 = 中央 C），0 表示休止。
 *
 * 维护等级：配置层（曲目表随便改）/ 引擎层（播放函数别乱动）
 * ================================================================== */

    const AUDIO_TRACKS = [
      {
        id: "lamp", n: "晚自习的灯", tag: "慢 · 正弦 · 一拍一音",
        bpm: 62, wave: "sine", gain: .16, echo: .22, pad: true,
        notes: [60, 64, 67, 72, 67, 64, 62, 0, 60, 64, 69, 72, 69, 64, 62, 0]
      },
      {
        id: "lixing", n: "立行号", tag: "平稳 · 五声音阶",
        bpm: 76, wave: "triangle", gain: .13, echo: .14, pad: true,
        notes: [60, 62, 64, 67, 69, 67, 64, 62, 60, 0, 64, 67, 69, 72, 69, 0]
      },
      {
        id: "stars", n: "群星", tag: "稀疏 · 高音 · 长回声",
        bpm: 52, wave: "sine", gain: .12, echo: .42, pad: false,
        notes: [72, 0, 0, 79, 0, 76, 0, 0, 74, 0, 0, 81, 0, 79, 0, 0]
      },
      {
        id: "grass", n: "草原", tag: "明亮 · 大调 · 稍快",
        bpm: 96, wave: "triangle", gain: .11, echo: .12, pad: true,
        notes: [67, 69, 71, 72, 71, 69, 67, 64, 62, 64, 67, 69, 67, 64, 62, 0]
      },
      {
        id: "rain", n: "雨后", tag: "小调 · 很慢 · 低音垫",
        bpm: 56, wave: "sine", gain: .15, echo: .30, pad: true,
        notes: [57, 60, 64, 0, 62, 60, 57, 0, 55, 57, 60, 64, 62, 0, 57, 0]
      },
      {
        id: "wind", n: "风的形状", tag: "轻 · 无和弦垫 · 跳音",
        bpm: 108, wave: "sine", gain: .10, echo: .26, pad: false,
        notes: [72, 76, 79, 0, 76, 74, 72, 0, 69, 72, 76, 0, 74, 72, 69, 0]
      },
      {
        id: "dusk", n: "黄昏教学楼", tag: "暖 · 慢三拍",
        bpm: 68, wave: "triangle", gain: .13, echo: .20, pad: true,
        notes: [60, 0, 64, 67, 0, 64, 62, 0, 59, 0, 62, 67, 0, 64, 62, 0]
      },
      {
        id: "ink", n: "素墨", tag: "极简 · 留白多",
        bpm: 48, wave: "sine", gain: .10, echo: .36, pad: false,
        notes: [60, 0, 0, 0, 67, 0, 0, 0, 64, 0, 0, 0, 62, 0, 0, 0]
      }
    ];

    const AUDIO_KEY = "htzx_audio_v1";
    let AUDIO = {
      ctx: null, master: null, delay: null, timer: null,
      track: "lamp", volume: .45, playing: false, step: 0,
      fileEl: null, fileName: "", fileUrl: "", source: "builtin"
    };

    function audioLoad() {
      try {
        const d = JSON.parse(localStorage.getItem(AUDIO_KEY) || "{}");
        if (AUDIO_TRACKS.some(t => t.id === d.track)) AUDIO.track = d.track;
        if (Number.isFinite(d.volume)) AUDIO.volume = Math.max(0, Math.min(1, d.volume));
      } catch (e) {}
    }
    function audioSave() {
      try {localStorage.setItem(AUDIO_KEY, JSON.stringify({track: AUDIO.track, volume: AUDIO.volume}));} catch (e) {}
    }

    function audioEnsureCtx() {
      if (AUDIO.ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {if (typeof toast === "function") toast("这个浏览器不支持内置音乐，可以试试导入本地音频。"); return false;}
      try {
        AUDIO.ctx = new AC();
        AUDIO.master = AUDIO.ctx.createGain();
        AUDIO.master.gain.value = AUDIO.volume * .5;   // 内置曲整体压低一点，别盖过音效
        AUDIO.delay = AUDIO.ctx.createDelay(1.0);
        AUDIO.delay.delayTime.value = .28;
        const fb = AUDIO.ctx.createGain(); fb.gain.value = .22;
        AUDIO.master.connect(AUDIO.ctx.destination);
        AUDIO.delay.connect(fb); fb.connect(AUDIO.delay);
        AUDIO.delay.connect(AUDIO.master);
        return true;
      } catch (e) {return false;}
    }

    function midiHz(n) {return 440 * Math.pow(2, (n - 69) / 12);}

    function audioNote(n, wave, gain, echo, dur) {
      if (!AUDIO.ctx || n === 0) return;
      const t = AUDIO.ctx.currentTime;
      const osc = AUDIO.ctx.createOscillator();
      const g = AUDIO.ctx.createGain();
      osc.type = wave; osc.frequency.value = midiHz(n);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + .035);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      osc.connect(g); g.connect(AUDIO.master);
      if (echo > 0 && AUDIO.delay) {const e = AUDIO.ctx.createGain(); e.gain.value = echo; g.connect(e); e.connect(AUDIO.delay);}
      osc.start(t); osc.stop(t + dur + .05);
      /* 八度下方铺一层很轻的垫音，听起来不那么单薄 */
      const sub = AUDIO.ctx.createOscillator();
      const sg = AUDIO.ctx.createGain();
      sub.type = "sine"; sub.frequency.value = midiHz(n - 12);
      sg.gain.setValueAtTime(0, t);
      sg.gain.linearRampToValueAtTime(gain * .32, t + .06);
      sg.gain.exponentialRampToValueAtTime(.0001, t + dur * 1.3);
      sub.connect(sg); sg.connect(AUDIO.master);
      sub.start(t); sub.stop(t + dur * 1.3 + .05);
    }

    function audioTick() {
      if (!AUDIO.playing || AUDIO.source !== "builtin") return;
      const t = AUDIO_TRACKS.find(x => x.id === AUDIO.track) || AUDIO_TRACKS[0];
      const beat = 60 / t.bpm;
      const n = t.notes[AUDIO.step % t.notes.length];
      audioNote(n, t.wave, t.gain, t.echo, beat * 1.7);
      /* 和弦垫：每 4 拍给一个长一点的低音，不抢主旋律 */
      if (t.pad && AUDIO.step % 4 === 0) audioNote(48 + (AUDIO.step % 8 ? 5 : 0), "sine", t.gain * .4, 0, beat * 3.4);
      AUDIO.step++;
    }

    function audioStopTimers() {
      if (AUDIO.timer) {clearInterval(AUDIO.timer); AUDIO.timer = null;}
      if (AUDIO.ctx && AUDIO.ctx.state === "running") {
        /* 不 suspend —— 内置曲靠 gain 静音更平滑，导入文件单独 pause */
      }
      if (AUDIO.master) AUDIO.master.gain.value = 0;
    }

    function audioPause() {
      AUDIO.playing = false;
      audioStopTimers();
      if (AUDIO.fileEl) {try {AUDIO.fileEl.pause();} catch (e) {}}
      audioSave();
      if (typeof audioPanelRefresh === "function") audioPanelRefresh();
    }

    function audioPlay(trackId) {
      if (trackId) {AUDIO.track = trackId; AUDIO.source = "builtin"; AUDIO.step = 0;}
      if (AUDIO.fileEl) {try {AUDIO.fileEl.pause();} catch (e) {}}
      if (!audioEnsureCtx()) return;
      if (AUDIO.ctx.state === "suspended") {try {AUDIO.ctx.resume();} catch (e) {}}
      audioStopTimers();
      AUDIO.master.gain.value = AUDIO.volume * .5;
      AUDIO.playing = true;
      AUDIO.source = "builtin";
      audioTick();
      const t = AUDIO_TRACKS.find(x => x.id === AUDIO.track) || AUDIO_TRACKS[0];
      AUDIO.timer = setInterval(audioTick, 60 / t.bpm * 1000);
      audioSave();
      if (typeof audioPanelRefresh === "function") audioPanelRefresh();
    }

    function audioPlayFile(file) {
      if (!file) return;
      audioStopTimers();
      AUDIO.playing = false;
      if (AUDIO.fileUrl) {try {URL.revokeObjectURL(AUDIO.fileUrl);} catch (e) {}}
      AUDIO.fileUrl = URL.createObjectURL(file);
      if (!AUDIO.fileEl) AUDIO.fileEl = new Audio();
      AUDIO.fileEl.src = AUDIO.fileUrl;
      AUDIO.fileEl.loop = true;
      AUDIO.fileEl.volume = AUDIO.volume;
      AUDIO.fileName = file.name;
      AUDIO.source = "file";
      const pr = AUDIO.fileEl.play();
      if (pr && pr.catch) pr.catch(() => {
        if (typeof toast === "function") toast("这个格式浏览器放不了，换 mp3 / ogg / wav 试试。");
      });
      AUDIO.playing = true;
      if (typeof audioPanelRefresh === "function") audioPanelRefresh();
    }

    function audioSetVolume(v) {
      AUDIO.volume = Math.max(0, Math.min(1, Number(v) || 0));
      if (AUDIO.master && AUDIO.playing && AUDIO.source === "builtin") AUDIO.master.gain.value = AUDIO.volume * .5;
      if (AUDIO.fileEl) AUDIO.fileEl.volume = AUDIO.volume;
      audioSave();
      const el = document.getElementById("audioVolVal");
      if (el) el.textContent = Math.round(AUDIO.volume * 100) + "%";
    }

    function audioToggle() {
      if (AUDIO.playing) audioPause();
      else if (AUDIO.source === "file" && AUDIO.fileEl) {
        AUDIO.fileEl.volume = AUDIO.volume;
        AUDIO.fileEl.play().catch(() => {});
        AUDIO.playing = true;
        if (typeof audioPanelRefresh === "function") audioPanelRefresh();
      } else audioPlay();
    }

    /* ------------------------------------------------------------------
     * 界面：曲目格子 + 音量滑块 + 本地导入
     * 用 showPopup 的 afterRender 挂事件；按钮全部内联 onclick，
     * 因为刷新面板时只替换 innerHTML，重新挂一遍更省事。
     * ------------------------------------------------------------------ */
    function audioPanelHtml() {
      const cur = AUDIO_TRACKS.find(t => t.id === AUDIO.track) || AUDIO_TRACKS[0];
      const state = AUDIO.playing
        ? `<span style="color:var(--green)">♪ 正在播放 · ${AUDIO.source === "file" ? TZ(AUDIO.fileName) : TZ(cur.n)}</span>`
        : `<span style="color:var(--dim)">已暂停 · 选一首点播放</span>`;
      let h = `<div class="audio-panel"><div class="audio-state">${state}</div>`;
      h += `<div class="audio-controls"><button class="btn" onclick="audioToggle()">${AUDIO.playing ? "⏸ 暂停" : "▶ 播放"}</button>`;
      h += `<span class="audio-vol">音量 <input type="range" id="audioVol" min="0" max="100" value="${Math.round(AUDIO.volume * 100)}" oninput="audioSetVolume(this.value/100)"><b id="audioVolVal">${Math.round(AUDIO.volume * 100)}%</b></span></div>`;
      h += `<div class="audio-tracks">`;
      AUDIO_TRACKS.forEach(t => {
        const on = (AUDIO.source === "builtin" && t.id === AUDIO.track) ? " on" : "";
        h += `<button class="audio-track${on}" onclick="audioPlay('${t.id}')"><b>${on ? "♪ " : ""}${TZ(t.n)}</b><small>${TZ(t.tag)}</small></button>`;
      });
      h += `</div>`;
      h += `<div class="audio-import"><label class="btn" style="cursor:pointer">📂 导入本地音乐<input type="file" id="audioFile" accept="audio/*" style="display:none"></label>`;
      h += `<span style="color:var(--dim);font-size:.78rem">支持 mp3 / ogg / wav / m4a 等浏览器能解码的格式；文件不会上传，只在本次会话内播放。</span></div>`;
      if (AUDIO.fileName) h += `<div class="create-note">已导入：${TZ(AUDIO.fileName)}　<button class="mini-btn" onclick="audioPlayFileAgain()">再播一次</button></div>`;
      h += `<div class="create-note">内置曲目由浏览器实时合成，不加载任何外部文件，离线双击也能播。浏览器要求先点一下才允许出声，所以每次打开页面默认是暂停。</div></div>`;
      return h;
    }

    function audioPlayFileAgain() {
      if (!AUDIO.fileEl) return;
      AUDIO.source = "file";
      AUDIO.fileEl.currentTime = 0;
      AUDIO.fileEl.volume = AUDIO.volume;
      AUDIO.fileEl.play().catch(() => {});
      AUDIO.playing = true;
      audioStopTimers();
      audioPanelRefresh();
    }

    /* 只替换正文、不重开弹窗 —— 避免每次点曲目都把弹窗关掉 */
    function audioPanelRefresh() {
      const body = document.getElementById("modalBody");
      if (!body) return;
      body.innerHTML = audioPanelHtml();
      const f = document.getElementById("audioFile");
      if (f) f.onchange = e => {if (e.target.files && e.target.files[0]) audioPlayFile(e.target.files[0]);};
    }

    function openAudioPanel() {
      audioLoad();
      /* 直接走 showModal 而不是 showPopup：面板自己带完整内容，
       * 需要显式标 feedback:false，否则点「关闭」会弹一个空的
       * 「这一下的结果」窗（showPopup 的 meta 不传这个字段）。 */
      if (typeof showModal === "function") {
        showModal("🎵 背景音乐", audioPanelHtml(), [{t: "关闭", fn: () => {}}],
          null, false, false, {kind: "free", badge: "🎵 背景音乐", feedback: false});
        const f = document.getElementById("audioFile");
        if (f) f.onchange = e => {if (e.target.files && e.target.files[0]) audioPlayFile(e.target.files[0]);};
      }
    }

    /* 启动时不自动播放（浏览器策略），只读回曲目与音量 */
    audioLoad();
