const prisma = require('../prisma/client');
const createError = require('http-errors');

/**
 * Lấy thông tin profile CÔNG KHAI (an toàn) của một user
 * @param {string} userId - ID của user cần xem
 */
const getProfileById = async (userId) => {
  // 1. Lấy user, bao gồm cả isActive để kiểm tra
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      bio: true,
      location: true,
      createdAt: true, // Dùng cho "Thành viên từ ngày..."
      isActive: true,  // 👈 Dùng để kiểm tra, không phải để trả về
    },
  });

  // 2. Kiểm tra
  // Nếu không tìm thấy, hoặc user này đã bị "khóa" (inactive),
  // thì xem như họ không tồn tại.
  if (!user || !user.isActive) {
    throw createError(404, 'Không tìm thấy profile của người dùng này');
  }

  // 3. (QUAN TRỌNG) Xây dựng đối tượng trả về
  // Chỉ bao gồm các trường công khai, loại bỏ `isActive`
  const publicProfile = {
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    location: user.location,
    createdAt: user.createdAt,
  };

  return publicProfile;
};

module.exports = {
  getProfileById,
};