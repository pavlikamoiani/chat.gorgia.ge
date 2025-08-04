const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../config/db');

router.post('/', async (req, res) => {
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
            process.env.JWT_SECRET || 'fallback_secret_key',
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

module.exports = router;
