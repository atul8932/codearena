const express = require('express');
const os = require('os');
const { getAllRooms, getRoom, updateRoom, deleteRoom } = require('../services/firebase');
const { PROBLEMS } = require('../data/problems');

const router = express.Router();

// ─── Passkey Middleware ───────────────────────────────────────────────────────
const ADMIN_PASSKEY = process.env.ADMIN_PASSKEY || 'codearena-admin-2024';

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (!key || key !== ADMIN_PASSKEY) {
    return res.status(401).json({ error: 'Unauthorized — invalid admin passkey' });
  }
  next();
}

// ─── Server start time for uptime calculation ─────────────────────────────────
const SERVER_START = Date.now();

// Track stats in-memory (resets on server restart)
let totalGamesPlayed = 0;
let totalSubmissions = 0;
let broadcastLog = [];

// Expose counters for gameSocket to increment
function incrementGames()  { totalGamesPlayed++; }
function incrementSubmits() { totalSubmissions++; }
function addBroadcastLog(entry) {
  broadcastLog.unshift({ ...entry, time: Date.now() });
  if (broadcastLog.length > 50) broadcastLog.pop();
}

// Will be set by server.js after io is created
let _io = null;
function setIO(io) { _io = io; }

// ─── AUTH ─────────────────────────────────────────────────────────────────────
// POST /api/admin/login
router.post('/login', (req, res) => {
  const { passkey } = req.body;
  if (!passkey || passkey !== ADMIN_PASSKEY) {
    return res.status(401).json({ error: 'Invalid passkey' });
  }
  res.json({ ok: true, message: 'Authenticated' });
});

