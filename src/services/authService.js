const prisma = require('../prisma/client');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { genToken, hashToken } = require('../utils/token');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30', 10);

function signAccessToken(user) {
  const payload = { sub: user.id, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

const generateRefreshToken = async (userId, device, ip, rememberMe = true) => {
  // 1. Tạo token thô
  const rawToken = genToken();

  // 2. Băm token
  const hashedToken = hashToken(rawToken);

  // 3. Đặt ngày hết hạn dựa vào rememberMe
  // rememberMe = true → 30 ngày, false → 1 ngày
  const expiryDays = rememberMe ? REFRESH_TOKEN_EXPIRES_DAYS : 1;
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

  // 4. Lưu HASH vào CSDL
  await prisma.refreshToken.create({
    data: {
      token: hashedToken,
      userId: userId,
      expiresAt: expiresAt,
      device: device || 'null',
      ipAddress: ip || 'null',
    },
  });

  // 5. Trả về token THÔ và số ngày hết hạn
  return { rawToken, expiryDays };
};

const generateVerificationToken = async userId => {
  const rawToken = genToken(32); // 32 bytes = 64 ký tự hex
  const hashedToken = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ

  // Xóa token cũ (nếu có) trước khi tạo token mới
  await prisma.verificationToken.deleteMany({
    where: { userId: userId },
  });

  // Lưu HASH vào CSDL
  await prisma.verificationToken.create({
    data: {
      token: hashedToken,
      userId: userId,
      expiresAt: expiresAt,
    },
  });

  return rawToken; // Trả về token THÔ
};

const registerUser = async ({
  fullName,
  email,
  password,
  role = 'VOLUNTEER',
  location = 'null',
  phoneNumber = 'null',
  dob = '1979-12-31T17:00:00Z',
}) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw createError.Conflict('Email is already registered');
  }

  const hashedPassword = await argon2.hash(password);

  const newUser = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash: hashedPassword,
      role,
      location,
      phoneNumber,
      dob,
    },
  });

  try {
    const rawToken = await generateVerificationToken(newUser.id);

    sendVerificationEmail(email, rawToken).catch(console.error);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }

  return newUser;
};

const verifyEmail = async rawTokenString => {
  // 1. Băm token thô
  const hashedToken = hashToken(rawTokenString);

  // 2. Tìm HASH trong CSDL
  const tokenInDb = await prisma.verificationToken.findUnique({
    where: { token: hashedToken },
  });

  // 3. Kiểm tra (an toàn, không tiết lộ lý do)
  if (!tokenInDb) {
    throw createError(400, 'Link xác thực không hợp lệ hoặc đã hết hạn');
  }

  // 4. Kiểm tra hết hạn
  if (tokenInDb.expiresAt < new Date()) {
    // Xóa token hết hạn
    await prisma.verificationToken.delete({ where: { id: tokenInDb.id } });
    throw createError(400, 'Link xác thực đã hết hạn. Vui lòng yêu cầu link mới.');
  }

  // 5. (Quan trọng) Cập nhật user
  await prisma.user.update({
    where: { id: tokenInDb.userId },
    data: { isEmailVerified: true },
  });

  // 6. Xóa token (đã sử dụng)
  await prisma.verificationToken.delete({
    where: { id: tokenInDb.id },
  });

  return; // Hoàn thành
};

const loginUser = async ({ email, password, device, ip, rememberMe = true }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw createError.Unauthorized('Invalid email or password');
  }

  // Nếu user đăng ký bằng Google và không có password
  if (!user.passwordHash) {
    throw createError.Unauthorized('Tài khoản này được đăng ký bằng Google. Vui lòng đăng nhập bằng Google.');
  }

  const passwordValid = await argon2.verify(user.passwordHash, password);

  if (!passwordValid) {
    throw createError.Unauthorized('Invalid email or password');
  }

  if (!user.isEmailVerified) {
    throw createError(403, 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email.');
  }

  if (!user.isActive) {
    throw createError.Forbidden('User account is deactivated');
  }

  const { rawToken, expiryDays } = await generateRefreshToken(user.id, device, ip, rememberMe);

  const accessToken = signAccessToken(user);

  return { user, accessToken, refreshToken: rawToken, expiryDays };
};

const logoutUser = async (tokenString, userId) => {
  // 1. Tìm token trong database bằng chính chuỗi token
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token: tokenString },
  });

  // 2. Kiểm tra
  if (!refreshToken || refreshToken.revoked) {
    // Nếu token không tồn tại, hoặc đã bị thu hồi
    // Ném lỗi 404
    throw createError(404, 'Refresh token không tìm thấy hoặc đã bị thu hồi');
  }

  // 3. (Quan trọng) Kiểm tra token này có thuộc về user đang yêu cầu logout không
  // (userId lấy từ Access Token đã được xác thực)
  if (refreshToken.userId !== userId) {
    throw createError(403, 'Không có quyền thu hồi token này');
  }

  // 4. Thu hồi token bằng cách cập nhật trường `revoked`
  await prisma.refreshToken.update({
    where: { id: refreshToken.id },
    data: { revoked: true },
  });

  return; // Hoàn thành
};

