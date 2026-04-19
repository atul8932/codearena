import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { TopNav, PageShell } from './LandingPage';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';


// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60), s = seconds % 60;
  return `${m}m ${s}s`;
}

function winRate(wins, total) {
  if (!total) return '0%';
  return `${Math.round((wins / total) * 100)}%`;
}

const LANG_ICONS = { python:'🐍', javascript:'⚡', cpp:'⚙️', java:'☕' };
const STATUS_COLOR = { solved:'var(--green)', partial:'var(--orange)', failed:'var(--accent)', coding:'var(--blue)', spectating:'var(--text-dim)' };
const RANK_MEDAL = { 1:'🥇', 2:'🥈', 3:'🥉' };

// ── GitHub-Style Heatmap ──────────────────────────────────────────────────────
function ActivityHeatmap({ activity }) {
  const today = new Date();

  // Build last 52 weeks of days
  const weeks = useMemo(() => {
    const days = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ key, count: activity[key] || 0, date: d });
    }
    // chunk into weeks
    const ws = [];
    for (let i = 0; i < days.length; i += 7) ws.push(days.slice(i, i + 7));
    return ws;
  }, [activity]);

  const maxCount = Math.max(1, ...Object.values(activity));

  const getColor = (count) => {
    if (!count) return 'rgba(255,255,255,0.05)';
    const intensity = count / maxCount;
    if (intensity > 0.75) return '#ef4444';
    if (intensity > 0.5)  return '#f97316';
    if (intensity > 0.25) return '#b91c1c';
    return '#7f1d1d';
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const m = week[0]?.date?.getMonth();
    if (m !== undefined && m !== lastMonth) { monthLabels.push({ wi, label: MONTHS[m] }); lastMonth = m; }
  });

  const totalActive = Object.values(activity).reduce((s, v) => s + v, 0);
  const currentStreak = useMemo(() => {
    let streak = 0, d = new Date(today);
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (activity[key]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }, [activity]);
  const longestStreak = useMemo(() => {
    let max = 0, cur = 0;
    const keys = Object.keys(activity).sort();
    for (let i = 0; i < keys.length; i++) {
      const prev = new Date(keys[i]); prev.setDate(prev.getDate() - 1);
      const prevKey = prev.toISOString().slice(0, 10);
      if (i > 0 && keys[i - 1] === prevKey) cur++;
      else cur = 1;
      max = Math.max(max, cur);
    }
    return max;
  }, [activity]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <p className="section-title mb-0">📅 Battle Activity</p>
        <div className="flex items-center gap-4 text-xs font-mono" style={{ color:'var(--text-dim)' }}>
          <span>🔥 <span style={{ color:'var(--accent)' }}>{currentStreak}</span> day streak</span>
          <span>⚡ <span style={{ color:'var(--text-muted)' }}>{longestStreak}</span> longest</span>
          <span>⚔️  <span style={{ color:'var(--text-muted)' }}>{totalActive}</span> battles</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex gap-1 mb-1 pl-8">
        {weeks.map((_, wi) => {
          const ml = monthLabels.find(m => m.wi === wi);
          return <div key={wi} className="w-3 text-center" style={{ fontSize:9, color:'var(--text-dim)', minWidth:12 }}>{ml?.label || ''}</div>;
        })}
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1 justify-around" style={{ fontSize:9, color:'var(--text-dim)' }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <span key={d} style={{ height:12, lineHeight:'12px' }}>{d[0]}</span>)}
        </div>
        {/* Grid */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <div key={di} title={`${day.key}: ${day.count} battle${day.count !== 1 ? 's' : ''}`}
                  className="rounded-sm cursor-default transition-all hover:ring-1 hover:ring-white/20"
                  style={{ width:12, height:12, background:getColor(day.count), minWidth:12 }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-xs" style={{ color:'var(--text-dim)' }}>Less</span>
        {['rgba(255,255,255,0.05)','#7f1d1d','#b91c1c','#f97316','#ef4444'].map((c, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ background:c }} />
        ))}
        <span className="text-xs" style={{ color:'var(--text-dim)' }}>More</span>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      className="card flex flex-col gap-1">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold" style={{ color: color || 'var(--text)' }}>{value ?? '—'}</div>
      <div className="text-xs font-semibold" style={{ color:'var(--text-muted)' }}>{label}</div>
      {sub && <div className="text-xs" style={{ color:'var(--text-dim)' }}>{sub}</div>}
    </motion.div>
  );
}

