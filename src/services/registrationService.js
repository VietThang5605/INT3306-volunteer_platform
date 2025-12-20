const prisma = require('../prisma/client');
const createError = require('http-errors');
const notificationService = require('./notificationService');

const listRegistrations = async (user, options) => {
  // 1. (QUAN TRỌNG) Code phòng thủ (như đã làm ở service khác)
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const take = limit;

  // 2. Xây dựng điều kiện WHERE
  const where = {};

  // Lọc theo query (nếu có)
  if (options.status) {
    where.status = options.status;
  }
  if (options.eventId) {
    where.eventId = options.eventId;
  }

  // 3. (QUAN TRỌNG) Lọc theo VAI TRÒ (ROLE)
  if (user.role === 'VOLUNTEER') {
    // Volunteer: Chỉ thấy đăng ký của mình
    where.userId = user.id;
  } else if (user.role === 'MANAGER') {
    // Manager: Chỉ thấy đăng ký của các sự kiện mình quản lý
    where.event = {
      managerId: user.id,
    };
  }
  // Admin: Không thêm điều kiện gì, thấy tất cả

  // 4. Dùng $transaction để lấy data và tổng số lượng
  const [registrations, total] = await prisma.$transaction([
    prisma.eventRegistration.findMany({
      where,
      skip,
      take,
      orderBy: {
        registeredAt: 'desc',
      },
      // Lấy kèm thông tin an toàn của sự kiện và user
      include: {
        event: {
          select: { id: true, name: true, startTime: true },
        },
        user: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    }),
    // Đếm tổng số (với cùng điều kiện where)
    prisma.eventRegistration.count({ where }),
  ]);

  // 5. Tính toán thông tin phân trang
  const totalPages = Math.ceil(total / limit);

  return {
    data: registrations,
    pagination: {
      totalItems: total,
      totalPages,
      currentPage: page,
      limit,
    },
  };
};

const createRegistration = async (eventId, userId) => {
  // 1. Kiểm tra sự kiện
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      status: true,
      capacity: true,
      managerId: true, // 👈 Lấy managerId để gửi thông báo
      name: true,      // 👈 Lấy tên sự kiện
    },
  });

  if (!event) {
    throw createError(404, 'Không tìm thấy sự kiện');
  }
  if (event.status !== 'APPROVED') {
    throw createError(400, 'Sự kiện này chưa được duyệt hoặc đã bị hủy');
  }

  // 2. Kiểm tra đăng ký đã tồn tại
  const existingRegistration = await prisma.eventRegistration.findFirst({
    where: { userId: userId, eventId: eventId },
  });
  if (existingRegistration) {
    throw createError(409, 'Bạn đã đăng ký sự kiện này rồi');
  }

  // 3. Kiểm tra số lượng (Capacity)
  if (event.capacity) {
    const confirmedCount = await prisma.eventRegistration.count({
      where: { eventId: eventId, status: 'CONFIRMED' },
    });
    if (confirmedCount >= event.capacity) {
      throw createError(400, 'Sự kiện này đã đủ số lượng người tham gia');
    }
  }

  // 4. Tạo đăng ký
  const newRegistration = await prisma.eventRegistration.create({
    data: {
      userId: userId,
      eventId: eventId,
    },
    include: {
      user: { select: { fullName: true } }, // 👈 Lấy tên người đăng ký
    },
  });

  // 5. 🔔 (TÍNH NĂNG NÂNG CAO) Gửi thông báo cho Manager
  // Chúng ta không dùng "await" (fire-and-forget)
  // để API trả về nhanh chóng cho Volunteer.
  if (event.managerId) {
    const content = `"${newRegistration.user.fullName}" vừa đăng ký tham gia sự kiện "${event.name}" của bạn.`;
    
    notificationService.createNotification(
      event.managerId,
      content,
      'REGISTRATION',
      newRegistration.id
    ).catch(console.error); // Bắt lỗi (nếu có) để không làm sập server
  }

  // 6. Trả về kết quả
  return newRegistration;
};

const deleteRegistration = async (registrationId, userId) => {
  // 1. Tìm đăng ký GỐC để kiểm tra
  const registration = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    select: {
      userId: true, // Lấy userId để kiểm tra sở hữu
      event: {
        select: {
          startTime: true, // Lấy startTime để kiểm tra logic nghiệp vụ
        },
      },
    },
  });

  // 2. Kiểm tra
  if (!registration) {
    throw createError(404, 'Không tìm thấy đăng ký');
  }

  // 3. (QUAN TRỌNG) Kiểm tra sở hữu
  if (registration.userId !== userId) {
    throw createError(403, 'Bạn không có quyền hủy đăng ký này'); // 403 Forbidden
  }

  // 4. (Nghiệp vụ) Không cho phép hủy nếu sự kiện đã bắt đầu
  if (registration.event.startTime && new Date(registration.event.startTime) < new Date()) {
    throw createError(400, 'Bạn không thể hủy đăng ký khi sự kiện đã bắt đầu');
  }

  // 5. Thực hiện xóa
  await prisma.eventRegistration.delete({
    where: { id: registrationId },
  });

  return; // Hoàn thành
};

