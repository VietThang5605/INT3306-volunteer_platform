const eventService = require('../services/eventService');

const getPublicEvents = async (req, res, next) => {
  try {
    const options = req.query;
    
    const result = await eventService.listPublicEvents(options);
    
    res.status(200).json({message: 'Lấy dữ liệu thành công', result});
  } catch (error) {
    next(error);
  }
};

const getPublicEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const event = await eventService.getPublicEventById(id);
    
    res.status(200).json({message: 'Lấy dữ liệu thành công', event});
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    // 1. Lấy ID của Manager từ middleware `auth`
    const managerId = req.user.id;
    
    // 2. Lấy dữ liệu sự kiện từ body (đã được Joi validate)
    const eventData = req.body;
    
    // 3. Xử lý ảnh bìa (nếu có)
    if (req.file) {
      // Multer Cloudinary lưu URL vào `path` hoặc `secure_url`
      eventData.coverUrl = req.file.path || req.file.secure_url;
    }
    // Xóa trường 'cover' (dư thừa từ frontend) để tránh lỗi Prisma
    delete eventData.cover;

    const newEvent = await eventService.createEvent(eventData, managerId);
    // 201 Created là status code chuẩn cho việc tạo mới thành công
    res.status(201).json({message: 'Tạo sự kiện thành công', event: newEvent});
  } catch (error) {
    next(error);
  }
};
const getAllEvents = async (req, res, next) => {
  try {
    const options = req.query; // { page, limit, status, search }
    // Gọi service
    const result = await eventService.getAllEventsForAdmin(options);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getMyEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const managerId = req.user.id;
    const event = await eventService.getEventByIdForManager(id, managerId);
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const { id: eventId } = req.params; // 1. Lấy ID sự kiện
    const managerId = req.user.id;      // 2. Lấy ID Manager (chủ sở hữu)
    const eventData = req.body;       // 3. Lấy dữ liệu cập nhật

    const updatedEvent = await eventService.updateEvent(
      eventId,
      managerId,
      eventData
    );
    
    res.status(200).json(updatedEvent);
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id: eventId } = req.params; // 1. Lấy ID sự kiện
    const managerId = req.user.id;      // 2. Lấy ID Manager (chủ sở hữu)

    await eventService.deleteEvent(eventId, managerId);
    
    // 204 No Content là response chuẩn cho việc xóa thành công
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getMyEvents = async (req, res, next) => {
  try {
    const managerId = req.user.id; // Lấy ID từ token
    const options = req.query; // { page, limit, status, search }

    const result = await eventService.getEventsByManager(managerId, options);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getEventMembers = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const options = req.query;

    const result = await eventService.getEventMembers(eventId, options);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getMyEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const managerId = req.user.id;
    
    const event = await eventService.getEventByIdForManager(id, managerId);
    
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicEvents,
  getPublicEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getEventMembers,
  getAllEvents,
  getMyEvent,
};