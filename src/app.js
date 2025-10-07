const express = require('express');
const cors = require('cors');
require('dotenv').config();

const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const proxyRoutes = require('./routes/proxy.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Core middlewares
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

const corsOptions = {
  origin: ['http://localhost:3002', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  exposedHeaders: ['x-tenant-id'],
};
app.use(cors(corsOptions));

app.use("/api/auth", authRoutes);
app.use("/", proxyRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error in proxy server:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
