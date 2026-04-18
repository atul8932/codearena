import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import socket, { setVoluntaryLeave } from '../services/socket';
import useGameStore from '../store/gameStore';
import { TopNav, PageShell } from './LandingPage';
import VotingOverlay from './VotingOverlay';


// ─── Avatar ───────────────────────────────────────────────────────────────────
const COLORS = ['#ef4444','#f97316','#F5A623','#22c55e','#60a5fa','#a78bfa','#E8871A','#e879f9'];
function Avatar({ name, size = 34, isHost }) {
  const c = COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  return (
    <div className="shrink-0 flex items-center justify-center rounded-lg font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4, background: c, color: '#111', boxShadow: isHost ? `0 0 10px ${c}60` : 'none' }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

// ─── Player Row ───────────────────────────────────────────────────────────────
function PlayerRow({ p, isMe, anonymousMode, gamePhase }) {
  const name = anonymousMode && gamePhase === 'battle' ? '???' : p.name;
  return (
    <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        borderBottom: '1px solid var(--border-2)',
        background: isMe ? 'rgba(239,68,68,0.04)' : 'transparent',
      }}>
      <td className="py-3 px-4">
        <Avatar name={name} isHost={p.isHost} />
      </td>
      <td className="py-3 px-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium" style={{ color: isMe ? 'var(--gold)' : 'var(--text)' }}>{name}</span>
          {p.isHost && <span className="badge-amber">HOST</span>}
          {isMe   && <span className="badge-pink">YOU</span>}
          {p.isSpectator && <span className="badge" style={{ color: 'var(--text-dim)', border: '1px solid var(--border)', fontSize: 10 }}>👁 SPECTATOR</span>}
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        {!p.isSpectator && (
          <div className="flex items-center justify-end gap-2">
            <span className="w-2 h-2 rounded-full"
              style={{ background: p.isReady ? 'var(--green)' : 'var(--surface-3)', boxShadow: p.isReady ? '0 0 6px var(--green)' : 'none' }} />
            <span className="text-xs font-mono" style={{ color: p.isReady ? 'var(--green)' : 'var(--text-dim)' }}>
              {p.isReady ? 'READY' : 'WAITING'}
            </span>
          </div>
        )}
      </td>
    </motion.tr>
  );
}

// ─── Countdown Overlay ────────────────────────────────────────────────────────
function CountdownOverlay({ value }) {
  const c = [,'#ef4444','#E8871A','var(--blue)'][value] || 'var(--text)';
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(12px)' }}>
      <p className="text-xs font-mono tracking-widest uppercase mb-8" style={{ color: 'var(--text-dim)' }}>
        Battle Starting In
      </p>
      <AnimatePresence mode="wait">
        <motion.div key={value} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.4, opacity: 0 }} transition={{ duration: 0.3 }}
          className="font-bold" style={{ fontSize: '9rem', lineHeight: 1, color: c }}>
          {value > 0 ? value : '⚔️'}
        </motion.div>
      </AnimatePresence>
      {value <= 0 && (
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mt-6 tracking-widest" style={{ color: 'var(--accent)' }}>
          CODE!
        </motion.p>
      )}
    </motion.div>
  );
}

