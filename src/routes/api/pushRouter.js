const express = require('express');
const router = express.Router();

const { auth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const pushController = require('../../controllers/pushController');
const {
  subscribeSchema,
  unsubscribeSchema,
} = require('../../validators/push.validator');

/**
 * @swagger
 * tags:
 *   name: Push Notifications
 *   description: Quản lý Web Push Notifications
 */

/**
 * @swagger
 * /push/vapid-public-key:
 *   get:
 *     summary: Lấy VAPID public key để client đăng ký push
 *     tags: [Push Notifications]
 *     responses:
 *       "200":
 *         description: VAPID public key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vapidPublicKey:
 *                   type: string
 *       "503":
 *         description: Push notifications chưa được cấu hình
 */
router.get('/vapid-public-key', pushController.getVapidPublicKey);

/**
 * @swagger
 * /push/subscribe:
 *   post:
 *     summary: Đăng ký nhận push notification
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription
 *             properties:
 *               subscription:
 *                 type: object
 *                 required:
 *                   - endpoint
 *                   - keys
 *                 properties:
 *                   endpoint:
 *                     type: string
 *                   keys:
 *                     type: object
 *                     properties:
 *                       p256dh:
 *                         type: string
 *                       auth:
 *                         type: string
 *     responses:
 *       "201":
 *         description: Đăng ký thành công
 *       "401":
 *         description: Chưa xác thực
 */
router.post(
  '/subscribe',
  auth,
  validate(subscribeSchema, 'body'),
  pushController.subscribe
);

/**
 * @swagger
 * /push/unsubscribe:
 *   post:
 *     summary: Hủy đăng ký push notification
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *             properties:
 *               endpoint:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Hủy đăng ký thành công
 *       "401":
 *         description: Chưa xác thực
 *       "404":
 *         description: Không tìm thấy subscription
 */
router.post(
  '/unsubscribe',
  auth,
  validate(unsubscribeSchema, 'body'),
  pushController.unsubscribe
);

module.exports = router;
