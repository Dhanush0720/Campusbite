const jwt = require('jsonwebtoken');
const User = require('../models/User');

let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  // Authenticate every socket connection with the same JWT used for REST calls.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user || !user.isActive) return next(new Error('Invalid user'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const { _id, role } = socket.user;
    // Personal room: order updates for this specific user
    socket.join(`user:${_id}`);
    // Role rooms: staff/manager dashboards get operational broadcasts
    socket.join(`role:${role}`);

    socket.on('disconnect', () => {
      // no-op; rooms are cleaned up automatically
    });
  });
};

// Helpers used by controllers/services to push events.
// Socket.IO here is a NOTIFICATION channel only - MongoDB remains the source of truth for order state.
const notifyUser = (userId, event, payload) => {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};

const notifyRole = (role, event, payload) => {
  if (!ioInstance) return;
  ioInstance.to(`role:${role}`).emit(event, payload);
};

module.exports = { initSocket, notifyUser, notifyRole };
