const { getRedis } = require('../_redis');
const { parseJsonBody } = require('../_parseBody');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }

  const adminSecret = process.env.ADMIN_SECRET || '';
  if (!adminSecret) {
    res.status(503).json({ ok: false, error: 'ADMIN_SECRET no configurado' });
    return;
  }

  const body = await parseJsonBody(req);
  const secret = String(body.secret || '').trim();

  if (secret !== adminSecret) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  const redis = getRedis();
  if (!redis) {
    res.status(503).json({ ok: false, error: 'Redis no configurado' });
    return;
  }

  try {
    const ids = await redis.smembers(SET_KEY);
    res.status(200).json({ ok: true, ids: ids || [] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};
