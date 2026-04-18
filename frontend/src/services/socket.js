import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

/**
 * Singleton Socket.IO client.
 * voluntaryLeave — set to true before intentionally leaving a room so the
 * reconnect handler knows NOT to re-join the old session.
 */
export let voluntaryLeave = false;
export const setVoluntaryLeave = (v) => { voluntaryLeave = v; };

const socket = io(BACKEND_URL, {
  autoConnect: false,       // connect manually when player enters
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1500,
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
