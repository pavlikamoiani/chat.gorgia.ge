// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('🟢 New user connected:', socket.id);

    socket.on('send-message', (message) => {
        console.log('📩 Message received:', message);
        io.emit('receive-message', message);
    });

    socket.on('disconnect', () => {
        console.log('🔴 User disconnected:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('✅ Server is running on port 3000');
});
