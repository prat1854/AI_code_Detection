/**
 * CodeGuard AI - Rate Limiting Middleware
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');

const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please wait a moment before sending more requests.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Attempts',
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
