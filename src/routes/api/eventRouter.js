const express = require('express');
const router = express.Router();

const { auth, permit } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { listEventsSchema, eventIdSchema, createEventSchema, updateEventSchema } = require('../../validators/event.validator');
const { listRegistrationsSchema } = require('../../validators/registration.validator');
const { listPostsSchema } = require('../../validators/post.validator');
const upload = require('../../config/cloudinary');
const postController = require('../../controllers/postController');
const eventController = require('../../controllers/eventController');
const registrationController = require('../../controllers/registrationController');

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Quản lý sự kiện và các hoạt động liên quan (đăng ký, bài viết)
 */



router.get(
  '/me',
  auth, // 1. Phải đăng nhập
  permit('MANAGER'), // 2. (Tùy chọn) Nếu muốn chặn Volunteer gọi API này thì uncomment
  validate(listEventsSchema, 'query'), // 3. Validate phân trang (page, limit...)
  eventController.getMyEvents
);


/**
 * @swagger
 * /events:
 *   get:
 *     summary: Lấy danh sách sự kiện công khai (có phân trang, lọc, sắp xếp)
 *     tags: [Events]
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
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Lọc theo ID danh mục
 *       - in: query
 *         name: time
 *         schema:
 *           type: string
 *           enum: [upcoming, past]
 *         description: Lọc theo thời gian (sắp diễn ra, đã diễn ra)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [startTime, createdAt]
 *           default: createdAt
 *         description: Sắp xếp theo
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Thứ tự sắp xếp
 *     responses:
 *       "200":
 *         description: Danh sách sự kiện
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get(
  '/',
  validate(listEventsSchema, 'query'),
  eventController.getPublicEvents,
);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một sự kiện công khai
 *     tags: [Events]
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
 *         description: Chi tiết sự kiện
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       "404":
 *         description: Không tìm thấy sự kiện
 */
router.get(
  '/:id',
  validate(eventIdSchema, 'params'),
  eventController.getPublicEvent,
);

/**
 * @swagger
 * /events:
 *   post:
 *     summary: (Manager) Tạo một sự kiện mới
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewEvent'
 *     responses:
 *       "201":
 *         description: Tạo sự kiện thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       "400":
 *         description: Dữ liệu không hợp lệ
 *       "401":
 *         description: Chưa xác thực
 *       "403":
 *         description: Không có quyền (không phải Manager)
 */
router.post(
  '/',
  auth, 
  permit('MANAGER'), 
  validate(createEventSchema),
  eventController.createEvent 
);

/**
 * @swagger
 * /events/{id}:
 *   patch:
 *     summary: (Manager) Cập nhật thông tin sự kiện
 *     tags: [Events]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEvent'
 *     responses:
 *       "200":
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       "400":
 *         description: Dữ liệu không hợp lệ
 *       "401":
 *         description: Chưa xác thực
 *       "403":
 *         description: Không có quyền (không phải chủ sở hữu sự kiện)
 *       "404":
 *         description: Không tìm thấy sự kiện
 */
router.patch(
  '/:id',
  auth, // 2. Phải đăng nhập
  permit('MANAGER'), // 3. Phải là Manager
  validate(eventIdSchema, 'params'), // 4. Validate ID trên URL
  validate(updateEventSchema),      // 5. Validate data trong BODY
  eventController.updateEvent       // 6. Chạy logic
);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: (Manager) Xóa một sự kiện
 *     tags: [Events]
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
 *         description: Chưa xác thực
 *       "403":
 *         description: Không có quyền (không phải chủ sở hữu sự kiện)
 *       "404":
 *         description: Không tìm thấy sự kiện
 */
router.delete(
  '/:id',
  auth, // 1. Phải đăng nhập
  permit('MANAGER'), // 2. Phải là Manager
  validate(eventIdSchema, 'params'), // 3. Validate ID trên URL
  eventController.deleteEvent       // 4. Chạy logic
);

/**
 * @swagger
 * /events/{id}/registrations:
 *   post:
 *     summary: (Volunteer) Đăng ký tham gia một sự kiện
 *     tags: [Events, Registrations]
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
 *       "201":
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Registration'
 *       "400":
 *         description: Không thể đăng ký (đã đăng ký, sự kiện đã đầy, etc.)
 *       "401":
 *         description: Chưa xác thực
 *       "403":
 *         description: Không có quyền (không phải Volunteer)
 *       "404":
 *         description: Không tìm thấy sự kiện
 */
router.post(
  '/:id/registrations',
  auth, // 1. Phải đăng nhập
  permit('VOLUNTEER'), // 2. Phải là Volunteer
  validate(eventIdSchema, 'params'), // 3. Validate ID sự kiện
  registrationController.createRegistration // 4. Chạy logic
);

/**
 * @swagger
 * /events/{id}/registrations:
 *   get:
 *     summary: (Manager) Lấy danh sách người đăng ký của một sự kiện
 *     tags: [Events, Registrations]
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
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Lọc theo trạng thái đăng ký
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
 *       "403":
 *         description: Không có quyền (không phải Manager của sự kiện)
 *       "404":
 *         description: Không tìm thấy sự kiện
 */
router.get(
  '/:id/registrations',
  auth, // 1. Phải đăng nhập
  permit('MANAGER'), // 2. Phải là Manager
  validate(eventIdSchema, 'params'), // 3. Validate ID sự kiện
  validate(listRegistrationsSchema, 'query'), // 4. Validate phân trang/lọc
  registrationController.getRegistrationsForEvent // 5. Chạy logic
);

/**
 * @swagger
 * /events/{id}/posts:
 *   get:
 *     summary: Lấy danh sách bài viết của một sự kiện
 *     tags: [Events, Posts]
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
 *         description: Danh sách bài viết
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       "401":
 *         description: Chưa xác thực
 *       "404":
 *         description: Không tìm thấy sự kiện
 */
router.get(
  '/:id/posts',
  auth, // 1. Phải đăng nhập
  validate(eventIdSchema, 'params'), // 2. Validate ID sự kiện
  validate(listPostsSchema, 'query'), // 3. Validate phân trang
  postController.getPosts
);

/**
 * @swagger
 * /events/{id}/posts:
 *   post:
 *     summary: Tạo một bài viết mới trong sự kiện
 *     tags: [Events, Posts]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewPost'
 *     responses:
 *       "201":
 *         description: Tạo bài viết thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       "400":
 *         description: Dữ liệu không hợp lệ
 *       "401":
 *         description: Chưa xác thực
 *       "403":
 *         description: Không có quyền đăng bài trong sự kiện này
 *       "404":
 *         description: Không tìm thấy sự kiện
 */
router.post(
  '/:id/posts',
  auth, // 1. Phải đăng nhập
  validate(eventIdSchema, 'params'), // 2. Validate ID sự kiện
  // validate(createPostSchema),      // 3. Validate body
  upload.array('media', 5),
  postController.createPost
);

router.get(
  '/:id/trending-posts',
  // auth,
  validate(eventIdSchema, 'params'), // Validate ID sự kiện
  postController.getTrendingByEvent
);



module.exports = router;
