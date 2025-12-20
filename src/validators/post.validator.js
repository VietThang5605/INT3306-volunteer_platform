// src/validators/post.validator.js
const Joi = require('joi');

// Validator cho GET /events/:id/posts (phân trang)
const listPostsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').optional(),
});

// Validator cho POST /events/:id/posts (tạo post)
const createPostSchema = Joi.object({
  content: Joi.string().trim().min(1).required().messages({
    'string.min': 'Nội dung không được để trống',
    'any.required': 'Nội dung là bắt buộc',
  }),
  visibility: Joi.string()
    .valid('PUBLIC', 'PRIVATE')
    .default('PUBLIC') // Nếu không gửi lên thì mặc định là PUBLIC
    .messages({
      'any.only': 'Chế độ hiển thị phải là PUBLIC hoặc PRIVATE',
    }),
});

const postIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID bài post phải là một UUID hợp lệ',
    'any.required': 'ID bài post là bắt buộc',
  }),
});

const updatePostStatusSchema = Joi.object({
  status: Joi.string()
    .valid('APPROVED', 'REJECTED') // Chỉ cho phép 2 trạng thái này
    .required()
    .messages({
      'any.only': 'Trạng thái phải là APPROVED hoặc REJECTED',
      'any.required': 'Trạng thái là bắt buộc',
    }),
});

module.exports = {
  listPostsSchema,
  createPostSchema,
  postIdSchema,
  updatePostStatusSchema
};