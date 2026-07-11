require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

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
app.use(express.static(path.join(__dirname, 'public'))); // serves our test HTML client

// Basic connection logging — this is the "hello world" of Socket.io
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);
  
  socket.on('chat message', (msg) => {
    console.log(`Message received: ${msg}`);
    io.emit('chat message', msg); // broadcast to ALL connected clients, including sender
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); // note: server.listen, not app.listen