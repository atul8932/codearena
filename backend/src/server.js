require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const roomRoutes = require('./routes/roomRoutes');
const { router: adminRouter, setIO } = require('./routes/adminRoutes');
const { initGameSocket } = require('./socket/gameSocket');
const { initFirebase } = require('./services/firebase');

// ─── Initialize Firebase ──────────────────────────────────────────────────────
initFirebase();


const app = express();
const server = http.createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'] }));
app.use(express.json({ limit: '50kb' }));

// ─── REST Routes ─────────────────────────────────────────────────────────────
app.use('/api/room',    roomRoutes);
app.use('/api/admin',   adminRouter);
app.use('/api/profile', require('./routes/profileRoutes'));

app.get('/health', (req, res) => res.json({ status: 'ok', time: Date.now() }));

// ─── Socket Game Engine ───────────────────────────────────────────────────────
initGameSocket(io);
setIO(io); // Give admin router access to io for real-time actions

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🚀 CodeArena backend running on port ${PORT}`);
  console.log(`   Socket.IO ready for connections`);
  console.log(`   Admin dashboard: http://localhost:5173/admin\n`);
});

