// src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Rate limit đã được BẬT
const DISABLE_RATE_LIMIT = false;

/**
 * Giới hạn CHUNG cho hầu hết các API
 * (Ví dụ: 100 yêu cầu mỗi 15 phút)
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn mỗi IP là 100 yêu cầu
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true, // Gửi header `RateLimit-*` (chuẩn)
  legacyHeaders: false, // Tắt header `X-RateLimit-*` (cũ)
  skip: () => DISABLE_RATE_LIMIT, // Tắt rate limit
});

/**
 * Giới hạn NGHIÊM NGẶT cho các API xác thực
 * (Ví dụ: 10 yêu cầu mỗi 15 phút)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Giới hạn mỗi IP là 10 yêu cầu
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => DISABLE_RATE_LIMIT, // Tắt rate limit
});

module.exports = {
  generalLimiter,
  authLimiter,
};
