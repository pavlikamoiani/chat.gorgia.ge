console.log("userRoutes.js loaded");

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'storage', 'images');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Только изображения разрешены!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/register', async (req, res) => {
    try {
        const { username, number, email, password } = req.body;

        if (!username || !number || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ? OR phone_number = ?',
            [username, email, number]
        );

        if (existingUsers.length > 0) {
            if (existingUsers.find(user => user.username === username)) {
                return res.status(409).json({ error: 'Username already exists' });
            }
            if (existingUsers.find(user => user.email === email)) {
                return res.status(409).json({ error: 'Email already exists' });
            }
            if (existingUsers.find(user => user.phone_number === number)) {
                return res.status(409).json({ error: 'Phone number already exists' });
            }
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const [result] = await pool.query(
            'INSERT INTO users (username, phone_number, email, password) VALUES (?, ?, ?, ?)',
            [username, number, email, hashedPassword]
        );

        const token = jwt.sign(
            { id: result.insertId, username, email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: result.insertId,
                username,
                email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

router.get('/search-user', async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
        return res.status(400).json({ error: 'Query is required' });
    }
    try {
        const [users] = await pool.query(
            'SELECT id, username, email FROM users WHERE username LIKE ? OR email LIKE ? LIMIT 10',
            [`%${q}%`, `%${q}%`]
        );
        res.json({ users });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Server error during search' });
    }
});

// Роут для загрузки изображений
router.post('/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        const imageUrl = `/images/${req.file.filename}`;
        res.json({ imageUrl });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Ошибка при загрузке файла' });
    }
});

router.post('/messages/send', async (req, res) => {
    const { senderId, receiverId, text, time, parentMessageId, forwarded, imageUrl } = req.body;

    if (!senderId || !receiverId || (!text && !imageUrl) || !time) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    try {
        await pool.query(
            'INSERT INTO messages (sender_id, receiver_id, text, time, parent_message_id, forwarded, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [senderId, receiverId, text, time, parentMessageId || null, forwarded ? 1 : 0, imageUrl || null]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Server error during message send' });
    }
});

// Обновление роута получения сообщений для включения URL изображений
router.get('/messages/:userId/:otherUserId', async (req, res) => {
    const { userId, otherUserId } = req.params;
    try {
        const [messages] = await pool.query(
            `SELECT * FROM messages
             WHERE (sender_id = ? AND receiver_id = ?)
                OR (sender_id = ? AND receiver_id = ?)
             ORDER BY time ASC`,
            [userId, otherUserId, otherUserId, userId]
        );
        res.json({ messages });
    } catch (error) {
        console.error('Fetch messages error:', error);
        res.status(500).json({ error: 'Server error during fetch messages' });
    }
});

router.get('/chat-contacts/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const [contacts] = await pool.query(
            `SELECT DISTINCT u.id, u.username, u.email, 
                (SELECT m.text FROM messages m 
                 WHERE ((m.sender_id = ? AND m.receiver_id = u.id) OR 
                        (m.sender_id = u.id AND m.receiver_id = ?)) 
                 ORDER BY m.time DESC LIMIT 1) as last_message,
                (SELECT m.time FROM messages m 
                 WHERE ((m.sender_id = ? AND m.receiver_id = u.id) OR 
                        (m.sender_id = u.id AND m.receiver_id = ?)) 
                 ORDER BY m.time DESC LIMIT 1) as last_message_time
             FROM users u
             INNER JOIN messages m 
             ON (m.sender_id = ? AND m.receiver_id = u.id) OR 
                (m.sender_id = u.id AND m.receiver_id = ?)
             WHERE u.id <> ?
             ORDER BY last_message_time DESC`,
            [userId, userId, userId, userId, userId, userId, userId]
        );

        res.json({
            contacts: contacts.map(contact => ({
                id: contact.id,
                name: contact.username,
                email: contact.email,
                lastMessage: contact.last_message,
                lastMessageTime: contact.last_message_time
            }))
        });
    } catch (error) {
        console.error('Fetch chat contacts error:', error);
        res.status(500).json({ error: 'Server error while fetching chat contacts' });
    }
});

// Create a group
router.post('/group/create', async (req, res) => {
    const { name, userIds, creatorId } = req.body;
    if (!name || !userIds || !Array.isArray(userIds) || !creatorId) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO groups (name, creator_id) VALUES (?, ?)',
            [name, creatorId]
        );
        const groupId = result.insertId;
        // Add creator and members
        const memberIds = Array.from(new Set([creatorId, ...userIds]));
        await Promise.all(memberIds.map(uid =>
            pool.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, uid])
        ));
        res.json({ success: true, groupId });
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ error: 'Server error during group creation' });
    }
});

// List groups for a user
router.get('/group/list', async (req, res) => {
    const userId = req.query.userId || req.headers['x-user-id'];
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    try {
        const [groups] = await pool.query(
            `SELECT g.id, g.name, g.creator_id, g.created_at
             FROM groups g
             JOIN group_members gm ON gm.group_id = g.id
             WHERE gm.user_id = ?`,
            [userId]
        );
        res.json({
            groups: groups.map(g => ({
                id: g.id,
                name: g.name,
                creatorId: g.creator_id,
                createdAt: g.created_at
            }))
        });
    } catch (error) {
        console.error('List groups error:', error);
        res.status(500).json({ error: 'Server error during group list' });
    }
});

// Send group message
router.post('/group/send-message', async (req, res) => {
    const { groupId, senderId, text, time, parentMessageId, forwarded, imageUrl } = req.body;
    if (!groupId || !senderId || (!text && !imageUrl) || !time) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    try {
        await pool.query(
            'INSERT INTO group_messages (group_id, sender_id, text, time, parent_message_id, forwarded, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [groupId, senderId, text, time, parentMessageId || null, forwarded ? 1 : 0, imageUrl || null]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Send group message error:', error);
        res.status(500).json({ error: 'Server error during group message send' });
    }
});

// Get group messages
router.get('/group/messages/:groupId', async (req, res) => {
    const { groupId } = req.params;
    try {
        const [messages] = await pool.query(
            `SELECT * FROM group_messages WHERE group_id = ? ORDER BY time ASC`,
            [groupId]
        );
        res.json({ messages });
    } catch (error) {
        console.error('Fetch group messages error:', error);
        res.status(500).json({ error: 'Server error during fetch group messages' });
    }
});

module.exports = router;
