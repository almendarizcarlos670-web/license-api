const { getRedis, SET_KEY } = require('../_redis');
const { parseJsonBody } = require('../_parseBody');

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
  if (redis) {
    try {
      redisIds = await redis.smembers(SET_KEY);
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e.message || e) });
    }
  }

  const envSet = parseEnvRevokedIds();
  const redisSet = new Set((redisIds || []).map(String));

  const allIds = new Set([...redisSet, ...envSet]);
  const items = [...allIds]
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

  res.status(200).json({
    ok: true,
    items,
    counts: {
      total: items.length,
      inRedis: redisSet.size,
      inEnvOnly: [...envSet].filter((id) => !redisSet.has(id)).length,
    },
  });
};
