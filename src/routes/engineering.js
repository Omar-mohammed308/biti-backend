import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const r = express.Router();
const jsonCols = ['prd','design_review','implementation_requirements','code_review',
                  'production_incident','incident_evaluation','evaluation'];

const toDb = (v,k) => jsonCols.includes(k) && v && typeof v==='object' ? JSON.stringify(v) : v;

r.get('/', authenticate, async (req, res) => {
  try {
    const { completed } = req.query;
    const vals=[req.user.id]; let sql='SELECT * FROM engineering_challenges WHERE user_id=$1';
    if (completed!==undefined) { sql+=` AND completed=$${vals.length+1}`; vals.push(completed==='true'); }
    sql+=' ORDER BY created_date DESC';
    const { rows } = await query(sql,vals);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

r.get('/active', authenticate, async (req,res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM engineering_challenges WHERE user_id=$1 AND completed=false ORDER BY created_date DESC LIMIT 1`,
      [req.user.id]
    );
    res.json(rows[0]||null);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

r.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM engineering_challenges WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error:'Not found' });
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

r.post('/', authenticate, async (req, res) => {
  try {
    const { title,level,specialization,prd } = req.body;
    const { rows } = await query(`
      INSERT INTO engineering_challenges(user_id,title,level,specialization,prd,current_phase)
      VALUES($1,$2,$3,$4,$5,1) RETURNING *`,
      [req.user.id,title,level,specialization,JSON.stringify(prd||{})]
    );
    res.status(201).json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

r.patch('/:id', authenticate, async (req, res) => {
  try {
    const allowed=['title','current_phase','prd','design_submission','design_review',
      'design_approved','implementation_requirements','implementation_code','implementation_github',
      'code_review','code_approved','production_incident','incident_response','incident_evaluation',
      'evaluation','final_score','completed'];

    const sets=[]; const vals=[];
    for (const k of allowed) {
      if (k in req.body) { sets.push(`${k}=$${vals.length+1}`); vals.push(toDb(req.body[k],k)); }
    }
    if (!sets.length) return res.status(400).json({ error:'Nothing' });
    sets.push('updated_date=NOW()'); vals.push(req.params.id,req.user.id);
    const { rows } = await query(
      `UPDATE engineering_challenges SET ${sets.join(',')} WHERE id=$${vals.length-1} AND user_id=$${vals.length} RETURNING *`,
      vals
    );
    if (!rows.length) return res.status(404).json({ error:'Not found' });
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

export default r;