// ── Battle Row ─────────────────────────────────────────────────────────────────
function BattleRow({ b, i }) {
  return (
    <motion.tr initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.04 }}
      style={{ borderBottom:'1px solid var(--border-2)', background: i%2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
      <td className="py-3 px-4 text-sm font-mono">
        {RANK_MEDAL[b.rank] || <span style={{ color:'var(--text-dim)' }}>#{b.rank}</span>}
        <span className="ml-1 text-xs" style={{ color:'var(--text-dim)' }}>/{b.totalPlayers}</span>
      </td>
      <td className="py-3 px-4 text-sm font-medium truncate max-w-[160px]" style={{ color:'var(--text)' }}>
        {b.problemTitle || '—'}
      </td>
      <td className="py-3 px-4">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ color: STATUS_COLOR[b.status] || 'var(--text-dim)', background:`${STATUS_COLOR[b.status]}15`, border:`1px solid ${STATUS_COLOR[b.status]}30` }}>
          {b.status}
        </span>
      </td>
      <td className="py-3 px-4 text-xs font-bold" style={{ color: b.rank===1 ? 'var(--gold)' : 'var(--text)' }}>
        {b.score ?? '—'}
      </td>
      <td className="py-3 px-4 text-xs font-mono hidden sm:table-cell" style={{ color:'var(--text-dim)' }}>
        {LANG_ICONS[b.language] || '💻'} {b.language}
      </td>
      <td className="py-3 px-4 text-xs font-mono hidden md:table-cell" style={{ color:'var(--text-dim)' }}>
        {fmtTime(b.timeTaken)}
      </td>
      <td className="py-3 px-4 text-xs hidden lg:table-cell" style={{ color:'var(--text-dim)' }}>{b.date || '—'}</td>
    </motion.tr>
  );
}

