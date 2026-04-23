import { io } from 'socket.io-client';

export const socket = io('http://localhost:1711', {
  transports: ['websocket', 'polling']
});