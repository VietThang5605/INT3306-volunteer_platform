const cloudinary = require('cloudinary');
const multer = require('multer');
const cloudinaryStorage = require('multer-storage-cloudinary');

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'volunteer-hub',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
  },
});

const upload = multer({ storage });

module.exports = upload;