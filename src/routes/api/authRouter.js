const { authController } = require('../../controllers/index');
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} = require('../../validators/auth.validator');
const validate = require('../../middlewares/validate');
const { auth } = require('../../middlewares/auth');
const { authLimiter } = require('../../middlewares/rateLimiter');

const express = require('express');
const router = express.Router();

router.use(authLimiter);

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Quản lý xác thực người dùng
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Register'
 *     responses:
 *       "201":
 *         description: Đăng ký thành công
 *       "400":
 *         description: Dữ liệu không hợp lệ
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập vào hệ thống
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       "200":
 *         description: Đăng nhập thành công, trả về thông tin user và access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *       "401":
 *         description: Sai email hoặc mật khẩu
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất khỏi hệ thống
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "204":
 *         description: Đăng xuất thành công
 *       "401":
 *         description: Chưa xác thực
 */
router.post('/logout', auth, authController.logout);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Làm mới access token bằng refresh token
 *     tags: [Auth]
 *     description: Gửi refresh token (lấy từ cookie httpOnly) để nhận access token mới.
 *     responses:
 *       "200":
 *         description: Làm mới token thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       "401":
 *         description: Refresh token không hợp lệ hoặc đã hết hạn
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Thay đổi mật khẩu người dùng hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePassword'
 *     responses:
 *       "200":
 *         description: Đổi mật khẩu thành công
 *       "400":
 *         description: Mật khẩu cũ không đúng
 *       "401":
 *         description: Chưa xác thực
 */
router.post('/change-password', auth, validate(changePasswordSchema), authController.changePassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin cá nhân của người dùng hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Thông tin người dùng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       "401":
 *         description: Chưa xác thực
 */
router.get('/me', auth, authController.getMe);

/**
 * @swagger
 * /auth/me:
 *   post:
 *     summary: Cập nhật thông tin cá nhân của người dùng hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMe'
 *     responses:
 *       "200":
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       "401":
 *         description: Chưa xác thực
 */
router.post('/me', auth, validate(updateProfileSchema), authController.updateMe);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Xác thực địa chỉ email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token xác thực được gửi qua email
 *     responses:
 *       "302":
 *         description: Xác thực thành công, chuyển hướng về trang đăng nhập
 *       "400":
 *         description: Token không hợp lệ hoặc đã hết hạn
 */
router.get('/verify-email', validate(verifyEmailSchema, 'query'), authController.verifyEmail);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Yêu cầu đặt lại mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             required:
 *               - email
 *     responses:
 *       "200":
 *         description: Nếu email tồn tại, một email hướng dẫn sẽ được gửi
 */
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu bằng token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPassword'
 *     responses:
 *       "200":
 *         description: Đặt lại mật khẩu thành công
 *       "400":
 *         description: Token không hợp lệ hoặc đã hết hạn
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
