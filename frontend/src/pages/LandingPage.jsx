import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import socket from '../services/socket';
import useGameStore from '../store/gameStore';

// ─── Shared Nav ──────────────────────────────────────────────────────────────
export function TopNav({ right }) {
  return (
    <nav className="top-nav">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
          style={{ background: 'var(--accent)', color: '#fff' }}>⚡</div>
        <span className="text-sm font-bold tracking-wide" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>
          CODE<span style={{ color: 'var(--accent)' }}>ARENA</span>
        </span>
      </div>

      <div className="flex-1" />

      {/* Right slot */}
      {right && right}
    </nav>
  );
}

// ─── Page wrapper ────────────────────────────────────────────────────────────
export function PageShell({ children, nav }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {nav}
      {children}
    </div>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────
const features = [
  { icon: '⚔️', title: 'Real-Time Battles',  desc: 'Compete simultaneously. Every millisecond counts.' },
  { icon: '🔥', title: 'Power-Ups',          desc: 'Freeze opponents, reveal hints, or double your score.' },
  { icon: '🎯', title: 'Live Scoreboard',    desc: 'Watch rankings shift live with every submission.' },
  { icon: '🤖', title: 'AI Commentary',      desc: 'Dynamic AI reacts to every move and milestone.' },
  { icon: '🏆', title: 'First Blood',        desc: 'First correct submission earns the crown.' },
  { icon: '👁️', title: 'Spectator Mode',     desc: 'Watch live battles without playing.' },
];

// ─── LandingPage ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { resetAll } = useGameStore();

  useEffect(() => { resetAll(); }, []);

  const handleConnect = () => {
    const name = playerName.trim();
    if (!name) return toast.error('Enter your name!');
    if (name.length > 20) return toast.error('Name too long (max 20 chars)');
    if (mode === 'join' || mode === 'spectate') {
      const id = roomId.trim().toUpperCase();
      if (!id || id.length < 4) return toast.error('Enter a valid Room ID');
    }
    setIsConnecting(true);
    const doEmit = () => {
      if (mode === 'create') {
        socket.emit('createRoom', { playerName: name, isPrivate: false, difficulty: difficulty || null });
      } else if (mode === 'spectate') {
        socket.emit('joinRoom', { roomId: roomId.trim().toUpperCase(), playerName: name, spectate: true });
      } else {
        socket.emit('joinRoom', { roomId: roomId.trim().toUpperCase(), playerName: name });
      }
    };
    if (socket.connected) { doEmit(); }
    else { socket.off('connect', doEmit); socket.once('connect', doEmit); socket.connect(); }
    setTimeout(() => setIsConnecting(false), 8000);
  };

  return (
    <PageShell nav={<TopNav />}>
      <div className="flex-1 flex flex-col">

        {/* ── Sub-header ── */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>Welcome to CodeArena</h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--accent)' }}>Real-Time Multiplayer Coding Battles</p>
          </div>
          <div className="status-online text-xs">ARENA ONLINE</div>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 px-6 py-6">
          <AnimatePresence mode="wait">
            {!mode ? (
              <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                {/* Hero */}
                <div className="text-center py-8 sm:py-12">
                  <h2 className="text-2xl sm:text-4xl font-bold mb-3" style={{ color: 'var(--text)' }}>
                    Enter the Arena.{' '}
                    <span style={{ color: 'var(--accent)' }}>Code to Win.</span>
                  </h2>
                  <p className="text-sm sm:text-base mb-6 sm:mb-8 max-w-lg mx-auto px-4" style={{ color: 'var(--text-muted)' }}>
                    Solve problems faster than your opponents in real-time coding battles.
                  </p>
                  <div className="flex flex-col sm:flex-wrap sm:flex-row gap-2 sm:gap-3 justify-center mb-8 sm:mb-10 px-4 sm:px-0">
                    <button id="btn-create-room" onClick={() => setMode('create')} className="btn-primary py-3 sm:py-2.5 text-sm w-full sm:w-auto sm:px-8">
                      ⚔️ Create Room
                    </button>
                    <button id="btn-join-room" onClick={() => setMode('join')} className="btn-secondary py-3 sm:py-2.5 text-sm w-full sm:w-auto sm:px-8">
                      🎮 Join Room
                    </button>
                    <button id="btn-spectate" onClick={() => setMode('spectate')} className="btn-ghost py-3 sm:py-2.5 text-sm w-full sm:w-auto sm:px-8">
                      👁️ Watch as Spectator
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-center gap-6 sm:gap-12 mb-8 sm:mb-12 flex-wrap">
                    {[['2.4K+', 'Active Players'], ['18K+', 'Battles Fought'], ['200+', 'Problems'], ['4', 'Languages']].map(([v, l]) => (
                      <div key={l} className="text-center">
                        <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>{v}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="max-w-5xl mx-auto">
                  <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--text-dim)' }}>
                    Why CodeArena
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {features.map((f) => (
                      <div key={f.title} className="card-hover p-4">
                        <div className="text-xl mb-2">{f.icon}</div>
                        <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{f.title}</div>
                        <div className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>{f.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-sm mx-auto mt-4 sm:mt-8 px-0 sm:px-0"
              >
                <div className="card">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                        {mode === 'create' ? '⚔️ Create Room' : mode === 'spectate' ? '👁️ Watch as Spectator' : '🎮 Join Room'}
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                        {mode === 'create' ? 'Start a new battle session' : mode === 'spectate' ? 'Watch a live battle without playing' : 'Enter an existing room'}
                      </p>
                    </div>
                    <button onClick={() => { setMode(null); setIsConnecting(false); }}
                      className="w-7 h-7 rounded flex items-center justify-center text-sm"
                      style={{ color: 'var(--text-dim)', background: 'var(--surface-2)' }}>
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Arena Name</label>
                      <input id="playerName" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                        placeholder="Enter your name..." maxLength={20} className="input-cyber" autoFocus />
                    </div>

                    {(mode === 'join' || mode === 'spectate') && (
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Room ID</label>
                        <input id="roomId" value={roomId} onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                          placeholder="e.g. XK72PQ9A" maxLength={8} className="input-cyber"
                          style={{ letterSpacing: '0.2em' }} />
                      </div>
                    )}

                    {mode === 'spectate' && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>👁️</span>
                        <span style={{ color: 'var(--text-dim)' }}>You will join as a silent observer — no submissions allowed.</span>
                      </div>
                    )}

                    {mode === 'create' && (
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                          Difficulty <span style={{ color: 'var(--text-dim)' }}>(optional)</span>
                        </label>
                        <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input-cyber">
                          <option value="">Random</option>
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    )}

                    <button id="btn-connect" onClick={handleConnect} disabled={isConnecting} className="btn-primary w-full py-2.5"
                      style={mode === 'spectate' ? { background: 'var(--surface-3)', color: 'var(--text-muted)', border: '1px solid var(--border)' } : {}}>
                      {isConnecting ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />Connecting...</>
                      ) : mode === 'create' ? '🚀 Launch Room' : mode === 'spectate' ? '👁️ Enter as Spectator' : '⚡ Enter Arena'}
                    </button>
                  </div>
                </div>

                <button onClick={() => { setMode(null); setIsConnecting(false); }}
                  className="w-full mt-3 text-sm text-center" style={{ color: 'var(--text-dim)' }}>
                  ← Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between text-xs"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          <span>CodeArena © 2024</span>
          <span className="hidden sm:block">Real-Time Multiplayer Coding Battles</span>
          <span>Built with ⚡</span>
        </div>
      </div>
    </PageShell>
  );
}
