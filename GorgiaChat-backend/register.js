const express = require('express');
const router = express.Router();
const db = require('./config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
    const { username, number, email, password } = req.body;
    if (!username || !number || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    db.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (results.length > 0) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            'INSERT INTO users (username, phone, email, password) VALUES (?, ?, ?, ?)',
            [username, number, email, hashedPassword], // use 'number' for phone
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database error.' });

                // Generate token
                const token = jwt.sign({ id: result.insertId, email }, 'your_jwt_secret', { expiresIn: '1d' });
                res.json({ token });
            }
        );
    });
});

module.exports = router;
const token = jwt.sign({ id: result.insertId, email }, 'your_jwt_secret', { expiresIn: '1d' });
res.json({ token });

module.exports = router;
