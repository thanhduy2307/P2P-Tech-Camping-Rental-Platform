const Message = require('../models/Message');
const User = require('../models/User');

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, imageUrl } = req.body;
    if (!receiverId || (!content && !imageUrl)) {
      return res.status(400).json({ success: false, message: 'Receiver and either content or imageUrl are required' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content: content || '',
      imageUrl: imageUrl || ''
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Find all messages involving the current user
    const messages = await Message.find({
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId }
      ]
    }).sort({ createdAt: -1 });

    // Group messages by the other user's ID
    const conversationsMap = {};

    for (const msg of messages) {
      const otherUserId = msg.sender.toString() === currentUserId.toString()
        ? msg.receiver.toString()
        : msg.sender.toString();

      if (!conversationsMap[otherUserId]) {
        conversationsMap[otherUserId] = {
          lastMessage: msg,
          unreadCount: 0
        };
      }

      // Count unread messages sent by the other user to the current user
      if (msg.receiver.toString() === currentUserId.toString() && msg.sender.toString() === otherUserId && !msg.isRead) {
        conversationsMap[otherUserId].unreadCount += 1;
      }
    }

    // Fetch user details for all other users
    const otherUserIds = Object.keys(conversationsMap);
    const otherUsers = await User.find({ _id: { $in: otherUserIds } }).select('name email role avatar');

    const conversations = otherUsers.map(user => {
      const convInfo = conversationsMap[user._id.toString()];
      return {
        user,
        lastMessage: convInfo.lastMessage,
        unreadCount: convInfo.unreadCount
      };
    });

    // Sort conversations by the last message's createdAt desc
    conversations.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Mark all messages from userId to currentUserId as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
