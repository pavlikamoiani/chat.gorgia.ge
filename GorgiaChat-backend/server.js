const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const pool = require('./config/db');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: false
}));
app.use(express.json());

// Routes
const registerRoute = require('./routes/register');
const loginRoute = require('./routes/login');
const userRoutes = require('./routes/userRoutes');

app.use('/api/register', registerRoute);
app.use('/api/login', loginRoute);
app.use('/api/user', userRoutes);

// Fallback route
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
});

// Socket.io
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const connectedUsers = new Map();
const onlineUsers = new Set(); // Track online users by their IDs

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // User connects immediately on load - store their socket ID
    socket.on('user-connected', ({ userId, userInfo }) => {
        if (userId) {
            const parsedUserId = parseInt(userId);
            console.log(`User ${parsedUserId} (${userInfo?.username || 'unknown'}) connected with socket ${socket.id}`);
            connectedUsers.set(parsedUserId, socket.id);
            onlineUsers.add(parsedUserId);

            // Broadcast to all clients that this user is now online
            io.emit('user-status-change', { userId: parsedUserId, isOnline: true });

            // Send the current online users to the newly connected client
            socket.emit('online-users', Array.from(onlineUsers));

            // Show all connected users for debugging
            console.log("Connected users:", Array.from(connectedUsers.entries()));

            if (userInfo) {
                socket.userInfo = userInfo;
            }
        }
    });

    socket.on('send-message', async (message) => {
        console.log('Message received:', message);
        io.emit('receive-message', message);

        if (message.senderDbId) {
            connectedUsers.set(parseInt(message.senderDbId), socket.id);
        }
    });

    socket.on('call-user', async ({ to, from, offer }) => {
        // Convert IDs to integers to ensure consistent key types in the Map
        const toId = parseInt(to);
        const fromId = parseInt(from.id);

        console.log(`Call request from: ${fromId} (${from?.username || 'unknown'}) to: ${toId}`);
        console.log("Connected users:", Array.from(connectedUsers.entries()));

        const toSocketId = connectedUsers.get(toId);

        if (!toSocketId) {
            console.log(`Target user ${toId} not connected - socket not found`);
            // Notify caller that recipient is not available
            socket.emit('call-failed', { reason: 'user-not-connected' });
            return;
        }

        console.log(`Found recipient socket: ${toSocketId}`);

        try {
            const [users] = await pool.query(
                'SELECT id, username, email FROM users WHERE id = ? LIMIT 1',
                [fromId]
            );

            if (users.length > 0) {
                console.log(`Sending incoming call to ${toId} from ${users[0].username}`);
                socket.to(toSocketId).emit('incoming-call', {
                    from: users[0],
                    offer
                });
            } else {
                const callerInfo = {
                    id: fromId,
                    username: from.username || `User ${fromId}`,
                    email: from.email || ''
                };
                console.log(`Sending incoming call to ${toId} from ${callerInfo.username}`);
                socket.to(toSocketId).emit('incoming-call', {
                    from: callerInfo,
                    offer
                });
            }
        } catch (err) {
            console.error("DB error:", err);
            const callerInfo = {
                id: fromId,
                username: from.username || `User ${fromId}`,
                email: from.email || ''
            };
            socket.to(toSocketId).emit('incoming-call', {
                from: callerInfo,
                offer
            });
        }
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
        const toSocketId = connectedUsers.get(to);
        if (toSocketId) {
            socket.to(toSocketId).emit('ice-candidate', { candidate });
        }
    });

    socket.on('call-answer', ({ to, answer, accepted }) => {
        const toSocketId = connectedUsers.get(parseInt(to));
        if (toSocketId) {
            if (accepted) {
                console.log(`Call accepted: ${to}`);
                socket.to(toSocketId).emit('call-accepted', { answer });
            } else {
                console.log(`Call rejected: ${to}`);
                socket.to(toSocketId).emit('call-rejected');
            }
        } else {
            console.log(`Cannot send call answer - user ${to} not found`);
        }
    });

    socket.on('call-rejected', ({ to }) => {
        const toSocketId = connectedUsers.get(to);
        if (toSocketId) {
            socket.to(toSocketId).emit('call-rejected');
        }
    });

    socket.on('end-call', ({ to }) => {
        const toSocketId = connectedUsers.get(to);
        if (toSocketId) {
            socket.to(toSocketId).emit('call-ended');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove user from connected users map
        let disconnectedUserId = null;
        for (const [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                disconnectedUserId = userId;
                console.log(`Removing user ${userId} from connected users`);
                connectedUsers.delete(userId);
                onlineUsers.delete(userId);
                break;
            }
        }

        // Notify all clients about user going offline
        if (disconnectedUserId) {
            io.emit('user-status-change', { userId: disconnectedUserId, isOnline: false });
        }

        console.log("Remaining connected users:", Array.from(connectedUsers.entries()));
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
