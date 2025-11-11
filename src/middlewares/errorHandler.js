// src/middlewares/errorHandler.js
const createError = require('http-errors');
const logger = require('../utils/logger'); // Giả sử bạn đã có file logger (dùng winston)

/**
 * Middleware xử lý lỗi trung tâm
 * (err, req, res, next)
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // 1. Ghi log lỗi
  logger.error(err.message, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // 2. Xử lý lỗi từ Joi (Lỗi 400 Bad Request)
  if (err.isJoi) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: err.details[0].message,
    });
  }

  // 3. Xử lý lỗi từ `http-errors` (lỗi 401, 403, 404...)
  // 🔽 ĐÂY LÀ DÒNG ĐÃ SỬA 🔽
  //    Sửa `httpErrors.isHttpError(err)` thành `createError.isHttpError(err)`
  if (createError.isHttpError(err)) {
    return res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
    });
  }

  // 4. Xử lý các lỗi 500 (lỗi code, database...)
  const isProduction = process.env.NODE_ENV === 'production';
  const errorMessage = isProduction
    ? 'Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.'
    : err.message; // Hiển thị lỗi chi tiết ở dev

  res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: errorMessage,
    stack: isProduction ? undefined : err.stack,
  });
};

module.exports = errorHandler;