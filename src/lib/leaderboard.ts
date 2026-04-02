import { browser } from '$app/environment';

export interface LeaderboardEntry {
	name: string;
	score: number;
	date: string;
}

const STORAGE_KEY = 'sunny-fishing-leaderboard';
const MAX_ENTRIES = 10;

export function getLeaderboard(): LeaderboardEntry[] {
	if (!browser) return [];
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		return saved ? JSON.parse(saved) : [];
	} catch {
		return [];
	}
}

export function saveScore(name: string, score: number): void {
	if (!browser) return;
	const entries = getLeaderboard();
	entries.push({
		name: name.trim() || '匿名玩家',
		score,
		date: new Date().toLocaleDateString('zh-TW')
	});
	entries.sort((a, b) => b.score - a.score);
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
	} catch {
		// ignore storage errors
	}
}

// 回傳玩家在排行榜中的名次（1-based）
export function getPlayerRank(score: number): number {
	const entries = getLeaderboard();
	return entries.filter((e) => e.score > score).length + 1;
}

// 清除所有排行榜資料
export function clearLeaderboard(): void {
	if (!browser) return;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// ignore storage errors
	}
}
