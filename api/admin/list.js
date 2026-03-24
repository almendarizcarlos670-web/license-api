const { getRedis, SET_KEY, RECORDS_HASH_KEY } = require('../_redis');
const { parseJsonBody } = require('../_parseBody');
const { loadRecordsHashFromRedis, parseRecordMeta } = require('../_recordParse');

function parseEnvRevokedIds() {
  const raw = process.env.REVOKED_LICENSE_IDS || '';
  return new Set(
    raw
      .split(/[,;\s\n\r]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
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

  if (secret !== adminSecret) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  const redis = getRedis();
  let redisIds = [];
  /** @type {Record<string, string>} */
  let recordsRaw = {};
  if (redis) {
    try {
      redisIds = await redis.smembers(SET_KEY);
      recordsRaw = await loadRecordsHashFromRedis(redis, RECORDS_HASH_KEY);
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e.message || e) });
    }
  }

  const envSet = parseEnvRevokedIds();
  const redisSet = new Set((redisIds || []).map(String));

  const recordIds = Object.keys(recordsRaw || {});
  const recordEntries = recordIds.map((licenseId) => {
    const meta = parseRecordMeta(recordsRaw[licenseId]);
    return {
      licenseId,
      hwid: typeof meta.hwid === 'string' ? meta.hwid : '',
      clienteNombre: typeof meta.clienteNombre === 'string' ? meta.clienteNombre : '',
      clienteCedula: typeof meta.clienteCedula === 'string' ? meta.clienteCedula : '',
      note: typeof meta.note === 'string' ? meta.note : '',
      updatedAt: typeof meta.updatedAt === 'string' ? meta.updatedAt : '',
      revoked: redisSet.has(licenseId) || envSet.has(licenseId),
    };
  });

  const allRevokedIds = new Set([...redisSet, ...envSet]);
  const items = [...allRevokedIds]
    .sort()
    .map((licenseId) => {
      const inR = redisSet.has(licenseId);
      const inE = envSet.has(licenseId);
      let source = '';
      if (inR && inE) source = 'Redis + Vercel (env)';
      else if (inR) source = 'Redis';
      else source = 'Vercel (env)';

      return {
        licenseId,
        status: 'revoked',
        source,
      };
    });

  recordEntries.sort((a, b) => String(a.licenseId).localeCompare(String(b.licenseId)));

  res.status(200).json({
    ok: true,
    items,
    records: recordEntries,
    counts: {
      total: items.length,
      inRedis: redisSet.size,
      inEnvOnly: [...envSet].filter((id) => !redisSet.has(id)).length,
      records: recordEntries.length,
    },
  });
};
