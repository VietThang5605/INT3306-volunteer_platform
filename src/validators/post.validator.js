// src/validators/post.validator.js
const Joi = require('joi');

// Validator cho GET /events/:id/posts (phân trang)
const listPostsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Validator cho POST /events/:id/posts (tạo post)
const createPostSchema = Joi.object({
  content: Joi.string().trim().min(1).required().messages({
    'string.min': 'Nội dung không được để trống',
    'any.required': 'Nội dung là bắt buộc',
  }),
});

const postIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID bài post phải là một UUID hợp lệ',
    'any.required': 'ID bài post là bắt buộc',
  }),
});

module.exports = {
  listPostsSchema,
  createPostSchema,
  postIdSchema,
};