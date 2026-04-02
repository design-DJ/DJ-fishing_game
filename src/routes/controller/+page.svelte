<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { io } from 'socket.io-client';

    // 從網址參數取得 Room ID (?room=123456)
    const roomId = $page.url.searchParams.get('room');
    let socket: any;

    onMount(() => {
        if (!roomId) return alert('缺少 Room ID');

        // 連線
        socket = io('http://192.168.1.10:3000'); // 注意：手機要連電腦的 IP，不能寫 localhost

        socket.emit('join-room', roomId);
    });

    // 發送指令
    function sendCommand(key: string, isPressed: boolean) {
        if (!socket) return;
        
        // 發射訊號給 Server
        socket.emit('send-command', {
            roomId,
            command: { key, isPressed }
        });
        
        // 手機震動回饋 (提升手感)
        if (isPressed && navigator.vibrate) navigator.vibrate(50);
    }
</script>

<div class="w-screen h-screen bg-gray-900 flex items-center justify-center select-none">
    
    <div class="flex gap-4 mr-8">
        <button 
            class="btn-control"
            ontouchstart={(e) => { e.preventDefault(); sendCommand('ArrowLeft', true); }}
            ontouchend={(e) => { e.preventDefault(); sendCommand('ArrowLeft', false); }}
        >⬅️</button>
        
        <button 
            class="btn-control"
            ontouchstart={(e) => { e.preventDefault(); sendCommand('ArrowRight', true); }}
            ontouchend={(e) => { e.preventDefault(); sendCommand('ArrowRight', false); }}
        >➡️</button>
    </div>

    <div>
        <button 
            class="btn-action"
            ontouchstart={(e) => { e.preventDefault(); sendCommand(' ', true); }}
            ontouchend={(e) => { e.preventDefault(); sendCommand(' ', false); }}
        >HOOK</button>
    </div>
</div>

<style>
    .btn-control {
        width: 80px; height: 80px; border-radius: 50%;
        background: #444; color: white; font-size: 2rem;
    }
    .btn-action {
        width: 100px; height: 100px; border-radius: 50%;
        background: #e74c3c; color: white; font-weight: bold;
    }
    /* 按下效果 */
    button:active { transform: scale(0.95); opacity: 0.8; }
</style>