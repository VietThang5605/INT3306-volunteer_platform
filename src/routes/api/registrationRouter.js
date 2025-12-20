const express = require('express');
const router = express.Router();


const { auth, permit } = require('../../middlewares/auth'); // Chỉ cần auth, không cần permit
const validate = require('../../middlewares/validate');
const { listRegistrationsSchema, registrationIdSchema, updateRegistrationStatusSchema } = require('../../validators/registration.validator');
const registrationController = require('../../controllers/registrationController');

/**
 * @swagger
 * tags:
 *   name: Registrations
 *   description: Quản lý việc đăng ký sự kiện của người dùng
 */

/**
 * @swagger
 * /registrations/my-channels:
 *   get:
 *     summary: Lấy danh sách kênh trao đổi (sự kiện đã được CONFIRMED)
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       "200":
 *         description: Danh sách kênh trao đổi
 *       "401":
 *         description: Chưa xác thực
 */
router.get(
  '/my-channels',
  auth,
  registrationController.getMyChannels
);

/**
 * @swagger
 * /registrations:
 *   get:
 *     summary: Lấy danh sách đăng ký (của tôi hoặc của tất cả nếu là Manager/Admin)
 *     tags: [Registrations]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED, WAITLIST]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lọc theo ID sự kiện (chỉ dành cho Manager/Admin)
 *     responses:
 *       "200":
 *         description: Danh sách đăng ký
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Registration'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       "401":
 *         description: Chưa xác thực
 */
router.get(
  '/',
  auth, // 1. Phải đăng nhập
  validate(listRegistrationsSchema, 'query'), // 2. Validate query params
  registrationController.getRegistrations     // 3. Chạy logic
);

/**
 * @swagger
 * /registrations/{id}:
 *   delete:
 *     summary: (Volunteer) Hủy đăng ký tham gia sự kiện
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID của đơn đăng ký
 *     responses:
 *       "204":
 *         description: Hủy đăng ký thành công
 *       "401":
 *         description: Chưa xác thực
 *       "403":
 *         description: Không có quyền (không phải chủ sở hữu đơn đăng ký)
 *       "404":
 *         description: Không tìm thấy đơn đăng ký
 */
router.delete(
  '/:id',
  auth, // 2. Phải đăng nhập
  permit('VOLUNTEER'), // 3. Phải là Volunteer
  validate(registrationIdSchema, 'params'), // 4. Validate ID
  registrationController.deleteRegistration // 5. Chạy logic
);

/**
 * @swagger
 * /registrations/{id}/status:
 *   patch:
 *     summary: (Manager) Cập nhật trạng thái của một đơn đăng ký
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID của đơn đăng ký
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED, WAITLIST]
 *             required:
 *               - status
 *     responses:
 *       "200":
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Registration'
 *       "400":
 *         description: Trạng thái không hợp lệ
 *       "401":
 *         description: Chưa xác thực
 *       "403":
 *         description: Không có quyền (không phải Manager của sự kiện)
 *       "404":
 *         description: Không tìm thấy đơn đăng ký
 */
router.patch(
  '/:id/status',
  auth, // 2. Phải đăng nhập
  permit('MANAGER'), // 3. Phải là Manager
  validate(registrationIdSchema, 'params'), // 4. Validate ID
  validate(updateRegistrationStatusSchema), // 5. Validate body
  registrationController.updateRegistrationStatus // 6. Chạy logic
);

module.exports = router;