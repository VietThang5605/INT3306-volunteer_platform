const webPushService = require('../services/webPushService');

/**
 * @desc    Lấy VAPID public key
 * @route   GET /api/v1/push/vapid-public-key
 * @access  Public
 */
const getVapidPublicKey = async (req, res, next) => {
  try {
    const key = webPushService.getVapidPublicKey();
    
    if (!key) {
      return res.status(503).json({
        message: 'Push notifications chưa được cấu hình',
      });
    }

    res.status(200).json({ vapidPublicKey: key });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đăng ký nhận push notification
 * @route   POST /api/v1/push/subscribe
 * @access  Authenticated
 */
const subscribe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subscription = req.body.subscription;
    const userAgent = req.headers['user-agent'];

    await webPushService.subscribe(userId, subscription, userAgent);

    res.status(201).json({ message: 'Đăng ký push notification thành công' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Hủy đăng ký push notification
 * @route   POST /api/v1/push/unsubscribe
 * @access  Authenticated
 */
const unsubscribe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { endpoint } = req.body;

    const deleted = await webPushService.unsubscribe(userId, endpoint);

    // Luôn trả 200, dù có xóa được hay không
    res.status(200).json({ 
      message: deleted ? 'Hủy đăng ký thành công' : 'Không có subscription để hủy',
      deleted 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
};
