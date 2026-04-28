<script lang="ts">
	import { game } from '$lib/game.svelte';
	import { getLeaderboard } from '$lib/leaderboard';
	import type { LeaderboardEntry } from '$lib/leaderboard';
	import { onMount } from 'svelte';

	let playerName = $state('');
	let leaderboard = $state<LeaderboardEntry[]>([]);

	onMount(() => {
		leaderboard = getLeaderboard();
	});

	function handleStart() {
		game.startGame(playerName);
	}

	function handleWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleStart();
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="min-h-screen bg-gradient-to-b from-sky-300 to-blue-600 flex items-center justify-center p-4">
	<div class="flex flex-col lg:flex-row gap-8 w-full max-w-5xl">
		<!-- 左側：遊戲標題與輸入 -->
		<div
			class="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6 flex-1"
		>
			<div class="text-center">
				<div class="text-8xl mb-2">🎣</div>
				<h1 class="text-5xl font-black text-blue-800 mb-2">賈好嘉釣魚</h1>
				<p class="text-gray-500 text-base">釣魚入籃加分！60 秒內釣越多越好！</p>
			</div>

			<div class="w-full max-w-sm flex flex-col gap-4">
				<label class="text-xl font-bold text-gray-700 text-center" for="nameInput">
					輸入你的名字
				</label>
				<input
					id="nameInput"
					type="text"
					bind:value={playerName}
					placeholder="玩家名稱（最多 10 字）"
					maxlength="10"
					class="border-2 border-blue-300 rounded-xl px-4 py-3 text-xl text-center focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
				/>
				<button
					onclick={handleStart}
					class="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-black text-2xl py-4 px-8 rounded-2xl shadow-lg transition-all duration-150"
				>
					🚀 開始遊戲
				</button>
			</div>

			<div class="text-gray-400 text-sm space-y-1 text-center border-t border-gray-200 pt-4 w-full">
				<p class="font-medium text-gray-500 mb-1">操作說明</p>
				<p>← → 移動船</p>
				<p>點擊空白鍵釣魚</p>
				<p>每條魚入碗得 10 分</p>
			</div>

			<button
				onclick={() => game.openAdmin()}
				class="text-gray-300 hover:text-gray-500 text-xs transition-colors mt-2"
			>
				⚙️ 管理設定
			</button>
		</div>

		<!-- 右側：排行榜 -->
		<div
			class="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 flex flex-col gap-4 flex-1"
		>
			<h2 class="text-3xl font-black text-yellow-600 text-center">🏆 排行榜 Top 10</h2>

			{#if leaderboard.length === 0}
				<div class="flex-1 flex items-center justify-center text-gray-400 text-xl text-center py-12">
					<p>還沒有紀錄<br />成為第一名吧！</p>
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
								<tr class="border-b border-gray-100 {i < 3 ? 'font-bold' : ''}">
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
