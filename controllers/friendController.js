const User = require('../models/User');

const sendRequest = async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (targetId === req.user.id) {
      return res.status(400).json({ message: "You can't add yourself" });
    }

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (target.friends.map(String).includes(req.user.id)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    const existing = target.friendRequests.find((r) => r.from.toString() === req.user.id);
    if (existing && existing.status === 'pending') {
      return res.status(400).json({ message: 'Request already pending' });
    }

    if (existing) {
      existing.status = 'pending';
      existing.requestedAt = new Date();
    } else {
      target.friendRequests.push({ from: req.user.id });
    }

    await target.save();
    res.status(200).json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getIncomingRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friendRequests.from', 'name nickname');
    const pending = user.friendRequests.filter((r) => r.status === 'pending');
    res.status(200).json({ requests: pending });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const respondToRequest = async (req, res) => {
  try {
    const { fromUserId } = req.params;
    const { action } = req.body;

    const me = await User.findById(req.user.id);
    const request = me.friendRequests.find((r) => r.from.toString() === fromUserId && r.status === 'pending');
    if (!request) return res.status(404).json({ message: 'No pending request found' });

    request.status = action === 'accept' ? 'accepted' : 'declined';

    if (action === 'accept') {
      if (!me.friends.map(String).includes(fromUserId)) me.friends.push(fromUserId);
      const other = await User.findById(fromUserId);
      if (!other.friends.map(String).includes(req.user.id)) {
        other.friends.push(req.user.id);
        await other.save();
      }
    }

    await me.save();
    res.status(200).json({ message: `Request ${action}ed` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const discoverUsers = async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    const users = await User.find({ _id: { $ne: req.user.id } }).select('name nickname friendRequests');

    const result = users.map((u) => {
      const isFriend = me.friends.map(String).includes(u._id.toString());
      const myReq = u.friendRequests.find((r) => r.from.toString() === req.user.id && r.status === 'pending');

      let status = 'none';
      if (isFriend) status = 'friend';
      else if (myReq) status = 'requested';

      return { _id: u._id, name: u.name, nickname: u.nickname, status };
    });

    res.status(200).json({ users: result });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getFriends = async (req, res) => {
  try {
    const me = await User.findById(req.user.id).populate('friends', 'name nickname');
    res.status(200).json({ friends: me.friends });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { sendRequest, getIncomingRequests, respondToRequest, discoverUsers, getFriends };