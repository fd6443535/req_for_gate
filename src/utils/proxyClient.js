const httpProxy = require('http-proxy');
const http = require('http');
const https = require('https');
const { insertApiLog } = require('../services/apiLogs.service');
const { sanitizeHeaders, truncate, safeStringify, isTextLikeContentType } = require('./sanitize');

// Keep-alive agents and a singleton proxy for better performance under load
const KEEPALIVE_MAX_SOCKETS = Number(process.env.PROXY_KEEPALIVE_MAX_SOCKETS || 128);
const SOCKET_TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT_MS || 30000); // idle socket
const UPSTREAM_TIMEOUT_MS = Number(process.env.PROXY_PROXY_TIMEOUT_MS || 60000); // upstream response
const MAX_LOG_BYTES = Number(process.env.PROXY_LOG_MAX_BYTES || 200000);

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: KEEPALIVE_MAX_SOCKETS });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: KEEPALIVE_MAX_SOCKETS });

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ignorePath: true,
  secure: false,
  preserveHeaderKeyCase: true,
  xfwd: true,
});

proxy.on('error', (err, _req, _res) => {
  const status = err && err.code === 'ECONNREFUSED' ? 502 : 500;
  try {
    _res.writeHead(status, { 'Content-Type': 'application/json' });
    _res.end(JSON.stringify({ error: 'Proxy error', details: err.message }));
  } catch (_) {}
  // Log failure if context exists
  try {
    const ctx = _req && _req._proxyCtx ? _req._proxyCtx : null;
    if (ctx) {
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
      insertApiLog(entry).catch(e => console.error('Failed to insert error API log:', e));
    }
  } catch (e) {
    console.error('Error while preparing error log entry:', e);
  }
});

proxy.on('proxyReq', (proxyReq, req2, _res2, _options) => {
  // Attach token if set by the handler
  if (req2 && req2._proxyAuthToken) {
    proxyReq.setHeader('authorization', `Bearer ${req2._proxyAuthToken}`);
  }

  // Remove tenant header from outgoing request to upstream
  try { proxyReq.removeHeader('x-tenant-id'); } catch (_) {}
  // Remove user-id header from outgoing request to upstream
  try { proxyReq.removeHeader('user-id'); } catch (_) {}

  // If body is already parsed by express, re-write for JSON/x-www-form-urlencoded
  const contentType = (req2.headers['content-type'] || '').toLowerCase();
  const method = (req2.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD'].includes(method) && req2.body && Object.keys(req2.body).length > 0) {
    let bodyData;
    if (contentType.includes('application/json')) {
      bodyData = Buffer.from(JSON.stringify(req2.body));
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const qs = new URLSearchParams(req2.body).toString();
      bodyData = Buffer.from(qs);
    }
    if (bodyData) {
      proxyReq.setHeader('content-length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  }
});

// Add tenant header back on the response to the client
proxy.on('proxyRes', (proxyRes, req2, res2) => {
  try {
    const tenantId = req2._tenantId || req2.headers['x-tenant-id'];
    if (tenantId) {
      res2.setHeader('x-tenant-id', tenantId);
    }
    const userId = req2._userId || req2.headers['user-id'];
    if (userId) {
      res2.setHeader('user-id', userId);
    }
    const ctx = req2._proxyCtx || null;
    if (ctx) {
      // Also expose correlation ID to client
      res2.setHeader('x-request-id', ctx.request_id);
    }
  } catch (_) {}

  // Capture response for logging
  try {
    const ctx = req2._proxyCtx;
    if (!ctx) return;

    const ct = (proxyRes.headers['content-type'] || '').toLowerCase();
    const isText = isTextLikeContentType(ct);
    const sanitizedRespHeaders = truncate(safeStringify(sanitizeHeaders(proxyRes.headers)));

    if (isText) {
      let chunks = [];
      let totalBytes = 0;
      proxyRes.on('data', (chunk) => {
        totalBytes += chunk.length;
        if (totalBytes <= MAX_LOG_BYTES) chunks.push(chunk);
      });
      proxyRes.on('end', () => {
        try {
          let response_body = null;
          if (chunks.length) {
            const buf = Buffer.concat(chunks);
            response_body = buf.toString('utf8');
            if (totalBytes > MAX_LOG_BYTES) response_body = truncate(response_body, MAX_LOG_BYTES);
          }
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
            response_status: proxyRes.statusCode || 0,
            response_headers: sanitizedRespHeaders,
            response_body,
            response_files: null,
            error_message: null,
            response_time_ms: Date.now() - (ctx.startTime || Date.now()),
          };
          insertApiLog(entry).catch(e => console.error('Failed to insert API log:', e));
        } catch (e) {
          console.error('Error assembling response log entry:', e);
        }
      });
    } else {
      proxyRes.on('end', () => {
        try {
          const response_files = truncate(safeStringify({ contentType: ct, length: proxyRes.headers['content-length'] || null }));
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
            response_status: proxyRes.statusCode || 0,
            response_headers: sanitizedRespHeaders,
            response_body: null,
            response_files,
            error_message: null,
            response_time_ms: Date.now() - (ctx.startTime || Date.now()),
          };
          insertApiLog(entry).catch(e => console.error('Failed to insert API log:', e));
        } catch (e) {
          console.error('Error assembling file response log entry:', e);
        }
      });
    }
  } catch (e) {
    console.error('proxyRes logging error:', e);
  }
});

function forward(req, res, forwardUrl, token) {
  req._proxyAuthToken = token || null;
  const isHttps = forwardUrl.startsWith('https://');
  const agent = isHttps ? httpsAgent : httpAgent;

  proxy.web(req, res, {
    target: forwardUrl,
    changeOrigin: true,
    ignorePath: true,
    secure: false,
    agent,
    timeout: SOCKET_TIMEOUT_MS,
    proxyTimeout: UPSTREAM_TIMEOUT_MS,
  });
}

module.exports = { forward };
