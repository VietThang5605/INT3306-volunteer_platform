// src/config/swaggerConfig.js
const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  // 1. Định nghĩa thông tin cơ bản
  definition: {
    openapi: '3.0.0', // Chuẩn OpenAPI
    info: {
      title: 'VolunteerHub API',
      version: '1.0.0',
      description: 'Tài liệu API chính thức cho dự án VolunteerHub.',
    },
    // (Quan trọng) Máy chủ API của bạn
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000/api',
        description: 'Development Server',
      },
      {
        url: process.env.PRODUCTION_API_BASE_URL,
        description: 'Production Server',
      },
    ],
    // (Quan trọng) Định nghĩa bảo mật (Bearer Token)
    components: {
      securitySchemes: {
        BearerAuth: { // Đặt tên cho scheme
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập Access Token (JWT) vào đây',
        },
      },
    },
    security: [
      {
        BearerAuth: [], // Áp dụng BearerAuth cho tất cả API (mặc định)
      },
    ],
  },
  // 2. (QUAN TRỌNG) Đường dẫn đến các file chứa JSDoc
  // Swagger sẽ quét các file này để tìm comment
  apis: [path.join(__dirname, '../routes/api/*.js')], // Sử dụng path.join để có đường dẫn tuyệt đối
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;