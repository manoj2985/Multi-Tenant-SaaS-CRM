const { Server } = require('socket.io');
const config = require('./env');
const { verifyAccessToken } = require('../utils/token');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.corsOrigin === '*' ? '*' : config.corsOrigin,
      methods: ['GET', 'POST']
    }
  });

  // JWT Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!authHeader) {
        return next(new Error('Authentication failed: No token provided'));
      }

      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
      const decoded = verifyAccessToken(token);

      socket.userId = decoded.userId;
      socket.companyId = decoded.companyId;
      socket.role = decoded.role;

      next();
    } catch (err) {
      return next(new Error('Authentication failed: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Join tenant-isolated and user-isolated room
    const userRoom = `user:${socket.userId}`;
    const companyRoom = `company:${socket.companyId}`;

    socket.join(userRoom);
    socket.join(companyRoom);

    socket.on('disconnect', () => {
      socket.leave(userRoom);
      socket.leave(companyRoom);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

const sendNotificationToUser = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
};

module.exports = {
  initSocket,
  getIO,
  sendNotificationToUser
};
