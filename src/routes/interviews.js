import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const r = express.Router();
const arrCols=['evaluation_criteria','questions','strengths','weaknesses','recommendations'];
const toDb=(v,k)=>arrCols.includes(k)&&Array.isArray(v)?JSON.stringify(v):v;

r.get('/', authenticate, async (req,res) => {
  try {
    const { completed } = req.query;
    const vals=[req.user.id]; let sql='SELECT * FROM interviews WHERE user_id=$1';
    if (completed!==undefined) { sql+=` AND completed=$${vals.length+1}`; vals.push(completed==='true'); }
    sql+=' ORDER BY created_date DESC';
    const { rows } = await query(sql,vals);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

r.post('/', authenticate, async (req,res) => {
  try {
    const { specialization,custom_scenario,custom_role,evaluation_criteria,questions } = req.body;
    const { rows } = await query(`
      INSERT INTO interviews(user_id,specialization,custom_scenario,custom_role,evaluation_criteria,questions)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id,specialization,custom_scenario,custom_role,
       JSON.stringify(evaluation_criteria||[]),JSON.stringify(questions||[])]
    );
    res.status(201).json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

r.patch('/:id', authenticate, async (req,res) => {
  try {
    const allowed=['questions','score','feedback','strengths','weaknesses','recommendations','completed','adaptive_difficulty'];
    const sets=[]; const vals=[];
    for (const k of allowed) if (k in req.body) { sets.push(`${k}=$${vals.length+1}`); vals.push(toDb(req.body[k],k)); }
    if (!sets.length) return res.status(400).json({ error:'Nothing' });
    sets.push('updated_date=NOW()'); vals.push(req.params.id,req.user.id);
    const { rows } = await query(
      `UPDATE interviews SET ${sets.join(',')} WHERE id=$${vals.length-1} AND user_id=$${vals.length} RETURNING *`,vals
    );
    if (!rows.length) return res.status(404).json({ error:'Not found' });
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

export default r;
