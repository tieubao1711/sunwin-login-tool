import { io } from 'socket.io-client';

export const socket = io('http://103.82.135.143:1711', {
  transports: ['websocket', 'polling']
});