/**
 * CodeGuard AI - Configuration Module
 */

require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'codeguard-super-secure-production-jwt-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://codeguard:codeguard_secret@localhost:5432/codeguard_db',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '120', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  maxCodeLengthBytes: parseInt(process.env.MAX_CODE_LENGTH_BYTES || '524288', 10) // 512 KB
};
