const rateLimit = require('express-rate-limit');

// Rate limiter đặc biệt cho việc tạo posts
const postCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 10, // Chỉ cho phép tạo 10 posts/phút
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Bạn đang tạo bài viết quá nhanh. Vui lòng đợi 1 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
});

// Rate limiter cho việc like/unlike
const interactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút  
  max: 100, // 100 interactions/phút
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Quá nhiều tương tác. Vui lòng đợi 1 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
});

module.exports = {
  postCreationLimiter,
  interactionLimiter,
};