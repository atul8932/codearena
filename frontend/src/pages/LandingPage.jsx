import { useState, useEffect } from 'react';
import { motion, AnimatePresence, color } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import socket, { voluntaryLeave, setVoluntaryLeave } from '../services/socket';
import useGameStore from '../store/gameStore';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

// ─── Shared Nav ──────────────────────────────────────────────────────────────
export function TopNav({ right }) {
  const { user, logout } = useAuth() || {};
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const avatarUrl = user?.photoURL;
  const initials = user?.displayName?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || '??';

  return (
    <nav className="top-nav">
      {/* Brand — click navigates home */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 rounded-lg px-1 py-0.5 transition-all"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
        title="Go to home"
      >
        <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
          style={{ background: 'var(--accent)', color: '#fff' }}>⚡</div>
        <span className="text-sm font-bold tracking-wide" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>
          CODE<span style={{ color: 'var(--accent)' }}>ARENA</span>
        </span>
      </button>

      <div className="flex-1" />

      {/* Right slot */}
      {right && right}

      {/* User chip & Notifications */}
      {user && (
        <div className="flex items-center gap-2 ml-2">
          {/* Notifications */}
          <div className="relative">
            <button onClick={() => { setShowNotifs(!showNotifs); markAsRead(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center relative hover:bg-white/5 transition-colors"
              title="Notifications">
              🔔
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white border border-black">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-10 w-64 card p-0 overflow-hidden z-50 shadow-2xl" style={{ border: '1px solid var(--border)' }}>
                <div className="p-3 font-bold text-xs flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  <span>Admin Notifications</span>
                  <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs" style={{ color: 'var(--text-dim)' }}>No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 text-xs" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="font-bold mb-1" style={{ color: 'var(--accent)' }}>{n.title}</div>
                        <div style={{ color: 'var(--text)' }}>{n.message}</div>
                        <div className="mt-1" style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                          {new Date(n.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Avatar — click to go to profile */}
          <button onClick={() => navigate('/profile')}
            className="flex items-center gap-2 rounded-lg px-2 py-1 transition-all"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            title="View profile">
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: avatarUrl ? 'transparent' : 'var(--accent)', color: '#fff', border: '1px solid var(--border)' }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : initials}
            </div>
            <span className="text-xs font-medium hidden sm:block truncate max-w-[100px]"
              style={{ color: 'var(--text-muted)' }}>
              {user.displayName || user.email?.split('@')[0]}
            </span>
          </button>
          {/* Logout */}
          <button onClick={handleLogout}
            className="btn-ghost text-xs px-2 py-1"
            title="Sign out">
            <span className="hidden sm:inline">Sign out</span>
            <span className="sm:hidden">↩</span>
          </button>
        </div>
      )}
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
  { icon: '⚔️', title: 'Real-Time Battles', desc: 'Compete simultaneously. Every millisecond counts.' },
  { icon: '🔥', title: 'Power-Ups', desc: 'Freeze opponents, reveal hints, or double your score.' },
  { icon: '🎯', title: 'Live Scoreboard', desc: 'Watch rankings shift live with every submission.' },
  { icon: '🤖', title: 'AI Commentary', desc: 'Dynamic AI reacts to every move and milestone.' },
  { icon: '🏆', title: 'First Blood', desc: 'First correct submission earns the crown.' },
  { icon: '👁️', title: 'Spectator Mode', desc: 'Watch live battles without playing.' },
];

// ─── DecryptedText Component ───────────────────────────────────────────────────
function DecryptedText({ text, speed = 40, className, style }) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let i = 0;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';

    const interval = setInterval(() => {
      setDisplayText(prev => {
        if (i >= text.length) {
          clearInterval(interval);
          return text;
        }

        let result = text.substring(0, i);
        for (let j = i; j < text.length; j++) {
          if (text[j] === ' ') result += ' ';
          else result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
      });
      i += 1 / 3; // Controls how fast it settles
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span className={className} style={style}>{displayText}</span>;
}

// ─── Custom Loading Window ──────────────────────────────────────────────────
function CustomLoadingWindow({ isVisible, message = "INITIALIZING SESSION..." }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.1, opacity: 0 }}
        className="card w-full max-w-sm border border-neon-blue/50 shadow-[0_0_30px_rgba(0,240,255,0.2)] flex flex-col items-center justify-center p-8 text-center"
      >
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-4 border-neon-blue/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-neon-blue rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-neon-blue text-xs font-bold">
            ⚡
          </div>
        </div>
        <h3 className="text-neon-blue font-bold font-display tracking-widest uppercase mb-2">
          <DecryptedText text={message} speed={20} />
        </h3>
        <p className="text-slate-400 text-xs font-cyber animate-pulse">
          Establishing secure WebSocket connection...
        </p>
      </motion.div>
    </div>
  );
}

// ─── LandingPage ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const [mode, setMode] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [timeLimit, setTimeLimit] = useState('20');
  const [maxPlayers, setMaxPlayers] = useState('8');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { resetAll, roomType, setRoomType } = useGameStore();

  const [publicRooms, setPublicRooms] = useState([]);

  useEffect(() => { resetAll(); }, []);

  // Fetch public scheduled rooms
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/room`)
      .then(r => r.json())
      .then(d => { if (d.publicRooms) setPublicRooms(d.publicRooms); })
      .catch(console.error);
  }, []);

  // Pre-fill name from Firebase auth
  useEffect(() => {
    if (user?.displayName) setPlayerName(user.displayName.slice(0, 20));
    else if (user?.email) setPlayerName(user.email.split('@')[0].slice(0, 20));
  }, [user]);

  // Auto Reconnect Logic — skip if the user intentionally left
  useEffect(() => {
    // If the user explicitly left, reset the flag and skip auto-rejoin
    if (voluntaryLeave) {
      setVoluntaryLeave(false);
      localStorage.removeItem('codearena_roomId');
      return;
    }
    const savedRoom = localStorage.getItem('codearena_roomId');
    if (savedRoom) {
      setRoomId(savedRoom);
      const doEmit = () => {
        socket.emit('joinRoom', { roomId: savedRoom, playerName: user?.displayName?.slice(0, 20) || 'ReconnectingPlayer', uid: user?.uid || null, autoReconnect: true });
      };
      if (socket.connected) doEmit();
      else { socket.once('connect', doEmit); socket.connect(); }
    }
  }, [user]);

  const handleConnect = () => {
    const name = playerName.trim();
    const uid = user?.uid || null;
    if (!name) return toast.error('Enter your name!');
    if (name.length > 20) return toast.error('Name too long (max 20 chars)');
    if (mode === 'join' || mode === 'spectate') {
      const id = roomId.trim().toUpperCase();
      if (!id || id.length < 4) return toast.error('Enter a valid Room ID');
    }
    setIsConnecting(true);
    const doEmit = () => {
      if (mode === 'create') {
        socket.emit('createRoom', { playerName: name, isPrivate, difficulty: difficulty || null, timeLimit: parseInt(timeLimit), maxPlayers: parseInt(maxPlayers), uid, roomType });
      } else if (mode === 'spectate') {
        socket.emit('joinRoom', { roomId: roomId.trim().toUpperCase(), playerName: name, spectate: true, uid });
      } else {
        socket.emit('joinRoom', { roomId: roomId.trim().toUpperCase(), playerName: name, uid });
      }
    };
    if (socket.connected) { doEmit(); }
    else { socket.off('connect', doEmit); socket.once('connect', doEmit); socket.connect(); }
    setTimeout(() => setIsConnecting(false), 8000);
  };

  return (
    <PageShell nav={<TopNav />}>
      <CustomLoadingWindow isVisible={isConnecting} message={mode === 'create' ? "LAUNCHING ROOM..." : "ENTERING ARENA..."} />
      <div className="flex-1 flex flex-col">

        {/* ── Sub-header ── */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display tracking-tight drop-shadow-lg"
              style={{
                backgroundImage: 'linear-gradient(to right, var(--neon-blue), var(--neon-purple), var(--neon-pink))',
                WebkitBackgroundClip: 'text',
                // WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              <text>Welcome to CodeArena</text>
            </h1>
            <p className="text-xs sm:text-sm mt-1 font-cyber tracking-widest uppercase flex items-center gap-2" style={{ color: 'var(--neon-pink)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse bg-neon-pink shadow-[0_0_8px_var(--neon-pink)] shrink-0"></span>
              <text >Real-Time Multiplayer Coding Battles</text>
            </p>
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
                    <span style={{ color: 'var(--accent)' }}><DecryptedText text="Code to Win." /></span>
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

                {/* Scheduled Global Battles */}
                {publicRooms.length > 0 && (
                  <div className="max-w-4xl mx-auto mb-16">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">⚔️</span>
                      <h3 className="font-bold text-lg text-neon-blue">Scheduled Global Battles</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {publicRooms.map(r => {
                        const startsIn = Math.max(0, Math.floor((r.scheduledStartTime - Date.now()) / 60000));
                        return (
                          <div key={r.id} className="card border border-neon-blue/30 bg-neon-blue/5">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-slate-200">{r.problem?.title || 'Unknown Problem'}</h4>
                                <div className="text-xs text-slate-400 mt-1">Room ID: {r.id}</div>
                              </div>
                              <span className="badge badge-green text-xs">Public</span>
                            </div>
                            <div className="flex justify-between items-center mt-4">
                              <div className="text-xs text-neon-pink font-bold">
                                {startsIn > 0 ? `Starts in ${startsIn} mins` : 'Starting soon!'}
                              </div>
                              <button onClick={() => { setRoomId(r.id); setMode('join'); }} className="btn-primary text-xs py-1.5 px-4">
                                Join Battle
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Difficulty</label>
                          <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input-cyber">
                            <option value="">Random</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Time Limit</label>
                            <select value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} className="input-cyber">
                              <option value="5">5 Minutes</option>
                              <option value="10">10 Minutes</option>
                              <option value="20">20 Minutes</option>
                              <option value="30">30 Minutes</option>
                              <option value="60">1 Hour</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Max Players</label>
                            <select value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} className="input-cyber">
                              <option value="2">2 Players (Duel)</option>
                              <option value="4">4 Players</option>
                              <option value="8">8 Players</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input type="checkbox" id="isPrivate" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="rounded" style={{ accentColor: 'var(--accent)' }} />
                          <label htmlFor="isPrivate" className="text-xs text-white/70 cursor-pointer">Private Room (Hidden from public listings)</label>
                        </div>
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
          <span>CodeArena © 2026</span>
          <span className="hidden sm:block">Real-Time Multiplayer Coding Battles</span>
        </div>
      </div>
    </PageShell>
  );
}
