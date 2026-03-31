import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const r = express.Router();

r.get('/', authenticate, async (req, res) => {
  try {
    const { submission_id, task_id } = req.query;
    const vals=[req.user.id]; let sql='SELECT * FROM reviews WHERE user_id=$1';
    if (submission_id) { sql+=` AND submission_id=$${vals.length+1}`; vals.push(submission_id); }
    if (task_id)       { sql+=` AND task_id=$${vals.length+1}`;       vals.push(task_id); }
    sql+=' ORDER BY created_date DESC';
    const { rows } = await query(sql,vals);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

/* all reviews – leaderboard */
r.get('/all', authenticate, async (req,res) => {
  try {
    const { rows } = await query('SELECT * FROM reviews ORDER BY created_date DESC');
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

r.post('/', authenticate, async (req, res) => {
  try {
    const { submission_id,task_id,score,feedback,code_quality,architecture,
            best_practices,performance,strengths,weaknesses,passed,suggestions } = req.body;
    const { rows } = await query(`
      INSERT INTO reviews(submission_id,task_id,user_id,score,feedback,code_quality,
        architecture,best_practices,performance,strengths,weaknesses,passed,suggestions)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [submission_id,task_id,req.user.id,score,feedback,code_quality,architecture,
       best_practices,performance,JSON.stringify(strengths||[]),JSON.stringify(weaknesses||[]),
       passed,JSON.stringify(suggestions||[])]
    );
    if (submission_id) await query(`UPDATE submissions SET status='reviewed',updated_date=NOW() WHERE id=$1`,[submission_id]);
    res.status(201).json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

export default r;