// ─── STATS ────────────────────────────────────────────────────────────────────
// GET /api/admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const rooms = await getAllRooms();
    const activeRooms   = rooms.filter((r) => r.state === 'battle').length;
    const lobbyRooms    = rooms.filter((r) => r.state === 'lobby').length;
    const finishedRooms = rooms.filter((r) => r.state === 'finished').length;
    const totalPlayers  = rooms.reduce((sum, r) => sum + Object.keys(r.players || {}).length, 0);

    const uptimeMs = Date.now() - SERVER_START;
    const uptimeSec = Math.floor(uptimeMs / 1000);

    res.json({
      server: {
        uptime: uptimeSec,
        uptimeHuman: formatUptime(uptimeSec),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(os.totalmem() / 1024 / 1024),
          free: Math.round(os.freemem() / 1024 / 1024),
        },
        cpu: os.cpus()[0]?.model || 'unknown',
        nodeVersion: process.version,
        platform: process.platform,
      },
      rooms: {
        total: rooms.length,
        active: activeRooms,
        lobby: lobbyRooms,
        finished: finishedRooms,
      },
      players: { online: totalPlayers },
      games: { total: totalGamesPlayed, submissions: totalSubmissions },
      problems: { total: PROBLEMS.length },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ROOMS ────────────────────────────────────────────────────────────────────
// GET /api/admin/rooms
router.get('/rooms', requireAdmin, async (req, res) => {
  try {
    const rooms = await getAllRooms();
    // Sanitize hidden data before sending
    const safe = rooms.map((r) => ({
      id: r.id,
      state: r.state,
      difficulty: r.difficulty,
      anonymousMode: r.anonymousMode,
      playerCount: Object.keys(r.players || {}).length,
      players: Object.values(r.players || {}).map((p) => ({
        id: p.id, name: p.name, isHost: p.isHost,
        isSpectator: p.isSpectator, score: p.score,
        status: p.status, attempts: p.attempts,
      })),
      problemTitle: r.problem?.title || null,
      startTime: r.startTime,
      createdAt: r.createdAt,
      firstBloodId: r.firstBloodId,
    }));
    res.json({ rooms: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/rooms/:roomId
router.get('/rooms/:roomId', requireAdmin, async (req, res) => {
  try {
    const room = await getRoom(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/rooms/:roomId  — force delete a room
router.delete('/rooms/:roomId', requireAdmin, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await getRoom(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (_io) {
      _io.to(roomId).emit('error', { message: '🚫 This room was closed by the admin.' });
      _io.in(roomId).socketsLeave(roomId);
    }
    await deleteRoom(roomId);
    res.json({ ok: true, message: `Room ${roomId} deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/rooms/:roomId/end  — force end the game
router.post('/rooms/:roomId/end', requireAdmin, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await getRoom(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const players = room.players || {};
    const leaderboard = Object.values(players)
      .filter((p) => !p.isSpectator)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((p, i) => ({ ...p, rank: i + 1 }));

    await updateRoom(roomId, { state: 'finished' });

    if (_io) {
      _io.to(roomId).emit('gameEnded', {
        leaderboard,
        winner: leaderboard[0] || null,
        message: '⚡ Game ended by admin',
      });
    }

    res.json({ ok: true, message: `Game in ${roomId} force-ended` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/rooms/:roomId/reset  — reset room to lobby
router.post('/rooms/:roomId/reset', requireAdmin, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await getRoom(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const players = {};
    Object.entries(room.players || {}).forEach(([id, p]) => {
      players[id] = { ...p, isReady: false, score: 0, status: 'waiting', solvedAt: null, attempts: 0, progress: 0 };
    });

    await updateRoom(roomId, { state: 'lobby', problem: null, startTime: null, firstBloodId: null, players });

    if (_io) {
      _io.to(roomId).emit('roomReset', { players });
      _io.to(roomId).emit('commentary', { message: '🔄 Room reset by admin.' });
    }

    res.json({ ok: true, message: `Room ${roomId} reset to lobby` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/rooms/:roomId/kick  — kick a player
router.post('/rooms/:roomId/kick', requireAdmin, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;
    if (!playerId) return res.status(400).json({ error: 'playerId required' });

    const room = await getRoom(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const players = { ...room.players };
    const playerName = players[playerId]?.name || playerId;
    delete players[playerId];

    await updateRoom(roomId, { players });

    if (_io) {
      _io.to(playerId).emit('error', { message: '🚫 You were kicked by the admin.' });
      _io.to(roomId).emit('playerLeft', { playerId, playerName, players });
      _io.to(roomId).emit('commentary', { message: `🚫 ${playerName} was removed by admin.` });
    }

    res.json({ ok: true, message: `${playerName} kicked from ${roomId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/rooms/:roomId/message  — send message to a room
router.post('/rooms/:roomId/message', requireAdmin, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    if (_io) {
      _io.to(roomId).emit('commentary', { message: `📢 [Admin] ${message}` });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── BROADCAST ────────────────────────────────────────────────────────────────
// POST /api/admin/broadcast  — send message to ALL rooms
router.post('/broadcast', requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    if (_io) {
      _io.emit('commentary', { message: `📢 [Admin Broadcast] ${message}` });
    }

    addBroadcastLog({ message });
    res.json({ ok: true, message: 'Broadcast sent to all rooms' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/broadcast/log
router.get('/broadcast/log', requireAdmin, (req, res) => {
  res.json({ log: broadcastLog });
});

// ─── PROBLEMS ─────────────────────────────────────────────────────────────────
// GET /api/admin/problems
router.get('/problems', requireAdmin, (req, res) => {
  res.json({
    problems: PROBLEMS.map((p) => ({
      id: p.id, title: p.title, difficulty: p.difficulty,
      tags: p.tags,
      sampleCount: p.sampleTestCases?.length || 0,
      hiddenCount: p.hiddenTestCases?.length || 0,
    })),
  });
});

// GET /api/admin/problems/:id  — full problem with all test cases
router.get('/problems/:id', requireAdmin, (req, res) => {
  const p = PROBLEMS.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Problem not found' });
  res.json({ problem: p });
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

module.exports = { router, setIO, incrementGames, incrementSubmits };
