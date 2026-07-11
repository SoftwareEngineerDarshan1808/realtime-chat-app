// Simple in-memory map: { userId: socketId }
// Fine for learning/single-server setups. A real production app with multiple
// server instances would use Redis instead, since this map only exists in one process's memory.
const onlineUsers = new Map();

const addUser = (userId, socketId) => {
  onlineUsers.set(userId.toString(), socketId);
};

const removeUser = (userId) => {
  onlineUsers.delete(userId.toString());
};

const getSocketId = (userId) => {
  return onlineUsers.get(userId.toString());
};

const getOnlineUserIds = () => {
  return Array.from(onlineUsers.keys());
};

module.exports = { addUser, removeUser, getSocketId, getOnlineUserIds };