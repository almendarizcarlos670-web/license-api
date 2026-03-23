/**
 * Upstash Redis puede devolver HGETALL como:
 * - objeto { [licenseId]: valor }
 * - array plano [ field, value, field, value, ... ]
 * Los valores a veces vienen como string JSON y otras ya deserializados como objeto.
 */

function normalizeHgetallResult(raw) {
  if (raw == null) return {};
  if (Array.isArray(raw)) {
    const o = {};
    for (let i = 0; i < raw.length; i += 2) {
      const k = raw[i];
      const v = raw[i + 1];
      if (k != null && k !== '') o[String(k)] = v;
    }
    return o;
  }
  if (typeof raw === 'object') return raw;
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

module.exports = { normalizeHgetallResult, parseRecordMeta };
