const Room = require('../models/Room');

const createRoom = async (req, res) => {
  try {
    const { name, memberIds = [] } = req.body; // memberIds: array of other user IDs to add

    // Always include the creator as a member too
    const members = [...new Set([req.user.id, ...memberIds])];

    const room = await Room.create({
      name,
      members,
      createdBy: req.user.id,
    });

    res.status(201).json({ message: 'Room created', room });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// All rooms, tagged with this user's relationship to each one
const listAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('members', 'name');
    const userId = req.user.id;

    const result = rooms.map((room) => {
      const isMember = room.members.some((m) => m._id.toString() === userId);
      const myRequest = room.joinRequests.find(
        (r) => r.user.toString() === userId,
      );
      const isCreator = room.createdBy.toString() === userId;
      const pendingCount = room.joinRequests.filter(
        (r) => r.status === 'pending',
      ).length;

      let status = 'not_joined';
      if (isMember) status = 'joined';
      else if (myRequest && myRequest.status === 'pending')
        status = 'requested';
      else if (myRequest && myRequest.status === 'declined')
        status = 'declined';

      return {
        _id: room._id,
        name: room.name,
        memberCount: room.members.length,
        status, // 'joined' | 'not_joined' | 'requested' | 'declined'
        isCreator,
        pendingCount,
      };
    });

    res.status(200).json({ rooms: result });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all rooms the current user belongs to
const getMyRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user.id }).populate(
      'members',
      'name email',
    );
    res.status(200).json({ rooms });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Request to join a room you're not a member of
const requestToJoin = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.members.map(String).includes(req.user.id)) {
      return res.status(400).json({ message: 'You are already a member' });
    }

    const existing = room.joinRequests.find(
      (r) => r.user.toString() === req.user.id,
    );
    if (existing && existing.status === 'pending') {
      return res.status(400).json({ message: 'Request already pending' });
    }

    if (existing) {
      existing.status = 'pending';
      existing.requestedAt = new Date();
    } else {
      room.joinRequests.push({ user: req.user.id });
    }

    await room.save();
    res.status(200).json({ message: 'Join request sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get pending requests for a room — only members can see these
const getPendingRequests = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId).populate(
      'joinRequests.user',
      'name email',
    );
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Only the room creator can view requests' });
    }

    const pending = room.joinRequests.filter((r) => r.status === 'pending');
    res.status(200).json({ requests: pending });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Accept or decline — only existing members can do this
const respondToRequest = async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Only the room creator can view requests' });
    }

    const request = room.joinRequests.find(
      (r) => r.user.toString() === userId && r.status === 'pending',
    );
    if (!request)
      return res
        .status(404)
        .json({ message: 'No pending request found for this user' });

    if (action === 'accept') {
      request.status = 'accepted';
      if (!room.members.map(String).includes(userId)) {
        room.members.push(userId);
      }
    } else if (action === 'decline') {
      request.status = 'declined';
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await room.save();
    res.status(200).json({ message: `Request ${action}ed`, room });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Leave a room
const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const isCreator = room.createdBy.toString() === req.user.id;
    const otherMembers = room.members.filter(
      (m) => m.toString() !== req.user.id,
    );

    if (isCreator && otherMembers.length > 0) {
      return res.status(400).json({
        message:
          'You must remove all other members (or transfer ownership) before leaving this room',
      });
    }

    room.members = otherMembers;

    // If creator was the last member, delete the empty room entirely
    if (isCreator && otherMembers.length === 0) {
      await Room.findByIdAndDelete(room._id);
      return res
        .status(200)
        .json({ message: 'Room deleted (you were the last member)' });
    }

    await room.save();
    res.status(200).json({ message: 'Left the room' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getMembers = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId).populate(
      'members',
      'name nickname email',
    );
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json({ members: room.members, createdBy: room.createdBy });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addMember = async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can add members' });
    }

    if (room.members.map(String).includes(userId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    room.members.push(userId);
    await room.save();
    res.status(200).json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Only the creator can remove members' });
    }
    if (userId === room.createdBy.toString()) {
      return res
        .status(400)
        .json({
          message: "Creator can't remove themselves this way — use leave",
        });
    }

    room.members = room.members.filter((m) => m.toString() !== userId);
    await room.save();
    res.status(200).json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createRoom,
  listAllRooms,
  getMyRooms,
  requestToJoin,
  getPendingRequests,
  respondToRequest,
  leaveRoom,
  getMembers,
  addMember,
  removeMember,
};
