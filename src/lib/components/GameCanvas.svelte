<script lang="ts">
	import { onMount } from 'svelte';
	import { GameEngine } from '$lib/game/GameEngine';
	import { AudioManager } from '$lib/game/AudioManager';
	import { game } from '$lib/game.svelte';

	let canvas: HTMLCanvasElement;
	let engine: GameEngine;
	let frameId: number;
	let audio: AudioManager;
	let isBgmMuted = $state(false);
	let isSfxMuted = $state(false);

	onMount(() => {
		// 0. 初始化音訊管理器
		audio = new AudioManager();
		audio.setBGMPlaybackRate(0.7);
		audio.setBGMLoopDelay(800);

		// 1. 初始化引擎
		engine = new GameEngine(
			canvas,
			(amount) => {
				game.addScore(amount);
			},
			game.fishCount
		);

		// 連接音效回呼
		engine.onSfx = (event) => {
			if (event === 'reel') audio.playReel();
			else if (event === 'catch') audio.playCatchFish();
			else if (event === 'score') audio.playScore();
		};

		// 遊戲開始音效 + 背景音樂（延遲讓開始音效先播完）
		audio.playGameStart();
		setTimeout(() => audio.startBGM(), 700);

		const ctx = canvas.getContext('2d')!;
		let lastSecondTime = performance.now();

		// 2. 遊戲主迴圈
		const loop = (timestamp: number) => {
			// 倒數計時（每秒減 1）
			if (timestamp - lastSecondTime >= 1000) {
				lastSecondTime += 1000;
				game.timeLeft = Math.max(0, game.timeLeft - 1);
				if (game.timeLeft <= 0) {
					game.endGame();
					return; // 停止迴圈
				}
			}

			// 更新與繪製遊戲物件
			engine.update();
			engine.draw();

			// 繪製 HUD（分數、時間、玩家名稱）
			drawHUD(ctx);

			frameId = requestAnimationFrame(loop);
		};

		frameId = requestAnimationFrame(loop);

		// 3. 組件銷毀時停止迴圈與音訊
		return () => {
			cancelAnimationFrame(frameId);
			audio.playGameEnd();
			// 短暫延遲後才銷毀，讓結束音效播完
			setTimeout(() => audio.destroy(), 1500);
		};
	});

	// 在 Canvas 上繪製即時分數與倒數計時
	function drawHUD(ctx: CanvasRenderingContext2D) {
		const W = canvas.width; // 1920
		const pad = 24;
		const boxH = 88;
		const boxW = 360;
		const radius = 16;

		ctx.save();
		ctx.textBaseline = 'middle';

		// --- 分數（左上）---
		roundRect(ctx, pad, pad, boxW, boxH, radius, 'rgba(0,0,0,0.52)');
		ctx.fillStyle = '#FFD700';
		ctx.font = 'bold 52px "Microsoft JhengHei", "PingFang TC", sans-serif';
		ctx.fillText(`分數：${game.score}`, pad + 20, pad + boxH / 2);

		// --- 倒數計時（右上）---
		const isLow = game.timeLeft <= 10;
		const timerX = W - pad - boxW;
		roundRect(
			ctx,
			timerX,
			pad,
			boxW,
			boxH,
			radius,
			isLow ? 'rgba(180,0,0,0.72)' : 'rgba(0,0,0,0.52)'
		);
		ctx.fillStyle = isLow ? '#FF8080' : '#FFFFFF';
		ctx.fillText(`時間：${game.timeLeft} 秒`, timerX + 20, pad + boxH / 2);

		// --- 玩家名稱（分數框下方）---
		const nameBoxY = pad + boxH + 10;
		roundRect(ctx, pad, nameBoxY, boxW, 56, radius, 'rgba(0,0,0,0.38)');
		ctx.fillStyle = '#AADDFF';
		ctx.font = '36px "Microsoft JhengHei", "PingFang TC", sans-serif';
		ctx.fillText(`玩家：${game.playerName}`, pad + 20, nameBoxY + 28);

		ctx.restore();
	}

	// 工具函式：繪製圓角矩形並填色
	function roundRect(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		w: number,
		h: number,
		r: number,
		color: string
	) {
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + w - r, y);
		ctx.arcTo(x + w, y, x + w, y + r, r);
		ctx.lineTo(x + w, y + h - r);
		ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
		ctx.lineTo(x + r, y + h);
		ctx.arcTo(x, y + h, x, y + h - r, r);
		ctx.lineTo(x, y + r);
		ctx.arcTo(x, y, x + r, y, r);
		ctx.closePath();
		ctx.fill();
	}

	// --- 輸入處理 ---

	function handleKeydown(e: KeyboardEvent) {
		if (engine) engine.handleInput(e.key, true);
	}

	function handleKeyup(e: KeyboardEvent) {
		if (engine) engine.handleInput(e.key, false);
	}

	function handleCanvasClick() {
		if (!engine) return;
		engine.handleInput(' ', true);
		setTimeout(() => engine.handleInput(' ', false), 100);
	}

	function handleToggleBGM() {
		isBgmMuted = audio.toggleBGM();
	}

	function handleToggleSFX() {
		isSfxMuted = audio.toggleSFX();
	}
</script>

<svelte:window onkeydown={handleKeydown} onkeyup={handleKeyup} />

<div class="relative inline-block w-full">
	<canvas
		bind:this={canvas}
		width="1920"
		height="1080"
		onclick={handleCanvasClick}
		class="max-w-full max-h-[80vh] w-auto h-auto mx-auto block border-2 border-gray-700 rounded-lg shadow-lg cursor-pointer bg-sky-100 touch-none"
	></canvas>
	<!-- 音訊控制按鈕 -->
	<div class="absolute top-3 right-3 z-10 flex gap-2">
		<button
			onclick={handleToggleBGM}
			class="bg-black/50 hover:bg-black/70 text-white text-xl rounded-full w-11 h-11 flex items-center justify-center transition-colors"
			title={isBgmMuted ? '開啟背景音樂' : '關閉背景音樂'}
		>
			{isBgmMuted ? '🎵' : '🎶'}
		</button>
		<button
			onclick={handleToggleSFX}
			class="bg-black/50 hover:bg-black/70 text-white text-xl rounded-full w-11 h-11 flex items-center justify-center transition-colors"
			title={isSfxMuted ? '開啟音效' : '關閉音效'}
		>
			{isSfxMuted ? '🔇' : '🔊'}
		</button>
	</div>
</div>
