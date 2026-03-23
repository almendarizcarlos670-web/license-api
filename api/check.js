/**
 * GET /api/check?product=ventas-express-ingresos-v1&licenseId=<uuid>
 *
 * Lista de revocadas: variable de entorno REVOKED_LICENSE_IDS (UUIDs separados por coma o espacio).
 * Opcional: LICENSE_API_KEY — si está definida, el cliente debe enviar el mismo valor en ?key= o header x-license-key
 */
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-license-key');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }

  const product = String(req.query.product || '').trim();
  const licenseId = String(req.query.licenseId || '').trim();
  const expectedProduct = 'ventas-express-ingresos-v1';

  if (product !== expectedProduct) {
    res.status(400).json({ ok: false, error: 'product' });
    return;
  }

  if (!licenseId || licenseId.length < 8) {
    res.status(400).json({ ok: false, error: 'licenseId' });
    return;
  }

  const serverKey = process.env.LICENSE_API_KEY || '';
  if (serverKey) {
    const qKey = String(req.query.key || '').trim();
    const hKey = String(req.headers['x-license-key'] || '').trim();
    if (qKey !== serverKey && hKey !== serverKey) {
      res.status(401).json({ ok: false, error: 'unauthorized' });
      return;
    }
  }

  const raw = process.env.REVOKED_LICENSE_IDS || '';
  const revoked = new Set(
    raw
      .split(/[,;\s\n\r]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const isRevoked = revoked.has(licenseId);

  res.status(200).json({
    ok: true,
    revoked: isRevoked,
    product: expectedProduct,
  });
};
