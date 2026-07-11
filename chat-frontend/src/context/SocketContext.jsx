import { createContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { BASE_URL } from '../api/client';

export const SocketContext = createContext(null); // CHANGED — now exported, no longer just local `const`

export const SocketProvider = ({ token, children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!token) return;

    const socket = io(BASE_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('online users', (ids) => setOnlineUsers(ids));

    return () => socket.disconnect();
  }, [token]);

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, connected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};