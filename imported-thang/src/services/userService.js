const prisma = require('../prisma/client');
const createError = require('http-errors');

const listUsers = async options => {
  // 1. (QUAN TRỌNG) Code phòng thủ
  // Chuyển đổi đầu vào (có thể là string rỗng, undefined) thành SỐ
  // Nếu thất bại, dùng giá trị mặc định (1 và 10)
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;

  // 2. Tính toán phân trang
  // (1 - 1) * 10 = 0 (skip)
  // (2 - 1) * 10 = 10 (skip)
  const skip = (page - 1) * limit;
  const take = limit;

  // 3. Dùng $transaction
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip,
      take,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        avatarUrl: true,
        bio: true,
        location: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.user.count(),
  ]);

  // 4. Tính toán thông tin phân trang
  const totalPages = Math.ceil(total / limit);

  return {
    data: users,
    pagination: {
      totalItems: total,
      totalPages,
      currentPage: page,
      limit,
    },
  };
};

const getUserById = async userId => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    // (Bảo mật) CHỈ CHỌN các trường an toàn
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
      avatarUrl: true,
      bio: true,
      location: true,
      dob: true,
    },
  });

  // Nếu không tìm thấy, ném lỗi 404
  if (!user) {
    throw createError(404, 'Không tìm thấy người dùng');
  }

  return user;
};

const updateUserById = async (userId, updateData, adminId) => {
  // 1. Kiểm tra xem user có tồn tại không
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw createError(404, 'Không tìm thấy người dùng');
  }

  // Ngăn admin tự hạ vai trò của chính mình
  if (userId === adminId && updateData.role && updateData.role !== 'ADMIN') {
    throw createError(400, 'Bạn không thể tự hạ vai trò của chính mình');
  }

  // 2. Cập nhật user
  // `updateData` đã được Joi "làm sạch" nên an toàn
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    // Trả về dữ liệu an toàn
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const deleteUserById = async (userIdToDelete, adminId) => {
  // 1. (RẤT QUAN TRỌNG) Ngăn Admin tự xóa chính mình
  if (userIdToDelete === adminId) {
    throw createError(400, 'Bạn không thể tự xóa tài khoản của chính mình');
  }

  // 2. Kiểm tra xem user có tồn tại không
  const user = await prisma.user.findUnique({
    where: { id: userIdToDelete },
  });

  if (!user) {
    throw createError(404, 'Không tìm thấy người dùng');
  }

  // 3. Thực hiện xóa user
  await prisma.user.delete({
    where: { id: userIdToDelete },
  });

  return;
};

module.exports = {
  listUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};
