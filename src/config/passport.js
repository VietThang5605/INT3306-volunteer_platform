// src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../prisma/client');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
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
          // Lấy lại thông tin user mới nhất từ DB (bao gồm avatarUrl đã được update)
          // để đảm bảo trả về đúng avatar hiện tại, không phải avatar từ Google
          user = await prisma.user.findUnique({
            where: { id: user.id },
          });
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
            isEmailVerified: true, // Email Google đã xác thực
            phoneNumber: 'null',
            location: 'null',
            dob: new Date('1979-12-31'),
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