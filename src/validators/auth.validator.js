const Joi = require('joi');
const PasswordComplexity = require('joi-password-complexity');

const complexityOptions = {
  min: 8,          // Tối thiểu 8 ký tự
  max: 1024,       // Tối đa 1024 ký tự
  lowerCase: 1,    // Ít nhất 1 chữ thường
  upperCase: 1,    // Ít nhất 1 chữ hoa
  numeric: 1,      // Ít nhất 1 số
  symbol: 1,       // Ít nhất 1 ký tự đặc biệt
  requirementCount: 6, // Phải thỏa mãn ít nhất 4 điều kiện (ví dụ: thường, hoa, số, ký tự)
};

const registerSchema = Joi.object({
  fullName: Joi.string()
    .min(3)
    .required()
    .messages({
      'string.empty': 'Họ tên không được để trống',
      'string.min': 'Họ tên phải có ít nhất 3 ký tự',
      'any.required': 'Họ tên là trường bắt buộc',
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email không đúng định dạng',
      'string.empty': 'Email không được để trống',
      'any.required': 'Email là trường bắt buộc',
    }),

  // Dùng PasswordComplexity để validate
  password: PasswordComplexity(complexityOptions)
    .required()
    .messages({
      'any.required': 'Mật khẩu là trường bắt buộc',
    }),

  role: Joi.string()
    .valid('VOLUNTEER', 'MANAGER') // Chỉ cho phép 2 giá trị này
    .optional() // Làm cho trường này không bắt buộc
    .messages({
      'any.only': 'Vai trò (role) chỉ có thể là VOLUNTEER hoặc MANAGER',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email không đúng định dạng',
      'string.empty': 'Email không được để trống',
      'any.required': 'Email là trường bắt buộc',
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Mật khẩu không được để trống',
      'any.required': 'Mật khẩu là trường bắt buộc',
    }),

  rememberMe: Joi.boolean().default(true),
});

const changePasswordSchema = Joi.object({
  // Mật khẩu cũ
  oldPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Mật khẩu cũ không được để trống',
      'any.required': 'Mật khẩu cũ là trường bắt buộc',
    }),

  // Mật khẩu mới (dùng lại luật phức tạp)
  newPassword: PasswordComplexity(complexityOptions)
    .required()
    .messages({
      'any.required': 'Mật khẩu mới là trường bắt buộc',
    }),

  // Xác nhận mật khẩu mới
  confirmPassword: Joi.any()
    .valid(Joi.ref('newPassword')) // 👈 Phải khớp với trường 'newPassword'
    .required()
    .messages({
      'any.only': 'Mật khẩu xác nhận không khớp', // Lỗi nếu không khớp
      'any.required': 'Xác nhận mật khẩu là trường bắt buộc',
    }),
});

const updateProfileSchema = Joi.object({
  // Cho phép cập nhật các thông tin cá nhân
  fullName: Joi.string()
    .min(3)
    .optional()
    .messages({
      'string.min': 'Họ tên phải có ít nhất 3 ký tự',
    }),
  
  phoneNumber: Joi.string()
    .optional()
    .allow('', null)
    .messages({
      'string.base': 'Số điện thoại phải là chuỗi',
    }),

  location: Joi.string()
    .optional()
    .allow('', null)
    .messages({
      'string.base': 'Địa chỉ phải là chuỗi',
    }),

  dob: Joi.date()
    .optional()
    .allow(null)
    .messages({
      'date.base': 'Ngày sinh không đúng định dạng',
    }),

  bio: Joi.string()
    .max(500)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'Bio không được quá 500 ký tự',
    }),
});

const verifyEmailSchema = Joi.object({
  token: Joi.string()
    .hex() // Phải là chuỗi hex
    .length(64) // Vì genToken(32) tạo ra 64 ký tự
    .required()
    .messages({
      'string.empty': 'Token không được để trống',
      'any.required': 'Token là trường bắt buộc',
      'string.length': 'Token không đúng định dạng',
      'string.hex': 'Token không đúng định dạng',
    }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không đúng định dạng',
    'any.required': 'Email là trường bắt buộc',
  }),
});

// Schema cho "Đặt lại mật khẩu" (Cần token và mật khẩu mới)
const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .hex()
    .length(64) // 👈 Phải khớp với token (32 bytes -> 64 hex)
    .required()
    .messages({
      'any.required': 'Token là trường bắt buộc',
      'string.length': 'Token không hợp lệ',
    }),
  
  // Mật khẩu mới
  newPassword: PasswordComplexity(complexityOptions)
    .required()
    .messages({ 'any.required': 'Mật khẩu mới là trường bắt buộc' }),

  // Xác nhận
  confirmPassword: Joi.any()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Mật khẩu xác nhận không khớp',
      'any.required': 'Xác nhận mật khẩu là trường bắt buộc',
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};