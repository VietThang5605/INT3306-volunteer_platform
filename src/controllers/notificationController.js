// src/controllers/notificationController.js
const notificationService = require('../services/notificationService');

/**
 * @desc    Lấy danh sách thông báo
 * @route   GET /api/v1/notifications
 * @access  Authenticated
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const options = req.query; // Đã được Joi validate
    
    const result = await notificationService.listNotifications(userId, options);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đánh dấu 1 thông báo là đã đọc
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Authenticated
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id: notificationId } = req.params;
    const userId = req.user.id;

    await notificationService.markAsRead(notificationId, userId);
    
    res.status(204).send(); // 204 No Content
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đánh dấu tất cả là đã đọc
 * @route   POST /api/v1/notifications/read-all
 * @access  Authenticated
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await notificationService.markAllAsRead(userId);
    
    res.status(204).send(); // 204 No Content
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};