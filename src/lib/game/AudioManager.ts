// src/lib/game/AudioManager.ts
// 支援兩種模式：
//   1. 音訊檔案模式（優先）：將音訊檔放在 static/audio/ 後自動啟用
//   2. Web Audio API 合成模式（備用）：無音訊檔時自動降級

export class AudioManager {
    // ─── 音訊檔案播放器 ──────────────────────────────────────
    // 如果你不需要合成音效，只需保留這個區塊即可
    private bgmAudio: HTMLAudioElement | null = null;
    private sfxMap: Map<string, HTMLAudioElement> = new Map();

    private actx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private bgmGain: GainNode | null = null;
    private bgmTimer: ReturnType<typeof setTimeout> | null = null;
    private bgmNextTime: number = 0;
    private bgmPlaying = false;
    private reelPlaying = false; // 防止釣竿音效重複播放
    bgmMuted = false;
    sfxMuted = false;

    constructor() {
        // 嘗試載入音訊檔案，若 404 則自動回退到合成模式
        this.detectAudioFiles();
    }

    private detectAudioFiles() {
        // 每個音效獨立嘗試載入，成功才存入，失敗（404）則靜默忽略
        // 有哪個檔案就用哪個，其餘自動回退到合成模式
        const bgm = new Audio('/audio/bgm.mp3');
        bgm.addEventListener('canplaythrough', () => {
            bgm.loop = true;
            bgm.volume = 0.4;
            this.bgmAudio = bgm;
        }, { once: true });
        bgm.load();

        const sfxList: [string, string][] = [
            ['reel',       '/audio/reel.m4a'],
            ['catch',      '/audio/catch.m4a'],
            ['score',      '/audio/score.m4a'],
            ['game-start', '/audio/game-start.m4a'],
            ['game-end',   '/audio/game-end.m4a'],
        ];
        for (const [key, src] of sfxList) {
            const a = new Audio(src);
            a.addEventListener('canplaythrough', () => {
                a.volume = 0.7;
                this.sfxMap.set(key, a);
            }, { once: true });
            a.load();
        }
    }

    /** 播放音效檔（若同一音效重疊，cloneNode 讓它可以同時多個播放） */
    private playSfxFile(key: string) {
        const src = this.sfxMap.get(key);
        if (!src) return;
        const clone = src.cloneNode() as HTMLAudioElement;
        clone.volume = src.volume;
        clone.play().catch(() => {});
    }

    // 懶初始化 AudioContext（需要使用者互動後才能建立）
    private ensureContext(): AudioContext {
        if (!this.actx) {
            this.actx = new AudioContext();
            this.masterGain = this.actx.createGain();
            this.masterGain.gain.value = 1;
            this.masterGain.connect(this.actx.destination);
        }
        if (this.actx.state === 'suspended') {
            this.actx.resume();
        }
        return this.actx;
    }

    // ─── 背景音樂 ───────────────────────────────────────────

    startBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.volume = this.bgmMuted ? 0 : 0.4;
            this.bgmAudio.play().catch(() => {});
            return;
        }
        // --- 合成模式 ---
        if (this.bgmPlaying) return;
        const ctx = this.ensureContext();
        this.bgmGain = ctx.createGain();
        this.bgmGain.gain.value = this.bgmMuted ? 0 : 0.22;
        this.bgmGain.connect(this.masterGain!);
        this.bgmPlaying = true;
        this.bgmNextTime = ctx.currentTime + 0.15;
        this.scheduleBGMLoop();
    }

    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            return;
        }
        // --- 合成模式 ---
        if (!this.bgmPlaying) return;
        this.bgmPlaying = false;
        if (this.bgmTimer !== null) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
        if (this.bgmGain && this.actx) {
            this.bgmGain.gain.setTargetAtTime(0, this.actx.currentTime, 0.4);
            this.bgmGain = null;
        }
    }

    // 根據 Web Audio API 時鐘排程旋律，確保無縫循環
    private scheduleBGMLoop() {
        if (!this.bgmPlaying || !this.bgmGain || !this.actx) return;
        const ctx = this.actx;

        // C 大調五聲音階（Hz）
        const N: Record<string, number> = {
            C3: 130.81, G3: 196.00,
            C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
            C5: 523.25, D5: 587.33, E5: 659.25,
        };

        const beat = 0.26; // 每拍秒數

        // 主旋律（音名, 拍數）
        const melody: [keyof typeof N, number][] = [
            ['C4', 1], ['E4', 1], ['G4', 1], ['A4', 1],
            ['G4', 1], ['E4', 1], ['D4', 1], ['C4', 1],
            ['E4', 1], ['G4', 1], ['A4', 1], ['C5', 1],
            ['A4', 1], ['G4', 1], ['E4', 1], ['C4', 2],
        ];

        // 低音伴奏（oom-pah 風格）
        const bass: [keyof typeof N, number][] = [
            ['C3', 2], ['G3', 2], ['C3', 2], ['G3', 2],
            ['C3', 2], ['G3', 2], ['C3', 2], ['G3', 2],
        ];

        let tMelody = this.bgmNextTime;
        let totalBeats = 0;

        for (const [name, beats] of melody) {
            this.note(ctx, this.bgmGain, N[name as string], 'sine', 0.38, tMelody, beats * beat * 0.82);
            tMelody += beats * beat;
            totalBeats += beats;
        }

        let tBass = this.bgmNextTime;
        for (const [name, beats] of bass) {
            this.note(ctx, this.bgmGain, N[name as string], 'triangle', 0.18, tBass, beats * beat * 0.9);
            tBass += beats * beat;
        }

        const loopDurationMs = totalBeats * beat * 1000;
        this.bgmNextTime += totalBeats * beat;

        // 在本次排程結束前 200ms 排程下一次，保持連續
        this.bgmTimer = setTimeout(() => this.scheduleBGMLoop(), loopDurationMs - 200);
    }

    // 通用的音符建立輔助函式
    private note(
        ctx: AudioContext,
        dest: AudioNode,
        freq: number,
        type: OscillatorType,
        amp: number,
        startTime: number,
        duration: number
    ) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(amp, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    }

    // ─── 音效 ────────────────────────────────────────────────

    /** 收線音效：快速上升掃頻（防重複：播放中則跳過） */
    playReel() {
        if (this.sfxMuted) return;
        if (this.reelPlaying) return;
        this.reelPlaying = true;
        if (this.sfxMap.has('reel')) {
            const src = this.sfxMap.get('reel')!;
            const clone = src.cloneNode() as HTMLAudioElement;
            clone.volume = src.volume;
            clone.addEventListener('ended', () => { this.reelPlaying = false; }, { once: true });
            clone.play().catch(() => { this.reelPlaying = false; });
            return;
        }
        const ctx = this.ensureContext();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(850, t + 0.18);
        gain.gain.setValueAtTime(0.32, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.23);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); this.reelPlaying = false; };
    }

    /** 釣到魚音效：雙音 Ding */
    playCatchFish() {
        if (this.sfxMuted) return;
        if (this.sfxMap.has('catch')) { this.playSfxFile('catch'); return; }
        const ctx = this.ensureContext();
        const t = ctx.currentTime;
        [600, 800].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.28, t + i * 0.11);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.11 + 0.28);
            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start(t + i * 0.11);
            osc.stop(t + i * 0.11 + 0.30);
            osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        });
    }

    /** 得分音效：C-E-G 上行三和弦 */
    playScore() {
        if (this.sfxMuted) return;
        if (this.sfxMap.has('score')) { this.playSfxFile('score'); return; }
        const ctx = this.ensureContext();
        const t = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.33, t + i * 0.13);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.13 + 0.35);
            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start(t + i * 0.13);
            osc.stop(t + i * 0.13 + 0.36);
            osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        });
    }

    /** 遊戲開始音效：上行四音昂揚進場 */
    playGameStart() {
        if (this.sfxMuted) return;
        if (this.sfxMap.has('game-start')) { this.playSfxFile('game-start'); return; }
        const ctx = this.ensureContext();
        const t = ctx.currentTime;
        [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.16, t + i * 0.14);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.14 + 0.40);
            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start(t + i * 0.14);
            osc.stop(t + i * 0.14 + 0.41);
            osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        });
    }

    /** 遊戲結束音效：下行四音淡出 */
    playGameEnd() {
        if (this.sfxMuted) return;
        if (this.sfxMap.has('game-end')) { this.playSfxFile('game-end'); return; }
        const ctx = this.ensureContext();
        const t = ctx.currentTime;
        [523.25, 392.00, 329.63, 261.63].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.26, t + i * 0.22);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.22 + 0.45);
            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start(t + i * 0.22);
            osc.stop(t + i * 0.22 + 0.46);
            osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        });
    }

    // ─── 音效開關 ────────────────────────────────────────────

    /** 切換背景音樂，回傳新狀態 */
    toggleBGM(): boolean {
        this.bgmMuted = !this.bgmMuted;
        if (this.bgmAudio) {
            this.bgmAudio.volume = this.bgmMuted ? 0 : 0.4;
        }
        if (this.bgmGain && this.actx) {
            this.bgmGain.gain.setTargetAtTime(
                this.bgmMuted ? 0 : 0.22,
                this.actx.currentTime,
                0.05
            );
        }
        return this.bgmMuted;
    }

    /** 切換動作音效，回傳新狀態 */
    toggleSFX(): boolean {
        this.sfxMuted = !this.sfxMuted;
        if (this.masterGain && this.actx) {
            this.masterGain.gain.setTargetAtTime(
                this.sfxMuted ? 0 : 1,
                this.actx.currentTime,
                0.05
            );
        }
        return this.sfxMuted;
    }

    /** 銷毀音訊資源 */
    destroy() {
        this.stopBGM();
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio = null;
        }
        this.sfxMap.clear();
        if (this.actx) {
            this.actx.close();
            this.actx = null;
        }
    }
}
