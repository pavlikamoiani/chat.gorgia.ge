const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    const { username, phone, email, password } = req.body;

    db.query(
        'SELECT * FROM users WHERE email = ? OR phone = ?',
        [email, phone],
        async (err, results) => {
            if (err) {
                return res.status(500).json({ message: "error registration" })
            }
        }
    )
}