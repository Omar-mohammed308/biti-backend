import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const r = express.Router();
const arrCols = ['architectural_decisions','past_incidents','ignored_warnings'];
const toDb = (v,k) => arrCols.includes(k) && Array.isArray(v) ? JSON.stringify(v) : v;

r.get('/', authenticate, async (req,res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM company_states WHERE user_id=$1 ORDER BY created_date DESC',[req.user.id]
    );
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

r.post('/', authenticate, async (req,res) => {
  try {
    const f = req.body;
    const { rows } = await query(`
      INSERT INTO company_states
        (user_id,company_name,company_product,company_scale,domain,career_level,
         challenges_completed,reputation_score,reliability_score,velocity_score,
         security_risk_score,operational_maturity,technical_debt_level,
         architectural_decisions,past_incidents,ignored_warnings,company_memory)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [req.user.id,f.company_name,f.company_product,f.company_scale,f.domain,f.career_level,
       f.challenges_completed||0,f.reputation_score??85,f.reliability_score??80,f.velocity_score??75,
       f.security_risk_score??20,f.operational_maturity??50,f.technical_debt_level??25,
       JSON.stringify(f.architectural_decisions||[]),JSON.stringify(f.past_incidents||[]),
       JSON.stringify(f.ignored_warnings||[]),f.company_memory]
    );
    res.status(201).json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

r.patch('/:id', authenticate, async (req,res) => {
  try {
    const allowed=['company_name','company_product','company_scale','domain','career_level',
      'challenges_completed','reputation_score','reliability_score','velocity_score',
      'security_risk_score','operational_maturity','technical_debt_level',
      'architectural_decisions','past_incidents','ignored_warnings','company_memory'];
    const sets=[]; const vals=[];
    for (const k of allowed) if (k in req.body) { sets.push(`${k}=$${vals.length+1}`); vals.push(toDb(req.body[k],k)); }
    if (!sets.length) return res.status(400).json({ error:'Nothing' });
    sets.push('updated_date=NOW()'); vals.push(req.params.id,req.user.id);
    const { rows } = await query(
      `UPDATE company_states SET ${sets.join(',')} WHERE id=$${vals.length-1} AND user_id=$${vals.length} RETURNING *`,vals
    );
    if (!rows.length) return res.status(404).json({ error:'Not found' });
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

r.delete('/:id', authenticate, async (req,res) => {
  try {
    await query('DELETE FROM company_states WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);
    res.json({ ok:true });
  } catch (e) { console.error(e); res.status(500).json({ error:'Failed' }); }
});

export default r;
