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

const SET_KEY = 'revoked:licenseIds';

module.exports = { getRedis, SET_KEY };
