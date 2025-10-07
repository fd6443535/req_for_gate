const { getTenantApiUrl } = require('../services/tenantApiUrls.service');
const { buildForwardUrl } = require('../utils/urlTemplate');
const { forward } = require('../utils/proxyClient');
const { sanitizeHeaders, truncate, safeStringify, isTextLikeContentType } = require('../utils/sanitize');
const { randomUUID } = require('crypto');
const { insertApiLog } = require('../services/apiLogs.service');

const MAX_LOG_BYTES = Number(process.env.PROXY_LOG_MAX_BYTES || 200000);

function createHandler(apiName, expectedMethod) {
  return async function proxyHandler(req, res) {
    try {
      // Allow CORS preflight
      if ((req.method || '').toUpperCase() === 'OPTIONS') {
        return res.status(204).end();
      }
      // Permit HEAD on GET endpoints
      const method = (req.method || '').toUpperCase();
      const expected = (expectedMethod || '').toUpperCase();
      const headOk = method === 'HEAD' && expected === 'GET';
      if (!(method === expected || headOk)) {
        return res
          .status(405)
          .json({ error: `Method ${req.method} not allowed for ${apiName}. Expected ${expectedMethod}.` });
      }

      const tenantId = req.headers['x-tenant-id'];
      const userId = req.headers['user-id'] || null;
      if (!tenantId) {
        return res.status(400).json({ error: 'Missing x-tenant-id header' });
      }

      // Lookup target URL + token
      const { url: templateUrl, token } = await getTenantApiUrl(tenantId, apiName, expectedMethod);

      // Build final URL from template by replacing placeholders with incoming values
      const forwardUrl = buildForwardUrl(templateUrl, apiName, req);

      // Prepare request logging context
      const ct = (req.headers['content-type'] || '').toLowerCase();
      const request_headers = truncate(safeStringify(sanitizeHeaders(req.headers)));
      const request_query = truncate(safeStringify(req.query || {}));
      let request_body = null;
      let request_files = null;
      if (isTextLikeContentType(ct) && req.body && Object.keys(req.body).length > 0) {
        request_body = truncate(safeStringify(req.body), MAX_LOG_BYTES);
      } else if (ct.includes('multipart/form-data')) {
        request_files = truncate(safeStringify({ multipart: true, contentType: ct, length: req.headers['content-length'] || null }));
      }

      // Attach context for downstream logging in proxy client
      const request_id = randomUUID();
      req._tenantId = tenantId;
      req._userId = userId;
      req._proxyCtx = {
        request_id,
        tenant_id: tenantId,
        user_id: userId,
        api_name: apiName,
        method,
        request_url: forwardUrl,
        request_headers,
        request_query,
        request_body,
        request_files,
        startTime: Date.now(),
      };

      // Forward request
      forward(req, res, forwardUrl, token);
    } catch (err) {
      // Determine status code
      let status = 500;
      if (err && (err.code === 'API_MAPPING_NOT_FOUND' || err.code === 'API_URL_MISSING')) status = 404;
      else if (err && err.code === 'MISSING_URL_PARAM') status = 400;

      try {
        // Build minimal context if not already set
        const request_id = (req._proxyCtx && req._proxyCtx.request_id) || randomUUID();
        const tenantId = req._tenantId || req.headers['x-tenant-id'] || null;
        const userId = req._userId || req.headers['user-id'] || null;
        const ctx = req._proxyCtx || {
          request_id,
          tenant_id: tenantId,
          user_id: userId,
          api_name: apiName,
          method: (req.method || '').toUpperCase(),
          request_url: req.originalUrl || req.url || '',
          request_headers: truncate(safeStringify(sanitizeHeaders(req.headers))),
          request_query: truncate(safeStringify(req.query || {})),
          request_body: null,
          request_files: null,
          startTime: Date.now(),
        };

        const entry = {
          request_id: ctx.request_id,
          tenant_id: ctx.tenant_id,
          user_id: ctx.user_id,
          api_name: ctx.api_name,
          method: ctx.method,
          request_url: ctx.request_url,
          request_headers: ctx.request_headers,
          request_query: ctx.request_query,
          request_body: ctx.request_body,
          request_files: ctx.request_files,
          response_status: status,
          response_headers: null,
          response_body: null,
          response_files: null,
          error_message: String(err && err.message ? err.message : err),
          response_time_ms: Date.now() - (ctx.startTime || Date.now()),
        };
        insertApiLog(entry).catch(e => console.error('Failed to insert pre-proxy API log:', e));
      } catch (e) {
        console.error('Error preparing pre-proxy log entry:', e);
      }

      if (status === 404) {
        res.status(404).json({ error: err.message });
      } else if (status === 400) {
        res.status(400).json({ error: err.message });
      } else {
        console.error(`Proxy handler error for ${apiName}:`, err);
        res.status(500).json({ error: 'Internal proxy error', details: err.message });
      }
    }
  };
}

module.exports = { createHandler };
