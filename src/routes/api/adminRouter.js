const express = require('express');
const router = express.Router();

const { auth, permit } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { eventIdSchema } = require('../../validators/event.validator');
const { exportSchema } = require('../../validators/admin.validator');
const { listUsersSchema, updateUserStatusSchema, userIdSchema } = require('../../validators/user.validator');
const adminController = require('../../controllers/adminController');
const eventService = require('../../services/eventService');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Các thao tác quản trị cấp cao (yêu cầu quyền Admin)
 */

router.use(auth, permit('ADMIN'));

/**
 * @swagger
 * /admin/events/{id}/approve:
 *   post:
 *     summary: (Admin) Phê duyệt một sự kiện
 *     tags: [Admin, Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID của sự kiện
 *     responses:
 *       "200":
 *         description: Phê duyệt thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       "401":
 *         description: Chưa xác thực hoặc không có quyền
 *       "404":
 *         description: Không tìm thấy sự kiện
 */
router.post(
  '/events/:id/approve',
  validate(eventIdSchema, 'params'), // 1. Validate ID trên URL
  adminController.approveEvent       // 2. Chạy logic
);

/**
 * @swagger
 * /admin/export/events:
 *   get:
 *     summary: (Admin) Xuất danh sách sự kiện ra file
 *     tags: [Admin, Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, xlsx]
 *           default: json
 *         description: Định dạng file xuất
 *     responses:
 *       "200":
 *         description: File sự kiện được tải về
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       "401":
 *         description: Chưa xác thực hoặc không có quyền
 */
router.get(
  '/export/events',
  validate(exportSchema, 'query'), 
  adminController.exportEvents
);

/**
 * @swagger
 * /admin/export/users:
 *   get:
 *     summary: (Admin) Xuất danh sách người dùng ra file
 *     tags: [Admin, Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, xlsx]
 *           default: json
 *         description: Định dạng file xuất
 *     responses:
 *       "200":
 *         description: File người dùng được tải về
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       "401":
 *         description: Chưa xác thực hoặc không có quyền
 */
router.get(
  '/export/users',
  validate(exportSchema, 'query'), // Tái sử dụng validator
  adminController.exportUsers      // Gọi controller mới
);

/**
 * @swagger
 * /admin/events/{id}:
 *   delete:
 *     summary: (Admin) Xóa vĩnh viễn một sự kiện
 *     tags: [Admin, Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID của sự kiện
 *     responses:
 *       "204":
 *         description: Xóa thành công
 *       "401":
 *         description: Chưa xác thực hoặc không có quyền
 *       "404":
 *         description: Không tìm thấy sự kiện
 */

router.delete(
  '/events/:id',
  validate(eventIdSchema, 'params'), // 1. Validate ID trên URL
  adminController.deleteEvent      // 2. Chạy logic
);

// Bổ sung route xem chi tiết sự kiện cho admin
router.get(
  '/events/:id',
  validate(eventIdSchema, 'params'),
  adminController.getEventDetail
);

// Bổ sung route dashboard stats cho admin
router.get(
  '/dashboard',
  adminController.getDashboardStats
);

// Bổ sung route lấy danh sách users cho admin
router.get(
  '/users',
  validate(listUsersSchema, 'query'),
  adminController.listUsers
);

// Bổ sung route cập nhật trạng thái user (Khóa/Mở khóa)
router.patch(
  '/users/:id/status',
  validate(userIdSchema, 'params'),
  validate(updateUserStatusSchema),
  adminController.updateUserStatus
);

// Bổ sung route xóa user
router.delete(
  '/users/:id',
  validate(userIdSchema, 'params'),
  adminController.deleteUser
);

module.exports = router;