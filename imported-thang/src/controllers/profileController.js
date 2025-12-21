const profileService = require('../services/profileService');

const getProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const profile = await profileService.getProfileById(id);
    
    res.status(200).json({message: 'Lấy dữ liệu thành công', profile});
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
};