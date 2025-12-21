const nodemailer = require('nodemailer');
const createError = require('http-errors');

const createEtherealTransporter = async () => {
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

  // 1. Tạo link xác thực
  // Dùng biến môi trường cho URL, nếu không có thì dùng localhost
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}`;

  // 2. Cấu hình email
  const mailOptions = {
    from: '"VolunteerHub" <no-reply@volunteerhub.com>',
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

  // 3. Gửi email
  try {
    const transporter = await createEtherealTransporter();
    const info = await transporter.sendMail(mailOptions);

    console.log('Đã gửi email: %s', info.messageId);
    // Link quan trọng: Mở link này trong trình duyệt để xem email "ảo"
    console.log('Xem email (Ethereal): %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    // Không ném lỗi ra ngoài để tránh làm sập luồng đăng ký
  }
};

const sendPasswordResetEmail = async (toEmail, rawToken) => {
  if (!toEmail || !rawToken) {
    throw createError(500, 'Email hoặc token bị thiếu');
  }

  // 1. Tạo link (trỏ về FRONTEND, không phải API)
  // Frontend sẽ đọc token từ URL, hiện form, sau đó gọi API POST /reset-password
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:3001'; // 👈 URL của Frontend
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  // 2. Cấu hình email
  const mailOptions = {
    from: '"VolunteerHub" <no-reply@volunteerhub.com>',
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

  // 3. Gửi email
  try {
    const transporter = await createEtherealTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log('Đã gửi email (Reset Pass): %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Lỗi khi gửi email (Reset Pass):', error);
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
