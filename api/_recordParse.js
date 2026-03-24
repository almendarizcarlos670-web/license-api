/**
 * Upstash / Redis REST puede devolver HGETALL como:
 * - objeto { [licenseId]: valor }
 * - array plano [ field, value, field, value, ... ]
 * - objeto con claves SOLO numéricas ("0","1","2"...) = el array anterior serializado mal
 *
 * Los valores a veces son string JSON y otras ya objeto (Upstash hace JSON.parse).
 */

function flatPairsToObject(arr) {
  if (!Array.isArray(arr)) return {};
  const o = {};
  for (let i = 0; i < arr.length; i += 2) {
    const k = arr[i];
    const v = arr[i + 1];
    if (k != null && k !== '') o[String(k)] = v;
  }
  return o;
}

/**
 * @param {unknown} raw
 * @returns {Record<string, unknown>}
 */
function normalizeHgetallResult(raw) {
  if (raw == null) return {};
  if (Array.isArray(raw)) {
    return flatPairsToObject(raw);
  }
  if (typeof raw === 'object' && raw !== null) {
    const keys = Object.keys(raw);
    if (keys.length === 0) return {};

    const allNumeric =
      keys.length > 0 && keys.every((k) => /^\d+$/.test(String(k)));
    if (allNumeric) {
      const sorted = [...keys].sort((a, b) => Number(a) - Number(b));
      const arr = sorted.map((k) => raw[k]);
      return flatPairsToObject(arr);
    }
    return /** @type {Record<string, unknown>} */ (raw);
  }
  return {};
}

function parseRecordMeta(val) {
  if (val == null) return {};
  if (typeof val === 'object' && !Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Lee el hash con HKEYS + HGET por campo.
 * Upstash REST deserializa mal HGETALL (claves 0,1,2… y valores vacíos); así evitamos ese bug.
 *
 * @param {*} redis
 * @param {string} hashKey
 * @returns {Promise<Record<string, unknown>>}
 */
async function loadRecordsHashFromRedis(redis, hashKey) {
  let keys = await redis.hkeys(hashKey);
  if (keys == null) return {};
  if (!Array.isArray(keys)) {
    keys = Object.values(keys);
  }
  if (keys.length === 0) return {};

  const entries = await Promise.all(
    keys.map(async (licenseId) => {
      const k = String(licenseId).trim();
      if (!k) return null;
      const raw = await redis.hget(hashKey, k);
      return [k, raw];
    }),
  );

  /** @type {Record<string, unknown>} */
  const out = {};
  for (const pair of entries) {
    if (!pair) continue;
    const [k, raw] = pair;
    out[k] = raw;
  }
  return out;
}

module.exports = {
  normalizeHgetallResult,
  parseRecordMeta,
  flatPairsToObject,
  loadRecordsHashFromRedis,
};
