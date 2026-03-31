import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.js';

const r = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve('uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.js','.jsx','.ts','.tsx','.py','.java','.html','.css',
                '.zip','.png','.jpg','.jpeg','.gif','.webp'];
    if (ok.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('File type not allowed'));
  }
});

r.post('/', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const base = process.env.BASE_URL || `http://localhost:${process.env.PORT||3001}`;
  res.json({ file_url: `${base}/uploads/${req.file.filename}` });
});

export default r;
