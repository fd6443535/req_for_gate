const SENSITIVE_HEADER_KEYS = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-tenant-id',
  'user-id',
]);

function sanitizeHeaders(headers) {
  if (!headers) return null;
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    const key = String(k).toLowerCase();
    if (SENSITIVE_HEADER_KEYS.has(key)) continue;
    out[k] = v;
  }
  return out;
}

function truncate(str, max = 100000) {
  if (str == null) return null;
  const s = String(str);
  if (s.length <= max) return s;
  return s.slice(0, max) + `... [truncated ${s.length - max} chars]`;
}

function safeStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    try {
      // Fallback shallow copy removing circulars
      const simple = {};
      for (const [k, v] of Object.entries(obj || {})) {
        if (typeof v === 'object') {
          simple[k] = '[object]';
        } else {
          simple[k] = v;
        }
      }
      return JSON.stringify(simple);
    } catch (_) {
      return String(obj);
    }
  }
}

function isTextLikeContentType(ct) {
  if (!ct) return false;
  const v = String(ct).toLowerCase();
  return (
    v.includes('application/json') ||
    v.includes('application/xml') ||
    v.includes('text/') ||
    v.includes('application/x-www-form-urlencoded')
  );
}

module.exports = { sanitizeHeaders, truncate, safeStringify, isTextLikeContentType };
