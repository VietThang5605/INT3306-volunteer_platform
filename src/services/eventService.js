const prisma = require('../prisma/client');
const createError = require('http-errors');

const listPublicEvents = async (options) => {
  // 1. (QUAN TRỌNG) Code phòng thủ cho Phân trang
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const take = limit;

  // 2. (QUAN TRỌNG) Code phòng thủ cho Sắp xếp
  const sortBy = options.sortBy || 'createdAt'; // Mặc định là 'createdAt'
  const order = options.order || 'desc';       // Mặc định là 'desc'
  const orderBy = { [sortBy]: order };

  // 3. Code phòng thủ cho Lọc (Filter)
  const categoryId = options.categoryId ? parseInt(options.categoryId, 10) : undefined;
  const time = options.time;

  // 4. Xây dựng điều kiện WHERE
  const where = {
    status: 'APPROVED', // Luôn chỉ lấy sự kiện đã duyệt
  };
  const now = new Date();

  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (time === 'upcoming') {
    where.startTime = { gte: now };
  } else if (time === 'past') {
    where.endTime = { lt: now };
  }

  // 5. Dùng $transaction
  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      skip,    
      take,    
      orderBy, 
      include: {
        category: {
          select: { id: true, name: true },
        },
        manager: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    }),
    prisma.event.count({ where }),
  ]);

  // 6. Tính toán thông tin phân trang
  const totalPages = Math.ceil(total / limit);

  return {
    data: events,
    pagination: {
      totalItems: total,
      totalPages,
      currentPage: page,
      limit,
    },
  };
};

const getPublicEventById = async (eventId) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      category: {
        select: { id: true, name: true },
      },
      manager: {
        select: { id: true, fullName: true, avatarUrl: true }, // Thông tin an toàn
      },
    },
  });

  if (!event || event.status !== 'APPROVED') {
    throw createError(404, 'Không tìm thấy sự kiện');
  }

  return event;
};

const createEvent = async (eventData, managerId) => {
  // `eventData` chứa: { name, description, startTime, endTime, categoryId, capacity }

  const newEvent = await prisma.event.create({
    data: {
      ...eventData, // 1. Lấy tất cả dữ liệu đã validate
      
      managerId: managerId, // 2. (An toàn) Gán manager là người đang đăng nhập
      status: 'PENDING',    // 3. (Quy trình) Mặc định là PENDING
    },
    include: {
      category: true,
      manager: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
    },
  });

  return newEvent;
};

const updateEvent = async (eventId, managerId, updateData) => {
  // 1. Lấy sự kiện GỐC để kiểm tra sở hữu và trạng thái
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      status: true,
      managerId: true,
      startTime: true, // Lấy thời gian cũ để so sánh
      endTime: true,
    },
  });

  // 2. Kiểm tra
  if (!event) {
    throw createError(404, 'Không tìm thấy sự kiện');
  }

  // (QUAN TRỌNG) Kiểm tra sở hữu
  if (event.managerId !== managerId) {
    throw createError(403, 'Bạn không có quyền sửa sự kiện này'); // 403 Forbidden
  }

  // 3. Xử lý logic nghiệp vụ
  const dataToUpdate = { ...updateData };

  // (QUAN TRỌNG) Tự động reset status về PENDING nếu sửa sự kiện đã duyệt
  if (
    event.status === 'APPROVED' ||
    event.status === 'COMPLETED' ||
    event.status === 'CANCELLED'
  ) {
    dataToUpdate.status = 'PENDING';
  }

  // 4. (QUAN TRỌNG) Kiểm tra logic thời gian
  // Lấy thời gian mới (nếu có) hoặc giữ thời gian cũ (từ CSDL)
  const newStartTime = dataToUpdate.startTime || event.startTime;
  const newEndTime = dataToUpdate.endTime || event.endTime;

  if (newEndTime <= newStartTime) {
    throw createError(400, 'Thời gian kết thúc phải sau thời gian bắt đầu');
  }
  
  // 5. Cập nhật CSDL
  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: dataToUpdate,
    include: {
      category: true,
      manager: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
    },
  });

  return updatedEvent;
};

const deleteEvent = async (eventId, managerId) => {
  // 1. Lấy sự kiện GỐC để kiểm tra sở hữu
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { managerId: true }, // Chỉ cần lấy managerId để kiểm tra
  });

  // 2. Kiểm tra
  if (!event) {
    throw createError(404, 'Không tìm thấy sự kiện');
  }

  // (QUAN TRỌNG) Kiểm tra sở hữu
  if (event.managerId !== managerId) {
    throw createError(403, 'Bạn không có quyền xóa sự kiện này'); // 403 Forbidden
  }

  // 3. Thực hiện xóa
  // Lưu ý: Prisma sẽ tự động xử lý `onDelete: Cascade`
  // (xóa tất cả Post, Comment, EventRegistration liên quan)
  await prisma.event.delete({
    where: { id: eventId },
  });

  return; // Hoàn thành
};

module.exports = {
  listPublicEvents,
  getPublicEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};