// src/validators/category.validator.js
const Joi = require('joi');

// Validator cho body (POST và PATCH)
const categorySchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    'string.min': 'Tên danh mục phải có ít nhất 3 ký tự',
    'any.required': 'Tên danh mục là bắt buộc',
  }),
  description: Joi.string().optional().allow(null, ''),
});

// Validator cho body (PATCH), làm cho 'name' tùy chọn
const updateCategorySchema = Joi.object({
  name: Joi.string().min(3).optional(),
  description: Joi.string().optional().allow(null, ''),
})
  .min(1) // Phải có ít nhất 1 trường
  .messages({ 'object.min': 'Phải cung cấp ít nhất một trường để cập nhật' });

// Validator cho params /:id (lưu ý: ID là Int)
const categoryIdSchema = Joi.object({
  id: Joi.number().integer().min(1).required().messages({
    'number.base': 'ID danh mục phải là một số',
    'any.required': 'ID danh mục là bắt buộc',
  }),
});

module.exports = {
  categorySchema,
  updateCategorySchema,
  categoryIdSchema,
};