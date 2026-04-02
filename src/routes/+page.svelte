<script lang="ts">
	import GameCanvas from '$lib/components/GameCanvas.svelte';
	import StartScreen from '$lib/components/StartScreen.svelte';
	import EndScreen from '$lib/components/EndScreen.svelte';
	import AdminScreen from '$lib/components/AdminScreen.svelte';
	import { game } from '$lib/game.svelte';
	import { io } from 'socket.io-client';
	import { onMount } from 'svelte';

	// 手機控制器 Socket.io（現有功能保留）
	const roomId = Math.floor(100000 + Math.random() * 900000).toString();

	onMount(() => {
		const socket = io('http://localhost:3000');
		socket.emit('join-room', roomId);

		socket.on('receive-command', (data: { key: string; isPressed: boolean }) => {
			// GameCanvas 的引擎會在 playing 階段接收鍵盤事件
			// 手機控制器指令透過模擬 keydown/keyup 事件傳遞
			if (game.gamePhase === 'playing') {
				const event = new KeyboardEvent(data.isPressed ? 'keydown' : 'keyup', { key: data.key });
				window.dispatchEvent(event);
			}
		});
	});
</script>

{#if game.gamePhase === 'start'}
	<StartScreen />
{:else if game.gamePhase === 'admin'}
	<AdminScreen />
{:else if game.gamePhase === 'playing'}
	<div class="min-h-screen bg-gray-900 flex flex-col">
		<header class="flex justify-between items-center px-6 py-3 bg-gray-800 text-white">
			<h1 class="text-xl font-bold">🎣 晴天釣魚</h1>
			<span class="text-gray-400 text-sm">房間：{roomId}</span>
		</header>
		<main class="flex-1 flex items-center justify-center p-2">
			<GameCanvas />
		</main>
	</div>
{:else if game.gamePhase === 'end'}
	<EndScreen />
{/if}
