import { io } from 'socket.io-client';

const createSocket = (projectId) => {
  const socket = io('http://localhost:9000', {
    query: { projectId },
  });

  socket.on('connect_error', (err) => {
    console.error('Socket.IO failed to connect:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.warn('Socket disconnected. Reason:', reason);
  });

  return socket;
}

export default createSocket