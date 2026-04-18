import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const DEFAULT_KEY = import.meta.env.VITE_ADMIN_PASSKEY || '';

// ─── API helper ───────────────────────────────────────────────────────────────
function api(path, key, opts = {}) {
  return fetch(`${API}/api/admin${path}`, {
    headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
    ...opts,
  }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Request failed');
    return data;
  });
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StateBadge({ state }) {
  const map = {
    battle:   'bg-neon-pink/20 text-neon-pink border-neon-pink/40',
    lobby:    'bg-neon-blue/20 text-neon-blue border-neon-blue/40',
    countdown:'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    finished: 'bg-slate-700 text-slate-400 border-slate-600',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-cyber border uppercase ${map[state] || 'bg-slate-700 text-slate-400 border-slate-600'}`}>
      {state}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = 'neon-blue' }) {
  const glow = { 'neon-blue': 'border-neon-blue/30 shadow-neon-blue/10', 'neon-pink': 'border-neon-pink/30 shadow-neon-pink/10', 'neon-green': 'border-neon-green/30 shadow-neon-green/10', 'neon-purple': 'border-neon-purple/30 shadow-neon-purple/10' };
  const text = { 'neon-blue': 'text-neon-blue', 'neon-pink': 'text-neon-pink', 'neon-green': 'text-neon-green', 'neon-purple': 'text-neon-purple' };
  return (
    <div className={`glass rounded-xl border ${glow[color]} p-5 shadow-lg`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`font-display text-3xl font-black ${text[color]}`}>{value}</div>
      <div className="font-cyber text-xs text-slate-400 mt-1 uppercase">{label}</div>
      {sub && <div className="text-xs text-slate-600 font-cyber mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

function ToastList({ toasts }) {
  const colors = { success: 'border-neon-green/40 text-neon-green', error: 'border-neon-pink/40 text-neon-pink', info: 'border-neon-blue/40 text-neon-blue' };
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
            className={`glass border rounded-lg px-4 py-3 text-sm font-cyber ${colors[t.type]}`}>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ msg, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass border border-neon-pink/30 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl">
        <div className="text-3xl mb-4 text-center">⚠️</div>
        <p className="text-slate-300 text-center mb-6 font-cyber text-sm">{msg}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-dark-border text-slate-400 font-cyber text-sm hover:bg-dark-card transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-lg bg-neon-pink/20 border border-neon-pink/40 text-neon-pink font-cyber text-sm hover:bg-neon-pink/30 transition-colors">Confirm</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [pass, setPass] = useState(DEFAULT_KEY);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: pass }),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error);
        return r.json();
      });
      onLogin(pass);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg cyber-grid flex items-center justify-center">
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="glass border border-neon-blue/20 rounded-2xl p-10 w-full max-w-md shadow-2xl glow-blue">
        <div className="text-center mb-8">
          <div className="font-display text-2xl font-black mb-1">
            CODE<span className="text-neon-pink">ARENA</span>
          </div>
          <div className="font-cyber text-neon-blue text-sm tracking-widest">ADMIN PANEL</div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-cyber text-slate-400 block mb-1.5">ADMIN PASSKEY</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Enter passkey..."
              className="input-cyber"
              autoFocus
            />
          </div>
          {err && <p className="text-neon-pink text-xs font-cyber">{err}</p>}
          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" /> Verifying...</>
            ) : '🔐 Enter Admin Panel'}
          </button>
        </form>

        <p className="text-center text-xs font-cyber text-slate-600 mt-6">
          Set ADMIN_PASSKEY in backend/.env to change the passkey
        </p>
      </motion.div>
    </div>
  );
}

