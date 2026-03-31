import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';

const r = express.Router();

const llmLimit = rateLimit({ windowMs: 60_000, max: 30,
  message: { error: 'Too many AI requests, please slow down' } });

r.post('/invoke', authenticate, llmLimit, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return res.status(503).json({ error: 'AI not configured' });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'https://bitora.app',
        'X-Title': 'Bitora'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error('OpenRouter error:', txt);
      return res.status(502).json({ error: 'AI request failed' });
    }

    const result = await response.json();
    let content = result.choices[0].message.content;

    // strip markdown fences
    content = content.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    const m = content.match(/\{[\s\S]*\}/);
    if (m) content = m[0];

    try {
      res.json(JSON.parse(content));
    } catch {
      res.json({ raw: content });
    }
  } catch (e) {
    console.error('LLM proxy error:', e);
    res.status(500).json({ error: 'AI request failed' });
  }
});

export default r;
