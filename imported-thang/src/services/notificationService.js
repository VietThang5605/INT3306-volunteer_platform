const prisma = require('../prisma/client');
const createError = require('http-errors');

const createNotification = async (userId, content, targetType, targetId) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        content,
        targetType,
        targetId,
        // isRead: false (là giá trị mặc định trong schema)
      },
    });

    console.log(`[NotificationService] Đã tạo thông báo cho user: ${userId}`);

    // (NÂNG CAO HƠN NỮA)
    // Sau khi tạo record, bạn có thể lấy PushSubscription của user này
    // và gửi một Web Push (nếu có) tại đây.

  } catch (error) {
    // Rất quan trọng: Tác vụ nền không bao giờ được ném lỗi ra ngoài.
    // Chúng ta chỉ ghi log lỗi và tiếp tục.
    console.error(
      `[NotificationService] Lỗi khi tạo thông báo cho user ${userId}:`,
      error
    );
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

  const totalPages = Math.ceil(total / limit);
  return {
    data: notifications,
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