const listRegistrationsForEvent = async (eventId, managerId, options) => {
  // 1. (QUAN TRỌNG) Kiểm tra sở hữu sự kiện
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { managerId: true }, // Chỉ cần lấy managerId
  });

  if (!event) {
    throw createError(404, 'Không tìm thấy sự kiện');
  }
  if (event.managerId !== managerId) {
    throw createError(403, 'Bạn không có quyền xem đăng ký của sự kiện này');
  }

  // 2. (Code phòng thủ) Lấy tùy chọn phân trang/lọc
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const take = limit;

  // 3. Xây dựng điều kiện WHERE
  const where = {
    eventId: eventId, // Lọc theo sự kiện này
  };

  if (options.status) {
    where.status = options.status; // Thêm lọc theo trạng thái
  }

  // 4. Dùng $transaction để lấy data và tổng số lượng
  const [registrations, total] = await prisma.$transaction([
    prisma.eventRegistration.findMany({
      where,
      skip,
      take,
      orderBy: {
        registeredAt: 'asc', // Ưu tiên người đăng ký sớm
      },
      include: {
        // Lấy thông tin an toàn của người đăng ký
        user: {
          select: {
            id: true,
            fullName: true,
            email: true, // Manager có thể cần email để liên hệ
            phoneNumber: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.eventRegistration.count({ where }),
  ]);

  // 5. Tính toán thông tin phân trang
  const totalPages = Math.ceil(total / limit);

  return {
    data: registrations,
    pagination: {
      totalItems: total,
      totalPages,
      currentPage: page,
      limit,
    },
  };
};

const updateRegistrationStatus = async (registrationId, managerId, newStatus) => {
  // 1. (QUAN TRỌNG) Kiểm tra sở hữu
  // Tìm đăng ký VÀ kiểm tra xem event của nó có thuộc manager này không
  const registration = await prisma.eventRegistration.findFirst({
    where: {
      id: registrationId,
      // Lọc lồng: Chỉ tìm thấy nếu sự kiện (event)
      // của đăng ký này có managerId khớp
      event: {
        managerId: managerId,
      },
    },
    select: {
      id: true,
      status: true,
      userId: true, // 👈 Lấy userId để gửi thông báo
      eventId: true, // 👈 Lấy eventId để check capacity
      event: {
        select: { 
          name: true,
          capacity: true, // 👈 Lấy capacity
        }, 
      },
    },
  });

  // 2. Kiểm tra
  if (!registration) {
    throw createError(
      404,
      'Không tìm thấy đăng ký, hoặc bạn không có quyền cập nhật'
    );
  }

  // 3. (Nghiệp vụ) Không cho cập nhật nếu trạng thái đã giống
  if (registration.status === newStatus) {
    throw createError(400, `Đăng ký này đã ở trạng thái ${newStatus}`);
  }

  // 3.5 (QUAN TRỌNG) Kiểm tra sức chứa nếu duyệt (CONFIRMED)
  if (newStatus === 'CONFIRMED') {
    const { capacity } = registration.event;
    if (capacity) {
      const currentConfirmed = await prisma.eventRegistration.count({
        where: {
          eventId: registration.eventId,
          status: 'CONFIRMED',
        },
      });
      
      if (currentConfirmed >= capacity) {
        throw createError(400, 'Sự kiện đã đủ số lượng người tham gia, không thể duyệt thêm.');
      }
    }
  }

  // 4. Cập nhật trạng thái
  const updatedRegistration = await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: {
      status: newStatus,
    },
  });

  // 5. 🔔 (TÍNH NĂNG NÂNG CAO) Gửi thông báo cho Volunteer
  // "Fire-and-forget"
  let content = '';
  if (newStatus === 'CONFIRMED') {
    content = `Đăng ký của bạn cho sự kiện "${registration.event.name}" đã được xác nhận!`;
  } else if (newStatus === 'CANCELLED') {
    content = `Rất tiếc, đăng ký của bạn cho sự kiện "${registration.event.name}" đã bị từ chối.`;
  }
  
  if (content) {
    notificationService.createNotification(
      registration.userId,
      content,
      'REGISTRATION',
      registration.id
    ).catch(console.error);
  }

  return updatedRegistration;
};

module.exports = {
  listRegistrations,
  createRegistration,
  deleteRegistration,
  listRegistrationsForEvent,
  updateRegistrationStatus,
};