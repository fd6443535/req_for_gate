require('dotenv').config();
const http = require('http');
// Suppress Node DEP0060 deprecation (util._extend) used by http-proxy by
// aliasing it to Object.assign before http-proxy is required anywhere.
const util = require('util');
if (typeof util._extend === 'function') {
  util._extend = Object.assign;
}
const app = require('./src/app');

const PORT = Number(process.env.PROXY_PORT || process.env.PORT || 4000);

const server = http.createServer(app);

server.on('error', (err) => {
  console.error('Proxy server error:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection in proxy server:', reason);
});

server.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});

