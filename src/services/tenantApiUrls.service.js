const { sql, getPool } = require('../config/dbConfig');

// Simple in-memory cache with TTL for API URL lookups
const _cache = new Map(); // key -> { url, token, expiresAt }
const CACHE_TTL_MS = Number(process.env.TENANT_API_CACHE_TTL_MS || 60000);
const FORCE_TEMPLATE_URL = process.env.PROXY_FORCE_TEMPLATE_URL || null;
const FORCE_TOKEN = process.env.PROXY_FORCE_TOKEN || null;

function _key(tenantId, apiName, method) {
  return `${String(tenantId)}::${String(apiName)}::${String(method).toUpperCase()}`;
}

function _getFromCache(key) {
  const entry = _cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return { url: entry.url, token: entry.token };
  }
  if (entry) _cache.delete(key);
  return null;
}

function _setCache(key, url, token) {
  _cache.set(key, { url, token, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function getTenantApiUrl(tenantId, apiName, method) {
  // Env override for local testing or emergencies
  if (FORCE_TEMPLATE_URL) {
    return { url: FORCE_TEMPLATE_URL, token: FORCE_TOKEN };
  }

  if (!tenantId) throw new Error('Missing x-tenant-id header');
  if (!apiName) throw new Error('Missing apiName');
  if (!method) throw new Error('Missing method');

  const cacheKey = _key(tenantId, apiName, method);
  const cached = _getFromCache(cacheKey);
  if (cached) return cached;

  const pool = await getPool();
  const request = pool.request();
  request.input('api_name', sql.VarChar(100), apiName);
  request.input('tenant_id', sql.VarChar(50), tenantId);
  request.input('method', sql.VarChar(10), method.toUpperCase());

  const result = await request.query(`
    SELECT TOP 1 api_name, tenant_id, method, api_url, status, token, last_updated_at
    FROM TenantApiUrls
    WHERE api_name = @api_name
      AND tenant_id = @tenant_id
      AND method = @method
    ORDER BY last_updated_at DESC
  `);

  if (!result.recordset || result.recordset.length === 0) {
    const notFound = new Error(`No active API mapping found for api=${apiName}, method=${method}, tenant=${tenantId}`);
    notFound.code = 'API_MAPPING_NOT_FOUND';
    throw notFound;
  }

  const row = result.recordset[0];
  if (!row.api_url) {
    const err = new Error(`API mapping missing url for api=${apiName}, method=${method}, tenant=${tenantId}`);
    err.code = 'API_URL_MISSING';
    throw err;
  }
  const value = { url: row.api_url, token: row.token || null };
  _setCache(cacheKey, value.url, value.token);
  return value;
}

module.exports = { getTenantApiUrl };
