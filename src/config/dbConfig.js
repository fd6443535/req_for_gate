const sql = require('mssql');

let poolPromise;

function getDbConfig() {
  return {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: process.env.DB_ENCRYPT ? process.env.DB_ENCRYPT === 'true' : true,
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE ? process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' : true,
    },
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: Number(process.env.DB_POOL_MIN || 0),
      idleTimeoutMillis: Number(process.env.DB_POOL_IDLE || 30000),
    },
    connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT || 30000),
    requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT || 30000),
  };
}

function getPool() {
  if (!poolPromise) {
    const config = getDbConfig();
    poolPromise = sql.connect(config);
    poolPromise.catch((err) => {
      console.error('Failed to connect to SQL Server for proxy_server:', err);
      // Reset so next call can retry
      poolPromise = undefined;
    });
  }
  return poolPromise;
}

module.exports = { sql, getPool };
