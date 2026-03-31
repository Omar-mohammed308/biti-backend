import express from 'express';
import './config/migrate.js';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import authRoutes        from './routes/auth.js';
import profileRoutes     from './routes/profile.js';
import taskRoutes        from './routes/tasks.js';
import submissionRoutes  from './routes/submissions.js';
import reviewRoutes      from './routes/reviews.js';
import engineeringRoutes from './routes/engineering.js';
import companyRoutes     from './routes/companies.js';
import badgeRoutes       from './routes/badges.js';
import goalRoutes        from './routes/goals.js';
import interviewRoutes   from './routes/interviews.js';
import uploadRoutes      from './routes/upload.js';
import llmRoutes         from './routes/llm.js';

const app = express();

/* ── Security ──────────────────────────────────────────────────────── */
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowed = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(u => u.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // allow no-origin (curl, Postman) and any listed frontend
    if (!origin || allowed.includes(origin) || process.env.NODE_ENV !== 'production') {
      cb(null, true);
    } else {
      cb(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true
}));

app.use(rateLimit({ windowMs: 15 * 60_000, max: 300 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ── Static uploads ────────────────────────────────────────────────── */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/* ── Health ────────────────────────────────────────────────────────── */
app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date() }));

/* ── Routes ────────────────────────────────────────────────────────── */
app.use('/api/auth',        authRoutes);
app.use('/api/profile',     profileRoutes);
app.use('/api/tasks',       taskRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/reviews',     reviewRoutes);
app.use('/api/engineering', engineeringRoutes);
app.use('/api/companies',   companyRoutes);
app.use('/api/badges',      badgeRoutes);
app.use('/api/goals',       goalRoutes);
app.use('/api/interviews',  interviewRoutes);
app.use('/api/upload',      uploadRoutes);
app.use('/api/llm',         llmRoutes);

/* ── Error handler ─────────────────────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀  Bitora backend on :${PORT}`));
