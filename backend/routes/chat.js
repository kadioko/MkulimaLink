const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { protect } = require('../middleware/auth');
const { emitToUser } = require('../utils/socket');

router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      isActive: true
    })
    .populate('participants', 'name avatar location rating')
    .populate('product', 'name images price')
    .sort({ 'lastMessage.timestamp': -1 });

    const chatsWithUnread = chats.map(chat => ({
      ...chat.toObject(),
      unreadCount: chat.unreadCount.get(req.user._id.toString()) || 0
    }));

    res.json(chatsWithUnread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/start', protect, async (req, res) => {
  try {
    const { recipientId, productId, initialMessage } = req.body;

    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, recipientId] },
      product: productId || null,
      type: 'direct'
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user._id, recipientId],
        type: 'direct',
        product: productId
      });
    }

    if (initialMessage) {
      await chat.addMessage(req.user._id, initialMessage, 'text');
      
      emitToUser(recipientId, 'new_chat', {
        chatId: chat._id,
        from: req.user.name,
        message: initialMessage
      });
    }

    await chat.populate('participants', 'name avatar location rating');
    await chat.populate('product', 'name images price');

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:chatId', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('participants', 'name avatar location rating phone')
      .populate('product', 'name images price quantity')
      .populate('messages.sender', 'name avatar');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await chat.markAsRead(req.user._id);

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:chatId/messages', protect, async (req, res) => {
  try {
    const { content, type, productRef, offer } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const message = await chat.addMessage(req.user._id, content, type || 'text', {
      productRef,
      offer
    });

    const recipientId = chat.participants.find(p => p.toString() !== req.user._id.toString());
    
    emitToUser(recipientId, 'new_message', {
      chatId: chat._id,
      message: {
        ...message.toObject(),
        sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:chatId/offer', protect, async (req, res) => {
  try {
    const { amount, quantity, productId } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const message = await chat.addMessage(
      req.user._id,
      `Offer: ${quantity} units at ${amount} TZS each`,
      'offer',
      {
        productRef: productId,
        offer: { amount, quantity, status: 'pending' }
      }
    );

    const recipientId = chat.participants.find(p => p.toString() !== req.user._id.toString());
    
    emitToUser(recipientId, 'new_offer', {
      chatId: chat._id,
      offer: message.offer,
      from: req.user.name
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:chatId/offer/:messageId', protect, async (req, res) => {
  try {
    const { status, counterAmount } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const message = chat.messages.id(req.params.messageId);
    if (!message || message.type !== 'offer') {
      return res.status(404).json({ message: 'Offer not found' });
    }

    message.offer.status = status;
    if (counterAmount) {
      message.offer.counterAmount = counterAmount;
    }

    await chat.save();

    const recipientId = chat.participants.find(p => p.toString() !== req.user._id.toString());
    
    emitToUser(recipientId, 'offer_updated', {
      chatId: chat._id,
      messageId: message._id,
      status,
      counterAmount
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:chatId/read', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    await chat.markAsRead(req.user._id);

    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/unread/count', protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      isActive: true
    });

    let totalUnread = 0;
    chats.forEach(chat => {
      totalUnread += chat.unreadCount.get(req.user._id.toString()) || 0;
    });

    res.json({ unreadCount: totalUnread });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



