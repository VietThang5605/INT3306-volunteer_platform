const adminService = require('../services/adminService');
const eventService = require('../services/eventService');

const approveEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await adminService.approveEvent(id);
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
};

const getEventDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await adminService.getEventDetail(id);
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
};

const exportEvents = async (req, res, next) => {
  try {
    // 1. Lấy `format` (đã có mặc định 'json' từ Joi)
    const { format } = req.query;

    // 2. Gọi service, service sẽ trả về data và contentType
    const { contentType, data } = await adminService.exportEvents(format);

    // 3. Tạo tên file động
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fileName = `volunteerhub-events-${date}.${format}`;

    // 4. Set headers để trình duyệt tự động tải file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // 5. Gửi data
    if (format === 'json') {
      res.json(data);
    } else {
      // res.send() đủ thông minh để xử lý cả
      // string (từ CSV) và buffer (từ XLSX)
      res.send(data);
    }
  } catch (error) {
    next(error);
  }
};

const exportUsers = async (req, res, next) => {
  try {
    const { format } = req.query; // Joi cung cấp mặc định

    const { contentType, data } = await adminService.exportUsers(format);

    const date = new Date().toISOString().split('T')[0];
    const fileName = `volunteerhub-users-${date}.${format}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    if (format === 'json') {
      res.json(data);
    } else {
      res.send(data);
    }
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id: eventId } = req.params; // Lấy ID sự kiện

    await adminService.deleteEventByAdmin(eventId);
    
    // 204 No Content là response chuẩn
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  approveEvent,
  exportEvents,
  exportUsers,
  deleteEvent,
  getEventDetail,
  getDashboardStats,
};