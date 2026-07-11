const express = require('express');
const { getConversation, getRoomMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/room/:roomId', protect, getRoomMessages);
router.get('/:otherUserId', protect, getConversation);

module.exports = router;