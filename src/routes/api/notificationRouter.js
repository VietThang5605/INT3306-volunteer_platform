// src/routes/api/notificationRouter.js
const express = require('express');
const router = express.Router();

const { auth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const {
  listNotificationsSchema,
  notificationIdSchema,
} = require('../../validators/notification.validator');
const notificationController = require('../../controllers/notificationController');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Quản lý thông báo của người dùng
 */

// (QUAN TRỌNG) Bảo vệ TẤT CẢ các route
router.use(auth);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Lấy danh sách thông báo của người dùng hiện tại
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, unread]
 *           default: all
 *         description: Lọc thông báo (tất cả hoặc chưa đọc)
 *     responses:
 *       "200":
 *         description: Danh sách thông báo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 unreadCount:
 *                   type: integer
 *       "401":
 *         description: Chưa xác thực
 */
router.get(
  '/',
  validate(listNotificationsSchema, 'query'),
  notificationController.getNotifications
);

/**
 * @swagger
 * /notifications/read-all:
 *   post:
 *     summary: Đánh dấu tất cả thông báo là đã đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "204":
 *         description: Thao tác thành công
 *       "401":
 *         description: Chưa xác thực
 */
router.post(
  '/read-all',
  notificationController.markAllAsRead
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Đánh dấu một thông báo là đã đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID của thông báo
 *     responses:
 *       "204":
 *         description: Thao tác thành công
 *       "401":
 *         description: Chưa xác thực
 *       "404":
 *         description: Không tìm thấy thông báo
 */
router.patch(
  '/:id/read',
  validate(notificationIdSchema, 'params'),
  notificationController.markAsRead
);

module.exports = router;