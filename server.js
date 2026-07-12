const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const roomRoutes = require('./routes/roomRoutes');
const socketAuth = require('./sockets/socketAuth');
const Message = require('./models/Message');
const Room = require('./models/Room');
const User = require('./models/User');
const {
  addUser,
  removeUser,
  getSocketId,
  getOnlineUserIds,
} = require('./sockets/onlineUser');
const friendRoutes = require('./routes/friendRoutes');

const app = express();
const server = http.createServer(app); // wrap Express in a raw HTTP server

const allowedOrigins = [
  'http://localhost:5173',
  'https://realtime-chat-app-szm5-r8grx8fuv.vercel.app',
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
  },
});

connectDB();

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/friends', friendRoutes);

// serves our test HTML client
app.use(express.static(path.join(__dirname, 'public')));

// Socket.io authentication middleware — runs before any connection is accepted
io.use(socketAuth);

io.on('connection', async (socket) => {
  console.log(`${socket.user.name} connected (socket id: ${socket.id})`);

  // Register this user as online
  addUser(socket.user.id, socket.id);

  // Broadcast updated online list to everyone
  io.emit('online users', getOnlineUserIds());

  // mark them delivered, and notify each original sender if they're online
  const undelivered = await Message.find({
    receiver: socket.user.id,
    status: 'sent',
  });
  for (const msg of undelivered) {
    msg.status = 'delivered';
    await msg.save();
    const senderSocketId = getSocketId(msg.sender.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit('message delivered', {
        messageId: msg._id,
        receiverId: socket.user.id,
      });
    }
  }

  // Private 1-to-1 message handler
  socket.on('private message', async ({ receiverId, text }) => {
    try {
      const sender = await User.findById(socket.user.id);
      if (!sender.friends.map(String).includes(receiverId)) {
        return socket.emit('error message', 'You can only message friends');
      }
      const receiverSocketId = getSocketId(receiverId);
      const message = await Message.create({
        sender: socket.user.id,
        receiver: receiverId,
        text,
        status: receiverSocketId ? 'delivered' : 'sent',
      });

      const senderUser = await User.findById(socket.user.id).select(
        'name nickname',
      );
      const displayName = senderUser.nickname || senderUser.name;

      const payload = {
        _id: message._id,
        sender: socket.user.id,
        senderName: displayName,
        text,
        status: message.status,
        createdAt: message.createdAt,
      };

      // Deliver instantly if receiver is online
      if (receiverSocketId)
        io.to(receiverSocketId).emit('private message', payload);
      socket.emit('private message', payload);
    } catch (err) {
      console.error('Error in private message handler:', err);
      socket.emit('error message', 'Failed to send message');
    }
  });

  // mark messages from a specific person as "seen" when I open that chat
  socket.on('mark seen', async ({ otherUserId }) => {
    const result = await Message.updateMany(
      {
        sender: otherUserId,
        receiver: socket.user.id,
        status: { $ne: 'seen' },
      },
      { status: 'seen' },
    );

    if (result.modifiedCount > 0) {
      const otherSocketId = getSocketId(otherUserId);
      if (otherSocketId) {
        io.to(otherSocketId).emit('messages seen', { by: socket.user.id });
      }
    }
  });

  // join a room
  socket.on('join room', async (roomId) => {
    // Verify this user is actually a member before letting them join
    const room = await Room.findById(roomId);

    if (!room || !room.members.map(String).includes(socket.user.id)) {
      return socket.emit('error message', 'Not authorized to join this room');
    }
    socket.join(roomId); // Socket.io's built-in room mechanism
  });

  // group message handler
  socket.on('room message', async ({ roomId, text }) => {
    try {
      const message = await Message.create({
        sender: socket.user.id,
        room: roomId,
        text,
      });

      const senderUser = await User.findById(socket.user.id).select(
        'name nickname',
      );
      const displayName = senderUser.nickname || senderUser.name;

      // Broadcast to everyone in the room, INCLUDING sender
      io.to(roomId).emit('room message', {
        _id: message._id,
        sender: socket.user.id,
        senderName: socket.user.name,
        roomId,
        text,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error('Error in room message handler:', err);
      socket.emit('error message', 'Failed to send room message');
    }
  });

  socket.on('disconnect', () => {
    console.log(`${socket.user.name} disconnected`);
    removeUser(socket.user.id);
    io.emit('online users', getOnlineUserIds());
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); // note: server.listen, not app.listen
