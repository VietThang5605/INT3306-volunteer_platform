// src/validators/notification.validator.js
const Joi = require('joi');

// Validator cho GET / (phân trang và lọc)
const listNotificationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  // (Nâng cao) Cho phép lọc theo "chưa đọc"
  filter: Joi.string().valid('all', 'unread').default('all'),
});

// Validator cho params /:id/read
const notificationIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID thông báo phải là một UUID hợp lệ',
    'any.required': 'ID thông báo là bắt buộc',
  }),
});

module.exports = {
  listNotificationsSchema,
  notificationIdSchema,
};