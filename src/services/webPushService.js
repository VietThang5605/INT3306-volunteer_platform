const webpush = require('web-push');
const prisma = require('../prisma/client');

// Cấu hình VAPID keys (cần tạo 1 lần và lưu vào .env)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

/**
 * Lưu push subscription của user
 */
const subscribe = async (userId, subscription, userAgent) => {
  const { endpoint, keys } = subscription;

  // Upsert: nếu endpoint đã tồn tại thì update, không thì tạo mới
  const result = await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent,
    },
    create: {
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent,
    },
  });

  console.log(`[WebPush] User ${userId} subscribed`);
  return result;
};

/**
 * Xóa push subscription
 */
const unsubscribe = async (userId, endpoint) => {
  const { count } = await prisma.pushSubscription.deleteMany({
    where: {
      userId,
      endpoint,
    },
  });

  console.log(`[WebPush] User ${userId} unsubscribed, deleted: ${count}`);
  return count > 0;
};

/**
 * Gửi push notification đến 1 user
 */
const sendToUser = async (userId, payload) => {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[WebPush] VAPID keys not configured, skipping push');
    return;
  }

  try {
    // Check nếu bảng PushSubscription chưa tồn tại (chưa migrate)
    if (!prisma.pushSubscription) {
      console.warn('[WebPush] PushSubscription table not available, skipping push');
      return;
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      console.log(`[WebPush] No subscriptions for user ${userId}`);
      return;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title || 'Thông báo mới',
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      data: payload.data || {},
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notificationPayload
          );
          return { success: true, endpoint: sub.endpoint };
        } catch (error) {
          // Nếu subscription không còn hợp lệ (410 Gone), xóa khỏi DB
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({
              where: { id: sub.id },
            });
            console.log(`[WebPush] Removed invalid subscription: ${sub.endpoint}`);
          }
          throw error;
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    console.log(`[WebPush] Sent to user ${userId}: ${successful}/${subscriptions.length}`);
  } catch (error) {
    console.error(`[WebPush] Error sending to user ${userId}:`, error);
  }
};

/**
 * Lấy VAPID public key để client subscribe
 */
const getVapidPublicKey = () => {
  return vapidPublicKey;
};

module.exports = {
  subscribe,
  unsubscribe,
  sendToUser,
  getVapidPublicKey,
};
