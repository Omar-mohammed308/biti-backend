import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const r = express.Router();

const jsonFields = ['selected_skills','strengths','weaknesses','learning_recommendations','skill_gap_analysis'];
const toDb = (v, key) => jsonFields.includes(key) && typeof v === 'object' ? JSON.stringify(v) : v;

/* GET /api/profile */
r.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM user_profiles WHERE user_id=$1', [req.user.id]);
    res.json(rows[0] ?? null);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

/* GET /api/profile/all  (leaderboard) */
r.get('/all', authenticate, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT up.*, u.full_name, u.email
      FROM user_profiles up JOIN users u ON u.id = up.user_id
      ORDER BY up.total_score DESC LIMIT 200
    `);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

/* POST /api/profile */
r.post('/', authenticate, async (req, res) => {
  try {
    const chk = await query('SELECT id FROM user_profiles WHERE user_id=$1', [req.user.id]);
    if (chk.rows.length) return res.status(409).json({ error: 'Profile exists' });

    const { specialization,selected_skills,dream_company,age,location,
            willing_to_relocate,skill_level,profile_image } = req.body;

    const { rows } = await query(`
      INSERT INTO user_profiles
        (user_id,specialization,selected_skills,dream_company,age,location,
         willing_to_relocate,skill_level,profile_image,interview_completed)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,true) RETURNING *`,
      [req.user.id,specialization,JSON.stringify(selected_skills||{}),
       dream_company,age,location,willing_to_relocate||false,skill_level||'beginner',profile_image]
    );
    res.status(201).json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

/* PATCH /api/profile */
r.patch('/', authenticate, async (req, res) => {
  try {
    const allowed = ['specialization','selected_skills','dream_company','age','location',
      'willing_to_relocate','skill_level','total_score','bitora_experience','bitora_days',
      'tasks_completed','interview_completed','strengths','weaknesses','current_streak',
      'last_activity_date','performance_rating','missed_deadlines','profile_image',
      'learning_recommendations','skill_gap_analysis'];

    const sets=[]; const vals=[];
    for (const k of allowed) {
      if (k in req.body) { sets.push(`${k}=$${vals.length+1}`); vals.push(toDb(req.body[k],k)); }
    }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    sets.push(`updated_date=NOW()`);
    vals.push(req.user.id);

    const { rows } = await query(
      `UPDATE user_profiles SET ${sets.join(',')} WHERE user_id=$${vals.length} RETURNING *`, vals
    );
    if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

export default r;
