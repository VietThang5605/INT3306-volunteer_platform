const userService = require('../services/userService');

const getUsers = async (req, res, next) => {
  try {
    const options = req.query;
    
    const result = await userService.listUsers(options);
    
    res.status(200).json({message: 'Lấy thông tin người dùng thành công', data: result});
  } catch (error) {
    next(error);
  }
};


const getUser = async (req, res, next) => {
  try {
    // Lấy ID từ params (đã được Joi validate)
    const { id } = req.params;
    
    const user = await userService.getUserById(id);
    
    res.status(200).json({message: 'Lấy thông tin người dùng thành công', data: user});
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params; // Lấy ID từ URL
    const updateData = req.body; // Lấy data từ body

    const adminId = req.user.id; 

    const updatedUser = await userService.updateUserById(id, updateData, adminId);
    
    res.status(200).json({message: 'Cập nhật thành công', updatedUser});
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id: userIdToDelete } = req.params; // 1. ID của user BỊ xóa (từ URL)
    const adminId = req.user.id; // 2. ID của Admin ĐANG xóa

    await userService.deleteUserById(userIdToDelete, adminId);
    
    // 204 No Content là response chuẩn cho việc xóa thành công
    res.status(204).json({message: 'Xóa người dùng thành công'});
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};