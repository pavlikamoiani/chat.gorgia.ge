const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

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

router.post('/messages/send', async (req, res) => {
    const { senderId, receiverId, text, time, parentMessageId, forwarded } = req.body;
    if (!senderId || !receiverId || !text || !time) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    try {
        await pool.query(
            'INSERT INTO messages (sender_id, receiver_id, text, time, parent_message_id, forwarded) VALUES (?, ?, ?, ?, ?, ?)',
            [senderId, receiverId, text, time, parentMessageId || null, forwarded ? 1 : 0]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Server error during message send' });
    }
});

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

module.exports = router;
