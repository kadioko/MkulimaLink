const Auction = require('../models/Auction');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');

// WebSocket event handlers
const socketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // User authentication
    socket.on('authenticate', (userId) => {
      socket.userId = userId;
      socket.join(`user_${userId}`);
      console.log(`User ${userId} authenticated on socket ${socket.id}`);
    });

    // Auction events
    socket.on('join_auction', (auctionId) => {
      socket.join(`auction_${auctionId}`);
      console.log(`Socket ${socket.id} joined auction ${auctionId}`);
      
      // Notify others that someone joined
      socket.to(`auction_${auctionId}`).emit('bidder_joined', {
        auctionId,
        timestamp: new Date()
      });
    });

    socket.on('leave_auction', (auctionId) => {
      socket.leave(`auction_${auctionId}`);
      console.log(`Socket ${socket.id} left auction ${auctionId}`);
    });

    socket.on('place_bid', async (data) => {
      const { auctionId, amount, userId } = data;
      
      try {
        const auction = await Auction.findById(auctionId);
        if (!auction || !auction.isActive()) return;
        
        // Broadcast bid to all in auction room
        io.to(`auction_${auctionId}`).emit('bid_placed', {
          auctionId,
          amount,
          bidder: userId,
          timestamp: new Date(),
          totalBids: auction.bids.length
        });
        
        // Notify previous bidder they were outbid
        const previousBid = auction.getHighestBidder();
        if (previousBid && previousBid.bidder.toString() !== userId) {
          io.to(`user_${previousBid.bidder}`).emit('outbid', {
            auctionId,
            productName: auction.product?.name,
            newBid: amount
          });
        }
      } catch (error) {
        console.error('Bid handling error:', error);
      }
    });

    socket.on('auction_timer_sync', (auctionId, timeLeft) => {
      io.to(`auction_${auctionId}`).emit('timer_update', { auctionId, timeLeft });
    });

    // Chat events
    socket.on('join_chat', (chatId) => {
      socket.join(`chat_${chatId}`);
    });

    socket.on('send_message', async (data) => {
      const { chatId, message, senderId, type = 'text' } = data;
      
      try {
        // Save message to database
        const chat = await Chat.findById(chatId);
        if (chat) {
          chat.messages.push({
            sender: senderId,
            content: message,
            type,
            timestamp: new Date()
          });
          await chat.save();
          
          // Broadcast to all in chat
          io.to(`chat_${chatId}`).emit('new_message', {
            chatId,
            message: {
              sender: senderId,
              content: message,
              type,
              timestamp: new Date()
            }
          });
          
          // Notify offline users
          chat.participants.forEach(participantId => {
            if (participantId.toString() !== senderId) {
              io.to(`user_${participantId}`).emit('chat_notification', {
                chatId,
                senderId,
                preview: message.substring(0, 50)
              });
            }
          });
        }
      } catch (error) {
        console.error('Chat message error:', error);
      }
    });

    socket.on('typing', (data) => {
      const { chatId, userId, isTyping } = data;
      socket.to(`chat_${chatId}`).emit('typing', { userId, isTyping });
    });

    // Notification events
    socket.on('subscribe_notifications', (userId) => {
      socket.join(`notifications_${userId}`);
    });

    // Product events
    socket.on('watch_product', (productId) => {
      socket.join(`product_${productId}`);
    });

    socket.on('unwatch_product', (productId) => {
      socket.leave(`product_${productId}`);
    });

    // Price alert events
    socket.on('subscribe_price_alerts', (userId) => {
      socket.join(`price_alerts_${userId}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return {
    // Helper methods for server-side events
    notifyUser: (userId, event, data) => {
      io.to(`user_${userId}`).emit(event, data);
    },

    notifyAuction: (auctionId, event, data) => {
      io.to(`auction_${auctionId}`).emit(event, data);
    },

    broadcastPriceAlert: (productId, alert) => {
      io.to(`product_${productId}`).emit('price_alert', alert);
    },

    notifyAll: (event, data) => {
      io.emit(event, data);
    }
  };
};

// Cron job handler for auction endings
const handleAuctionEnding = async (io) => {
  const endingSoon = await Auction.find({
    status: 'active',
    endTime: {
      $lte: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      $gt: new Date()
    }
  });

  endingSoon.forEach(auction => {
    const timeLeft = Math.floor((auction.endTime - new Date()) / 1000);
    io.to(`auction_${auction._id}`).emit('ending_soon', {
      auctionId: auction._id,
      timeLeft,
      currentBid: auction.currentBid
    });
  });
};

// Cron job handler for ended auctions
const handleEndedAuctions = async (io) => {
  const ended = await Auction.find({
    status: 'active',
    endTime: { $lte: new Date() }
  });

  for (const auction of ended) {
    auction.status = 'ended';
    const winner = auction.getHighestBidder();
    if (winner) {
      auction.winner = winner.bidder;
    }
    await auction.save();

    // Notify participants
    io.to(`auction_${auction._id}`).emit('auction_ended', {
      auctionId: auction._id,
      winner: winner ? winner.bidder : null,
      finalPrice: auction.currentBid
    });

    // Notify winner
    if (winner) {
      io.to(`user_${winner.bidder}`).emit('auction_won', {
        auctionId: auction._id,
        productName: auction.product?.name,
        amount: auction.currentBid
      });
    }

    // Notify seller
    io.to(`user_${auction.seller}`).emit('auction_sold', {
      auctionId: auction._id,
      finalPrice: auction.currentBid,
      winner: winner?.bidder
    });
  }
};

module.exports = { socketHandlers, handleAuctionEnding, handleEndedAuctions };