const rotateRefreshToken = async rawTokenString => {
  // 1. Băm token thô nhận được
  const hashedToken = hashToken(rawTokenString);

  // 2. Tìm HASH này trong CSDL
  const tokenInDb = await prisma.refreshToken.findUnique({
    where: { token: hashedToken }, // Tìm bằng HASH
    include: { user: true },
  });

  // 3. Kiểm tra an ninh
  if (!tokenInDb) {
    throw createError(401, 'Refresh token không hợp lệ hoặc không tìm thấy');
  }

  // (Quan trọng) Xóa token cũ ngay lập tức để chống tái sử dụng
  await prisma.refreshToken.delete({
    where: { id: tokenInDb.id },
  });

  // 4. Kiểm tra (nay đã an toàn vì token cũ đã bị xóa)
  if (tokenInDb.revoked) {
    throw createError(401, 'Refresh token đã bị thu hồi');
  }
  if (tokenInDb.expiresAt < new Date()) {
    throw createError(401, 'Refresh token đã hết hạn, vui lòng đăng nhập lại');
  }

  // 5. Lấy thông tin user
  const user = tokenInDb.user;
  if (!user || !user.isActive) {
    throw createError(401, 'Không tìm thấy người dùng hoặc tài khoản đã bị khóa');
  }

  // 6. Tính số ngày còn lại của token cũ để giữ nguyên thời hạn
  const remainingMs = tokenInDb.expiresAt.getTime() - Date.now();
  const remainingDays = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  const rememberMe = remainingDays > 1; // Nếu còn > 1 ngày thì là rememberMe

  // 7. Tạo cặp MỚI (giữ nguyên rememberMe setting)
  const newAccessToken = signAccessToken(user);
  const { rawToken: newRawRefreshToken, expiryDays } = await generateRefreshToken(
    user.id,
    null,
    null,
    rememberMe,
  );

  return {
    accessToken: newAccessToken,
    rawRefreshToken: newRawRefreshToken,
    expiryDays,
  };
};

const changePassword = async (userId, oldPassword, newPassword) => {
  // 1. Lấy thông tin user (bao gồm hash mật khẩu)
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw createError(404, 'Không tìm thấy người dùng');
  }

  // 2. (Quan trọng) Xác thực mật khẩu cũ
  const isOldPasswordValid = await argon2.verify(user.passwordHash, oldPassword);

  if (!isOldPasswordValid) {
    throw createError(400, 'Mật khẩu cũ không chính xác'); // Dùng 400 Bad Request
  }

  // 3. Băm mật khẩu mới
  const newPasswordHash = await argon2.hash(newPassword);

  // 4. Cập nhật mật khẩu mới vào CSDL
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
    },
  });

  // 5. Thu hồi tất cả refresh token hiện có của user này
  await prisma.refreshToken.updateMany({
    where: { userId: userId, revoked: false },
    data: { revoked: true },
  });

  return; // Hoàn thành
};

const getUserProfile = async userId => {
  console.log('=== GET PROFILE DEBUG ===');
  console.log('Fetching profile for userId:', userId);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
      bio: true,
      phoneNumber: true,
      location: true,
      dob: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log('Returned avatarUrl from DB:', user?.avatarUrl);
  console.log('=== END GET PROFILE DEBUG ===');

  if (!user) {
    throw createError(404, 'Không tìm thấy người dùng');
  }

  return user;
};

const updateUserProfile = async (userId, updateData) => {
  if (Object.keys(updateData).length === 0) {
    throw createError(400, 'Không có thông tin nào để cập nhật');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const generatePasswordResetToken = async (userId) => {
  const rawToken = genToken(32);
  const hashedToken = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ

  // Xóa token cũ
  await prisma.passwordResetToken.deleteMany({
    where: { userId: userId },
  });

  // Lưu HASH vào CSDL
  await prisma.passwordResetToken.create({
    data: {
      token: hashedToken,
      userId: userId,
      expiresAt: expiresAt,
    },
  });
  
  return rawToken; // Trả về token THÔ
};

const requestPasswordReset = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    try {
      const rawToken = await generatePasswordResetToken(user.id);
      await sendPasswordResetEmail(user.email, rawToken);
    } catch (error) {
      console.error('Lỗi khi xử lý reset password:', error);
      // Không ném lỗi ra ngoài
    }
  }

  // Luôn trả về thành công
  return;
};

const performPasswordReset = async (rawToken, newPassword) => {
  // 1. Băm token thô
  const hashedToken = hashToken(rawToken);

  // 2. Tìm HASH trong CSDL
  const tokenInDb = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
  });

  // 3. Kiểm tra (an toàn)
  if (!tokenInDb) {
    throw createError(400, 'Token không hợp lệ hoặc đã hết hạn');
  }
  if (tokenInDb.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: tokenInDb.id } });
    throw createError(400, 'Token đã hết hạn');
  }

  // 4. Lấy userId
  const userId = tokenInDb.userId;

  // 5. Băm mật khẩu mới
  const newPasswordHash = await argon2.hash(newPassword);

  // 6. (AN NINH CAO) Thực hiện trong 1 giao dịch (Transaction)
  // 3 việc phải xảy ra đồng thời:
  // a. Cập nhật mật khẩu mới
  // b. Xóa token reset (đã sử dụng)
  // c. Vô hiệu hóa TẤT CẢ các Refresh Token (đăng xuất mọi thiết bị)
  await prisma.$transaction([
    // a. Cập nhật mật khẩu
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    }),

    // b. Xóa PasswordResetToken
    prisma.passwordResetToken.delete({
      where: { id: tokenInDb.id },
    }),

    // c. (Rất quan trọng) Thu hồi tất cả RefreshToken
    prisma.refreshToken.updateMany({
      where: { userId: userId, revoked: false },
      data: { revoked: true },
    }),
  ]);

  return; // Hoàn thành
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  rotateRefreshToken,
  changePassword,
  getUserProfile,
  updateUserProfile,
  verifyEmail,
  requestPasswordReset,
  performPasswordReset,
  signAccessToken,
  generateRefreshToken,
};
