const express = require('express');
const router = express.Router();

const { auth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { postIdSchema, updatePostStatusSchema } = require('../../validators/post.validator');
const postController = require('../../controllers/postController');
const { postCreationLimiter, interactionLimiter } = require('../../middlewares/postLimiter');
const {
  listCommentsSchema,
  createCommentSchema,
} = require('../../validators/comment.validator');
const commentController = require('../../controllers/commentController');

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Quản lý bài viết và các tương tác liên quan (like, comment)
 */

/**
 * @swagger
 * /posts/trending:
 *   get:
 *     summary: Lấy top 10 bài viết trending (nhiều like/comment nhất)
 *     tags: [Posts]
 *     responses:
 *       "200":
 *         description: Danh sách bài viết trending
 */
router.get('/trending', postController.getTrendingGlobal);

router.use(auth);

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Xóa một bài viết
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID của bài viết
 *     responses:
 *       "204":
 *         description: Xóa thành công
 *       "401":
 *         description: Chưa xác thực
 *       "403":
 *         description: Không có quyền xóa bài viết này
 *       "404":
 *         description: Không tìm thấy bài viết
 */
router.delete(
  '/:id',
  validate(postIdSchema, 'params'), // 1. Validate ID post
  postController.deletePost       // 2. Chạy logic
);

/**
 * @swagger
 * /posts/{id}/like:
 *   post:
 *     summary: Thích hoặc bỏ thích một bài viết
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID của bài viết
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
 *         description: Không tìm thấy bài viết
 */
router.post(
  '/:id/like',
  interactionLimiter, // Thêm rate limiter
  validate(postIdSchema, 'params'), // 1. Validate ID post
  postController.togglePostLike   // 2. Chạy logic
);

/**
 * @swagger
 * /posts/{id}/comments:
 *   get:
 *     summary: Lấy danh sách bình luận của một bài viết
 *     tags: [Posts, Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID của bài viết
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng kết quả mỗi trang
 *     responses:
 *       "200":
 *         description: Danh sách bình luận
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       "401":
 *         description: Chưa xác thực
 *       "404":
 *         description: Không tìm thấy bài viết
 */
router.get(
  '/:id/comments',
  validate(postIdSchema, 'params'), // 1. Validate ID post
  validate(listCommentsSchema, 'query'), // 2. Validate phân trang
  commentController.getComments
);

/**
 * @swagger
 * /posts/{id}/comments:
 *   post:
 *     summary: Tạo một bình luận mới cho bài viết
 *     tags: [Posts, Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID của bài viết
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewComment'
 *     responses:
 *       "201":
 *         description: Tạo bình luận thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       "400":
 *         description: Dữ liệu không hợp lệ
 *       "401":
 *         description: Chưa xác thực
 *       "404":
 *         description: Không tìm thấy bài viết
 */
router.post(
  '/:id/comments',
  postCreationLimiter, // Thêm rate limiter cho comment
  validate(postIdSchema, 'params'), // 1. Validate ID post
  validate(createCommentSchema),   // 2. Validate body
  commentController.createComment
);

router.post(
  '/:id/status',
  validate(postIdSchema, 'params'),
  validate(updatePostStatusSchema),
  postController.updateStatus
);

module.exports = router;