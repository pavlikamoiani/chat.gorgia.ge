const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

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

// Database
const pool = require('./config/db');

// Routes
const registerRoute = require('./routes/register');
const loginRoute = require('./routes/login');
const userRoutes = require('./routes/userRoutes');

app.use('/api/register', registerRoute);
app.use('/api/login', loginRoute);
app.use('/api/user', userRoutes);

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
});


const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('send-message', async (message) => {
        console.log('Message received:', message);
        io.emit('receive-message', message);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
