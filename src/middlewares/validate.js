const createError = require('http-errors');

/**
 * Middleware factory function để tạo ra một middleware validation.
 * Nó nhận vào một Joi schema.
 *
 * @param {Joi.Schema} schema - Joi schema để validate.
 * @param {'body' | 'query' | 'params'} [source='body'] - Nguồn dữ liệu (mặc định là 'body').
 * @returns {Function} - Middleware của Express.
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    // 1. Chọn nguồn dữ liệu để validate (body, query, params)
    const dataToValidate = req[source];

    // 2. Thực hiện validation
    // `abortEarly: false` -> Thu thập TẤT CẢ lỗi, không chỉ lỗi đầu tiên
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
    });

    if (error) {
      // 3. Nếu có lỗi, gom các thông báo lỗi lại
      // error.details là một mảng, ví dụ: [{ message: "Lỗi A" }, { message: "Lỗi B" }]
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', '); // Nối các lỗi lại, ví dụ: "Lỗi A, Lỗi B"

      // 4. Gửi lỗi 400 (Bad Request) đến errorHandler
      return next(createError(400, errorMessage));
    }

    // 5. Nếu không có lỗi:
    // Ghi đè lại req[source] bằng dữ liệu đã được Joi làm sạch (ví dụ: ép kiểu)
    req[source] = value;
    
    // 6. Cho phép đi tiếp
    next();
  };
};

module.exports = validate;