import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]); // rolling log of recent real-time events (for toasts/badges)

  useEffect(() => {
    const token = localStorage.getItem('campusbite_token');
    if (!user || !token) {
      socketRef.current?.disconnect();
      return;
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    const pushEvent = (type) => (payload) =>
      setEvents((prev) => [{ type, payload, at: Date.now() }, ...prev].slice(0, 20));

    socket.on('order:confirmed', pushEvent('order:confirmed'));
    socket.on('order:status', pushEvent('order:status'));
    socket.on('order:new', pushEvent('order:new'));
    socket.on('inventory:low-stock', pushEvent('inventory:low-stock'));

    return () => socket.disconnect();
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, events }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
