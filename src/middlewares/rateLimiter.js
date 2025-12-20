// src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Tắt rate limit khi dev (set true), bật khi production (set false)
const DISABLE_RATE_LIMIT = process.env.NODE_ENV !== 'production';

/**
 * Giới hạn CHUNG cho hầu hết các API
 * 200 requests / 1 phút - đủ thoải mái cho user bình thường
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 200, // 200 requests/phút/IP
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => DISABLE_RATE_LIMIT,
});

/**
 * Giới hạn cho Auth API (login, register, forgot-password...)
 * 20 requests / 15 phút - chống brute force
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 20, // 20 requests/15 phút/IP
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Quá nhiều lần thử, vui lòng đợi 15 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => DISABLE_RATE_LIMIT,
});

/**
 * Giới hạn cho Upload API (upload ảnh, video...)
 * 30 uploads / 10 phút - tránh spam upload
 */
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 30, // 30 uploads/10 phút/IP
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Upload quá nhiều, vui lòng đợi 10 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => DISABLE_RATE_LIMIT,
});

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
};
