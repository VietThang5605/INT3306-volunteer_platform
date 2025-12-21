const express = require('express');
const router = express.Router();

const { auth, permit } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { listUsersSchema, updateUserSchema, userIdSchema } = require('../../validators/user.validator');
const userController = require('../../controllers/userController');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Quản lý người dùng (yêu cầu quyền Admin)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lấy danh sách người dùng (có phân trang, tìm kiếm, sắp xếp)
 *     tags: [Users]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo email hoặc họ tên
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [email, fullName, createdAt]
 *         description: Trường để sắp xếp
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Thứ tự sắp xếp
 *     responses:
 *       "200":
 *         description: Danh sách người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       "401":
 *         description: Chưa xác thực hoặc không có quyền
 */
router.get('/', auth, permit('ADMIN'), validate(listUsersSchema, 'query'), userController.getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết của một người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của người dùng
 *     responses:
 *       "200":
 *         description: Thông tin chi tiết người dùng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       "401":
 *         description: Chưa xác thực hoặc không có quyền
 *       "404":
 *         description: Không tìm thấy người dùng
 */
router.get('/:id', auth, permit('ADMIN'), validate(userIdSchema, 'params'), userController.getUser);

/**
 * @swagger
 * /users/{id}:
 *   post:
 *     summary: Cập nhật thông tin của một người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của người dùng cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUser'
 *     responses:
 *       "200":
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       "400":
 *         description: Dữ liệu không hợp lệ
 *       "401":
 *         description: Chưa xác thực hoặc không có quyền
 *       "404":
 *         description: Không tìm thấy người dùng
 */
router.post('/:id', auth, permit('ADMIN'), validate(userIdSchema, 'params'), validate(updateUserSchema), userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Xóa một người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của người dùng cần xóa
 *     responses:
 *       "204":
 *         description: Xóa thành công
 *       "401":
 *         description: Chưa xác thực hoặc không có quyền
 *       "403":
 *         description: Không thể xóa tài khoản của chính mình
 *       "404":
 *         description: Không tìm thấy người dùng
 */
router.delete('/:id', auth, permit('ADMIN'), validate(userIdSchema, 'params'), userController.deleteUser);

module.exports = router;