const { sql, getPool } = require('../config/dbConfig');

async function insertApiLog(entry) {
  const pool = await getPool();
  const request = pool.request();

  // Prepare inputs with NVARCHAR(MAX) for JSON-like strings
  request.input('request_id', sql.VarChar(100), entry.request_id);
  request.input('tenant_id', sql.VarChar(50), entry.tenant_id || null);
  request.input('user_id', sql.VarChar(50), entry.user_id || null);
  request.input('api_name', sql.VarChar(100), entry.api_name);
  request.input('method', sql.VarChar(10), (entry.method || '').toUpperCase());

  request.input('request_url', sql.NVarChar(sql.MAX), entry.request_url);
  request.input('request_headers', sql.NVarChar(sql.MAX), entry.request_headers || null);
  request.input('request_query', sql.NVarChar(sql.MAX), entry.request_query || null);
  request.input('request_body', sql.NVarChar(sql.MAX), entry.request_body || null);
  request.input('request_files', sql.NVarChar(sql.MAX), entry.request_files || null);

  request.input('response_status', sql.Int, entry.response_status || 0);
  request.input('response_headers', sql.NVarChar(sql.MAX), entry.response_headers || null);
  request.input('response_body', sql.NVarChar(sql.MAX), entry.response_body || null);
  request.input('response_files', sql.NVarChar(sql.MAX), entry.response_files || null);

  request.input('error_message', sql.NVarChar(sql.MAX), entry.error_message || null);
  request.input('response_time_ms', sql.Int, entry.response_time_ms != null ? entry.response_time_ms : 0);

  await request.query(`
    INSERT INTO ApiLogsTable (
      request_id, tenant_id, user_id, api_name, method,
      request_url, request_headers, request_query, request_body, request_files,
      response_status, response_headers, response_body, response_files,
      error_message, response_time_ms
    ) VALUES (
      @request_id, @tenant_id, @user_id, @api_name, @method,
      @request_url, @request_headers, @request_query, @request_body, @request_files,
      @response_status, @response_headers, @response_body, @response_files,
      @error_message, @response_time_ms
    )
  `);
}

module.exports = { insertApiLog };
