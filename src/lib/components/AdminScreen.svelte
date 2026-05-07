<script lang="ts">
	import { game } from '$lib/game.svelte';
	import { clearLeaderboard } from '$lib/leaderboard';

	let password = $state('');
	let authenticated = $state(false);
	let errorMsg = $state('');
	let durationInput = $state(game.gameDuration);
	let fishCountInput = $state(game.fishCount);
	let clearConfirm = $state(false);
	let flashMessage = $state('');

	function handleLogin() {
		if (password === 'jbj') {
			authenticated = true;
			durationInput = game.gameDuration;
			fishCountInput = game.fishCount;
			errorMsg = '';
		} else {
			errorMsg = '密碼錯誤，請重試';
			password = '';
		}
	}

	function handlePasswordKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleLogin();
	}

	function handleSaveDuration() {
		const val = Number(durationInput);
		if (isNaN(val) || val < 10 || val > 600) {
			showFlash('請輸入 10 ~ 600 之間的秒數');
			return;
		}
		game.gameDuration = val;
		game.saveSettings();
		showFlash('設定已儲存！');
	}

	function handleSaveFishCount() {
		const val = Number(fishCountInput);
		if (isNaN(val) || val < 1 || val > 30) {
			showFlash('請輸入 1 ~ 30 之間的數量');
			return;
		}
		game.fishCount = val;
		game.saveSettings();
		showFlash('設定已儲存！');
	}

	function handleClearLeaderboard() {
		if (!clearConfirm) {
			clearConfirm = true;
			return;
		}
		clearLeaderboard();
		clearConfirm = false;
		showFlash('排行榜已清除！');
	}

	function cancelClear() {
		clearConfirm = false;
	}

	function showFlash(msg: string) {
		flashMessage = msg;
		setTimeout(() => (flashMessage = ''), 2500);
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-sky-300 to-blue-600 flex items-center justify-center p-4">
	{#if !authenticated}
		<!-- 密碼驗證畫面 -->
		<div class="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-10 flex flex-col items-center gap-6 w-full max-w-sm">
			<div class="text-center">
				<div class="text-6xl mb-3">🔒</div>
				<h1 class="text-3xl font-black text-gray-800 mb-1">管理設定</h1>
				<p class="text-gray-400 text-sm">請輸入管理密碼以繼續</p>
			</div>

			<div class="w-full flex flex-col gap-3">
				<input
					type="password"
					bind:value={password}
					onkeydown={handlePasswordKeydown}
					placeholder="輸入密碼"
					class="border-2 border-gray-300 rounded-xl px-4 py-3 text-lg text-center focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
					autofocus
				/>

				{#if errorMsg}
					<p class="text-red-500 text-sm text-center font-medium">{errorMsg}</p>
				{/if}

				<button
					onclick={handleLogin}
					class="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-black text-lg py-3 rounded-2xl shadow-lg transition-all duration-150"
				>
					確認進入
				</button>

				<button
					onclick={() => game.closeAdmin()}
					class="text-gray-400 hover:text-gray-600 text-sm underline transition-colors"
				>
					返回首頁
				</button>
			</div>
		</div>
	{:else}
		<!-- 管理設定面板 -->
		<div class="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 flex flex-col gap-6 w-full max-w-2xl">
			<div class="text-center">
				<div class="text-5xl mb-2">⚙️</div>
				<h1 class="text-3xl font-black text-gray-800">管理設定</h1>
			</div>

			{#if flashMessage}
				<div class="bg-green-100 border border-green-400 text-green-700 rounded-xl px-4 py-2 text-center font-medium text-sm">
					{flashMessage}
				</div>
			{/if}

			<!-- 遊戲時間 + 魚的數量（水平排列） -->
			<div class="flex gap-4">
				<!-- 遊戲時間設定 -->
				<div class="bg-gray-50 rounded-2xl p-5 flex flex-col gap-3 flex-1">
					<h2 class="text-lg font-black text-gray-700">⏱ 單局遊戲時間</h2>
					<p class="text-gray-400 text-sm">目前設定：<span class="font-bold text-blue-600">{game.gameDuration} 秒</span></p>
					<div class="flex gap-2">
						<input
							type="number"
							bind:value={durationInput}
							min="10"
							max="600"
							class="flex-1 border-2 border-gray-300 rounded-xl px-3 py-2 text-lg text-center focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
						/>
						<span class="flex items-center text-gray-500 font-medium">秒</span>
					</div>
					<p class="text-gray-400 text-xs">範圍：10 ~ 600 秒</p>
					<button
						onclick={handleSaveDuration}
						class="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold py-2 rounded-xl shadow transition-all duration-150 mt-auto"
					>
						儲存設定
					</button>
				</div>

				<!-- 魚的數量設定 -->
				<div class="bg-gray-50 rounded-2xl p-5 flex flex-col gap-3 flex-1">
					<h2 class="text-lg font-black text-gray-700">🐟 魚的最大數量</h2>
					<p class="text-gray-400 text-sm">目前設定：<span class="font-bold text-blue-600">{game.fishCount} 隻</span></p>
					<div class="flex gap-2">
						<input
							type="number"
							bind:value={fishCountInput}
							min="1"
							max="30"
							class="flex-1 border-2 border-gray-300 rounded-xl px-3 py-2 text-lg text-center focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
						/>
						<span class="flex items-center text-gray-500 font-medium">隻</span>
					</div>
					<p class="text-gray-400 text-xs">範圍：1 ~ 30 隻</p>
					<button
						onclick={handleSaveFishCount}
						class="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold py-2 rounded-xl shadow transition-all duration-150 mt-auto"
					>
						儲存設定
					</button>
				</div>
			</div>

			<!-- 清除排行榜 -->
			<div class="bg-gray-50 rounded-2xl p-5 flex flex-col gap-3">
				<h2 class="text-lg font-black text-gray-700">🗑 清除排行榜</h2>
				<p class="text-gray-400 text-sm">清除後所有排行紀錄將無法復原，遊戲排行榜將重新計算。</p>

				{#if clearConfirm}
					<p class="text-red-500 font-bold text-sm text-center">確定要清除所有排行榜紀錄嗎？</p>
					<div class="flex gap-3">
						<button
							onclick={handleClearLeaderboard}
							class="flex-1 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold py-2 rounded-xl shadow transition-all duration-150"
						>
							確定清除
						</button>
						<button
							onclick={cancelClear}
							class="flex-1 bg-gray-300 hover:bg-gray-400 active:scale-95 text-gray-700 font-bold py-2 rounded-xl shadow transition-all duration-150"
						>
							取消
						</button>
					</div>
				{:else}
					<button
						onclick={handleClearLeaderboard}
						class="bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold py-2 rounded-xl shadow transition-all duration-150"
					>
						清除排行榜
					</button>
				{/if}
			</div>

			<!-- 返回按鈕 -->
			<button
				onclick={() => game.closeAdmin()}
				class="bg-gray-600 hover:bg-gray-700 active:scale-95 text-white font-black text-lg py-3 rounded-2xl shadow-lg transition-all duration-150"
			>
				← 返回遊戲首頁
			</button>
		</div>
	{/if}
</div>
