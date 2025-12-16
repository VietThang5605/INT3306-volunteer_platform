// src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../prisma/client');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/v1/auth/google/callback', // Phải khớp với Google Console
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // profile chứa thông tin từ Google (id, email, displayName, photos...)
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const photo = profile.photos ? profile.photos[0].value : null;

        // 1. Kiểm tra user đã tồn tại chưa
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // 2a. Nếu user đã tồn tại
          // Nếu chưa có googleId (trước đây đk bằng email/pass), ta cập nhật thêm googleId
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: googleId, avatarUrl: user.avatarUrl || photo },
            });
          }
          return done(null, user);
        }

        // 2b. Nếu user chưa tồn tại -> Tạo mới (Register tự động)
        user = await prisma.user.create({
          data: {
            email: email,
            fullName: profile.displayName,
            googleId: googleId,
            avatarUrl: photo,
            role: 'VOLUNTEER', // Mặc định là TNV
            isActive: true, // Email Google đã xác thực nên active luôn
            // passwordHash để null
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;