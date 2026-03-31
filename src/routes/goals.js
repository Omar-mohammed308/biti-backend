import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const r = express.Router();

r.get('/', authenticate, async (req,res) => {
  try {
    const { completed, goal_type } = req.query;
    const vals=[req.user.id]; let sql='SELECT * FROM goals WHERE user_id=$1';
    if (completed!==undefined) { sql+=` AND completed=$${vals.length+1}`; vals.push(completed==='true'); }
    if (goal_type) { sql+=` AND goal_type=$${vals.length+1}`; vals.push(goal_type); }
    sql+=' ORDER BY created_date DESC';
    const { rows } = await query(sql,vals);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

r.post('/', authenticate, async (req,res) => {
  try {
    const { goal_type,title,description,target_value,deadline,reward_points } = req.body;
    const { rows } = await query(`
      INSERT INTO goals(user_id,goal_type,title,description,target_value,deadline,reward_points)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id,goal_type,title,description,target_value,deadline||null,reward_points||0]
    );
    res.status(201).json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

r.patch('/:id', authenticate, async (req,res) => {
  try {
    const { current_value,completed,completed_date } = req.body;
    const { rows } = await query(`
      UPDATE goals SET
        current_value=COALESCE($1,current_value),
        completed=COALESCE($2,completed),
        completed_date=COALESCE($3,completed_date),
        updated_date=NOW()
      WHERE id=$4 AND user_id=$5 RETURNING *`,
      [current_value,completed,completed_date,req.params.id,req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error:'Not found' });
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

export default r;
