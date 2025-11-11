const registrationService = require('../services/registrationService');

const getRegistrations = async (req, res, next) => {
  try {
    // 1. Lấy user từ middleware `auth`
    const user = req.user;
    
    // 2. Lấy options từ middleware `validate`
    const options = req.query;
    
    const result = await registrationService.listRegistrations(user, options);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const createRegistration = async (req, res, next) => {
  try {
    // 1. Lấy ID sự kiện từ params
    const { id: eventId } = req.params;
    // 2. Lấy ID user từ middleware `auth`
    const userId = req.user.id;
    
    const newRegistration = await registrationService.createRegistration(
      eventId,
      userId
    );
    
    // 201 Created
    res.status(201).json(newRegistration);
  } catch (error) {
    next(error);
  }
};

const deleteRegistration = async (req, res, next) => {
  try {
    const { id: registrationId } = req.params; // 1. Lấy ID đăng ký
    const userId = req.user.id;             // 2. Lấy ID user

    await registrationService.deleteRegistration(registrationId, userId);
    
    // 204 No Content
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getRegistrationsForEvent = async (req, res, next) => {
  try {
    const { id: eventId } = req.params; // 1. Lấy ID sự kiện
    const managerId = req.user.id;      // 2. Lấy ID Manager
    const options = req.query;        // 3. Lấy tùy chọn lọc/phân trang

    const result = await registrationService.listRegistrationsForEvent(
      eventId,
      managerId,
      options
    );
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateRegistrationStatus = async (req, res, next) => {
  try {
    const { id: registrationId } = req.params; // 1. Lấy ID đăng ký
    const managerId = req.user.id;            // 2. Lấy ID Manager
    const { status: newStatus } = req.body; // 3. Lấy trạng thái mới

    const updatedReg = await registrationService.updateRegistrationStatus(
      registrationId,
      managerId,
      newStatus
    );
    
    res.status(200).json(updatedReg);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRegistrations,
  createRegistration,
  deleteRegistration,
  getRegistrationsForEvent,
  updateRegistrationStatus,
};