const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan'); // Dùng để log request
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const apiRoutes = require('./routes/api'); // File index của routes
const errorHandler = require('./middlewares/errorHandler'); // 👈 1. Import

const swaggerUi = require('swagger-ui-express'); // 👈 Import
const swaggerSpec = require('./config/swaggerConfig'); // 👈 Import

const app = express();
app.use
app.use(helmet()); // Bảo mật headers
app.use(cors(/* Cấu hình cors tại đây */));
app.use(express.json()); // Thay thế body-parser
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Đọc cookie
app.use(morgan('dev')); // Log request (dev/combined)

app.use('/api/', apiRoutes);

app.use(
  '/api-docs', // Endpoint bạn muốn
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }', // Ẩn topbar của Swagger
    customSiteTitle: 'VolunteerHub API Docs',
  })
);

app.use((req, res, next) => {
  next(createError(404, 'Không tìm thấy route này'));
});

app.use(errorHandler);

module.exports = app;