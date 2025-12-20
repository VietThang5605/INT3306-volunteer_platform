const cloudinary = require('cloudinary');
const CloudinaryStorage = require('multer-storage-cloudinary'); // Import chuẩn cho v2.x
const multer = require('multer');

// Config Cloudinary trước
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary, // Truyền object root (chứa .v2)
  params: {
    folder: 'volunteer-hub',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    resource_type: 'auto',
  },
});

const upload = multer({ storage: storage });

module.exports = upload;