// server.js
import { Server } from 'socket.io';
import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);

// 設定 Socket.io (允許跨域，因為開發時前端可能是 localhost:5173)
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // 1. 加入房間 (PC 和 手機都要做這步)
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // 2. 手機發送指令 -> 轉發給同一房間的 PC
    // payload 格式: { key: 'ArrowLeft', isPressed: true }
    socket.on('send-command', (data) => {
        const { roomId, command } = data;
        // broadcast: 發給房間內除了自己以外的人 (就是發給 PC)
        socket.to(roomId).emit('receive-command', command);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(3000, () => {
    console.log('Socket Server running on port 3000');
});