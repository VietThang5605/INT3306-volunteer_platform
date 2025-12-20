const prisma = require('../prisma/client');
const createError = require('http-errors');
const webPushService = require('./webPushService');
const { emitToUser } = require('../socket');

const createNotification = async (userId, content, targetType, targetId) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        content,
        targetType,
        targetId,
        // isRead: false (là giá trị mặc định trong schema)
      },
    });

    console.log(`[NotificationService] Đã tạo thông báo cho user: ${userId}`);

    // Emit socket event cho real-time notification
    emitToUser(userId, 'new_notification', {
      notification: {
        ...notification,
        eventId: null, // FE có thể fetch thêm nếu cần
      },
    });

    // Gửi Web Push notification
    webPushService.sendToUser(userId, {
      title: 'Thông báo mới',
      body: content,
      data: {
        notificationId: notification.id,
        targetType,
        targetId,
        url: getNotificationUrl(targetType, targetId),
      },
    });

  } catch (error) {
    // Rất quan trọng: Tác vụ nền không bao giờ được ném lỗi ra ngoài.
    // Chúng ta chỉ ghi log lỗi và tiếp tục.
    console.error(
      `[NotificationService] Lỗi khi tạo thông báo cho user ${userId}:`,
      error
    );
  }
};

/**
 * Tạo URL redirect dựa trên loại notification
 */
const getNotificationUrl = (targetType, targetId) => {
  if (!targetType || !targetId) return '/notifications';
  
  switch (targetType) {
    case 'EVENT':
      return `/events/${targetId}`;
    case 'POST':
      return `/posts/${targetId}`;
    case 'REGISTRATION':
      return `/registrations/${targetId}`;
    default:
      return '/notifications';
  }
};

const listNotifications = async (userId, options) => {
  // 1. (Code phòng thủ)
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const take = limit;

  // 2. Xây dựng điều kiện WHERE
  const where = {
    userId: userId, // (QUAN TRỌNG) Chỉ lấy của user này
  };

  if (options.filter === 'unread') {
    where.isRead = false; // Thêm bộ lọc "chưa đọc"
  }

  // 3. Dùng $transaction
  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }, // Mới nhất lên trước
    }),
    prisma.notification.count({ where }),
  ]);

  // 4. Enrich notifications với eventId nếu targetType là POST
  const enrichedNotifications = await Promise.all(
    notifications.map(async (noti) => {
      if (noti.targetType === 'POST' && noti.targetId) {
        const post = await prisma.post.findUnique({
          where: { id: noti.targetId },
          select: { eventId: true },
        });
        return { ...noti, eventId: post?.eventId || null };
      }
      if (noti.targetType === 'REGISTRATION' && noti.targetId) {
        const registration = await prisma.eventRegistration.findUnique({
          where: { id: noti.targetId },
          select: { eventId: true },
        });
        return { ...noti, eventId: registration?.eventId || null };
      }
      return { ...noti, eventId: null };
    })
  );

  const totalPages = Math.ceil(total / limit);
  return {
    data: enrichedNotifications,
    pagination: { totalItems: total, totalPages, currentPage: page, limit },
  };
};

/**
 * (Auth) Đánh dấu 1 thông báo là đã đọc
 * @param {string} notificationId - ID thông báo
 * @param {string} userId - ID của user
 */
const markAsRead = async (notificationId, userId) => {
  // 1. Dùng `updateMany` để kiểm tra sở hữu (ownership) trong 1 query
  const { count } = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: userId, // 👈 Đảm bảo user sở hữu thông báo này
    },
    data: {
      isRead: true,
    },
  });

  // 2. Nếu count = 0, nghĩa là ID sai hoặc không có quyền
  if (count === 0) {
    throw createError(404, 'Không tìm thấy thông báo hoặc bạn không có quyền');
  }
  return;
};

/**
 * (Auth) Đánh dấu tất cả thông báo là đã đọc
 * @param {string} userId - ID của user
 */
const markAllAsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: {
      userId: userId,
      isRead: false, // Chỉ cập nhật những cái "chưa đọc"
    },
    data: {
      isRead: true,
    },
  });
  return;
};

module.exports = {
  createNotification,
  listNotifications,
  markAsRead,
  markAllAsRead,
};