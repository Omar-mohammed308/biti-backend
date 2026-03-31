import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const r = express.Router();

const sign = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

/* POST /api/auth/register */
r.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password || !full_name)
      return res.status(400).json({ error: 'email, password, full_name required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password min 6 chars' });

    const exists = await query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO users (email,password_hash,full_name) VALUES($1,$2,$3)
       RETURNING id,email,full_name,role,created_date`,
      [email.toLowerCase(), hash, full_name]
    );
    res.status(201).json({ user: rows[0], token: sign(rows[0]) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Registration failed' }); }
});

/* POST /api/auth/login */
r.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const { rows } = await query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    if (!await bcrypt.compare(password, user.password_hash))
      return res.status(401).json({ error: 'Invalid credentials' });

    const { password_hash, ...safe } = user;
    res.json({ user: safe, token: sign(user) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Login failed' }); }
});

/* GET /api/auth/me */
r.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id,email,full_name,role,created_date FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

export default r;
