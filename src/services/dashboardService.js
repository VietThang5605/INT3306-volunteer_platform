const prisma = require('../prisma/client');
const createError = require('http-errors');

/**
 * (Helper) Lấy thống kê cho Admin
 */
const getAdminDashboard = async () => {
  // Chạy song song 4 truy vấn
  const [
    totalUsers,
    totalEvents,
    totalRegistrations,
    pendingEvents,
    recentUsers,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.event.count(),
    prisma.eventRegistration.count(),
    prisma.event.count({ where: { status: 'PENDING' } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, fullName: true, email: true, createdAt: true },
    }),
  ]);

  return {
    summary: {
      totalUsers,
      totalEvents,
      totalRegistrations,
      pendingEvents,
    },
    recentUsers,
  };
};

/**
 * (Helper) Lấy thống kê cho Manager
 */
const getManagerDashboard = async (managerId) => {
  const [
    eventCounts,
    totalRegistrations,
    pendingRegistrations,
    recentRegistrations,
  ] = await prisma.$transaction([
    // Đếm sự kiện theo status (của manager này)
    prisma.event.groupBy({
      by: ['status'],
      where: { managerId: managerId },
      _count: { id: true },
    }),
    // Tổng số đăng ký (của các sự kiện manager này quản lý)
    prisma.eventRegistration.count({
      where: { event: { managerId: managerId } },
    }),
    // Số đăng ký đang chờ duyệt
    prisma.eventRegistration.count({
      where: { event: { managerId: managerId }, status: 'PENDING' },
    }),
    // 5 đăng ký mới nhất
    prisma.eventRegistration.findMany({
      where: { event: { managerId: managerId } },
      take: 5,
      orderBy: { registeredAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        event: { select: { id: true, name: true } },
      },
    }),
  ]);

  // Định dạng lại eventCounts
  const summary = {
    totalEvents: 0,
    pendingEvents: 0,
    approvedEvents: 0,
    totalRegistrations: totalRegistrations,
    pendingRegistrations: pendingRegistrations,
  };
  eventCounts.forEach((group) => {
    const count = group._count.id;
    summary.totalEvents += count;
    if (group.status === 'PENDING') summary.pendingEvents = count;
    if (group.status === 'APPROVED') summary.approvedEvents = count;
  });

  return {
    summary,
    recentRegistrations,
  };
};

/**
 * (Helper) Lấy thống kê cho Volunteer
 */
const getVolunteerDashboard = async (userId) => {
  const [
    registrationCounts,
    upcomingEvent,
    recentNotifications,
  ] = await prisma.$transaction([
    // Đếm số sự kiện đã/đang tham gia
    prisma.eventRegistration.groupBy({
      by: ['status'],
      where: { userId: userId },
      _count: { id: true },
    }),
    // Tìm sự kiện "Sắp diễn ra" (CONFIRMED và startTime > now)
    prisma.eventRegistration.findFirst({
      where: {
        userId: userId,
        status: 'CONFIRMED',
        event: { startTime: { gte: new Date() } },
      },
      orderBy: { event: { startTime: 'asc' } },
      include: {
        event: true,
      },
    }),
    // Lấy 5 thông báo mới nhất
    prisma.notification.findMany({
      where: { userId: userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Định dạng lại registrationCounts
  const summary = {
    confirmedRegistrations: 0,
    completedRegistrations: 0, // (Bạn cần logic để set 'COMPLETED')
  };
  registrationCounts.forEach((group) => {
    if (group.status === 'CONFIRMED') summary.confirmedRegistrations = group._count.id;
    if (group.status === 'COMPLETED') summary.completedRegistrations = group._count.id;
  });

  return {
    summary,
    upcomingEvent: upcomingEvent ? upcomingEvent.event : null,
    recentActivity: recentNotifications,
  };
};


/**
 * (Chính) Lấy dữ liệu Dashboard dựa trên vai trò
 * @param {object} user - User object (từ req.user)
 */
const getDashboardData = async (user) => {
  switch (user.role) {
    case 'ADMIN':
      return getAdminDashboard();
    case 'MANAGER':
      return getManagerDashboard(user.id);
    case 'VOLUNTEER':
      return getVolunteerDashboard(user.id);
    default:
      throw createError(403, 'Vai trò không xác định');
  }
};

const getSystemStats = async () => {
  const [totalUsers, totalEvents, totalPosts] = await prisma.$transaction([
    // 1. Đếm User đang hoạt động
    prisma.user.count({ where: { isActive: true } }),

    // 2. Đếm Event đã được duyệt
    prisma.event.count({ where: { status: 'APPROVED' } }),

    // 3. Đếm Post đã được duyệt
    prisma.post.count({ where: { status: 'APPROVED' } }),
  ]);

  return {
    totalUsers,
    totalEvents,
    totalPosts,
  };
};

module.exports = {
  getDashboardData,
  getSystemStats,
};