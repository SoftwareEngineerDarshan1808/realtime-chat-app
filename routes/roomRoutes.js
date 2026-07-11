const express = require('express');
const {
  createRoom,
  listAllRooms,
  getMyRooms,
  requestToJoin,
  getPendingRequests,
  respondToRequest,
  leaveRoom,
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createRoom);
router.get('/all', protect, listAllRooms);
router.get('/', protect, getMyRooms);
router.post('/:roomId/request', protect, requestToJoin);
router.get('/:roomId/requests', protect, getPendingRequests);
router.post('/:roomId/requests/:userId', protect, respondToRequest);
router.post('/:roomId/leave', protect, leaveRoom);

module.exports = router;
