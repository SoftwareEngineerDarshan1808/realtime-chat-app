require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const socketAuth = require('./sockets/socketAuth');
const Message = require('./models/Message');
const {
  addUser,
  removeUser,
  getSocketId,
  getOnlineUserIds,
} = require('./sockets/onlineUser');

const app = express();
const server = http.createServer(app); // wrap Express in a raw HTTP server

const io = new Server(server, {
  cors: {
    origin: '*', // for local dev only — lock this down later
  },
});

connectDB();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// serves our test HTML client
app.use(express.static(path.join(__dirname, 'public'))); 

// Socket.io authentication middleware — runs before any connection is accepted
io.use(socketAuth);

io.on('connection', (socket) => {
  console.log(`${socket.user.name} connected (socket id: ${socket.id})`);

  // Register this user as online
  addUser(socket.user.id, socket.id);

  // Broadcast updated online list to everyone
  io.emit('online users', getOnlineUserIds());

  // Private 1-to-1 message handler
  socket.on('private message', async ({ receiverId, text }) => {
    try {
      const message = await Message.create({
        sender: socket.user.id,
        receiver: receiverId,
        text,
      });

      const receiverSocketId = getSocketId(receiverId);

      // Deliver instantly if receiver is online
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('private message', {
          _id: message._id,
          sender: socket.user.id,
          senderName: socket.user.name,
          text,
          createdAt: message.createdAt,
        });
      }
      // If receiver is offline, message is already saved in MongoDB —

      // Echo back to sender so their own UI updates too
      socket.emit('private message', {
        _id: message._id,
        sender: socket.user.id,
        senderName: socket.user.name,
        text,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error('Error in private message handler:', err);
      socket.emit('error message', 'Failed to send message');
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
