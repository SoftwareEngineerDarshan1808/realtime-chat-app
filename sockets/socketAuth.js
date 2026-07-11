const jwt = require('jsonwebtoken');

const socketAuth = (socket, next) => {
  const token = socket.handshake.auth.token; // client sends token during connection

  if (!token) {
    return next(new Error('Authentication error: no token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // attach user info to this socket for later use
    next();
  } catch (err) {
    next(new Error('Authentication error: invalid token'));
  }
};

module.exports = socketAuth;
