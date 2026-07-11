const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = async (req, res) => {
  try {
    const { name, email, password, inviterID } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    //if its invited user 
    if (inviterId) {
      const inviter = await User.findById(inviterId);
      if (inviter) {
        inviter.friends.push(user._id);
        user.friends.push(inviter._id);
        await inviter.save();
        await user.save();
      }
    }
    
    res
      .status(201)
      .json({ message: 'Registered successfully', userId: user._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        theme: user.theme,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select(
      'name nickname email',
    );
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateNickname = async (req, res) => {
  try {
    const { nickname } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { nickname: nickname || '' },
      { new: true },
    ).select('name nickname email');

    res.status(200).json({ message: 'Nickname updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;
    const validThemes = ['dark', 'light', 'midnight', 'sunset'];
    if (!validThemes.includes(theme)) {
      return res.status(400).json({ message: 'Invalid theme' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { theme },
      { new: true },
    ).select('theme');
    res.status(200).json({ message: 'Theme updated', theme: user.theme });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { register, login, getAllUsers, updateNickname, updateTheme };
