// src/routes/api/commentRouter.js
const express = require('express');
const router = express.Router();

const { auth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { commentIdSchema } = require('../../validators/comment.validator');
const commentController = require('../../controllers/commentController');

// (QUAN TRỌNG) Bảo vệ TẤT CẢ các route trong file này
router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Quản lý bình luận
 */

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Xóa một bình luận
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID của bình luận
 *     responses:
 *       "204":
 *         description: Xóa thành công
 *       "401":
 *         description: Chưa xác thực
 *       "403":
 *         description: Không có quyền xóa bình luận này
 *       "404":
 *         description: Không tìm thấy bình luận
 */
router.delete(
  '/:id',
  validate(commentIdSchema, 'params'), // 1. Validate ID comment
  commentController.deleteComment    // 2. Chạy logic
);

/**
 * @swagger
 * /comments/{id}/like:
 *   post:
 *     summary: Thích hoặc bỏ thích một bình luận
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID của bình luận
 *     responses:
 *       "200":
 *         description: Thao tác thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isLiked:
 *                   type: boolean
 *                   description: Trạng thái thích mới
 *                 likesCount:
 *                   type: integer
 *                   description: Tổng số lượt thích
 *       "401":
 *         description: Chưa xác thực
 *       "404":
 *         description: Không tìm thấy bình luận
 */
router.post(
  '/:id/like',
  validate(commentIdSchema, 'params'), // 1. Validate ID comment
  commentController.toggleCommentLike  // 2. Chạy logic
);

module.exports = router;