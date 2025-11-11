// src/controllers/commentController.js
const commentService = require('../services/commentService');

/**
 * @desc    Lấy danh sách bình luận của 1 bài post
 * @route   GET /api/v1/posts/:id/comments
 * @access  Authenticated
 */
const getComments = async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    const options = req.query; // Đã được Joi validate
    
    const result = await commentService.listCommentsForPost(postId, options);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo bình luận mới
 * @route   POST /api/v1/posts/:id/comments
 * @access  Authenticated
 */
const createComment = async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;
    const { content } = req.body; // Đã được Joi validate

    const newComment = await commentService.createComment(postId, userId, content);
    
    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { id: commentId } = req.params; // 1. Lấy ID bình luận
    const user = req.user;                // 2. Lấy toàn bộ thông tin user

    await commentService.deleteComment(commentId, user);
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const toggleCommentLike = async (req, res, next) => {
  try {
    const { id: commentId } = req.params; // 1. Lấy ID bình luận
    const userId = req.user.id;         // 2. Lấy ID user

    const result = await commentService.toggleCommentLike(commentId, userId);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComments,
  createComment,
  toggleCommentLike,
  deleteComment,
};