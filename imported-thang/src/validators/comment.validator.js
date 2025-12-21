// src/validators/comment.validator.js
const Joi = require('joi');

// Validator cho GET (phân trang)
const listCommentsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Validator cho POST (tạo comment)
const createCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).required().messages({
    'string.min': 'Nội dung bình luận không được để trống',
    'any.required': 'Nội dung bình luận là bắt buộc',
  }),
  parentId: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'ID bình luận cha không hợp lệ',
  }),
});

const commentIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID bình luận phải là một UUID hợp lệ',
    'any.required': 'ID bình luận là bắt buộc',
  }),
});

module.exports = {
  listCommentsSchema,
  createCommentSchema,
  commentIdSchema,
};