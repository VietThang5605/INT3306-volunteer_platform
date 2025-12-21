const prisma = require('../prisma/client');
const createError = require('http-errors');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const argon2 = require('argon2'); // Import argon2
// 1. Import service mới
const notificationService = require('./notificationService');
const eventService = require('./eventService');

const getEventDetail = async eventId => {
  return await eventService.getEventByIdForAdmin(eventId);
};

const approveEvent = async eventId => {
  // 1. & 2. (Giữ nguyên) Kiểm tra event và status ...
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { status: true },
  });
  if (!event) {
    throw createError(404, 'Không tìm thấy sự kiện');
  }
  if (event.status !== 'PENDING') {
    throw createError(400, `Sự kiện này đang ở trạng thái ${event.status}, không thể duyệt`);
  }

  // 3. Cập nhật trạng thái
  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: 'APPROVED',
    },
    // (Quan trọng) Phải include managerId và name để gửi thông báo
    include: {
      category: true,
      manager: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
    },
  });

  // 4. (TÍNH NĂNG NÂNG CAO)
  // Kích hoạt thông báo mà không cần "await"
  if (updatedEvent && updatedEvent.managerId) {
    const content = `Sự kiện "${updatedEvent.name}" của bạn đã được quản trị viên duyệt.`;

    notificationService.createNotification(
      updatedEvent.managerId,
      content,
      'EVENT',
      updatedEvent.id,
    );
  }

  // 5. Trả về kết quả cho Admin
  return updatedEvent;
};

