const Joi = require('joi');

const listUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  
  // (Tùy chọn mở rộng sau này)
  role: Joi.string().valid('VOLUNTEER', 'MANAGER', 'ADMIN'),
  search: Joi.string().trim().allow(''),
});

const userIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID người dùng phải là một UUID hợp lệ',
    'any.required': 'ID người dùng là bắt buộc',
  }),
});

const updateUserSchema = Joi.object({
  // Chỉ cho phép cập nhật 2 trường này
  role: Joi.string().valid('VOLUNTEER', 'MANAGER', 'ADMIN').optional(),
  isActive: Joi.boolean().optional(),
})
  .min(1) // Phải có ít nhất 1 trường để cập nhật
  .messages({
    'object.min': 'Phải cung cấp ít nhất một trường (role hoặc isActive) để cập nhật.',
  });

const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    'any.required': 'Trạng thái hoạt động (isActive) là bắt buộc',
    'boolean.base': 'Trạng thái hoạt động phải là kiểu boolean',
  }),
});

const PasswordComplexity = require('joi-password-complexity');

const complexityOptions = {
  min: 8,
  max: 1024,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 6,
};

const createManagerSchema = Joi.object({
  fullName: Joi.string().required().messages({
    'any.required': 'Họ tên là bắt buộc',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc',
  }),
  password: PasswordComplexity(complexityOptions).required().messages({
    'any.required': 'Mật khẩu là bắt buộc',
    'passwordComplexity.tooShort': 'Mật khẩu phải có ít nhất 8 ký tự',
    'passwordComplexity.lowercase': 'Mật khẩu phải chứa ít nhất 1 chữ thường',
    'passwordComplexity.uppercase': 'Mật khẩu phải chứa ít nhất 1 chữ hoa',
    'passwordComplexity.numeric': 'Mật khẩu phải chứa ít nhất 1 số',
    'passwordComplexity.symbol': 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt',
  }),
});

module.exports = {
  listUsersSchema,
  updateUserSchema,
  userIdSchema,
  updateUserStatusSchema,
  createManagerSchema,
};