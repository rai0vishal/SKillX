import { io } from 'socket.io-client';
import { API_BASE_URL } from './api.js';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: false, // We'll connect it manually when the user is known
    });
  }
  return socket;
};

export const connectSocket = (email) => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  if (email) {
    s.emit('registerUser', email);
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};
