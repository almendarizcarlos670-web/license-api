const { getRedis, SET_KEY, RECORDS_HASH_KEY } = require('../_redis');
const { parseJsonBody } = require('../_parseBody');
const { parseRecordMeta } = require('../_recordParse');

/**
 * Borra el registro completo en Redis:
 * - quita el licenseId del set de revocados (si estaba)
 * - elimina los metadatos (HWID, nombre, etc.) del hash de registros
 *
 * Opcional: `hwid` — si se envía, solo borra si coincide con el guardado (evita borrar por error).
 */
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
  const hwidCheck = String(body.hwid || '').trim();

  if (secret !== adminSecret) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  if (!licenseId || licenseId.length < 8) {
    res.status(400).json({ ok: false, error: 'licenseId' });
    return;
  }

  const redis = getRedis();
  if (!redis) {
    res.status(503).json({ ok: false, error: 'Redis no configurado' });
    return;
  }

  try {
    const raw = await redis.hget(RECORDS_HASH_KEY, licenseId);
    if (hwidCheck && raw) {
      const parsed = parseRecordMeta(raw);
      const stored =
        parsed && typeof parsed.hwid === 'string' ? parsed.hwid.trim() : '';
      if (stored && stored !== hwidCheck) {
        res.status(400).json({
          ok: false,
          error: 'El ID de equipo no coincide con el registro guardado.',
          hint: 'Deja el campo HWID vacío para borrar sin comprobar, o pega el ID exacto.',
        });
        return;
      }
    }

    const removedRevoke = await redis.srem(SET_KEY, licenseId);
    const removedRecord = await redis.hdel(RECORDS_HASH_KEY, licenseId);

    res.status(200).json({
      ok: true,
      licenseId,
      action: 'delete-record',
      removedFromRevoked: removedRevoke > 0,
      removedRecordFields: removedRecord > 0,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};
