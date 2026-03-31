import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const r = express.Router();

r.get('/', authenticate, async (req, res) => {
  try {
    const { task_id } = req.query;
    const vals=[req.user.id]; let sql='SELECT * FROM submissions WHERE user_id=$1';
    if (task_id) { sql+=' AND task_id=$2'; vals.push(task_id); }
    sql+=' ORDER BY created_date DESC LIMIT 10';
    const { rows } = await query(sql, vals);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

r.post('/', authenticate, async (req, res) => {
  try {
    const { task_id, code, file_url, notes } = req.body;
    if (!task_id) return res.status(400).json({ error:'task_id required' });

    const chk = await query('SELECT id FROM tasks WHERE id=$1 AND user_id=$2',[task_id,req.user.id]);
    if (!chk.rows.length) return res.status(403).json({ error:'Task not found' });

    const { rows } = await query(
      `INSERT INTO submissions(user_id,task_id,code,file_url,notes) VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id,task_id,code,file_url,notes]
    );
    await query(`UPDATE tasks SET status='submitted',updated_date=NOW() WHERE id=$1`,[task_id]);
    res.status(201).json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

r.patch('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE submissions SET status=$1,updated_date=NOW() WHERE id=$2 AND user_id=$3 RETURNING *`,
      [req.body.status,req.params.id,req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error:'Not found' });
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

export default r;
