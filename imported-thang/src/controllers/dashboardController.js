// src/controllers/dashboardController.js
const dashboardService = require('../services/dashboardService');

/**
 * @desc    Lấy dữ liệu Dashboard (theo vai trò)
 * @route   GET /api/v1/dashboard
 * @access  Authenticated
 */
const getDashboard = async (req, res, next) => {
  try {
    // Lấy user từ middleware `auth`
    const user = req.user;
    
    const data = await dashboardService.getDashboardData(user);
    
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const getSystemStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getSystemStats();
    
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getSystemStats,
};