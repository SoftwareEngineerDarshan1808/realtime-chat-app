const express = require('express');
const {
  sendRequest,
  getIncomingRequests,
  respondToRequest,
  discoverUsers,
  getFriends,
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/discover', protect, discoverUsers);
router.get('/', protect, getFriends);
router.get('/requests', protect, getIncomingRequests);
router.post('/request/:userId', protect, sendRequest);
router.post('/requests/:fromUserId/respond', protect, respondToRequest);

module.exports = router;