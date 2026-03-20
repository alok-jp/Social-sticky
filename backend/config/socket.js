const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');

module.exports = (io) => {
  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    // Missing token
    if (!token) {
      // Log origin/addr for debugging (do not print token)
      console.warn(`Socket auth failed: missing token (handshake origin=${socket.handshake.headers.origin || 'unknown'})`);
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      // Invalid token
      console.warn(`Socket auth failed: invalid token (origin=${socket.handshake.headers.origin || 'unknown'}). Error: ${err.message}`);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.userId}`);

    // join a personal room so we can send friend-specific updates
    try {
      socket.join(`user_${socket.userId}`);
    } catch (e) { /* ignore */ }

    // Join a group room
    socket.on('join_group', (groupId) => {
      socket.join(`group_${groupId}`);
    });

    socket.on('leave_group', (groupId) => {
      socket.leave(`group_${groupId}`);
    });

    // Send message
    socket.on('send_message', async ({ groupId, content }) => {
      try {
        const user = await User.findById(socket.userId).select('name avatar');
        const message = await Message.create({
          group: groupId,
          sender: socket.userId,
          content,
        });
        const populated = await message.populate('sender', 'name avatar');
        io.to(`group_${groupId}`).emit('new_message', populated);
      } catch (err) {
        socket.emit('error', err.message);
      }
    });

    // Typing indicator
    socket.on('typing', ({ groupId, name }) => {
      socket.to(`group_${groupId}`).emit('user_typing', { name });
    });

    socket.on('stop_typing', ({ groupId }) => {
      socket.to(`group_${groupId}`).emit('user_stop_typing');
    });

    // Task update broadcast
    socket.on('task_update', ({ groupId, task }) => {
      socket.to(`group_${groupId}`).emit('task_updated', task);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.userId}`);
    });
  });
};
