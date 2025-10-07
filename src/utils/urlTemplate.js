const { URL } = require('url');

// Helper to fetch object keys case-insensitively
function getCaseInsensitive(obj, key) {
  if (!obj) return undefined;
  const lower = String(key).toLowerCase();
  for (const k of Object.keys(obj)) {
    if (String(k).toLowerCase() === lower) return obj[k];
  }
  return undefined;
}

function badRequest(message, code = 'MISSING_URL_PARAM') {
  const err = new Error(message);
  err.code = code;
  return err;
}

// Build a forward URL by treating the DB value as a full template, replacing any
// :placeholders in both path and query using values from the incoming request.
// Values are sourced from req.query, req.headers, and trailing path segments
// after /api/<apiName>. Any remaining incoming query params are merged through.
function buildForwardUrl(templateUrl, apiName, req) {
  const urlObj = new URL(templateUrl);

  const basePath = `/api/${apiName}`;
  const originalPath = (req.originalUrl || req.url || '').split('?')[0];
  let suffixSegments = [];
  if (originalPath.startsWith(basePath)) {
    const rest = originalPath.slice(basePath.length);
    suffixSegments = rest.split('/').filter(Boolean);
  }

  const values = {};

  // Replace placeholders in path
  const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);
  let segIdx = 0;
  const replacedPathSegments = pathSegments.map(seg => {
    if (seg.startsWith(':')) {
      const name = seg.slice(1);
      let val = getCaseInsensitive(req.query, name);
      if (val === undefined) val = getCaseInsensitive(req.headers, name);
      if (val === undefined && (name.toLowerCase() === 'reqid' || name.toLowerCase() === 'req_id')) {
        val = getCaseInsensitive(req.query, 'reqid') ?? getCaseInsensitive(req.query, 'reqId') ??
              getCaseInsensitive(req.headers, 'reqid') ?? getCaseInsensitive(req.headers, 'reqId');
      }
      if (val === undefined && segIdx < suffixSegments.length) {
        val = suffixSegments[segIdx++];
      }
      if (val === undefined) {
        throw badRequest(`Missing URL parameter: ${name}`, 'MISSING_URL_PARAM');
      }
      values[name] = val;
      return encodeURIComponent(String(val));
    }
    return seg;
  });
  urlObj.pathname = '/' + replacedPathSegments.join('/');

  // Replace placeholders in query; if value missing, drop that param (optional)
  const existingEntries = Array.from(urlObj.searchParams.entries());
  for (const [k, v] of existingEntries) {
    if (typeof v === 'string' && v.startsWith(':')) {
      const name = v.slice(1);
      let val = values[name];
      if (val === undefined) val = getCaseInsensitive(req.query, name) ?? getCaseInsensitive(req.headers, name);
      if (val === undefined && (name.toLowerCase() === 'reqid' || name.toLowerCase() === 'req_id')) {
        val = getCaseInsensitive(req.query, 'reqid') ?? getCaseInsensitive(req.query, 'reqId') ??
              getCaseInsensitive(req.headers, 'reqid') ?? getCaseInsensitive(req.headers, 'reqId');
      }
      if (val === undefined || val === null || val === '') {
        urlObj.searchParams.delete(k);
      } else {
        urlObj.searchParams.set(k, String(val));
      }
    }
  }

  // Merge any remaining incoming query params that weren't specified in the template
  const incomingQuery = req.query || {};
  for (const [k, v] of Object.entries(incomingQuery)) {
    if (!urlObj.searchParams.has(k)) {
      if (Array.isArray(v)) {
        v.forEach(item => {
          if (item != null) urlObj.searchParams.append(k, String(item));
        });
      } else if (v != null && v !== '') {
        urlObj.searchParams.append(k, String(v));
      }
    }
  }

  return urlObj.toString();
}

module.exports = { buildForwardUrl, badRequest, getCaseInsensitive };
