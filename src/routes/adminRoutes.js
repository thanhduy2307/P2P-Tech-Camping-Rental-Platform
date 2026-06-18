const express = require('express');
const {
  getStats,
  getUsers,
  updateUserRole,
  toggleUserBan,
  getAssets,
  getOrders
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Tất cả các route admin đều yêu cầu đăng nhập và có role admin
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/ban', toggleUserBan);
router.get('/assets', getAssets);
router.get('/orders', getOrders);

module.exports = router;
