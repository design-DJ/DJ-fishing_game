<script lang="ts">
	import { game } from '$lib/game.svelte';
	import { getLeaderboard, getPlayerRank } from '$lib/leaderboard';
	import type { LeaderboardEntry } from '$lib/leaderboard';
	import { onMount } from 'svelte';

	let leaderboard = $state<LeaderboardEntry[]>([]);
	let playerRank = $state(0);

	onMount(() => {
		leaderboard = getLeaderboard();
		playerRank = getPlayerRank(game.score);
	});

	function handleRestart() {
		game.restartGame();
	}

	function rankEmoji(rank: number): string {
		if (rank === 1) return '🏆';
		if (rank <= 3) return '🎉';
		if (rank <= 10) return '🎣';
		return '🐟';
	}

	function rankMessage(rank: number): string {
		if (rank === 1) return '恭喜！你是第一名！';
		if (rank === 2) return '太厲害了！第二名！';
		if (rank === 3) return '不錯！第三名！';
		if (rank <= 10) return `排行榜第 ${rank} 名！`;
		return '繼續努力，下次一定進排行榜！';
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-sky-300 to-blue-600 flex items-center justify-center p-4">
	<div class="flex flex-col lg:flex-row gap-8 w-full max-w-5xl">
		<!-- 左側：遊戲結果 -->
		<div
			class="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6 flex-1"
		>
			<div class="text-center">
				<div class="text-7xl mb-2">{rankEmoji(playerRank)}</div>
				<h1 class="text-4xl font-black text-blue-800 mb-1">遊戲結束！</h1>
				<p class="text-2xl text-gray-500">{game.playerName}</p>
			</div>

			<!-- 分數顯示 -->
			<div class="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 w-full text-center">
				<p class="text-gray-400 text-base mb-1">本次得分</p>
				<p class="text-7xl font-black text-blue-600">{game.score}</p>
			</div>

			<!-- 名次訊息 -->
			<div
				class="rounded-2xl p-4 w-full text-center {playerRank <= 10
					? 'bg-yellow-50 border-2 border-yellow-200'
					: 'bg-gray-50 border-2 border-gray-200'}"
			>
				<p class="text-xl font-bold {playerRank <= 10 ? 'text-yellow-700' : 'text-gray-500'}">
					{rankMessage(playerRank)}
				</p>
			</div>

			<button
				onclick={handleRestart}
				class="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-black text-2xl py-4 px-8 rounded-2xl shadow-lg transition-all duration-150 w-full"
			>
				🔄 再玩一次
			</button>
		</div>

		<!-- 右側：排行榜 -->
		<div
			class="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 flex flex-col gap-4 flex-1"
		>
			<h2 class="text-3xl font-black text-yellow-600 text-center">🏆 排行榜 Top 10</h2>

			{#if leaderboard.length === 0}
				<div class="flex-1 flex items-center justify-center text-gray-400 text-xl">
					<p>還沒有紀錄</p>
				</div>
			{:else}
				<div class="overflow-auto">
					<table class="w-full text-center">
						<thead>
							<tr class="text-gray-500 border-b-2 border-gray-200 text-sm uppercase">
								<th class="py-2 w-12">排名</th>
								<th class="py-2">玩家</th>
								<th class="py-2">分數</th>
								<th class="py-2">日期</th>
							</tr>
						</thead>
						<tbody>
							{#each leaderboard as entry, i}
								<!-- 高亮玩家自己的這局成績 -->
								<tr
									class="border-b border-gray-100 {i < 3 ? 'font-bold' : ''} {entry.name ===
										game.playerName && entry.score === game.score
										? 'bg-yellow-50 ring-2 ring-yellow-300'
										: ''}"
								>
									<td class="py-3 text-2xl">
										{#if i === 0}🥇{:else if i === 1}🥈{:else if i === 2}🥉{:else}{i + 1}{/if}
									</td>
									<td
										class="py-3 text-base {i === 0
											? 'text-yellow-600'
											: i === 1
												? 'text-gray-500'
												: i === 2
													? 'text-orange-600'
													: 'text-gray-700'}">{entry.name}</td
									>
									<td class="py-3 text-base {i < 3 ? 'text-blue-600' : 'text-gray-600'}"
										>{entry.score}</td
									>
									<td class="py-3 text-xs text-gray-400">{entry.date}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>