// ── ProfilePage ───────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!user) { navigate('/auth', { replace:true }); return; }
    fetch(`${BACKEND}/api/profile/${user.uid}`)
      .then(r => r.json())
      .then(data => { setProfile(data); setLoading(false); })
      .catch(err => { setError('Failed to load profile.'); setLoading(false); });
  }, [user]);

  const stats   = profile?.stats   || {};
  const activity = profile?.activity || {};
  const battles  = profile?.battles  || [];

  const totalBattles = stats.totalBattles || 0;
  const wins         = stats.wins || 0;
  const totalScore   = stats.totalScore || 0;
  const avgScore     = totalBattles ? Math.round(totalScore / totalBattles) : 0;

  const joinedDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
    : '—';

  const avatarUrl  = user?.photoURL;
  const initials   = user?.displayName?.slice(0,2).toUpperCase() || '??';

  const handleLogout = async () => { await logout(); navigate('/auth', { replace:true }); };

  return (
    <PageShell nav={<TopNav />}>
      {/* Sub-header */}
      <div className="px-4 sm:px-6 py-4 flex items-center gap-3" style={{ borderBottom:'1px solid var(--border)' }}>
        <button onClick={() => navigate('/')} className="btn-ghost text-xs px-2 py-1">← Home</button>
        <span style={{ color:'var(--border)' }}>|</span>
        <h1 className="text-base font-bold text-glow-subtle" style={{ color:'var(--text)' }}>My Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-5xl mx-auto w-full">

        {/* ── Hero Card ── */}
        <div className="card flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ background: avatarUrl ? 'transparent' : 'linear-gradient(135deg,#ef4444,#f97316)', color:'#fff', border:'2px solid var(--border)' }}>
            {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-glow-subtle" style={{ color:'var(--text)' }}>
                {user?.displayName || user?.email?.split('@')[0] || 'Coder'}
              </h2>
              {user?.emailVerified && <span className="badge-green text-xs">✓ Verified</span>}
            </div>
            <p className="text-xs mb-2" style={{ color:'var(--text-dim)' }}>{user?.email}</p>
            <div className="flex flex-wrap gap-3 text-xs font-mono" style={{ color:'var(--text-dim)' }}>
              <span>📅 Joined {joinedDate}</span>
              {stats.lastPlayed && <span>🎮 Last played {stats.lastPlayed}</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleLogout} className="btn-ghost text-xs">Sign out</button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <span className="w-8 h-8 border-2 rounded-full border-white/10 border-t-red-500"
              style={{ animation:'spin 0.8s linear infinite' }} />
          </div>
        )}

        {error && !loading && (
          <div className="card text-center py-8" style={{ color:'var(--text-dim)' }}>
            <p className="text-2xl mb-2">⚠️</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-1">Play some battles first — your stats will appear here!</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon="⚔️" label="Total Battles" value={totalBattles} />
              <StatCard icon="🏆" label="Wins" value={wins} color="var(--gold)"
                sub={`${winRate(wins, totalBattles)} win rate`} />
              <StatCard icon="⭐" label="Total Score" value={totalScore.toLocaleString()} color="var(--green)" />
              <StatCard icon="📊" label="Avg Score" value={avgScore} color="var(--blue)"
                sub="per battle" />
            </div>

            {/* ── Activity Heatmap ── */}
            <div className="overflow-x-auto">
              <ActivityHeatmap activity={activity} />
            </div>

            {/* ── Recent Battles ── */}
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3" style={{ borderBottom:'1px solid var(--border)' }}>
                <p className="section-title mb-0">⚔️ Recent Battles</p>
              </div>

              {battles.length === 0 ? (
                <div className="text-center py-12" style={{ color:'var(--text-dim)' }}>
                  <div className="text-4xl mb-3 opacity-40">🏜️</div>
                  <p className="text-sm">No battles yet. Enter the arena!</p>
                  <button onClick={() => navigate('/')} className="btn-primary mt-4 text-xs">
                    ⚔️ Start Battling
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)' }}>
                        {['Rank','Problem','Result','Score','Language','Time','Date'].map((h, i) => (
                          <th key={i} className={`py-2.5 px-4 text-xs font-semibold tracking-wide text-left
                            ${i >= 4 ? 'hidden sm:table-cell' : ''}
                            ${i >= 5 ? 'hidden md:table-cell' : ''}
                            ${i >= 6 ? 'hidden lg:table-cell' : ''}`}
                            style={{ color:'var(--text-dim)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {battles.map((b, i) => <BattleRow key={b.id || i} b={b} i={i} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Achievements ── */}
            <div className="card">
              <p className="section-title">🏅 Achievements</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[
                  { icon:'⚔️', label:'First Blood',    desc:'Win your first battle',    earned: wins >= 1 },
                  { icon:'🔥', label:'On Fire',        desc:'Win 5 battles',             earned: wins >= 5 },
                  { icon:'💯', label:'Century',        desc:'Play 100 battles',          earned: totalBattles >= 100 },
                  { icon:'👑', label:'Top Scorer',     desc:'Score 5000+ total',         earned: totalScore >= 5000 },
                  { icon:'⚡', label:'Speed Coder',    desc:'Win in under 3 minutes',    earned: battles.some(b => b.rank===1 && b.timeTaken && b.timeTaken < 180) },
                  { icon:'🌟', label:'Consistent',     desc:'10 day activity streak',    earned: Object.keys(activity).length >= 10 },
                  { icon:'🐍', label:'Pythonista',     desc:'Win with Python',           earned: battles.some(b => b.rank===1 && b.language==='python') },
                  { icon:'🏆', label:'Champion',       desc:'Win 25 battles',            earned: wins >= 25 },
                ].map(a => (
                  <div key={a.label} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: a.earned ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
                             border: `1px solid ${a.earned ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
                             opacity: a.earned ? 1 : 0.4 }}>
                    <span className="text-xl">{a.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold" style={{ color: a.earned ? 'var(--text)' : 'var(--text-dim)' }}>{a.label}</div>
                      <div className="text-xs" style={{ color:'var(--text-dim)', fontSize:10 }}>{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
