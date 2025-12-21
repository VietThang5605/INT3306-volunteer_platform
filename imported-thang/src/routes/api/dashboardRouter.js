// src/routes/api/dashboardRouter.js
const express = require('express');
const router = express.Router();

const { auth } = require('../../middlewares/auth'); // Chỉ cần auth
const dashboardController = require('../../controllers/dashboardController');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Lấy dữ liệu tổng quan cho dashboard
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Lấy dữ liệu tổng quan cho dashboard (dữ liệu trả về tùy theo vai trò của người dùng)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Dữ liệu tổng quan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Dữ liệu trả về sẽ khác nhau tùy theo vai trò (Admin, Manager, Volunteer)
 *               example:
 *                 # Example for Admin
 *                 adminData:
 *                   totalUsers: 150
 *                   totalEvents: 45
 *                   totalRegistrations: 320
 *                   pendingEvents: 5
 *                 # Example for Manager
 *                 managerData:
 *                   myEventsCount: 12
 *                   totalRegistrationsForMyEvents: 88
 *                   pendingRegistrations: 15
 *                 # Example for Volunteer
 *                 volunteerData:
 *                   registeredEventsCount: 7
 *                   approvedRegistrationsCount: 5
 *                   pendingRegistrationsCount: 2
 *       "401":
 *         description: Chưa xác thực
 */
router.get(
  '/',
  auth, // 1. Phải đăng nhập
  dashboardController.getDashboard // 2. Chạy logic
);

router.get(
  '/stats',
  dashboardController.getSystemStats
);

module.exports = router;