// src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const prisma = require('../prisma/client');

/**
 * Middleware xác thực (Authentication).
 * Kiểm tra Access Token, giải mã và gắn thông tin user vào `req`.
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError(401, 'Authorization header bị thiếu hoặc không đúng định dạng');
    }

    const token = authHeader.split(' ')[1];

    // 1. Dùng ACCESS_TOKEN_SECRET
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Tìm user trong DB (Rất tốt cho bảo mật)
    // payload.sub (subject) là ID của user
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    // 3. Kiểm tra user có tồn tại và còn hoạt động không
    if (!user) {
      throw createError(401, 'Không tìm thấy người dùng này');
    }
    if (!user.isActive) {
      throw createError(403, 'Tài khoản của bạn đã bị khóa'); // 403 Forbidden
    }

    // 4. Gắn thông tin cốt lõi vào `req`
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    
    next();
  } catch (err) {
    // 5. Xử lý lỗi JWT an toàn hơn
    if (err.name === 'TokenExpiredError') {
      return next(createError(401, 'Token đã hết hạn'));
    }
    // Bắt tất cả các lỗi JWT khác (invalid signature, malformed, etc.)
    if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
      return next(createError(401, 'Token không hợp lệ'));
    }
    // Chuyển tiếp các lỗi khác (ví dụ: lỗi database)
    next(err);
  }
};

/**
 * Middleware phân quyền (Authorization).
 * Chỉ cho phép các vai trò (roles) được chỉ định đi tiếp.
 * @param  {...('VOLUNTEER' | 'MANAGER' | 'ADMIN')} roles - Các vai trò được phép
 */
const permit = (...roles) => (req, res, next) => {
  // Đảm bảo `auth` đã chạy trước
  if (!req.user || !req.user.role) {
    return next(createError(401, 'Chưa xác thực'));
  }

  // Kiểm tra vai trò
  if (!roles.includes(req.user.role)) {
    // 403 Forbidden - Bạn đã xác thực, nhưng không có quyền
    return next(createError(403, 'Bạn không có quyền thực hiện hành động này'));
  }
  
  next();
};

module.exports = { auth, permit };