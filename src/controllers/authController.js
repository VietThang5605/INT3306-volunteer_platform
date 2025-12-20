const authService = require('../services/authService');
const createError = require('http-errors');

const register = async (req, res, next) => {
  try {
    const userData = req.body;
    await authService.registerUser(userData);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query; 

    await authService.verifyEmail(token);

    const clientLoginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/login` : '/';
    res.redirect(`${clientLoginUrl}?verified=true`);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe = true } = req.body;
    const { user, accessToken, refreshToken, expiryDays } = await authService.loginUser({
      email,
      password,
      rememberMe,
    });

    res.cookie(
      'refreshToken',
      refreshToken,
      {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: expiryDays * 24 * 60 * 60 * 1000, // Dùng expiryDays từ service
        path: '/',
      },
    );

    res.json({
      message: 'Đăng nhập thành công',
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      accessToken,
      refreshToken,
      expiryDays, // Trả về để FE biết thời hạn
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    // 1. Lấy token từ cookie (đã được parse bởi cookie-parser)
    const tokenString = req.cookies.refreshToken;

    if (!tokenString) {
      // Nếu không có token, không cần làm gì
      return res.status(204).send();
    }

    // 2. Thu hồi token trong DB (dùng authService)
    // `req.user.id` vẫn lấy từ access token (để bảo mật)
    await authService.logoutUser(tokenString, req.user.id);

    // 3. (Quan trọng) Xóa cookie khỏi trình duyệt
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    });

    // 4. Trả về thành công
    res.status(204).send();
  } catch (error) {
    // Nếu token không hợp lệ (ví dụ authService ném lỗi),
    // chúng ta vẫn nên xóa cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    });
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  const rawTokenString =
    req.cookies.refreshToken || req.cookies.refresh_token || req.body.refreshToken;

  if (!rawTokenString) {
    return next(createError(401, 'Không tìm thấy Refresh token'));
  }

  try {
    // 2. Gọi service (service sẽ trả về token THÔ mới)
    const { accessToken, rawRefreshToken, expiryDays } = await authService.rotateRefreshToken(rawTokenString);

    // 3. Đặt cookie MỚI (chứa token THÔ mới)
    res.cookie(
      'refreshToken',
      rawRefreshToken,
      {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: expiryDays * 24 * 60 * 60 * 1000,
        path: '/',
      },
    );

    // 4. Trả về accessToken và refreshToken MỚI
    res.json({
      message: 'Token được làm mới thành công',
      accessToken,
      refreshToken: rawRefreshToken,
      expiryDays,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    // 1. Lấy ID user từ middleware `auth`
    const userId = req.user.id;

    // 2. Lấy mật khẩu từ body (đã được Joi validate)
    const { oldPassword, newPassword } = req.body;

    // 3. Gọi service
    await authService.changePassword(userId, oldPassword, newPassword);

    // 4. Trả về thành công
    res.status(200).json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    // 1. Lấy ID user từ middleware `auth`
    //    (auth middleware đã xác thực và gắn req.user)
    const userId = req.user.id;

    // 2. Gọi service để lấy thông tin profile (đã được "sanitize")
    const userProfile = await authService.getUserProfile(userId);

    // 3. Trả về thông tin profile
    res.status(200).json(userProfile);
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    // 1. Lấy ID user từ middleware `auth`
    const userId = req.user.id;
    
    // 2. `req.body` đã được Joi validate và làm sạch
    const updateData = req.body;

    // 3. Gọi service
    const updatedUser = await authService.updateUserProfile(userId, updateData);

    // 4. Trả về thông tin user đã cập nhật
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.requestPasswordReset(email);
    
    // (AN NINH) Luôn trả về 200, bất kể email có tồn tại hay không
    res.status(200).json({
      message: 'Nếu tài khoản này tồn tại, một email đặt lại mật khẩu đã được gửi.',
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await authService.performPasswordReset(token, newPassword);
    
    res.status(200).json({ message: 'Đặt lại mật khẩu thành công.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  changePassword,
  getMe,
  updateMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
