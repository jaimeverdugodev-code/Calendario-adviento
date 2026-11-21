const OPENAI_API_BASE = (process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function extractJSON(text) {
  if (!text) return null;
  const match = String(text).match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    try {
      const fixed = match[0]
        .replace(/'([^']+?)'\s*:/g, '"$1":')
        .replace(/:\s*'([^']*?)'/g, (m, g1) => ': "' + g1.replace(/"/g, '\\"') + '"');
      return JSON.parse(fixed);
    } catch (e2) {
      return null;
    }
  }
}

function normalize(result) {
  let respuesta = typeof result.respuesta === 'string' ? result.respuesta : 'Mmm... no me convence. Ponme una razón mejor.';
  let puntos = Number(result.puntos_ganados);
  if (!Number.isFinite(puntos)) puntos = 3;
  puntos = Math.max(-5, Math.min(15, Math.round(puntos)));
  const humorOk = ['grunon', 'dudoso', 'conmovido', 'rendido'];
  const humor = humorOk.includes(result.humor) ? result.humor : 'dudoso';
  return { respuesta, puntos_ganados: puntos, humor };
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not configured' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'messages required' });
  }

  // Limitar tamaño/historial para evitar abuso accidental
  const safeMessages = messages.slice(-20).map((m) => ({
    role: m && m.role === 'assistant' ? 'assistant' : (m && m.role === 'system' ? 'system' : 'user'),
    content: String(m && m.content ? m.content : '').slice(0, 1500)
  })).filter((m) => m.content);

  try {
    const upstream = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: safeMessages,
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.9
      })
    });

    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = null; }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: 'OpenAI request failed',
        detail: data && data.error ? data.error.message || data.error : text.slice(0, 300)
      });
    }

    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    const json = extractJSON(content);
    if (!json || typeof json.respuesta !== 'string') {
      return res.status(502).json({ error: 'Invalid model response', raw: String(content || '').slice(0, 500) });
    }

    return res.status(200).json(normalize(json));
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error', detail: String(err && err.message ? err.message : err) });
  }
}
