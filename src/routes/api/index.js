const authRouter = require('./authRouter');
const userRouter = require('./userRouter');
const profileRouter = require('./profileRouter');
const eventRouter = require('./eventRouter');
const adminRouter = require('./adminRouter');
const registrationRouter = require('./registrationRouter');
const categoryRouter = require('./categoryRouter')
const postRouter = require('./postRouter');
const commentRouter = require('./commentRouter');
const dashboardRouter = require('./dashboardRouter');
const notificationRouter = require('./notificationRouter');
const pushRouter = require('./pushRouter');
const { generalLimiter } = require('../../middlewares/rateLimiter');

const express = require("express")

const router = express.Router()

// Auth routes dùng authLimiter riêng (đã có trong authRouter)
router.use('/auth', authRouter);

// Các routes khác dùng generalLimiter
router.use('/users', generalLimiter, userRouter);
router.use('/profiles', generalLimiter, profileRouter);
router.use('/events', generalLimiter, eventRouter);
router.use('/admin', generalLimiter, adminRouter);
router.use('/registrations', generalLimiter, registrationRouter);
router.use('/categories', generalLimiter, categoryRouter);
router.use('/posts', generalLimiter, postRouter);
router.use('/comments', generalLimiter, commentRouter);
router.use('/dashboard', generalLimiter, dashboardRouter);
router.use('/notifications', generalLimiter, notificationRouter);
router.use('/push', generalLimiter, pushRouter);

module.exports = router;