const { nanoid } = require('nanoid');
const { createRoom, getRoom, updateRoom, deleteRoom, saveUserBattle } = require('../services/firebase');
const { runTestCases } = require('../services/judge0');
const { getRandomProblem } = require('../data/problems');

// ─── AI Commentary Templates ──────────────────────────────────────────────────
const COMMENTARY = {
  lead: (name) => [
    `🔥 ${name} is absolutely dominating right now!`,
    `⚡ ${name} pulls ahead — can anyone stop them?`,
    `🎯 ${name} is on fire! Flawless execution!`,
    `💀 ${name} is making this look too easy!`,
  ],
  struggle: (name) => [
    `😰 ${name} seems to be stuck — time is ticking!`,
    `🤔 ${name} is fighting through this problem...`,
    `⏳ Come on ${name}, you got this!`,
    `🔄 ${name} is iterating... could be a breakthrough soon!`,
  ],
  firstBlood: (name) => [
    `🩸 FIRST BLOOD! ${name} draws first blood with a blazing submission!`,
    `💥 BOOM! ${name} is the first to crack it!`,
    `⚔️  ${name} strikes first! The arena goes wild!`,
  ],
  general: [
    '🚀 What a battle! Every keystroke counts!',
    '🎮 The arena is heating up — who will crack it first?',
    '🌐 Code faster! Glory awaits the bold!',
    '💡 Algorithms are weapons — wield them wisely!',
    '🏆 Only one can stand at the top of the leaderboard!',
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
const BASE_SCORE = 1000;
const TIME_PENALTY_PER_SEC = 2; // deduct per second elapsed

function calcScore(passedPct, elapsedSeconds) {
  const accuracy = Math.round(BASE_SCORE * passedPct);
  const timePenalty = Math.min(accuracy * 0.5, elapsedSeconds * TIME_PENALTY_PER_SEC);
  return Math.max(0, Math.round(accuracy - timePenalty));
}

// ─── Active game timers per room ──────────────────────────────────────────────
const gameTimers = new Map(); // roomId → { interval, startTime }

// ─── Rate limiting: last submission timestamp per player ──────────────────────
const lastSubmission = new Map(); // socketId → timestamp
const SUBMIT_COOLDOWN_MS = 10_000;

// ─── Power-up tracking ───────────────────────────────────────────────────────
const frozenPlayers = new Set(); // socketIds currently frozen

// ─────────────────────────────────────────────────────────────────────────────
// Main Socket.IO Game Engine
// ─────────────────────────────────────────────────────────────────────────────
function initGameSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // ── CREATE ROOM ────────────────────────────────────────────────────────
    socket.on('createRoom', async ({ playerName, isPrivate = false, difficulty = null, uid = null }) => {
      try {
        const roomId = nanoid(8).toUpperCase();
        const player = {
          id: socket.id,
          name: playerName || `Player_${socket.id.slice(0, 4)}`,
          uid: uid || null, // Firebase Auth UID for profile tracking
          isHost: true,
          isReady: false,
          score: 0,
          status: 'waiting',
          solvedAt: null,
          attempts: 0,
          progress: 0,
          isTyping: false,
        };

        const roomData = {
          id: roomId,
          isPrivate,
          difficulty,
          players: { [socket.id]: player },
          state: 'lobby',     // lobby | countdown | battle | finished
          problem: null,
          startTime: null,
          duration: 20 * 60,  // 20 minutes in seconds
          firstBloodId: null,
          anonymousMode: false,
          createdAt: Date.now(),
        };

        await createRoom(roomId, roomData);
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.playerName = player.name;

        socket.emit('roomCreated', { roomId, player, room: roomData });
        console.log(`🏠 Room created: ${roomId} by ${player.name}`);
      } catch (err) {
        console.error('createRoom error:', err);
        socket.emit('error', { message: 'Failed to create room' });
      }
    });

    // ── JOIN ROOM ──────────────────────────────────────────────────────────
    socket.on('joinRoom', async ({ roomId, playerName, spectate = false, uid = null }) => {
      try {
        const room = await getRoom(roomId);
        if (!room) return socket.emit('error', { message: 'Room not found' });
        if (room.state !== 'lobby' && !spectate) {
          return socket.emit('error', { message: 'Game already in progress. Join as spectator?' });
        }

        const playerCount = Object.keys(room.players || {}).length;
        if (playerCount >= 8 && !spectate) {
          return socket.emit('error', { message: 'Room is full (max 8 players)' });
        }

        const player = {
          id: socket.id,
          name: playerName || `Player_${socket.id.slice(0, 4)}`,
          uid: uid || null,
          isHost: false,
          isReady: false,
          isSpectator: spectate,
          score: 0,
          status: spectate ? 'spectating' : 'waiting',
          solvedAt: null,
          attempts: 0,
          progress: 0,
          isTyping: false,
        };

        const updatedPlayers = { ...(room.players || {}), [socket.id]: player };
        await updateRoom(roomId, { players: updatedPlayers });

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.playerName = player.name;

        const updatedRoom = await getRoom(roomId);

        socket.emit('roomJoined', { player, room: updatedRoom });
        socket.to(roomId).emit('playerJoined', { player, players: updatedRoom.players });

        // Commentary
        io.to(roomId).emit('commentary', {
          message: `🎮 ${player.name} has entered the arena!`,
        });

        console.log(`👤 ${player.name} joined room ${roomId}`);
      } catch (err) {
        console.error('joinRoom error:', err);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ── PLAYER READY TOGGLE ────────────────────────────────────────────────
    socket.on('playerReady', async ({ roomId }) => {
      try {
        const room = await getRoom(roomId);
        if (!room) return;

        const players = room.players || {};
        if (!players[socket.id]) return;

        players[socket.id].isReady = !players[socket.id].isReady;
        await updateRoom(roomId, { players });

        io.to(roomId).emit('playersUpdate', { players });
      } catch (err) {
        console.error('playerReady error:', err);
      }
    });

    // ── TOGGLE ANONYMOUS MODE (host only) ─────────────────────────────────
    socket.on('toggleAnonymous', async ({ roomId }) => {
      try {
        const room = await getRoom(roomId);
        if (!room) return;
        if (room.players[socket.id]?.isHost !== true) return;

        await updateRoom(roomId, { anonymousMode: !room.anonymousMode });
        io.to(roomId).emit('settingsUpdate', { anonymousMode: !room.anonymousMode });
      } catch (err) {
        console.error('toggleAnonymous error:', err);
      }
    });

    // ── START GAME (host only) ────────────────────────────────────────────
    socket.on('startGame', async ({ roomId }) => {
      try {
        const room = await getRoom(roomId);
        if (!room) return;
        if (room.players[socket.id]?.isHost !== true) {
          return socket.emit('error', { message: 'Only the host can start the game' });
        }

        const realPlayers = Object.values(room.players).filter((p) => !p.isSpectator);
        if (realPlayers.length < 1) {
          return socket.emit('error', { message: 'Need at least 1 player to start' });
        }

        const problem = getRandomProblem(room.difficulty);
        await updateRoom(roomId, { state: 'countdown', problem });

        io.to(roomId).emit('gameCountdown', { problem: sanitizeProblem(problem) });

        // 3-2-1-GO countdown: emit the current count BEFORE decrementing
        // so clients receive 3, 2, 1 then immediately the gameStarted event
        let count = 3;
        const cdInterval = setInterval(async () => {
          if (count > 0) {
            io.to(roomId).emit('countdownTick', { count });
            count--;
          } else {
            clearInterval(cdInterval);

            const startTime = Date.now();
            await updateRoom(roomId, { state: 'battle', startTime });

            io.to(roomId).emit('gameStarted', {
              startTime,
              problem: sanitizeProblem(problem),
              duration: room.duration || 1200,
            });

            startGameTimer(io, roomId, room.duration || 1200);
            console.log(`⚔️  Game started in room ${roomId} — Problem: ${problem.title}`);
          }
        }, 1000);
      } catch (err) {
        console.error('startGame error:', err);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    // ── SUBMIT CODE ───────────────────────────────────────────────────────
    socket.on('submitCode', async ({ roomId, code, language }) => {
      try {
        // Rate limiting
        const lastTime = lastSubmission.get(socket.id) || 0;
        const now = Date.now();
        if (now - lastTime < SUBMIT_COOLDOWN_MS) {
          const remaining = Math.ceil((SUBMIT_COOLDOWN_MS - (now - lastTime)) / 1000);
          return socket.emit('submitError', { message: `Please wait ${remaining}s before resubmitting` });
        }
        lastSubmission.set(socket.id, now);

        const room = await getRoom(roomId);
        if (!room || room.state !== 'battle') return;

        const player = room.players[socket.id];
        if (!player || player.isSpectator) return;

        // Sanitize code (strip obvious injection patterns)
        const sanitized = sanitizeCode(code);

        socket.emit('submissionQueued', { message: 'Running test cases...' });
        io.to(roomId).emit('playerActivity', {
          playerId: socket.id,
          action: 'submitting',
        });

        const elapsedSeconds = Math.floor((now - room.startTime) / 1000);
        const problem = room.problem;
        const allTestCases = [...(problem.sampleTestCases || []), ...(problem.hiddenTestCases || [])];

        const { passed, total, results } = await runTestCases(sanitized, language, allTestCases);
        const passedPct = total > 0 ? passed / total : 0;
        const accepted = passed === total;

        // Apply doubleScore power-up if active
        let score = calcScore(passedPct, elapsedSeconds);
        if (accepted && player.doubleScore) {
          score = Math.min(score * 2, BASE_SCORE * 2); // cap at 2× base
        }
        const attempts = (player.attempts || 0) + 1;
        const status = accepted ? 'solved' : passedPct > 0 ? 'partial' : 'failed';

        // Update player in room (clear doubleScore flag after use)
        const players = room.players;
        players[socket.id] = {
          ...player,
          score: accepted ? score : Math.max(player.score, score),
          status,
          attempts,
          solvedAt: accepted ? now : player.solvedAt,
          progress: Math.round(passedPct * 100),
          doubleScore: false, // consumed
        };

        const firstBlood = accepted && !room.firstBloodId;
        if (firstBlood) {
          await updateRoom(roomId, { players, firstBloodId: socket.id });
          io.to(roomId).emit('firstBlood', { playerId: socket.id, playerName: player.name });
          io.to(roomId).emit('commentary', {
            message: pickRandom(COMMENTARY.firstBlood(player.name)),
          });
        } else {
          await updateRoom(roomId, { players });
        }

        // Emit result to submitter
        socket.emit('submissionResult', {
          accepted,
          passed,
          total,
          score,
          status,
          results: results.map((r) => ({
            input: r.input,
            expectedOutput: r.expectedOutput,
            actualOutput: r.actualOutput,
            accepted: r.accepted,
            time: r.time,
          })),
        });

        // Broadcast leaderboard update
        const leaderboard = buildLeaderboard(players);
        io.to(roomId).emit('leaderboardUpdate', { leaderboard, players });

        // AI Commentary
        const leader = leaderboard[0];
        if (leader && Math.random() < 0.7) {
          const msg =
            leader.id === socket.id
              ? pickRandom(COMMENTARY.lead(player.name))
              : pickRandom(COMMENTARY.struggle(player.name));
          setTimeout(() => io.to(roomId).emit('commentary', { message: msg }), 1500);
        }

        // Check if all players solved
        const activePlayers = Object.values(players).filter((p) => !p.isSpectator);
        const allSolved = activePlayers.every((p) => p.status === 'solved');
        if (allSolved) {
          endGame(io, roomId);
        }
      } catch (err) {
        console.error('submitCode error:', err);
        socket.emit('submitError', { message: 'Submission processing failed' });
      }
    });

    // ── RUN CODE (sample test cases only) ────────────────────────────────
    socket.on('runCode', async ({ roomId, code, language }) => {
      try {
        const room = await getRoom(roomId);
        if (!room) return;

        // Block spectators from running code
        const player = room.players[socket.id];
        if (!player || player.isSpectator) {
          return socket.emit('runResult', { error: 'Spectators cannot run code' });
        }

        const problem = room.problem;
        if (!problem) return socket.emit('runResult', { error: 'No problem loaded' });

        const sanitized = sanitizeCode(code);
        const sampleCases = problem.sampleTestCases || [];

        socket.emit('runQueued', { message: 'Running sample test cases...' });

        const { passed, total, results } = await runTestCases(sanitized, language, sampleCases);
        socket.emit('runResult', {
          accepted: passed === total && total > 0,
          passed,
          total,
          results: results.map((r) => ({
            input: r.input,
            expectedOutput: r.expectedOutput,
            actualOutput: r.actualOutput,
            accepted: r.accepted,
            time: r.time,
          })),
        });
      } catch (err) {
        console.error('runCode error:', err);
        socket.emit('runResult', { error: 'Run failed' });
      }
    });

    // ── TYPING INDICATOR ──────────────────────────────────────────────────
    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('playerTyping', {
        playerId: socket.id,
        playerName: socket.data.playerName,
        isTyping,
      });
    });

    // ── CODE PROGRESS ─────────────────────────────────────────────────────
    // Broadcast progress to peers WITHOUT writing to DB on every keystroke.
    // Progress is persisted on actual submission only.
    socket.on('codeProgress', ({ roomId, progress }) => {
      const clamped = Math.min(100, Math.max(0, progress || 0));
      socket.to(roomId).emit('progressUpdate', {
        playerId: socket.id,
        progress: clamped,
      });
    });

    // ── POWER-UP ──────────────────────────────────────────────────────────
    socket.on('usePowerUp', async ({ roomId, type, targetId }) => {
      try {
        const room = await getRoom(roomId);
        if (!room || room.state !== 'battle') return;

        const player = room.players[socket.id];
        if (!player) return;

        switch (type) {
          case 'freeze': {
            // Freeze target player for 5 seconds
            if (!room.players[targetId]) return;
            frozenPlayers.add(targetId);
            io.to(targetId).emit('powerUpEffect', {
              type: 'freeze',
              duration: 5000,
              message: `❄️ You've been FROZEN by ${player.name}!`,
            });
            io.to(roomId).emit('commentary', {
              message: `🥶 ${player.name} freezes ${room.players[targetId].name}'s keyboard!`,
            });
            setTimeout(() => frozenPlayers.delete(targetId), 5000);
            break;
          }
          case 'hint': {
            // Send a partial hint from the problem
            const hint = room.problem?.description?.slice(0, 100) + '...(hint)';
            socket.emit('powerUpEffect', { type: 'hint', hint });
            break;
          }
          case 'doubleScore': {
            // Flag player for double scoring next accepted submission
            const players = room.players;
            players[socket.id].doubleScore = true;
            await updateRoom(roomId, { players });
            socket.emit('powerUpEffect', {
              type: 'doubleScore',
              message: '⚡ Double score activated for your next submission!',
            });
            break;
          }
        }

        socket.to(roomId).emit('powerUpUsed', {
          playerId: socket.id,
          playerName: player.name,
          type,
          targetId,
        });
      } catch (err) {
        console.error('usePowerUp error:', err);
      }
    });

    // ── RESET ROOM (host requests a rematch from ResultPage) ─────────────
    socket.on('resetRoom', async ({ roomId }) => {
      try {
        const room = await getRoom(roomId);
        if (!room) return;
        if (room.players[socket.id]?.isHost !== true) return;

        // Reset all player state back to lobby defaults
        const players = {};
        Object.entries(room.players).forEach(([id, p]) => {
          players[id] = {
            ...p,
            isReady: false,
            score: 0,
            status: p.isSpectator ? 'spectating' : 'waiting',
            solvedAt: null,
            attempts: 0,
            progress: 0,
            doubleScore: false,
          };
        });

        await updateRoom(roomId, {
          state: 'lobby',
          problem: null,
          startTime: null,
          firstBloodId: null,
          players,
        });

        clearGameTimer(roomId);
        io.to(roomId).emit('roomReset', { players });
        io.to(roomId).emit('commentary', { message: '🔄 Host called a rematch! Get ready...' });
      } catch (err) {
        console.error('resetRoom error:', err);
      }
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      const roomId = socket.data.roomId;
      if (!roomId) return;

      try {
        const room = await getRoom(roomId);
        if (!room) return;

        const players = { ...(room.players || {}) };
        const leaving = players[socket.id];
        delete players[socket.id];

        const remaining = Object.values(players).filter((p) => !p.isSpectator);

        if (remaining.length === 0) {
          // Empty room — clean up
          await deleteRoom(roomId);
          clearGameTimer(roomId);
          console.log(`🗑️  Room ${roomId} deleted (empty)`);
        } else {
          // Transfer host if needed
          if (leaving?.isHost) {
            const newHost = remaining[0];
            players[newHost.id].isHost = true;
            io.to(newHost.id).emit('hostTransferred', { message: "You're now the host!" });
          }
          await updateRoom(roomId, { players });
          io.to(roomId).emit('playerLeft', {
            playerId: socket.id,
            playerName: leaving?.name,
            players,
          });
          io.to(roomId).emit('commentary', {
            message: `👋 ${leaving?.name || 'A player'} has left the arena.`,
          });
        }
      } catch (err) {
        console.error('disconnect cleanup error:', err);
      }
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startGameTimer(io, roomId, durationSeconds) {
  const startTime = Date.now();
  const interval = setInterval(async () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = durationSeconds - elapsed;

    if (remaining <= 0) {
      clearInterval(interval);
      gameTimers.delete(roomId);
      await endGame(io, roomId);
    } else {
      io.to(roomId).emit('timerTick', { remaining, elapsed });

      // Periodic commentary
      if (elapsed % 60 === 0 && elapsed > 0) {
        io.to(roomId).emit('commentary', { message: pickRandom(COMMENTARY.general) });
      }
    }
  }, 1000);
  gameTimers.set(roomId, interval);
}

function clearGameTimer(roomId) {
  const timer = gameTimers.get(roomId);
  if (timer) {
    clearInterval(timer);
    gameTimers.delete(roomId);
  }
}

async function endGame(io, roomId) {
  try {
    clearGameTimer(roomId);
    const room = await getRoom(roomId);
    if (!room || room.state === 'finished') return;

    await updateRoom(roomId, { state: 'finished' });

    const leaderboard = buildLeaderboard(room.players);
    const winner = leaderboard[0];
    const activePlayers = leaderboard.filter(p => !p.isSpectator);
    const totalPlayers = activePlayers.length;
    const dateKey = new Date().toISOString().slice(0, 10);

    // ── Save each player's battle record to Firestore ──
    const startTime = room.startTime || Date.now();
    for (const p of leaderboard) {
      if (p.uid) {
        const timeTaken = p.solvedAt ? Math.floor((p.solvedAt - startTime) / 1000) : null;
        saveUserBattle(p.uid, {
          roomId,
          rank:         p.rank,
          totalPlayers,
          score:        p.score || 0,
          status:       p.status || 'coding',
          problemTitle: room.problem?.title || 'Unknown',
          language:     p.language || 'unknown',
          timeTaken,
          date:         dateKey,
        }).catch(console.error);
      }
    }

    io.to(roomId).emit('gameEnded', {
      leaderboard,
      winner,
      message: winner ? `🏆 ${winner.name} wins the arena!` : 'Game over!',
    });

    console.log(`🏁 Game ended in room ${roomId}${winner ? ` — Winner: ${winner.name}` : ''}`);
  } catch (err) {
    console.error('endGame error:', err);
  }
}

function buildLeaderboard(players) {
  return Object.values(players)
    .filter((p) => !p.isSpectator)
    .sort((a, b) => {
      // Sort by score desc, then by solvedAt asc (faster wins tiebreak)
      if (b.score !== a.score) return b.score - a.score;
      if (a.solvedAt && b.solvedAt) return a.solvedAt - b.solvedAt;
      if (a.solvedAt) return -1;
      if (b.solvedAt) return 1;
      return 0;
    })
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

/** Strip hidden test cases and sensitive data from problem before sending to client */
function sanitizeProblem(problem) {
  const { hiddenTestCases, ...safe } = problem;
  return safe;
}

/** Basic code sanitization — prevent obvious shell injection.
 *  Uses word-boundary checks so legitimate Java/C++ identifiers
 *  like `evaluate(` or `executor` are NOT blocked.
 */
function sanitizeCode(code) {
  return code
    // Block Python-specific dangerous imports
    .replace(/^\s*import\s+os\b/gim, '# import os (blocked)')
    .replace(/^\s*import\s+subprocess\b/gim, '# import subprocess (blocked)')
    .replace(/^\s*from\s+os\b/gim, '# from os (blocked)')
    // Block exec/eval only when they are standalone calls (not part of another identifier)
    // e.g. exec( at word boundary → blocked; executor( → NOT blocked
    .replace(/\bexec\s*\(/g, '/* exec( blocked */ (')
    .replace(/\beval\s*\(/g, '/* eval( blocked */ (')
    .slice(0, 50_000); // max code length
}

module.exports = { initGameSocket };
