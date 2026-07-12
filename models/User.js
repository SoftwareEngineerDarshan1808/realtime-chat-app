const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nickname: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    theme: {
      type: String,
      enum: ['dark', 'light', 'midnight', 'sunset'],
      default: 'dark',
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'declined'],
          default: 'pending',
        },
        requestedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', userSchema);
