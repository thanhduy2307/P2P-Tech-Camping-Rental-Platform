const express = require('express');
const {
  sendMessage,
  getMessages,
  getConversations,
  markAsRead
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All chat routes are protected
router.use(protect);

router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.get('/:userId', getMessages);
router.put('/read/:userId', markAsRead);

module.exports = router;
