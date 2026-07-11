const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const request = async (path, options = {}) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`; 
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${cleanPath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const login = (email, password) =>
  request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const register = (name, email, password) =>
  request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });

export const updateNickname = (nickname) =>
  request('/api/auth/nickname', {
    method: 'PUT',
    body: JSON.stringify({ nickname }),
  });

export const updateTheme = (theme) =>
  request('/api/auth/theme', {
    method: 'PUT',
    body: JSON.stringify({ theme }),
  });

export const getUsers = () => request('/api/auth/users');

export const createRoom = (name, memberIds) =>
  request('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ name, memberIds }),
  });

export const getAllRooms = () => request('/api/rooms/all');

export const requestJoinRoom = (roomId) =>
  request(`/api/rooms/${roomId}/request`, { method: 'POST' });

export const getConversation = (otherUserId) =>
  request(`/api/messages/${otherUserId}`);

export const getRoomMessages = (roomId) =>
  request(`/api/messages/room/${roomId}`);

export const getPendingRoomRequests = (roomId) =>
  request(`/api/rooms/${roomId}/requests`);

export const respondToRoomRequest = (roomId, userId, action) =>
  request(`/api/rooms/${roomId}/requests/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });

export const leaveRoom = (roomId) =>
  request(`/api/rooms/${roomId}/leave`, {
    method: 'POST',
  });

export { BASE_URL };
