import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const MEDAL = ['🥇', '🥈', '🥉'];
const TIER_COLORS = {
  S: { label: 'S', color: '#00e676', bg: 'rgba(0,230,118,0.1)', border: 'rgba(0,230,118,0.3)' },
  A: { label: 'A', color: '#40c4ff', bg: 'rgba(64,196,255,0.1)', border: 'rgba(64,196,255,0.3)' },
  B: { label: 'B', color: '#e040fb', bg: 'rgba(224,64,251,0.1)', border: 'rgba(224,64,251,0.3)' },
  C: { label: 'C', color: '#ffd740', bg: 'rgba(255,215,64,0.1)', border: 'rgba(255,215,64,0.3)' },
  D: { label: 'D', color: '#ffab40', bg: 'rgba(255,171,64,0.1)', border: 'rgba(255,171,64,0.3)' },
  E: { label: 'E', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)' },
};

function getTier(score) {
  if (score >= 2000) return TIER_COLORS.S;
  if (score >= 1000) return TIER_COLORS.A;
  if (score >= 500)  return TIER_COLORS.B;
  if (score >= 200)  return TIER_COLORS.C;
  if (score >= 50)   return TIER_COLORS.D;
  return TIER_COLORS.E;
}

function WinRate({ wins, total }) {
  const rate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const color = rate >= 60 ? 'var(--accent)' : rate >= 40 ? 'var(--blue)' : 'var(--text-dim)';
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-xs font-mono font-bold" style={{ color }}>{rate}%</span>
      <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function SkeletonRow({ i }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse"
      style={{ borderBottom: '1px solid var(--border-2)' }}>
      <div className="w-8 h-4 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="w-8 h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="flex-1 h-4 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="w-16 h-4 rounded hidden sm:block" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="w-16 h-4 rounded hidden md:block" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="w-12 h-4 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4 py-4">
      <div className="text-2xl shrink-0">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-dim)' }}>{label}</div>
        <div className="text-xl font-bold text-glow-subtle" style={{ color: color || 'var(--accent)' }}>{value}</div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState('');
  const [sortBy, setSortBy]   = useState('totalScore'); // totalScore | wins | totalBattles
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND}/api/profile/leaderboard?limit=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.leaderboard || []);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    // Auto-refresh every 60 seconds
    const t = setInterval(fetchLeaderboard, 60_000);
    return () => clearInterval(t);
  }, [fetchLeaderboard]);

  // Sort + filter
  const sorted = [...data]
    .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const filtered = sorted.filter(p =>
    !search || p.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const myEntry = user ? sorted.find(p => p.uid === user.uid) : null;

  // Aggregate stats
  const totalPlayers  = data.length;
  const totalBattles  = data.reduce((s, p) => s + (p.totalBattles || 0), 0);
  const totalWins     = data.reduce((s, p) => s + (p.wins || 0), 0);
  const topScore      = data[0]?.totalScore || 0;

  const SORT_TABS = [
    { key: 'totalScore',   label: '🏆 Score'   },
    { key: 'wins',         label: '⚔️ Wins'     },
    { key: 'totalBattles', label: '🎮 Battles'  },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── TopNav ── */}
      <div className="top-nav">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--accent)', color: '#000' }}>⚡</div>
          <span className="text-sm font-bold tracking-wide text-glow-subtle" style={{ color: 'var(--text)' }}>
            CODE<span className="text-glow-green" style={{ color: 'var(--accent)' }}>ARENA</span>
          </span>
        </button>
        <div className="flex-1" />
        <span className="season-badge hidden sm:inline-flex">SEASON 1</span>
        {user && (
          <button onClick={() => navigate('/profile')} className="btn-ghost text-xs px-3">
            👤 Profile
          </button>
        )}
        <button onClick={() => navigate('/')} className="btn-ghost text-xs px-3">← Home</button>
      </div>

      {/* ── Sub-header ── */}
      <div className="px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold text-glow-subtle" style={{ color: 'var(--text)' }}>
            🏆 Global Leaderboard
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Loading...'}
            {' '}· Auto-refreshes every 60s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLeaderboard} disabled={loading}
            className="btn-ghost text-xs px-3 gap-1 disabled:opacity-40">
            {loading ? (
              <span className="w-3 h-3 border-2 rounded-full inline-block"
                style={{ borderColor: 'rgba(0,230,118,0.2)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
            ) : '🔄'} Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full">

        {/* ── Stats overview ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon="👥" label="Total Players"  value={totalPlayers.toLocaleString()} color="var(--accent)" />
          <StatCard icon="🎮" label="Total Battles"  value={totalBattles.toLocaleString()} color="var(--blue)" />
          <StatCard icon="⚔️" label="Total Wins"     value={totalWins.toLocaleString()}    color="var(--purple)" />
          <StatCard icon="🌟" label="Top Score"      value={topScore.toLocaleString()}     color="var(--gold)" />
        </div>

        {/* ── My Rank Banner ── */}
        {myEntry && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)' }}>
            <span className="text-lg">{MEDAL[myEntry.rank - 1] || `#${myEntry.rank}`}</span>
            <div className="flex-1">
              <span className="text-sm font-semibold text-glow-subtle" style={{ color: 'var(--accent)' }}>
                You're ranked #{myEntry.rank}
              </span>
              <span className="text-xs ml-2" style={{ color: 'var(--text-dim)' }}>
                · {myEntry.totalScore || 0} pts · {myEntry.wins || 0} wins
              </span>
            </div>
            <span className="badge-green text-xs">YOU</span>
          </motion.div>
        )}

        {/* ── Controls ── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Sort tabs */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface)' }}>
            {SORT_TABS.map(t => (
              <button key={t.key} onClick={() => setSortBy(t.key)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={sortBy === t.key
                  ? { background: 'var(--accent)', color: '#000' }
                  : { color: 'var(--text-dim)', background: 'transparent' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-dim)' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search player..."
              className="input-cyber pl-8 py-2 text-xs"
            />
          </div>

          <span className="text-xs ml-auto" style={{ color: 'var(--text-dim)' }}>
            {filtered.length} players
          </span>
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}>
          {/* Header */}
          <div className="grid px-4 py-2.5 text-xs font-bold uppercase tracking-widest"
            style={{ gridTemplateColumns: '3rem 2.5rem 1fr 5rem 5rem 5rem 4rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            <span>Rank</span>
            <span></span>
            <span>Player</span>
            <span className="hidden sm:block text-right">Score</span>
            <span className="hidden md:block text-right">Wins</span>
            <span className="hidden md:block text-right">Battles</span>
            <span className="text-right">Win%</span>
          </div>

          {/* Rows */}
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} i={i} />)
          ) : error ? (
            <div className="py-16 text-center">
              <div className="text-3xl mb-3">⚠️</div>
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{error}</p>
              <button onClick={fetchLeaderboard} className="btn-primary mt-4 text-xs px-4">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-3xl mb-3 opacity-30">🏜️</div>
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                {search ? 'No players match your search.' : 'No leaderboard data yet. Play some battles!'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map((p, idx) => {
                const tier   = getTier(p.totalScore || 0);
                const isMe   = user?.uid === p.uid;
                const medal  = MEDAL[p.rank - 1];
                return (
                  <motion.div key={p.uid}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                    className="grid px-4 py-3 items-center transition-all"
                    style={{
                      gridTemplateColumns: '3rem 2.5rem 1fr 5rem 5rem 5rem 4rem',
                      borderBottom: '1px solid var(--border-2)',
                      background: isMe ? 'rgba(0,230,118,0.04)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isMe) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isMe ? 'rgba(0,230,118,0.04)' : 'transparent'; }}
                  >
                    {/* Rank */}
                    <span className="text-sm font-mono font-bold">
                      {medal || <span style={{ color: 'var(--text-dim)' }}>#{p.rank}</span>}
                    </span>

                    {/* Tier badge */}
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-black"
                      style={{ background: tier.bg, border: `1px solid ${tier.border}`, color: tier.color }}>
                      {tier.label}
                    </span>

                    {/* Name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-sm font-semibold truncate ${isMe ? 'text-glow-green' : ''}`}
                        style={{ color: isMe ? 'var(--accent)' : 'var(--text)' }}>
                        {p.displayName || 'Anonymous'}
                      </span>
                      {isMe && <span className="badge-green shrink-0" style={{ fontSize: 9 }}>YOU</span>}
                      {p.rank === 1 && <span className="text-xs shrink-0" title="Top Player">👑</span>}
                    </div>

                    {/* Score */}
                    <span className="hidden sm:block text-right text-sm font-bold font-mono"
                      style={{ color: sortBy === 'totalScore' ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {(p.totalScore || 0).toLocaleString()}
                    </span>

                    {/* Wins */}
                    <span className="hidden md:block text-right text-sm font-mono"
                      style={{ color: sortBy === 'wins' ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {p.wins || 0}
                    </span>

                    {/* Battles */}
                    <span className="hidden md:block text-right text-sm font-mono"
                      style={{ color: sortBy === 'totalBattles' ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {p.totalBattles || 0}
                    </span>

                    {/* Win rate */}
                    <div className="flex justify-end">
                      <WinRate wins={p.wins || 0} total={p.totalBattles || 0} />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Tier legend */}
        <div className="mt-6 flex flex-wrap gap-2 items-center">
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Tier system:</span>
          {Object.entries(TIER_COLORS).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold"
              style={{ background: v.bg, border: `1px solid ${v.border}`, color: v.color }}>
              {v.label}
              <span className="font-normal text-[10px]" style={{ color: v.color, opacity: 0.7 }}>
                {k === 'S' ? '2000+' : k === 'A' ? '1000+' : k === 'B' ? '500+' : k === 'C' ? '200+' : k === 'D' ? '50+' : '0+'}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
