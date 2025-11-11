// src/routes/api/categoryRouter.js
const express = require('express');
const router = express.Router();

const { auth, permit } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const {
  categorySchema,
  updateCategorySchema,
  categoryIdSchema,
} = require('../../validators/category.validator');
const categoryController = require('../../controllers/categoryController');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Quản lý danh mục bài viết
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Lấy tất cả danh mục
 *     tags: [Categories]
 *     responses:
 *       "200":
 *         description: Danh sách các danh mục
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get(
  '/',
  categoryController.getCategories
);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: (Admin) Tạo danh mục mới
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewCategory'
 *     responses:
 *       "201":
 *         description: Tạo danh mục thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       "400":
 *         description: Dữ liệu không hợp lệ
 *       "401":
 *         description: Chưa xác thực hoặc không có quyền
 */
router.post(
  '/',
  auth,
  permit('ADMIN'),
  validate(categorySchema),
  categoryController.createCategory
);

/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     summary: (Admin) Cập nhật danh mục
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của danh mục
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategory'
 *     responses:
 *       "200":
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       "400":
 *         description: Dữ liệu không hợp lệ
 *       "401":
 *         description: Chưa xác thực hoặc không có quyền
 *       "404":
 *         description: Không tìm thấy danh mục
 */
router.patch(
  '/:id',
  auth,
  permit('ADMIN'),
  validate(categoryIdSchema, 'params'),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: (Admin) Xóa danh mục
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của danh mục
 *     responses:
 *       "204":
 *         description: Xóa thành công
 *       "401":
 *         description: Chưa xác thực hoặc không có quyền
 *       "404":
 *         description: Không tìm thấy danh mục
 */
router.delete(
  '/:id',
  auth,
  permit('ADMIN'),
  validate(categoryIdSchema, 'params'),
  categoryController.deleteCategory
);

module.exports = router;