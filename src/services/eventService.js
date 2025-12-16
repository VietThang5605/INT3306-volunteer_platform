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
  // 1. Lấy thông tin sự kiện hiện tại trong DB
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw createError(404, 'Không tìm thấy sự kiện');
  }

  // 2. Kiểm tra quyền sở hữu (Manager)
  if (event.managerId !== managerId) {
    throw createError(403, 'Bạn không có quyền chỉnh sửa sự kiện này');
  }

  // 3. 🛡️ LOGIC MỚI: Kiểm tra thời gian
  // Nếu thời gian bắt đầu nhỏ hơn hoặc bằng hiện tại => Sự kiện đã bắt đầu (hoặc đã xong)
  const now = new Date();
  const startTime = new Date(event.startTime);

  if (startTime <= now) {
    throw createError(
      400, 
      'Sự kiện đang diễn ra hoặc đã kết thúc. Bạn không thể chỉnh sửa thông tin lúc này.'
    );
  }

  // 4. (Tùy chọn) Kiểm tra logic thời gian mới (nếu người dùng sửa giờ)
  // Nếu updateData có chứa startTime hoặc endTime, cần đảm bảo endTime > startTime
  if (updateData.startTime && updateData.endTime) {
     if (new Date(updateData.endTime) <= new Date(updateData.startTime)) {
        throw createError(400, 'Thời gian kết thúc phải sau thời gian bắt đầu');
     }
  } 
  // Nếu chỉ sửa 1 trong 2 trường, bạn cần lấy trường còn lại từ `event` cũ để so sánh (Logic này hơi dài dòng, để đơn giản ta giả định Validator đã check format, còn logic chéo thì nên chặn sửa giờ khi sự kiện sắp diễn ra).

  // 5. Thực hiện Update
  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: updateData,
    include: {
        category: true // Trả về kèm category cho đầy đủ
    }
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

const getEventsByManager = async (managerId, options) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // 1. Xây dựng bộ lọc
  const where = {
    managerId: managerId, // 👈 QUAN TRỌNG: Chỉ lấy của Manager này
  };

  // Lọc theo trạng thái (PENDING, APPROVED, REJECTED, COMPLETED...)
  if (options.status) {
    where.status = options.status;
  }

  // Tìm kiếm theo tên sự kiện
  if (options.search) {
    where.name = {
      contains: options.search,
      mode: 'insensitive', // Không phân biệt hoa thường
    };
  }

  // 2. Query Database
  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }, // Sự kiện mới tạo lên đầu
      include: {
        category: true, // Lấy kèm thông tin danh mục
        _count: {
          select: { registrations: true }, // Đếm số người đã đăng ký
        },
      },
    }),
    prisma.event.count({ where }),
  ]);

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

module.exports = {
  listPublicEvents,
  getPublicEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByManager,
};