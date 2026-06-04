import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  const url = import.meta.env.VITE_SOCKET_URL || window.location.origin.replace(/:\d+$/, ':5000');

  socket = io(url, {
    transports: ['websocket'],
    reconnectionAttempts: Infinity,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    console.log('Socket connected', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connect_error', err);
  });

  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}
