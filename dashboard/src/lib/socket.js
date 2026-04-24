import { io } from 'socket.io-client';

export const socket = io('http://127.0.0.1:1711', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 3000
});