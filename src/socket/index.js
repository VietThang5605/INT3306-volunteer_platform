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
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on('join_post', (postId) => {
      if (!postId) return;
      socket.join(`post:${postId}`);
    });

    socket.on('leave_post', (postId) => {
      if (!postId) return;
      socket.leave(`post:${postId}`);
    });

    socket.on('join_event', (eventId) => {
      if (!eventId) return;
      socket.join(`event:${eventId}`);
    });

    socket.on('leave_event', (eventId) => {
      if (!eventId) return;
      socket.leave(`event:${eventId}`);
    });

    socket.on('join_user', (userId) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
    });

    socket.on('leave_user', (userId) => {
      if (!userId) return;
      socket.leave(`user:${userId}`);
    });

    socket.on('error', (error) => {
      console.error(`[Socket] Error: ${socket.id}`, error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} - ${reason}`);
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

const emitToPost = (postId, event, data) => {
  if (io) {
    io.to(`post:${postId}`).emit(event, data);
  }
};

const emitToEvent = (eventId, event, data) => {
  if (io) {
    io.to(`event:${eventId}`).emit(event, data);
  }
};

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
