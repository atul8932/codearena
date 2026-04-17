import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

/**
 * Singleton Socket.IO client with auto-reconnect.
 * Import `socket` wherever you need to emit/listen.
 */
const socket = io(BACKEND_URL, {
  autoConnect: false,       // connect manually when player enters
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'],
});

// Log connection events in dev
if (import.meta.env.DEV) {
  socket.on('connect', () => console.log('🔌 Socket connected:', socket.id));
  socket.on('disconnect', (reason) => console.log('⚡ Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  socket.on('reconnect', (n) => console.log(`🔄 Reconnected after ${n} attempts`));
}

export default socket;
