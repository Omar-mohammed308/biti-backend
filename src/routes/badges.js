import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const r = express.Router();

r.get('/', authenticate, async (req,res) => {
  try {
    const { rows } = await query('SELECT * FROM badges WHERE user_id=$1 ORDER BY earned_date DESC',[req.user.id]);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

r.post('/', authenticate, async (req,res) => {
  try {
    const { badge_type,badge_name,badge_description,badge_icon,badge_rarity } = req.body;
    const { rows } = await query(`
      INSERT INTO badges(user_id,badge_type,badge_name,badge_description,badge_icon,badge_rarity)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id,badge_type,badge_name,badge_description,badge_icon,badge_rarity]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code==='23505') return res.status(409).json({ error:'Badge already earned' });
    console.error(e); res.status(500).json({ error:'Failed' });
  }
});

export default r;
