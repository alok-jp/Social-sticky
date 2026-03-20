import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('ssn_token');
    // Only connect if we have both a user object and a stored token.
    if (user && token) {
      // Connect to backend Socket.IO server on Render
      const isVercel = window.location.hostname.includes('vercel.app');
      const socketUrl = (process.env.REACT_APP_API_URL || (isVercel ? 'https://social-sticky.onrender.com' : 'http://localhost:5001')).replace('/api', '');
      socketRef.current = io(socketUrl, { auth: { token }, transports: ['websocket'] });

      // Helpful debug: log connect errors to the console so we can see reasons like auth failures.
      socketRef.current.on('connect_error', (err) => {
        // eslint-disable-next-line no-console
        console.error('Socket connect_error:', err && err.message ? err.message : err);
      });

      return () => {
        socketRef.current?.off('connect_error');
        socketRef.current?.disconnect();
        socketRef.current = null;
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
};
