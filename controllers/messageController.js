const Message = require('../models/Message');

const getConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { otherUserId } = req.params;

    // Find messages where either direction matches this pair of users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 }) // oldest first, so chat reads top-to-bottom naturally
      .limit(50) // basic cap for now — real pagination comes later if needed
      .populate('sender', 'name nickname')
      .populate('receiver', 'name nickname');

    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: 1 })
      .limit(50)
      .populate('sender', 'name');

    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getConversation, getRoomMessages };