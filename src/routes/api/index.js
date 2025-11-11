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

const express = require("express")

const router = express.Router()

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/profiles', profileRouter);
router.use('/events', eventRouter);
router.use('/admin', adminRouter);
router.use('/registrations', registrationRouter);
router.use('/categories', categoryRouter);
router.use('/posts', postRouter);
router.use('/comments', commentRouter);
router.use('/dashboard', dashboardRouter);
router.use('/notifications', notificationRouter);

module.exports = router;