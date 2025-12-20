const Joi = require('joi');

// Validator cho GET /events (lọc và phân trang)
const listEventsSchema = Joi.object({
  // Phân trang
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),

  // Lọc (Tùy chọn)
  categoryId: Joi.number().integer().min(1).optional(),
  
  // Lọc thời gian: 'upcoming' (sắp diễn ra), 'past' (đã diễn ra)
  time: Joi.string().valid('upcoming', 'past').optional(),
  
  // Sắp xếp
  sortBy: Joi.string().valid('startTime', 'createdAt').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

const eventIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID sự kiện phải là một UUID hợp lệ',
    'any.required': 'ID sự kiện là bắt buộc',
  }),
});

const createEventSchema = Joi.object({
  name: Joi.string().min(5).required().messages({
    'string.min': 'Tên sự kiện phải có ít nhất 5 ký tự',
    'any.required': 'Tên sự kiện là bắt buộc',
  }),
  description: Joi.string().optional().allow(null, ''),
  location: Joi.string().optional().allow(null, ''),
  
  // Yêu cầu thời gian là chuỗi ISO (YYYY-MM-DDTHH:mm:ssZ)
  startTime: Joi.date().iso().required().messages({
    'date.format': 'Thời gian bắt đầu (startTime) phải là chuỗi ISO 8601',
    'any.required': 'Thời gian bắt đầu là bắt buộc',
  }),
  
  endTime: Joi.date().iso()
    .greater(Joi.ref('startTime')) // Phải sau startTime
    .required()
    .messages({
      'date.greater': 'Thời gian kết thúc (endTime) phải sau thời gian bắt đầu',
      'any.required': 'Thời gian kết thúc là bắt buộc',
    }),

  categoryId: Joi.number().integer().min(1).optional().allow(null),
  capacity: Joi.number().integer().min(1).optional().allow(null),
  cover: Joi.any().optional(),
  
  // Bất kỳ trường nào khác (như status, managerId) sẽ tự động bị Joi lọc bỏ
});

const updateEventSchema = Joi.object({
  name: Joi.string().min(5).optional().messages({
    'string.min': 'Tên sự kiện phải có ít nhất 5 ký tự',
  }),
  description: Joi.string().optional().allow(null, ''),
  location: Joi.string().optional().allow(null, ''),
  
  // Dùng Joi.date() (không .iso()) để linh hoạt
  startTime: Joi.date().optional(),
  
  endTime: Joi.date().optional(), // Logic so sánh (greater) sẽ ở service
  
  categoryId: Joi.number().integer().min(1).optional().allow(null),
  capacity: Joi.number().integer().min(1).optional().allow(null),
})
  .min(1) // Phải có ít nhất 1 trường để cập nhật
  .messages({
    'object.min': 'Phải cung cấp ít nhất một trường để cập nhật',
  });


module.exports = {
  listEventsSchema,
  eventIdSchema,
  createEventSchema,
  updateEventSchema,
};
