const express = require('express');
const {
  register,
  login,
  getAllUsers,
  updateNickname,
  updateTheme,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', protect, getAllUsers);
router.put('/nickname', protect, updateNickname);
router.put('/theme', protect, updateTheme);

module.exports = router;
