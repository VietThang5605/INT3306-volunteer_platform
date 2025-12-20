const nodemailer = require('nodemailer');
const createError = require('http-errors');

// Tạo transporter với Gmail OAuth2
const createTransporter = () => {
  // Production: dùng Gmail OAuth2
  if (process.env.GMAIL_REFRESH_TOKEN) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      },
    });
  }

  // Development: dùng Ethereal (email giả lập)
  console.warn('[Email] GMAIL_REFRESH_TOKEN chưa cấu hình, dùng Ethereal test email');
  return null;
};

// Fallback sang Ethereal nếu chưa config Gmail
const getTransporter = async () => {
  const transporter = createTransporter();
  if (transporter) return transporter;

  // Tạo Ethereal test account
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const sendVerificationEmail = async (toEmail, rawToken) => {
  if (!toEmail || !rawToken) {
    throw createError(500, 'Email hoặc token bị thiếu');
  }

  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}`;

  const mailOptions = {
    from: `"VolunteerHub" <${process.env.GMAIL_USER || 'no-reply@volunteerhub.com'}>`,
    to: toEmail,
    subject: 'Chào mừng! Vui lòng xác thực email của bạn',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Chào mừng bạn đến với VolunteerHub!</h2>
        <p>Cảm ơn bạn đã đăng ký. Vui lòng nhấp vào nút bên dưới để xác thực tài khoản của bạn:</p>
        <a href="${verificationUrl}" 
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Xác thực Email
        </a>
        <p style="margin-top: 20px;">Hoặc sao chép và dán URL này vào trình duyệt:</p>
        <p>${verificationUrl}</p>
        <hr>
        <p style="font-size: 0.9em; color: #777;">Lưu ý: Link này sẽ hết hạn sau 1 giờ.</p>
      </div>
    `,
  };

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);

    console.log('[Email] Đã gửi email xác thực: %s', info.messageId);
    
    // Nếu dùng Ethereal, log link xem email
    if (!process.env.GMAIL_REFRESH_TOKEN) {
      console.log('[Email] Xem email (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('[Email] Lỗi khi gửi email xác thực:', error);
  }
};

const sendPasswordResetEmail = async (toEmail, rawToken) => {
  if (!toEmail || !rawToken) {
    throw createError(500, 'Email hoặc token bị thiếu');
  }

  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5000';
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  const mailOptions = {
    from: `"VolunteerHub" <${process.env.GMAIL_USER || 'no-reply@volunteerhub.com'}>`,
    to: toEmail,
    subject: 'Yêu cầu đặt lại mật khẩu VolunteerHub',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Quên mật khẩu?</h2>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Nếu đây là bạn, hãy nhấp vào nút bên dưới để đặt mật khẩu mới:</p>
        <a href="${resetUrl}" 
           style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Đặt lại Mật khẩu
        </a>
        <p style="margin-top: 20px;">Link này sẽ hết hạn sau 1 giờ.</p>
        <hr>
        <p style="font-size: 0.9em; color: #777;">Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
      </div>
    `,
  };

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    
    console.log('[Email] Đã gửi email reset password: %s', info.messageId);
    
    if (!process.env.GMAIL_REFRESH_TOKEN) {
      console.log('[Email] Xem email (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('[Email] Lỗi khi gửi email reset password:', error);
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
