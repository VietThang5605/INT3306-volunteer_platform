// src/validators/registration.validator.js
const Joi = require('joi');

// Validator cho GET /registrations
const listRegistrationsSchema = Joi.object({
  // Phân trang
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),

  // Lọc (Tùy chọn)
  // Cho phép lọc theo một hoặc nhiều trạng thái
  status: Joi.string()
    .valid('PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLIST')
    .optional(),
  
  // (Tùy chọn) Lọc theo eventId
  eventId: Joi.string().uuid().optional(),
});

const registrationIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID đăng ký phải là một UUID hợp lệ',
    'any.required': 'ID đăng ký là bắt buộc',
  }),
});

const updateRegistrationStatusSchema = Joi.object({
  // Lấy các giá trị từ Enum trong CSDL
  status: Joi.string()
    .valid('PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLIST')
    .required()
    .messages({
      'any.only': 'Trạng thái (status) không hợp lệ',
      'any.required': 'Trạng thái (status) là bắt buộc',
    }),
});

module.exports = {
  listRegistrationsSchema,
  registrationIdSchema,
  updateRegistrationStatusSchema,
};