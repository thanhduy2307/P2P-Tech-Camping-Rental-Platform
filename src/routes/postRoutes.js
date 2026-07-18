const express = require('express');
const {
  createPost,
  getAllPosts,
  getUserPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLikePost,
  commentPost,
  generateAIPostContent,
  sharePost
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.get('/user/:userId', getUserPosts);

// Protected routes (require login)
router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

router.post('/:id/like', protect, toggleLikePost);
router.post('/:id/comment', protect, commentPost);
router.post('/:id/share', protect, sharePost);

router.post('/generate-ai-content', protect, generateAIPostContent);

module.exports = router;