// ─── LobbyPage ────────────────────────────────────────────────────────────────
export default function LobbyPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { player, players, room, gamePhase, anonymousMode, countdownValue } = useGameStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (!player || !roomId) navigate('/'); }, [player, roomId]);
  useEffect(() => { if (gamePhase === 'battle') navigate(`/battle/${roomId}`); }, [gamePhase]);

  const playerList = Object.values(players || {});
  const realPlayers = playerList.filter((p) => !p.isSpectator);
  const readyCount = realPlayers.filter((p) => p.isReady).length;
  const allReady = realPlayers.length > 1 && realPlayers.every((p) => p.isReady || p.isHost);
  const myData = player ? players[player.id] || player : null;
  const isHost = myData?.isHost === true;


  const handleReady  = () => socket.emit('playerReady', { roomId });
  const handleStart  = () => { if (realPlayers.length < 1) return toast.error('Need at least 1 player!'); socket.emit('startGame', { roomId }); };
  const handleCopy   = () => { navigator.clipboard.writeText(roomId); setCopied(true); toast.success('Room ID copied!', { icon: '📋' }); setTimeout(() => setCopied(false), 2000); };
  const handleToggle = () => socket.emit('toggleAnonymous', { roomId });
  const handleLeave  = () => {
    setVoluntaryLeave(true);          // prevent reconnect ghost-join
    localStorage.removeItem('codearena_roomId'); // clear persisted room
    socket.emit('leaveRoom', { roomId });
    useGameStore.getState().resetAll();
    navigate('/');
  };


  const diffColor = { Hard: 'var(--accent)', Medium: 'var(--bronze)', Easy: 'var(--green)' }[room?.difficulty] || 'var(--text-dim)';

  return (
    <PageShell nav={
      <TopNav
        right={<div className="status-online text-xs">{realPlayers.length}/8 Players</div>}
      />
    }>
      <AnimatePresence>
        {gamePhase === 'voting' && <VotingOverlay />}
        {gamePhase === 'countdown' && countdownValue != null && <CountdownOverlay value={countdownValue} />}
      </AnimatePresence>

      {/* Sub-header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text)' }}>Battle Lobby</h1>
          <p className="text-xs mt-0.5 hidden sm:block" style={{ color: 'var(--text-dim)' }}>Share the Room ID and wait for opponents</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Leave Lobby button — always visible */}
          <button
            onClick={handleLeave}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg transition-all font-semibold"
            style={{
              background: 'rgba(239,68,68,0.08)',
              color: 'var(--accent)',
              border: '1px solid rgba(239,68,68,0.25)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          >
            🚪 Leave
          </button>

          {isHost ? (
            <button onClick={handleStart}
              disabled={realPlayers.length < 1}
              className="btn-primary text-xs sm:text-sm"
              style={!allReady && realPlayers.length > 1 ? { opacity: 0.55 } : {}}>
              {realPlayers.length < 2 ? '⚔️ Start Solo' : allReady ? '⚔️ Start Battle!' : `⏳ ${readyCount}/${realPlayers.length}`}
            </button>
          ) : (
            <button onClick={handleReady}
              className="btn-primary text-xs sm:text-sm"
              style={myData?.isReady ? { background: 'transparent', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.4)' } : {}}>
              {myData?.isReady ? '✓ Ready!' : '⚡ Ready Up'}
            </button>
          )}
        </div>

      </div>

      {/* Content */}
      <div className="flex-1 px-3 sm:px-6 py-4 sm:py-5 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 overflow-y-auto">

        {/* Left — Room info */}
        <div className="space-y-4">
          {/* Room ID */}
          <div className="card">
            <p className="section-title">🏠 Room ID</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 text-center font-mono font-bold text-xl py-3 rounded-lg"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--accent)', letterSpacing: '0.25em' }}>
                {roomId}
              </div>
              <button onClick={handleCopy}
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: copied ? 'rgba(34,197,94,0.1)' : 'var(--surface-2)',
                  border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                  color: copied ? 'var(--green)' : 'var(--text-dim)',
                }}>
                {copied ? '✓' : '📋'}
              </button>
            </div>
            <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>Share with friends to invite</p>
          </div>

          {/* Settings */}
          <div className="card">
            <p className="section-title">⚙️ Settings</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Difficulty</span>
                <span className="text-sm font-semibold" style={{ color: diffColor }}>{room?.difficulty || 'Random'}</span>
              </div>
              <div className="divider" />
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Duration</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>20 min</span>
              </div>
              {player?.isHost && (
                <>
                  <div className="divider" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Anonymous Mode</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>Hide names in battle</p>
                    </div>
                    <button onClick={handleToggle}
                      className="relative w-11 h-6 rounded-full transition-all"
                      style={{
                        background: anonymousMode ? 'var(--accent)' : 'var(--surface-3)',
                        border: `1px solid ${anonymousMode ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
                      }}>
                      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                        style={{ left: anonymousMode ? '1.25rem' : '0.125rem', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right — Player table */}
        <div className="lg:col-span-2 card">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <p className="section-title mb-0">👥 Participants</p>
            <div className="flex items-center gap-3">
              <div className="font-mono text-xs" style={{ color: 'var(--text-dim)' }}>
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>{readyCount}</span>/{realPlayers.length} ready
              </div>
              {realPlayers.length > 0 && (
                <div className="progress-track w-20">
                  <motion.div className="progress-fill" style={{ background: 'var(--green)' }}
                    animate={{ width: `${(readyCount / Math.max(realPlayers.length, 1)) * 100}%` }} />
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['', 'Participant', 'Status'].map((h, i) => (
                  <th key={i} className={`py-2 px-${i === 0 ? 4 : i === 2 ? 4 : 2} text-xs font-semibold tracking-wide ${i === 2 ? 'text-right' : 'text-left'}`}
                    style={{ color: 'var(--text-dim)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {playerList.map((p) => (
                  <PlayerRow key={p.id} p={p} isMe={p.id === player?.id} anonymousMode={anonymousMode} gamePhase={gamePhase} />
                ))}
              </AnimatePresence>
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 4 - playerList.length) }).map((_, i) => (
                <tr key={`empty-${i}`} style={{ borderBottom: '1px solid var(--border-2)' }}>
                  <td className="py-3 px-4">
                    <div className="w-[34px] h-[34px] rounded-lg border border-dashed" style={{ borderColor: 'var(--border)' }} />
                  </td>
                  <td className="py-3 px-2" colSpan={2}>
                    <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Waiting for player...</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {playerList.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--text-dim)' }}>
              <div className="text-4xl mb-3 opacity-40">🏜️</div>
              <p className="text-sm">No players yet. Share the Room ID!</p>
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 pt-3 flex items-center gap-5 text-xs font-mono" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />Ready</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-600" />Waiting</div>
            <div className="ml-auto">Max 8 players</div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
