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
const { signAccessToken, generateRefreshToken } = require('../../services/authService');
const passport = require('../../config/passport');
const upload = require('../../config/cloudinary');
const prisma = require('../../prisma/client');
const createError = require('http-errors');

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

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account', // Hiển thị màn hình chọn tài khoản Google
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
  }),
  async (req, res) => {
    const user = req.user;

    // 3. Tạo JWT Token
    const accessToken = signAccessToken(user);
    const { rawToken: refreshToken } = await generateRefreshToken(user.id, null, null, true);

    // 4. Chuyển hướng về Frontend kèm theo tokens và user info
    const userInfo = encodeURIComponent(
      JSON.stringify({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }),
    );
    res.redirect(
      `${process.env.CLIENT_URL}/oauth-success?token=${accessToken}&refreshToken=${refreshToken}&user=${userInfo}`,
    );
  },
);

router.post(
  '/me/avatar',
  auth,
  (req, res, next) => {
    console.log('=== UPLOAD MIDDLEWARE DEBUG ===');
    console.log('Content-Type:', req.headers['content-type']);
    
    upload.single('avatar')(req, res, (err) => {
      if (err) {
        console.error('Multer/Cloudinary upload error:', err);
        return next(createError(500, `Upload failed: ${err.message}`));
      }
      console.log('req.file after multer:', req.file);
      console.log('=== END UPLOAD MIDDLEWARE DEBUG ===');
      next();
    });
  },
  async (req, res, next) => {
    try {
      // Cloudinary trả về url/secure_url, không phải path
      const avatarUrl = req.file?.secure_url || req.file?.url || req.file?.path;
      
      if (!req.file || !avatarUrl) throw createError(400, 'Không nhận được file ảnh hợp lệ');
      
      console.log('=== AVATAR UPDATE DEBUG ===');
      console.log('User ID:', req.user.id);
      console.log('New Avatar URL:', avatarUrl);
      
      // Update vào DB
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl: avatarUrl },
      });

      console.log('Updated user avatarUrl in DB:', updatedUser.avatarUrl);
      console.log('=== END DEBUG ===');

      res.status(200).json({ message: 'Cập nhật avatar thành công', url: avatarUrl });
    } catch (error) {
      console.error('Avatar update error:', error);
      next(error);
    }
  }
);

module.exports = router;