// ─── SECTION: Overview ────────────────────────────────────────────────────────
function OverviewSection({ stats, onRefresh }) {
  if (!stats) return <div className="text-slate-500 font-cyber animate-pulse">Loading stats...</div>;
  const { server, rooms, players, games, problems } = stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-neon-blue">📊 Overview</h2>
        <button onClick={onRefresh} className="btn-ghost text-xs px-3 py-1.5">↻ Refresh</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🏠" label="Total Rooms" value={rooms.total} sub={`${rooms.active} in battle`} color="neon-blue" />
        <StatCard icon="⚔️" label="Active Battles" value={rooms.active} sub={`${rooms.lobby} in lobby`} color="neon-pink" />
        <StatCard icon="👥" label="Players Online" value={players.online} color="neon-green" />
        <StatCard icon="🏆" label="Games Played" value={games.total} sub={`${games.submissions} submissions`} color="neon-purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Server health */}
        <div className="card">
          <p className="section-title">🖥️ SERVER HEALTH</p>
          <div className="space-y-3 text-sm font-cyber">
            {[
              ['Uptime', server.uptimeHuman, 'text-neon-green'],
              ['Memory Used', `${server.memory.used} MB / ${server.memory.total} MB`, 'text-neon-blue'],
              ['Free Memory', `${server.memory.free} MB`, 'text-slate-400'],
              ['Node Version', server.nodeVersion, 'text-neon-purple'],
              ['Platform', server.platform, 'text-slate-400'],
              ['CPU', server.cpu, 'text-slate-500'],
            ].map(([label, val, cls]) => (
              <div key={label} className="flex justify-between items-center border-b border-dark-border pb-2">
                <span className="text-slate-500">{label}</span>
                <span className={cls}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Problem stats */}
        <div className="card">
          <p className="section-title">📚 PROBLEMS</p>
          <div className="space-y-2 text-sm font-cyber">
            <div className="flex justify-between border-b border-dark-border pb-2">
              <span className="text-slate-500">Total Problems</span>
              <span className="text-neon-blue">{problems.total}</span>
            </div>
            <div className="flex justify-between border-b border-dark-border pb-2">
              <span className="text-slate-500">Room States</span>
              <span className="text-slate-400">
                🟢 {rooms.lobby} lobby · 🔴 {rooms.active} battle · ⬛ {rooms.finished} done
              </span>
            </div>
            <div className="flex justify-between border-b border-dark-border pb-2">
              <span className="text-slate-500">Submissions (session)</span>
              <span className="text-neon-purple">{games.submissions}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SECTION: Rooms ───────────────────────────────────────────────────────────
function RoomsSection({ adminKey, toast }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [msgRoom, setMsgRoom] = useState(null);
  const [msgText, setMsgText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/rooms', adminKey);
      setRooms(data.rooms);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  const doDelete = async (roomId) => {
    try { await api(`/rooms/${roomId}`, adminKey, { method: 'DELETE' }); toast(`Room ${roomId} deleted`, 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const doEnd = async (roomId) => {
    try { await api(`/rooms/${roomId}/end`, adminKey, { method: 'POST' }); toast(`Game in ${roomId} ended`, 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const doReset = async (roomId) => {
    try { await api(`/rooms/${roomId}/reset`, adminKey, { method: 'POST' }); toast(`Room ${roomId} reset`, 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const doKick = async (roomId, playerId, name) => {
    try { await api(`/rooms/${roomId}/kick`, adminKey, { method: 'POST', body: JSON.stringify({ playerId }) }); toast(`${name} kicked`, 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const doMsg = async () => {
    if (!msgText.trim()) return;
    try { await api(`/rooms/${msgRoom}/message`, adminKey, { method: 'POST', body: JSON.stringify({ message: msgText }) }); toast('Message sent!', 'success'); setMsgRoom(null); setMsgText(''); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-neon-blue">🏠 Active Rooms</h2>
        <button onClick={load} className="btn-ghost text-xs px-3 py-1.5">↻ Refresh</button>
      </div>

      {loading ? <div className="text-slate-500 font-cyber animate-pulse">Loading rooms...</div> : null}

      {!loading && rooms.length === 0 && (
        <div className="card text-center py-12 text-slate-500 font-cyber">No active rooms right now.</div>
      )}

      <div className="space-y-3">
        {rooms.map((room) => (
          <motion.div key={room.id} layout className="card border border-dark-border">
            {/* Room header */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(expanded === room.id ? null : room.id)}>
              <div className="font-display text-neon-blue font-bold tracking-widest text-sm">{room.id}</div>
              <StateBadge state={room.state} />
              {room.problemTitle && <span className="text-xs font-cyber text-slate-500">📋 {room.problemTitle}</span>}
              <div className="ml-auto flex items-center gap-2 text-xs font-cyber text-slate-400">
                <span>👥 {room.playerCount}</span>
                <span className="text-xs text-slate-600">{room.difficulty || 'Random'}</span>
                <span>{expanded === room.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Expanded details */}
            <AnimatePresence>
              {expanded === room.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                  <div className="border-t border-dark-border mt-3 pt-3 space-y-3">
                    {/* Players */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-cyber text-slate-500 mb-2">PLAYERS</p>
                      {room.players.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 bg-dark-bg rounded-lg px-3 py-2">
                          <span className="font-cyber text-sm text-slate-300">{p.name}</span>
                          {p.isHost && <span className="badge-purple text-xs">HOST</span>}
                          {p.isSpectator && <span className="badge text-xs text-slate-500">SPEC</span>}
                          <span className={`text-xs font-cyber ml-1 ${
                            p.status === 'solved' ? 'text-neon-green' :
                            p.status === 'failed' ? 'text-neon-pink' : 'text-slate-500'
                          }`}>{p.status}</span>
                          <span className="text-xs text-neon-blue ml-auto">{p.score} pts</span>
                          <button onClick={() => setConfirm({ msg: `Kick ${p.name} from ${room.id}?`, cb: () => doKick(room.id, p.id, p.name) })}
                            className="text-xs text-neon-pink hover:text-neon-pink/80 font-cyber px-2 py-0.5 rounded border border-neon-pink/30 hover:bg-neon-pink/10 transition-colors">
                            kick
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap pt-1">
                      {room.state === 'battle' && (
                        <button onClick={() => setConfirm({ msg: `Force end game in ${room.id}?`, cb: () => doEnd(room.id) })}
                          className="px-3 py-1.5 rounded-lg text-xs font-cyber border border-neon-pink/40 text-neon-pink hover:bg-neon-pink/10 transition-colors">
                          ⏹ End Game
                        </button>
                      )}
                      <button onClick={() => setConfirm({ msg: `Reset room ${room.id} to lobby?`, cb: () => doReset(room.id) })}
                        className="px-3 py-1.5 rounded-lg text-xs font-cyber border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 transition-colors">
                        🔄 Reset
                      </button>
                      <button onClick={() => setMsgRoom(room.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-cyber border border-neon-blue/40 text-neon-blue hover:bg-neon-blue/10 transition-colors">
                        💬 Message
                      </button>
                      <button onClick={() => setConfirm({ msg: `Delete room ${room.id}? All players will be disconnected.`, cb: () => doDelete(room.id) })}
                        className="px-3 py-1.5 rounded-lg text-xs font-cyber border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors">
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Confirm modal */}
      {confirm && (
        <ConfirmModal msg={confirm.msg}
          onConfirm={() => { confirm.cb(); setConfirm(null); }}
          onCancel={() => setConfirm(null)} />
      )}

      {/* Message modal */}
      {msgRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass border border-neon-blue/30 rounded-2xl p-8 max-w-sm w-full mx-4">
            <p className="font-cyber text-neon-blue text-sm mb-4">Send message to room <strong>{msgRoom}</strong></p>
            <textarea value={msgText} onChange={(e) => setMsgText(e.target.value)}
              className="input-cyber resize-none h-24 w-full mb-4" placeholder="Type message..." />
            <div className="flex gap-3">
              <button onClick={() => setMsgRoom(null)} className="flex-1 py-2 rounded-lg border border-dark-border text-slate-400 font-cyber text-sm">Cancel</button>
              <button onClick={doMsg} className="flex-1 py-2 rounded-lg bg-neon-blue/20 border border-neon-blue/40 text-neon-blue font-cyber text-sm">Send</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── SECTION: Broadcast & Notifications ───────────────────────────────────────
function BroadcastSection({ adminKey, toast }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState([]);

  // Notifications
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSending, setNotifSending] = useState(false);

  const loadLog = useCallback(async () => {
    try { const d = await api('/broadcast/log', adminKey); setLog(d.log); }
    catch {}
  }, [adminKey]);

  useEffect(() => { loadLog(); }, [loadLog]);

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await api('/broadcast', adminKey, { method: 'POST', body: JSON.stringify({ message }) });
      toast('📢 Broadcast sent to all rooms!', 'success');
      setMessage('');
      loadLog();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSending(false); }
  };

  const sendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setNotifSending(true);
    try {
      await api('/notification', adminKey, { method: 'POST', body: JSON.stringify({ title: notifTitle, message: notifMessage }) });
      toast('🔔 Notification pushed to all users!', 'success');
      setNotifTitle('');
      setNotifMessage('');
    } catch (e) { toast(e.message, 'error'); }
    finally { setNotifSending(false); }
  };

  const presets = [
    '🔥 Server maintenance in 5 minutes — finish up!',
    '🏆 Tournament starting soon — prepare your code!',
    '⚡ New problems added! Check the lobby.',
    '👑 Congratulations to all competitors today!',
    '🚀 Welcome to CodeArena — may the best coder win!',
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg font-bold text-neon-blue">📢 Broadcast & Alerts</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Toast Broadcast */}
        <div className="card">
          <p className="section-title">SEND TO ALL ROOMS (In-Game Toast)</p>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            className="input-cyber resize-none h-24 w-full mb-3"
            placeholder="Type a message to broadcast to all active rooms..." />

          <div className="mb-4">
            <p className="text-xs font-cyber text-slate-500 mb-2">QUICK PRESETS</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button key={p} onClick={() => setMessage(p)}
                  className="text-xs font-cyber px-2 py-1 rounded border border-dark-border text-slate-400 hover:text-slate-200 hover:bg-dark-card transition-colors">
                  {p.slice(0, 30)}…
                </button>
              ))}
            </div>
          </div>

          <button onClick={send} disabled={sending || !message.trim()}
            className="btn-primary w-full disabled:opacity-50">
            {sending ? 'Sending...' : '📢 Send Broadcast'}
          </button>
        </div>

        {/* Global Notification */}
        <div className="card" style={{ borderColor: 'var(--neon-pink)' }}>
          <p className="section-title text-neon-pink">SEND GLOBAL NOTIFICATION (Bell Icon)</p>
          <p className="text-xs text-slate-500 font-cyber mb-4">
            This saves a persistent alert to the notification bell for all online and offline users.
          </p>
          
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs font-cyber text-slate-400 mb-1 block">TITLE</label>
              <input type="text" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="e.g. New Problem Added!" className="input-cyber w-full" />
            </div>
            <div>
              <label className="text-xs font-cyber text-slate-400 mb-1 block">MESSAGE</label>
              <textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} placeholder="Type details..." className="input-cyber resize-none h-16 w-full" />
            </div>
          </div>

          <button onClick={sendNotification} disabled={notifSending || !notifTitle.trim() || !notifMessage.trim()}
            className="btn-primary w-full disabled:opacity-50 !bg-neon-pink/20 !border-neon-pink !text-neon-pink hover:!bg-neon-pink/30">
            {notifSending ? 'Sending...' : '🔔 Push Notification'}
          </button>
        </div>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="card">
          <p className="section-title">BROADCAST HISTORY</p>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {log.map((entry, i) => (
              <div key={i} className="flex items-start gap-3 text-xs font-cyber border-b border-dark-border pb-2">
                <span className="text-slate-600 shrink-0">{new Date(entry.time).toLocaleTimeString()}</span>
                <span className="text-slate-300">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SECTION: Problems ────────────────────────────────────────────────────────
function ProblemsSection({ adminKey, toast }) {
  const [problems, setProblems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    api('/problems', adminKey)
      .then((d) => setProblems(d.problems))
      .catch((e) => toast(e.message, 'error'));
  }, [adminKey]);

  const viewDetail = async (id) => {
    if (selected === id) { setSelected(null); setDetail(null); return; }
    setSelected(id);
    setLoadingDetail(true);
    try {
      const d = await api(`/problems/${id}`, adminKey);
      setDetail(d.problem);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoadingDetail(false); }
  };

  const diffColor = { Easy: 'badge-green', Medium: 'badge-orange', Hard: 'badge-pink' };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-neon-blue">📚 Problems Library</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {problems.map((p) => (
          <motion.div key={p.id} layout
            className={`card cursor-pointer border transition-colors ${selected === p.id ? 'border-neon-blue/40' : 'border-dark-border hover:border-dark-border/70'}`}
            onClick={() => viewDetail(p.id)}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-cyber text-slate-600 text-xs">{p.id}</span>
                  <span className={`badge ${diffColor[p.difficulty]}`}>{p.difficulty}</span>
                </div>
                <div className="font-display text-sm font-bold text-slate-200">{p.title}</div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {p.tags?.map((t) => <span key={t} className="badge badge-purple text-xs">{t}</span>)}
                </div>
              </div>
              <div className="text-right text-xs font-cyber text-slate-500 shrink-0">
                <div>{p.sampleCount} samples</div>
                <div>{p.hiddenCount} hidden</div>
              </div>
            </div>

            {/* Inline detail */}
            <AnimatePresence>
              {selected === p.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                  <div className="border-t border-dark-border mt-3 pt-3">
                    {loadingDetail && <div className="text-slate-500 font-cyber text-xs animate-pulse">Loading...</div>}
                    {detail && (
                      <div className="space-y-3 text-xs font-cyber">
                        <div>
                          <span className="text-slate-500">DESCRIPTION</span>
                          <p className="text-slate-400 mt-1 leading-relaxed">{detail.description?.slice(0, 200)}...</p>
                        </div>
                        <div>
                          <span className="text-slate-500">SAMPLE TESTS ({detail.sampleTestCases?.length})</span>
                          <div className="mt-1 space-y-1">
                            {detail.sampleTestCases?.map((tc, i) => (
                              <div key={i} className="bg-dark-bg rounded p-2">
                                <span className="text-slate-500">In: </span><span className="text-neon-blue">{tc.input.replace(/\n/g, ' | ')}</span>
                                <span className="text-slate-500 ml-3">Out: </span><span className="text-neon-green">{tc.output}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">HIDDEN TESTS ({detail.hiddenTestCases?.length})</span>
                          <div className="mt-1 space-y-1">
                            {detail.hiddenTestCases?.map((tc, i) => (
                              <div key={i} className="bg-dark-bg rounded p-2">
                                <span className="text-neon-purple">[Hidden] </span>
                                <span className="text-slate-500">In: </span><span className="text-neon-blue">{tc.input.replace(/\n/g, ' | ')}</span>
                                <span className="text-slate-500 ml-3">Out: </span><span className="text-neon-green">{tc.output}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">LANGUAGES</span>
                          <div className="flex gap-2 mt-1">
                            {Object.keys(detail.starterCode || {}).map((l) => (
                              <span key={l} className="px-2 py-0.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 text-neon-purple">{l}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION: Settings ────────────────────────────────────────────────────────
function SettingsSection({ adminKey, toast }) {
  const currentKey = adminKey;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg font-bold text-neon-blue">⚙️ Settings & Info</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <p className="section-title">🔐 AUTHENTICATION</p>
          <div className="space-y-3 text-sm font-cyber">
            <div className="p-3 bg-dark-bg rounded-lg border border-neon-green/20">
              <div className="text-neon-green text-xs mb-1">✅ Currently authenticated</div>
              <div className="text-slate-500 text-xs">Session is valid until page refresh</div>
            </div>
            <div className="p-3 bg-dark-bg rounded-lg border border-dark-border">
              <div className="text-slate-400 text-xs mb-1">Active passkey</div>
              <code className="text-neon-purple text-xs">{'•'.repeat(Math.min(currentKey.length, 20))}</code>
            </div>
            <div className="p-3 bg-neon-blue/5 rounded-lg border border-neon-blue/20 text-xs text-slate-400">
              To change the passkey, update <code className="text-neon-blue">ADMIN_PASSKEY</code> in{' '}
              <code className="text-neon-blue">backend/.env</code> and restart the server.
            </div>
          </div>
        </div>

        <div className="card">
          <p className="section-title">📡 API ENDPOINTS</p>
          <div className="space-y-2 text-xs font-cyber">
            {[
              ['POST', '/api/admin/login', 'Verify passkey'],
              ['GET', '/api/admin/stats', 'Server & game stats'],
              ['GET', '/api/admin/rooms', 'List all rooms'],
              ['DELETE', '/api/admin/rooms/:id', 'Force delete room'],
              ['POST', '/api/admin/rooms/:id/end', 'End active game'],
              ['POST', '/api/admin/rooms/:id/reset', 'Reset to lobby'],
              ['POST', '/api/admin/rooms/:id/kick', 'Kick a player'],
              ['POST', '/api/admin/rooms/:id/message', 'Message a room'],
              ['POST', '/api/admin/broadcast', 'Broadcast to all'],
              ['GET', '/api/admin/problems', 'List all problems'],
              ['GET', '/api/admin/problems/:id', 'Full problem detail'],
            ].map(([method, path, desc]) => (
              <div key={path} className="flex items-start gap-2 border-b border-dark-border pb-1.5">
                <span className={`shrink-0 ${method === 'GET' ? 'text-neon-green' : method === 'POST' ? 'text-neon-blue' : 'text-neon-pink'}`}>{method}</span>
                <code className="text-slate-300 text-xs break-all">{path}</code>
                <span className="text-slate-600 ml-auto shrink-0">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ADMIN PAGE ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('adminKey') || '');
  const [authed, setAuthed] = useState(!!sessionStorage.getItem('adminKey'));
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const { toasts, add: toast } = useToast();
  const refreshRef = useRef(null);

  const loadStats = useCallback(async () => {
    if (!adminKey) return;
    try {
      const d = await api('/stats', adminKey);
      setStats(d);
    } catch (e) {
      if (e.message.includes('Unauthorized')) { setAuthed(false); sessionStorage.removeItem('adminKey'); }
    }
  }, [adminKey]);

  useEffect(() => {
    if (!authed) return;
    loadStats();
    // Auto-refresh every 10 seconds
    refreshRef.current = setInterval(loadStats, 10000);
    return () => clearInterval(refreshRef.current);
  }, [authed, loadStats]);

  const handleLogin = (key) => {
    setAdminKey(key);
    sessionStorage.setItem('adminKey', key);
    setAuthed(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminKey');
    setAuthed(false);
    setAdminKey('');
    setStats(null);
  };

  if (!authed) return <LoginPage onLogin={handleLogin} />;

  const TABS = [
    { id: 'overview',  label: '📊 Overview' },
    { id: 'rooms',     label: '🏠 Rooms' },
    { id: 'broadcast', label: '📢 Broadcast' },
    { id: 'problems',  label: '📚 Problems' },
    { id: 'settings',  label: '⚙️ Settings' },
  ];

  return (
    <div className="min-h-screen bg-dark-bg cyber-grid">
      <ToastList toasts={toasts} />

      {/* Fixed top bar */}
      <div className="fixed top-0 inset-x-0 z-40 bg-dark-card/90 backdrop-blur border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="font-display font-bold text-base">
            CODE<span className="text-neon-pink">ARENA</span>
            <span className="text-neon-blue ml-2 text-sm font-cyber tracking-widest">ADMIN</span>
          </div>

          {/* Live status dot */}
          <div className="flex items-center gap-1.5 text-xs font-cyber text-neon-green">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            LIVE
          </div>

          {/* Stats quick view */}
          {stats && (
            <div className="hidden md:flex items-center gap-4 text-xs font-cyber text-slate-500 ml-4">
              <span>🏠 {stats.rooms.total} rooms</span>
              <span>⚔️ {stats.rooms.active} battles</span>
              <span>👥 {stats.players.online} players</span>
              <span>⏱ {stats.server.uptimeHuman}</span>
            </div>
          )}

          <div className="ml-auto">
            <button onClick={handleLogout}
              className="text-xs font-cyber text-slate-500 hover:text-neon-pink transition-colors border border-dark-border rounded-lg px-3 py-1.5">
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-7xl mx-auto px-4 pb-0 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-cyber whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-neon-blue text-neon-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="pt-28 pb-16 max-w-7xl mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
            {tab === 'overview'  && <OverviewSection stats={stats} onRefresh={loadStats} />}
            {tab === 'rooms'     && <RoomsSection adminKey={adminKey} toast={toast} />}
            {tab === 'broadcast' && <BroadcastSection adminKey={adminKey} toast={toast} />}
            {tab === 'problems'  && <ProblemsSection adminKey={adminKey} toast={toast} />}
            {tab === 'settings'  && <SettingsSection adminKey={adminKey} toast={toast} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
