const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { socketHandlers } = require('./socketHandlers');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Expose io globally for cron jobs
  global.io = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      socket.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.userId})`);
    
    socket.join(`user:${socket.userId}`);
    
    if (socket.user.location?.region) {
      socket.join(`region:${socket.user.location.region}`);
    }
    
    socket.join(`role:${socket.user.role}`);

    socket.on('join_chat', (chatId) => {
      socket.join(`chat:${chatId}`);
      console.log(`User ${socket.userId} joined chat ${chatId}`);
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on('send_message', async (data) => {
      const { chatId, message, recipientId } = data;
      
      const messageData = {
        senderId: socket.userId,
        senderName: socket.user.name,
        message,
        timestamp: new Date(),
        chatId
      };

      io.to(`chat:${chatId}`).emit('new_message', messageData);
      
      io.to(`user:${recipientId}`).emit('message_notification', {
        from: socket.user.name,
        preview: message.substring(0, 50),
        chatId
      });
    });

    socket.on('typing', (data) => {
      socket.to(`chat:${data.chatId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.name
      });
    });

    socket.on('stop_typing', (data) => {
      socket.to(`chat:${data.chatId}`).emit('user_stop_typing', {
        userId: socket.userId
      });
    });

    socket.on('track_delivery', (deliveryId) => {
      socket.join(`delivery:${deliveryId}`);
    });

    socket.on('update_location', async (data) => {
      const { deliveryId, latitude, longitude } = data;
      
      io.to(`delivery:${deliveryId}`).emit('location_update', {
        deliveryId,
        latitude,
        longitude,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  // Initialize enhanced socket handlers
  socketHandlers(io);

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToRegion = (region, event, data) => {
  if (io) {
    io.to(`region:${region}`).emit(event, data);
  }
};

const emitToRole = (role, event, data) => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToRegion,
  emitToRole,
  emitToAll
};
