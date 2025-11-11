// src/config/swaggerConfig.js
const swaggerJSDoc = require('swagger-jsdoc');

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
        url: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
        description: 'Development Server',
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
  apis: ['./src/routes/api/*.js'], // Quét tất cả file router
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;