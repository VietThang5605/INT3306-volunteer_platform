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

module.exports = {
  listUsersSchema,
  updateUserSchema,
  userIdSchema,
  updateUserStatusSchema,
};