const exportEvents = async format => {
  // 1. (QUAN TRỌNG - SỬA LỖI) Code phòng thủ:
  // Đảm bảo `format` luôn có giá trị hợp lệ, mặc định là 'json'.
  const exportFormat = format || 'json';

  // 2. Lấy TẤT CẢ sự kiện (không phân trang)
  const events = await prisma.event.findMany({
    include: {
      category: {
        select: { name: true },
      },
      manager: {
        select: { fullName: true, email: true },
      },
      _count: {
        select: { registrations: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // 3. Chuyển đổi dữ liệu sang dạng "phẳng" (flat)
  const flatData = events.map(event => ({
    id: event.id,
    name: event.name,
    status: event.status,
    location: event.location,
    startTime: event.startTime,
    endTime: event.endTime,
    capacity: event.capacity,
    managerName: event.manager?.fullName,
    managerEmail: event.manager?.email,
    categoryName: event.category?.name,
    registeredCount: event._count.registrations,
    createdAt: event.createdAt,
    description: event.description,
  }));

  // 4. Xử lý định dạng JSON
  if (exportFormat === 'json') {
    return {
      contentType: 'application/json',
      data: flatData,
    };
  }

  // 5. Xử lý định dạng CSV
  if (exportFormat === 'csv') {
    const fields = [
      { label: 'Event ID', value: 'id' },
      { label: 'Tên sự kiện', value: 'name' },
      { label: 'Trạng thái', value: 'status' },
      { label: 'Địa điểm', value: 'location' },
      { label: 'Thời gian bắt đầu', value: 'startTime' },
      { label: 'Thời gian kết thúc', value: 'endTime' },
      { label: 'Số lượng (Max)', value: 'capacity' },
      { label: 'Số lượng (Đã đăng ký)', value: 'registeredCount' },
      { label: 'Tên Manager', value: 'managerName' },
      { label: 'Email Manager', value: 'managerEmail' },
      { label: 'Danh mục', value: 'categoryName' },
      { label: 'Ngày tạo', value: 'createdAt' },
      { label: 'Mô tả', value: 'description' },
    ];

    const json2csvParser = new Parser({ fields, withBOM: true });
    const csv = json2csvParser.parse(flatData);

    return {
      contentType: 'text/csv; charset=utf-8',
      data: csv,
    };
  }

  // 6. Xử lý định dạng XLSX
  if (exportFormat === 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VolunteerHub';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Events');

    worksheet.columns = [
      { header: 'Event ID', key: 'id', width: 38 },
      { header: 'Tên sự kiện', key: 'name', width: 30 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Địa điểm', key: 'location', width: 30 },
      { header: 'Bắt đầu', key: 'startTime', width: 20 },
      { header: 'Kết thúc', key: 'endTime', width: 20 },
      { header: 'Manager', key: 'managerName', width: 25 },
      { header: 'Email Manager', key: 'managerEmail', width: 30 },
      { header: 'Đã đăng ký', key: 'registeredCount', width: 10 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDDDDD' },
    };

    worksheet.addRows(flatData);

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      data: buffer,
    };
  }
};

const exportUsers = async format => {
  // 1. (QUAN TRỌNG) Code phòng thủ
  const exportFormat = format || 'json';

  // 2. Lấy TẤT CẢ user (không phân trang)
  const users = await prisma.user.findMany({
    // (Bảo mật) TUYỆT ĐỐI KHÔNG LẤY passwordHash
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      createdAt: true,
      location: true,
      dob: true,
      // Đếm các quan hệ
      _count: {
        select: {
          managedEvents: true, // Số SK quản lý (cho MANAGER)
          eventRegs: true, // Số SK đăng ký (cho VOLUNTEER)
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // 3. Chuyển đổi dữ liệu sang dạng "phẳng" (flat)
  const flatData = users.map(user => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt.toISOString(),
    location: user.location,
    // Chuyển đổi Date sang YYYY-MM-DD an toàn
    dob: user.dob ? user.dob.toISOString().split('T')[0] : '',
    managedEventsCount: user._count.managedEvents,
    registrationsCount: user._count.eventRegs,
  }));

  // 4. Xử lý định dạng JSON
  if (exportFormat === 'json') {
    return {
      contentType: 'application/json',
      data: flatData,
    };
  }

  // 5. Định nghĩa Fields/Columns (dùng chung cho CSV và XLSX)
  const fields = [
    { label: 'User ID', value: 'id', key: 'id', width: 38 },
    { label: 'Họ tên', value: 'fullName', key: 'fullName', width: 25 },
    { label: 'Email', value: 'email', key: 'email', width: 30 },
    { label: 'Vai trò', value: 'role', key: 'role', width: 15 },
    { label: 'Active', value: 'isActive', key: 'isActive', width: 10 },
    { label: 'Email Verified', value: 'isEmailVerified', key: 'isEmailVerified', width: 10 },
    { label: 'Ngày tham gia', value: 'createdAt', key: 'createdAt', width: 20 },
    { label: 'SK Quản lý', value: 'managedEventsCount', key: 'managedEventsCount', width: 10 },
    { label: 'SK Đăng ký', value: 'registrationsCount', key: 'registrationsCount', width: 10 },
    { label: 'Địa điểm', value: 'location', key: 'location', width: 20 },
    { label: 'Ngày sinh', value: 'dob', key: 'dob', width: 15 },
  ];

  // 6. Xử lý định dạng CSV
  if (exportFormat === 'csv') {
    const json2csvParser = new Parser({ fields, withBOM: true });
    const csv = json2csvParser.parse(flatData);
    return {
      contentType: 'text/csv; charset=utf-8',
      data: csv,
    };
  }

  // 7. Xử lý định dạng XLSX
  if (exportFormat === 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VolunteerHub';
    const worksheet = workbook.addWorksheet('Users');

    // Gán cột (lấy từ `fields` ở trên)
    worksheet.columns = fields.map(f => ({ header: f.label, key: f.key, width: f.width }));

    worksheet.getRow(1).font = { bold: true };
    worksheet.addRows(flatData);

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      data: buffer,
    };
  }
};

const deleteEventByAdmin = async eventId => {
  // 1. Kiểm tra xem sự kiện có tồn tại không
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, name: true, managerId: true }, // Lấy thêm name và managerId
  });

  if (!event) {
    throw createError(404, 'Không tìm thấy sự kiện');
  }

  // 2. Thực hiện xóa
  // Admin không cần kiểm tra sở hữu (managerId)
  await prisma.event.delete({
    where: { id: eventId },
  });

  // 3. Gửi thông báo cho Manager (nếu có)
  if (event.managerId) {
    const content = `Sự kiện "${event.name}" của bạn đã bị quản trị viên xóa.`;
    
    // Dùng try-catch để không làm ảnh hưởng luồng chính nếu lỗi
    try {
      notificationService.createNotification(
        event.managerId,
        content,
        'EVENT', // Vẫn để EVENT để lưu lịch sử, dù link có thể 404
        eventId,
      );
    } catch (error) {
      console.error('[DeleteEvent] Lỗi gửi thông báo:', error);
    }
  }

  return; // Hoàn thành
};

const deleteUserByAdmin = async userId => {
  // 1. Kiểm tra user có tồn tại không
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw createError(404, 'Không tìm thấy người dùng');
  }

  // 2. Kiểm tra role (Không cho phép xóa Admin)
  if (user.role === 'ADMIN') {
    throw createError(403, 'Không thể xóa tài khoản Admin');
  }

  // 3. Thực hiện xóa
  await prisma.user.delete({
    where: { id: userId },
  });

  return;
};

const createManager = async ({ fullName, email, password }) => {
  // 1. Kiểm tra email tồn tại
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw createError(409, 'Email đã được sử dụng');
  }

  // 2. Hash mật khẩu
  const hashedPassword = await argon2.hash(password);

  // 3. Tạo user mới (ACTIVE và VERIFIED luôn)
  const newUser = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash: hashedPassword,
      role: 'MANAGER',
      isEmailVerified: true,
      isActive: true,
      phoneNumber: 'null',
      location: 'null',
      dob: '1979-12-31T17:00:00Z',
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return newUser;
};

const getDashboardStats = async () => {
  const [
    totalUsers,
    totalVolunteers,
    totalManagers,
    totalAdmins,
    totalEvents,
    pendingEvents,
    approvedEvents,
    completedEvents,
    totalCategories,
  ] = await prisma.$transaction([
    // User Stats
    prisma.user.count(),
    prisma.user.count({ where: { role: 'VOLUNTEER' } }),
    prisma.user.count({ where: { role: 'MANAGER' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    // Event Stats
    prisma.event.count(),
    prisma.event.count({ where: { status: 'PENDING' } }),
    prisma.event.count({ where: { status: 'APPROVED' } }),
    prisma.event.count({ where: { status: 'COMPLETED' } }),
    // Category Stats
    prisma.category.count(),
  ]);

  return {
    users: {
      total: totalUsers,
      volunteers: totalVolunteers,
      managers: totalManagers,
      admins: totalAdmins,
    },
    events: {
      total: totalEvents,
      pending: pendingEvents,
      approved: approvedEvents,
      completed: completedEvents,
    },
    categories: {
      total: totalCategories,
    },
  };
};

module.exports = {
  approveEvent,
  exportEvents,
  exportUsers,
  deleteEventByAdmin,
  getEventDetail,
  getDashboardStats,
  deleteUserByAdmin,
  createManager,
};