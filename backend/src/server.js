/**
 * CodeGuard AI - Backend API Server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const { initDatabase } = require('./database');
const { apiLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/auth');
const analysisRoutes = require('./routes/analysis');
const reportsRoutes = require('./routes/reports');
const healthRoutes = require('./routes/health');

const app = express();

// Security & Logging Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allow embedded reports and Monaco Editor assets
}));
app.use(cors({
  origin: '*', // Allow frontend client
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Apply rate limiting to all standard API routes
app.use('/api/', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/health', healthRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

// Start Server
async function startServer() {
  await initDatabase();

  const server = app.listen(config.port, () => {
    console.log(`🚀 CodeGuard Backend API active on port ${config.port} [${config.nodeEnv}]`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
