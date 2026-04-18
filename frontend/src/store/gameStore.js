import { create } from 'zustand';

/**
 * Global Zustand store for CodeArena.
 * Slices: player, room, game, ui
 */
const useGameStore = create((set, get) => ({
  // ─── Player ───────────────────────────────────────────────────────────
  player: null,         // { id, name, isHost, isReady, score, status, ... }
  setPlayer: (player) => set({ player }),
  updatePlayer: (updates) =>
    set((state) => ({ player: state.player ? { ...state.player, ...updates } : updates })),

  // ─── Room ──────────────────────────────────────────────────────────────
  room: null,           // { id, players, state, problem, startTime, ... }
  setRoom: (room) => set({ room }),
  updateRoom: (updates) =>
    set((state) => ({ room: state.room ? { ...state.room, ...updates } : updates })),

  // Players map (from socket updates)
  players: {},          // { [socketId]: playerObj }
  setPlayers: (players) => set({ players }),
  updatePlayerInRoom: (id, updates) =>
    set((state) => ({
      players: { ...state.players, [id]: { ...(state.players[id] || {}), ...updates } },
    })),

  // ─── Game ──────────────────────────────────────────────────────────────
  gamePhase: 'idle',    // idle | lobby | countdown | battle | result
  setGamePhase: (phase) => set({ gamePhase: phase }),

  problem: null,        // sanitized problem object
  setProblem: (problem) => set({ problem }),

  leaderboard: [],      // sorted array of player objects with rank
  setLeaderboard: (leaderboard) => set({ leaderboard }),

  timer: 0,             // seconds remaining
  setTimer: (timer) => set({ timer }),

  startTime: null,
  setStartTime: (t) => set({ startTime: t }),

  firstBloodPlayerId: null,
  setFirstBlood: (id) => set({ firstBloodPlayerId: id }),

  winner: null,
  setWinner: (winner) => set({ winner }),

  finalLeaderboard: [],
  setFinalLeaderboard: (lb) => set({ finalLeaderboard: lb }),

  // ─── Chat ──────────────────────────────────────────────────────────────
  chatMessages: [],
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg].slice(-100) })),

  // ─── Code State ────────────────────────────────────────────────────────
  code: '',
  setCode: (code) => set({ code }),

  language: 'python',
  setLanguage: (language) => set({ language }),

  submissionResult: null,
  setSubmissionResult: (result) => set({ submissionResult: result }),

  runResult: null,
  setRunResult: (result) => set({ runResult: result }),

  isSubmitting: false,
  setIsSubmitting: (v) => set({ isSubmitting: v }),

  isRunning: false,
  setIsRunning: (v) => set({ isRunning: v }),

  // ─── UI State ──────────────────────────────────────────────────────────
  typingPlayers: {},    // { [socketId]: true/false }
  setTypingPlayer: (id, isTyping) =>
    set((state) => ({ typingPlayers: { ...state.typingPlayers, [id]: isTyping } })),

  commentary: [],       // last N commentary messages
  addCommentary: (msg) =>
    set((state) => ({
      commentary: [{ msg, id: Date.now() }, ...state.commentary].slice(0, 8),
    })),

  powerUpEffect: null,  // { type, message, duration }
  setPowerUpEffect: (effect) => set({ powerUpEffect: effect }),
  clearPowerUpEffect: () => set({ powerUpEffect: null }),

  isFrozen: false,
  setFrozen: (v) => set({ isFrozen: v }),

  anonymousMode: false,
  setAnonymousMode: (v) => set({ anonymousMode: v }),

  countdownValue: null,
  setCountdownValue: (v) => set({ countdownValue: v }),

  // ─── Reset ─────────────────────────────────────────────────────────────
  resetGame: () =>
    set({
      gamePhase: 'lobby',
      problem: null,
      leaderboard: [],
      timer: 0,
      startTime: null,
      firstBloodPlayerId: null,
      winner: null,
      finalLeaderboard: [],
      chatMessages: [],
      code: '',
      submissionResult: null,
      runResult: null,
      isSubmitting: false,
      isRunning: false,
      typingPlayers: {},
      commentary: [],
      powerUpEffect: null,
      isFrozen: false,
      countdownValue: null,
    }),

  resetAll: () =>
    set({
      player: null,
      room: null,
      players: {},
      gamePhase: 'idle',
      problem: null,
      leaderboard: [],
      timer: 0,
      startTime: null,
      firstBloodPlayerId: null,
      winner: null,
      finalLeaderboard: [],
      chatMessages: [],
      code: '',
      language: 'python',
      submissionResult: null,
      runResult: null,
      isSubmitting: false,
      isRunning: false,
      typingPlayers: {},
      commentary: [],
      powerUpEffect: null,
      isFrozen: false,
      anonymousMode: false,
      countdownValue: null,
    }),
}));

export default useGameStore;
