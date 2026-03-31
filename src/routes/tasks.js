import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const r = express.Router();

r.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const vals = [req.user.id];
    let sql = 'SELECT * FROM tasks WHERE user_id=$1';
    if (status) { sql += ' AND status=$2'; vals.push(status); }
    sql += ' ORDER BY created_date DESC';
    const { rows } = await query(sql, vals);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

r.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM tasks WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

r.post('/', authenticate, async (req, res) => {
  try {
    const { title,description,requirements,acceptance_criteria,difficulty,specialization,deadline,duration_days } = req.body;
    const { rows } = await query(`
      INSERT INTO tasks(user_id,title,description,requirements,acceptance_criteria,difficulty,specialization,deadline,duration_days)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id,title,description,JSON.stringify(requirements||[]),JSON.stringify(acceptance_criteria||[]),
       difficulty,specialization,deadline,duration_days||4]
    );
    res.status(201).json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

r.patch('/:id', authenticate, async (req, res) => {
  try {
    const allowed = ['status','penalty_applied','title','description'];
    const sets=[]; const vals=[];
    for (const k of allowed) if (k in req.body) { sets.push(`${k}=$${vals.length+1}`); vals.push(req.body[k]); }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    sets.push('updated_date=NOW()'); vals.push(req.params.id,req.user.id);
    const { rows } = await query(
      `UPDATE tasks SET ${sets.join(',')} WHERE id=$${vals.length-1} AND user_id=$${vals.length} RETURNING *`, vals
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

export default r;
