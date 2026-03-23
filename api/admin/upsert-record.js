const { getRedis, RECORDS_HASH_KEY } = require('../_redis');
const { parseJsonBody } = require('../_parseBody');

function sanitize(s, max = 500) {
  return String(s ?? '')
    .trim()
    .slice(0, max);
}

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
  const licenseId = String(body.licenseId || '').trim();
  const hwid = sanitize(body.hwid, 128);

  if (secret !== adminSecret) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  if (!licenseId || licenseId.length < 8) {
    res.status(400).json({ ok: false, error: 'licenseId inválido' });
    return;
  }

  if (!hwid) {
    res.status(400).json({ ok: false, error: 'hwid (ID de equipo) requerido' });
    return;
  }

  const redis = getRedis();
  if (!redis) {
    res.status(503).json({ ok: false, error: 'Redis no configurado' });
    return;
  }

  const record = {
    hwid,
    clienteNombre: sanitize(body.clienteNombre, 240),
    clienteCedula: sanitize(body.clienteCedula, 80),
    note: sanitize(body.note, 500),
    updatedAt: new Date().toISOString(),
  };

  try {
    await redis.hset(RECORDS_HASH_KEY, licenseId, JSON.stringify(record));
    res.status(200).json({ ok: true, licenseId, action: 'upsert-record', record });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};
