/**
 * Redis opcional (Upstash). Si no hay variables, getRedis() devuelve null.
 */
function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  try {
    const { Redis } = require('@upstash/redis');
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (_e) {
    return null;
  }
}

/** Set de UUID revocados (solo IDs). */
const SET_KEY = 'revoked:licenseIds';

/**
 * Hash: licenseId → JSON { hwid, clienteNombre?, clienteCedula?, note?, updatedAt }
 * Permite listar y borrar el registro completo (incl. ID de equipo del cliente).
 */
const RECORDS_HASH_KEY = 'license:records';

module.exports = { getRedis, SET_KEY, RECORDS_HASH_KEY };
