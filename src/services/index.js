const authService = require('../services/authService');
const userService = require('../services/userService');
const profileService = require('../services/profileService');
const eventService = require('../services/eventService');
const adminService = require('../services/adminService');
const notificationService = require('../services/notificationService');
const registrationService = require('../services/registrationService');
const categoryService = require('../services/categoryService');
const postService = require('../services/postService');
const commentService = require('../services/commentService');
const dashboardService = require('../services/dashboardService');
const webPushService = require('../services/webPushService');

module.exports = {
    authService,
    userService,
    profileService,
    eventService,
    adminService,
    notificationService,
    registrationService,
    categoryService,
    postService,
    commentService,
    dashboardService,
    webPushService
};