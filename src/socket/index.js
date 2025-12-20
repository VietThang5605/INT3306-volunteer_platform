const { Server } = require('socket.io');

let io = null;

/**
 * Khởi tạo Socket.IO server
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // User join vào room của post để nhận update
    socket.on('join_post', (postId) => {
      socket.join(`post:${postId}`);
      console.log(`[Socket] ${socket.id} joined post:${postId}`);
    });

    // User rời khỏi room
    socket.on('leave_post', (postId) => {
      socket.leave(`post:${postId}`);
      console.log(`[Socket] ${socket.id} left post:${postId}`);
    });

    // User join vào room của event
    socket.on('join_event', (eventId) => {
      socket.join(`event:${eventId}`);
      console.log(`[Socket] ${socket.id} joined event:${eventId}`);
    });

    socket.on('leave_event', (eventId) => {
      socket.leave(`event:${eventId}`);
    });

    // User join vào room cá nhân để nhận notification
    socket.on('join_user', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket] ${socket.id} joined user:${userId}`);
    });

    socket.on('leave_user', (userId) => {
      socket.leave(`user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Lấy instance của Socket.IO
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO chưa được khởi tạo!');
  }
  return io;
};

/**
 * Emit event đến tất cả user đang xem 1 post
 */
const emitToPost = (postId, event, data) => {
  if (io) {
    io.to(`post:${postId}`).emit(event, data);
  }
};

/**
 * Emit event đến tất cả user đang xem 1 event
 */
const emitToEvent = (eventId, event, data) => {
  if (io) {
    io.to(`event:${eventId}`).emit(event, data);
  }
};

/**
 * Emit event đến 1 user cụ thể (dùng cho notification)
 */
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToPost,
  emitToEvent,
  emitToUser,
};
