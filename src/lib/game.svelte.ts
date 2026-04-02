// src/lib/game.svelte.ts
import { browser } from '$app/environment';
import { saveScore } from './leaderboard';

export type GamePhase = 'start' | 'playing' | 'end' | 'admin';

const SETTINGS_KEY = 'sunny-fishing-settings';

class GameState {
	score = $state(0);
	playerName = $state('');
	gamePhase = $state<GamePhase>('start');
	timeLeft = $state(30);
	gameDuration = $state(30);
	fishCount = $state(10);

	constructor() {
		if (browser) {
			try {
				const saved = localStorage.getItem(SETTINGS_KEY);
				if (saved) {
					const settings = JSON.parse(saved);
					if (typeof settings.gameDuration === 'number' && settings.gameDuration >= 10) {
						this.gameDuration = settings.gameDuration;
					}
					if (typeof settings.fishCount === 'number' && settings.fishCount >= 1) {
						this.fishCount = settings.fishCount;
					}
				}
			} catch {
				// ignore
			}
		}
	}

	saveSettings() {
		if (browser) {
			try {
				localStorage.setItem(
					SETTINGS_KEY,
					JSON.stringify({ gameDuration: this.gameDuration, fishCount: this.fishCount })
				);
			} catch {
				// ignore
			}
		}
	}

	// 動作方法 (Actions)
	addScore(amount: number) {
		// 每條魚 10 分
		this.score += amount * 10;
	}

	startGame(name: string) {
		this.playerName = name.trim() || '匿名玩家';
		this.score = 0;
		this.timeLeft = this.gameDuration;
		this.gamePhase = 'playing';
	}

	endGame() {
		this.gamePhase = 'end';
		if (browser) {
			saveScore(this.playerName, this.score);
		}
	}

	restartGame() {
		this.gamePhase = 'start';
	}

	openAdmin() {
		this.gamePhase = 'admin';
	}

	closeAdmin() {
		this.gamePhase = 'start';
	}
}

// 匯出單例模式 (Singleton)，讓整個 App 共用同一份狀態
export const game = new GameState();
