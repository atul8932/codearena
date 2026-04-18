import { useEffect, useRef, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import socket from '../services/socket';
import useGameStore from '../store/gameStore';

// ─── Timer ────────────────────────────────────────────────────────────────────
function TimerDisplay({ seconds }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const isUrgent = seconds <= 60, isCritical = seconds <= 30;
  return (
    <div className={`font-mono text-base font-bold tabular-nums ${isCritical ? 'animate-pulse' : ''}`}
      style={{ color: isCritical ? 'var(--accent)' : isUrgent ? 'var(--bronze)' : 'var(--text)' }}>
      {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </div>
  );
}

// ─── Live Scoreboard ──────────────────────────────────────────────────────────
function LiveScoreboard({ leaderboard, myId, anonymousMode }) {
  const medals = ['🥇','🥈','🥉'];
  const statusColor = (s) => ({ solved:'var(--green)', partial:'var(--orange)', failed:'var(--accent)', coding:'var(--blue)' }[s] || 'var(--text-dim)');
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}>
      <div className="px-4 py-2.5 flex items-center" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>🏆 Live Scoreboard</span>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {leaderboard.length === 0 && (
          <div className="py-6 text-center text-xs" style={{ color: 'var(--text-dim)' }}>No submissions yet...</div>
        )}
        {leaderboard.map((p, i) => (
          <div key={p.id} className={`flex items-center gap-3 px-4 py-2.5 ${p.id===myId ? 'bg-red-500/5' : ''}`}
            style={{ borderBottom: '1px solid var(--border-2)' }}>
            <span className="w-6 text-center text-sm shrink-0">{medals[i] || <span className="font-mono text-xs" style={{ color:'var(--text-dim)' }}>#{i+1}</span>}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm truncate" style={{ color: p.id===myId ? 'var(--gold)' : 'var(--text)' }}>
                  {anonymousMode ? '???' : p.name}
                </span>
                {p.id===myId && <span className="badge-pink" style={{ fontSize:9 }}>YOU</span>}
              </div>
              <div className="progress-track w-full">
                <motion.div className="progress-fill" animate={{ width:`${p.progress||0}%` }} transition={{ duration:0.5 }}
                  style={{ background: statusColor(p.status) }} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold" style={{ color: statusColor(p.status) }}>{p.score||0}</div>
              <div className="text-xs font-mono uppercase" style={{ color: statusColor(p.status), opacity:0.7 }}>{p.status||'coding'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Commentary ───────────────────────────────────────────────────────────────
function CommentaryTicker({ messages }) {
  if (!messages.length) return null;
  return (
    <div className="h-7 overflow-hidden rounded-md px-3 flex items-center"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <AnimatePresence mode="wait">
        <motion.p key={messages[0]?.id} initial={{ y:12,opacity:0 }} animate={{ y:0,opacity:1 }}
          exit={{ y:-12,opacity:0 }} transition={{ duration:0.2 }}
          className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }}>
          🤖 {messages[0]?.msg}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ─── Power-ups ────────────────────────────────────────────────────────────────
function PowerUpBar({ roomId, players, myId }) {
  const opponents = Object.values(players).filter((p) => p.id!==myId && !p.isSpectator);
  const [activeTarget, setActiveTarget] = useState(opponents[0]?.id||null);
  const use = (type) => { socket.emit('usePowerUp',{ roomId,type,targetId:activeTarget }); toast(`${type} used!`,{ icon:'⚡' }); };
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-mono" style={{ color:'var(--text-dim)' }}>POWER-UPS:</span>
      {opponents.length>0 && (
        <select value={activeTarget||''} onChange={(e)=>setActiveTarget(e.target.value)}
          className="text-xs rounded px-2 py-1 font-mono" style={{ background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-muted)' }}>
          {opponents.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
      {[
        { type:'freeze',      label:'❄️', color:'var(--blue)'  },
        { type:'hint',        label:'💡', color:'#a78bfa'      },
        { type:'doubleScore', label:'⚡ 2×', color:'var(--green)' },
      ].map(({ type,label,color })=>(
        <button key={type} onClick={()=>use(type)}
          className="px-2 py-1 rounded text-xs font-mono transition-all"
          style={{ border:`1px solid ${color}30`, color, background:`${color}08` }}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Test Case Panel ──────────────────────────────────────────────────────────
function TestCasePanel({ submissionResult, runResult, isRunning, isSubmitting }) {
  const result = submissionResult||runResult;
  const results = result?.results||[];
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="section-title mb-0">📋 Test Cases</p>
        {(isRunning||isSubmitting) && (
          <div className="flex items-center gap-2 text-xs font-mono" style={{ color:'var(--blue)' }}>
            <span className="w-3 h-3 border-2 rounded-full" style={{ borderColor:'rgba(96,165,250,0.3)', borderTopColor:'var(--blue)', animation:'spin 0.8s linear infinite' }} />
            {isSubmitting?'Judging...':'Running...'}
          </div>
        )}
      </div>
      {result && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold"
            style={result.accepted
              ? { background:'rgba(34,197,94,0.08)', color:'var(--green)', border:'1px solid rgba(34,197,94,0.2)' }
              : result.passed>0
              ? { background:'rgba(249,115,22,0.08)', color:'var(--orange)', border:'1px solid rgba(249,115,22,0.2)' }
              : { background:'rgba(239,68,68,0.08)', color:'var(--accent)', border:'1px solid rgba(239,68,68,0.2)' }}>
            {result.accepted?'✅ ACCEPTED':result.passed>0?`⚠️ ${result.passed}/${result.total} PASSED`:'❌ WRONG ANSWER'}
            {result.score>0 && <span style={{ color:'var(--blue)', marginLeft:6 }}>+{result.score} pts</span>}
          </span>
        </div>
      )}
      <div className="space-y-2 overflow-y-auto flex-1">
        {results.map((r,i)=>(
          <div key={i} className="p-3 rounded-lg text-xs font-mono"
            style={{ background:r.accepted?'rgba(34,197,94,0.04)':'rgba(239,68,68,0.04)', border:`1px solid ${r.accepted?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)'}` }}>
            <div className="flex items-center gap-2 mb-2">
              <span>{r.accepted?'✅':'❌'}</span>
              <span style={{ color:'var(--text-muted)' }}>Test {i+1}</span>
              {r.time && <span className="ml-auto" style={{ color:'var(--text-dim)' }}>{r.time}s</span>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><div className="mb-1" style={{ color:'var(--text-dim)', fontSize:10 }}>EXPECTED</div><div style={{ color:'var(--green)', opacity:.8 }} className="break-all">{r.expectedOutput}</div></div>
              <div><div className="mb-1" style={{ color:'var(--text-dim)', fontSize:10 }}>YOUR OUTPUT</div><div style={{ color:r.accepted?'var(--green)':'var(--accent)', opacity:.8 }} className="break-all">{r.actualOutput||'(empty)'}</div></div>
            </div>
          </div>
        ))}
        {!result&&!isRunning&&!isSubmitting && (
          <div className="text-center py-8 flex flex-col items-center gap-2" style={{ color:'var(--text-dim)' }}>
            <span className="text-2xl opacity-30">▶</span>
            <span className="text-xs">Run or Submit to see results</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Typing Indicators ────────────────────────────────────────────────────────
function TypingIndicators({ typingPlayers, players, myId }) {
  const ids = Object.entries(typingPlayers).filter(([id,v])=>v&&id!==myId).map(([id])=>id);
  if (!ids.length) return null;
  return (
    <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono" style={{ color:'var(--text-dim)' }}>
      {ids.slice(0,2).map((id)=>(
        <span key={id} className="flex items-center gap-1">
          <span style={{ color:'var(--blue)' }}>{players[id]?.name||'Someone'}</span>
          <span className="inline-flex gap-0.5">{[0,1,2].map((i)=><span key={i} className="w-1 h-1 rounded-full animate-bounce" style={{ background:'var(--blue)', animationDelay:`${i*0.15}s` }} />)}</span>
        </span>
      ))}
      <span>typing</span>
    </div>
  );
}

// ─── Problem Content (shared) ─────────────────────────────────────────────────
function ProblemContent({ problem }) {
  const diffStyle = { Hard:{c:'var(--accent)'}, Medium:{c:'var(--bronze)'}, Easy:{c:'var(--green)'} }[problem?.difficulty]||{c:'var(--text-dim)'};
  return (
    <>
      <div className="px-4 py-3 shrink-0" style={{ borderBottom:'1px solid var(--border)' }}>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color:diffStyle.c, background:`${diffStyle.c}15`, border:`1px solid ${diffStyle.c}30` }}>
            {problem?.difficulty}
          </span>
          {problem?.tags?.slice(0,2).map((t)=><span key={t} className="badge-purple text-xs">{t}</span>)}
        </div>
        <h2 className="font-semibold text-sm leading-snug" style={{ color:'var(--text)' }}>{problem?.title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 text-sm">
        <div className="prose prose-sm prose-invert max-w-none leading-relaxed" style={{ color:'var(--text-muted)' }}>
          <ReactMarkdown>{problem?.description||''}</ReactMarkdown>
        </div>
        {problem?.constraints?.length>0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ color:'var(--text-dim)' }}>Constraints</p>
            <ul className="space-y-1">
              {problem.constraints.map((c,i)=>(
                <li key={i} className="flex gap-2 text-xs font-mono" style={{ color:'var(--text-muted)' }}>
                  <span style={{ color:'var(--text-dim)' }}>·</span>{c}
                </li>
              ))}
            </ul>
          </div>
        )}
        {problem?.sampleTestCases?.length>0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ color:'var(--text-dim)' }}>Examples</p>
            {problem.sampleTestCases.map((tc,i)=>(
              <div key={i} className="rounded-lg p-3 text-xs font-mono space-y-1.5"
                style={{ background:'var(--bg)', border:'1px solid var(--border)' }}>
                <div><span style={{ color:'var(--text-dim)' }}>Input: </span><span style={{ color:'var(--green)', opacity:.85 }}>{tc.input}</span></div>
                <div><span style={{ color:'var(--text-dim)' }}>Output: </span><span style={{ color:'var(--blue)', opacity:.85 }}>{tc.output}</span></div>
                {tc.explanation && <div style={{ color:'var(--text-dim)' }}><em>{tc.explanation}</em></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const LANGUAGES = [
  { value:'python',     label:'Python', icon:'🐍', monaco:'python' },
  { value:'javascript', label:'JS',     icon:'⚡', monaco:'javascript' },
  { value:'cpp',        label:'C++',    icon:'⚙️', monaco:'cpp' },
  { value:'java',       label:'Java',   icon:'☕', monaco:'java' },
];

// Mobile tabs for battle page
const MOBILE_TABS = ['problem', 'editor', 'board'];

// ─── BattlePage ───────────────────────────────────────────────────────────────
export default function BattlePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { player, players, problem, leaderboard, timer, gamePhase, anonymousMode,
    code, setCode, language, setLanguage, submissionResult, runResult,
    isSubmitting, isRunning, typingPlayers, commentary, isFrozen,
    setIsSubmitting, setIsRunning, chatMessages } = useGameStore();

  const typingTimer = useRef(null);
  const chatBottomRef = useRef(null);
  const [mobileTab, setMobileTab] = useState('editor');
  const [chatInput, setChatInput] = useState('');

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit('chatMessage', { roomId, message: chatInput.trim() });
    setChatInput('');
  };

  const isSpectator = !!(player && players[player.id]?.isSpectator);
  const activePlayers = Object.values(players).filter(p => !p.isSpectator);

  const [liveCodes, setLiveCodes] = useState({});
  const [spectatingTargetId, setSpectatingTargetId] = useState(activePlayers[0]?.id || null);

  useEffect(() => {
    const handleLiveCode = ({ playerId, code, language }) => {
      setLiveCodes(prev => ({ ...prev, [playerId]: { code, language } }));
    };
    socket.on('liveCodeUpdate', handleLiveCode);
    return () => socket.off('liveCodeUpdate', handleLiveCode);
  }, []);

  useEffect(() => {
    if (!player||!problem) navigate('/');
    if (gamePhase==='result') navigate(`/result/${roomId}`);
  }, [player, problem, gamePhase]);

  useEffect(() => () => { clearTimeout(typingTimer.current); socket.emit('typing',{ roomId, isTyping:false }); }, [roomId]);

  const handleCodeChange = useCallback((val) => {
    if (isFrozen || isSpectator) return;
    setCode(val||'');
    socket.emit('codeUpdate', { roomId, code: val, language });
    socket.emit('typing',{ roomId, isTyping:true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(()=>socket.emit('typing',{ roomId, isTyping:false }), 1500);
    socket.emit('codeProgress',{ roomId, progress: Math.min(100, Math.round(((val||'').split('\n').length/20)*100)) });
  }, [roomId, isFrozen, isSpectator, language]);

  const handleLangChange = (lang) => { setLanguage(lang); setCode(problem?.starterCode?.[lang]||''); };
  const handleRun = () => {
    if (isSpectator) return toast.error('👁️ Spectators cannot run code!');
    if (isFrozen) return toast.error('❄️ Frozen!');
    socket.emit('runCode',{roomId,code,language}); setIsRunning(true);
    // On mobile, switch to results view
    setMobileTab('editor');
  };
  const handleSubmit = () => {
    if (isSpectator) return toast.error('👁️ Spectators cannot submit code!');
    if (isFrozen) return toast.error('❄️ Frozen!');
    socket.emit('submitCode',{roomId,code,language}); setIsSubmitting(true);
  };

  const monacoLang = LANGUAGES.find((l)=>l.value===language)?.monaco||'python';

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background:'var(--bg)' }}>
      {isFrozen && <div className="freeze-overlay" />}

      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-3 sm:px-4 shrink-0"
        style={{ height:52, borderBottom:'1px solid var(--border)', background:'var(--bg-2)' }}>
        <span className="text-sm font-bold shrink-0" style={{ color:'var(--text)' }}>
          Code<span style={{ color:'var(--accent)' }}>Arena</span>
        </span>
        <div className="w-px h-4 mx-1 shrink-0" style={{ background:'var(--border)' }} />
        <span className="text-xs sm:text-sm font-medium truncate" style={{ color:'var(--text-muted)' }}>{problem?.title||'Battle'}</span>
        {isSpectator && <span className="badge-purple shrink-0 hidden sm:inline-flex" style={{ fontSize:10 }}>👁️ SPEC</span>}
        <div className="flex-1" />
        <div className="hidden lg:block w-52"><CommentaryTicker messages={commentary} /></div>
        <div className="flex items-center gap-3 shrink-0">
          <TimerDisplay seconds={timer} />
          <span className="text-xs font-mono hidden sm:block" style={{ color:'var(--text-dim)' }}>{roomId}</span>
          <button onClick={() => { localStorage.removeItem('codearena_roomId'); socket.emit('leaveRoom', { roomId }); navigate('/'); }}
            className="btn-primary !bg-red-500/20 !border-red-500 !text-red-500 hover:!bg-red-500/30 text-xs px-3 py-1">
            <span className="hidden sm:inline">🚪 Exit Battle</span>
            <span className="sm:hidden">🚪 Exit</span>
          </button>
        </div>
      </div>

      {/* ── Mobile Tab Bar ── */}
      <div className="lg:hidden flex shrink-0" style={{ borderBottom:'1px solid var(--border)', background:'var(--bg-2)' }}>
        {[
          { id:'problem', label:'📋 Problem' },
          { id:'editor',  label:'💻 Code'    },
          { id:'board',   label:'🏆 Board'   },
        ].map((t) => (
          <button key={t.id} onClick={()=>setMobileTab(t.id)}
            className="flex-1 py-2.5 text-xs font-semibold transition-all"
            style={{
              color: mobileTab===t.id ? 'var(--accent)' : 'var(--text-dim)',
              borderBottom: mobileTab===t.id ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent',
              marginBottom: -1,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── DESKTOP: Problem panel (always visible) ── */}
        <div className={`shrink-0 flex flex-col overflow-hidden
          ${mobileTab==='problem' ? 'flex' : 'hidden'} lg:flex
          w-full lg:w-80 xl:w-96`}
          style={{ borderRight:'1px solid var(--border)', background:'var(--bg-2)' }}>
          <ProblemContent problem={problem} />
        </div>

        {/* ── DESKTOP: Editor + right panel ── */}
        <div className={`flex-1 flex overflow-hidden
          ${mobileTab==='editor' || mobileTab==='board' ? 'flex' : 'hidden'} lg:flex`}>

          {/* Editor panel */}
          {isSpectator ? (
            <div className={`flex-1 flex-col items-center justify-center
              ${mobileTab==='editor' ? 'flex' : 'hidden'} lg:flex`}
              style={{ background:'var(--bg)' }}>
              <div className="text-center px-8 max-w-sm">
                <div className="text-5xl mb-4 opacity-60">👁️</div>
                <h3 className="text-base font-bold mb-2" style={{ color:'var(--text)' }}>Spectator Mode</h3>
                <p className="text-sm leading-relaxed" style={{ color:'var(--text-dim)' }}>
                  You are watching this battle live.
                </p>
                <div className="mt-5 px-4 py-3 rounded-lg text-xs font-mono text-left space-y-1"
                  style={{ background:'var(--surface)', border:'1px solid var(--border)' }}>
                  <div style={{ color:'var(--text-dim)' }}>✓ View problem statement</div>
                  <div style={{ color:'var(--text-dim)' }}>✓ Watch live scoreboard</div>
                  <div style={{ color:'var(--accent)', opacity:.6 }}>✗ Run or submit code</div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`flex-1 flex-col overflow-hidden
              ${mobileTab==='editor' ? 'flex' : 'hidden'} lg:flex`}>
              {/* Toolbar */}
              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 shrink-0"
                style={{ borderBottom:'1px solid var(--border)', background:'var(--bg-2)' }}>
                <div className="flex gap-1 items-center">
                  {!isSpectator ? (
                    LANGUAGES.map((l)=>(
                      <button key={l.value} id={`lang-${l.value}`} onClick={()=>handleLangChange(l.value)}
                        className="px-2 sm:px-3 py-1.5 rounded text-xs font-mono transition-all"
                        style={language===l.value
                          ? { background:'var(--accent)', color:'#fff', border:'1px solid transparent' }
                          : { color:'var(--text-dim)', border:'1px solid transparent' }}>
                        <span className="sm:hidden">{l.icon}</span>
                        <span className="hidden sm:inline">{l.icon} {l.label}</span>
                      </button>
                    ))
                  ) : (
                    activePlayers.length > 0 && (
                      <div className="flex items-center gap-2 px-2">
                        <span className="text-xs font-mono" style={{ color:'var(--text-dim)' }}>WATCHING:</span>
                        <select value={spectatingTargetId||''} onChange={(e)=>setSpectatingTargetId(e.target.value)}
                          className="text-xs font-semibold rounded px-2 py-1 outline-none"
                          style={{ background:'var(--surface)', color:'var(--blue)', border:'1px solid var(--border)' }}>
                          {activePlayers.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    )
                  )}
                </div>
                <div className="flex-1" />
                <TypingIndicators typingPlayers={typingPlayers} players={players} myId={player?.id} />
                <button onClick={handleRun} disabled={isRunning||isSubmitting} id="run-code-btn"
                  className="btn-ghost disabled:opacity-40 text-xs px-2 sm:px-3">
                  {isRunning?'⏳':'▶'}<span className="hidden sm:inline"> {isRunning?'Running...':'Run'}</span>
                </button>
                <button onClick={handleSubmit} disabled={isSubmitting||isRunning} id="submit-code-btn"
                  className="btn-primary disabled:opacity-40 text-xs px-2 sm:px-3">
                  {isSubmitting?'⏳':'⚡'}<span className="hidden sm:inline"> {isSubmitting?'Judging...':'Submit'}</span>
                </button>
              </div>

              {/* Monaco */}
              <div className="flex-1 relative overflow-hidden" style={{ background:'#1e1e1e' }}>
                {isFrozen && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                    <div className="text-5xl animate-pulse">❄️</div>
                  </div>
                )}
                <Editor height="100%"
                  language={isSpectator ? (liveCodes[spectatingTargetId]?.language || 'python') : monacoLang}
                  value={isSpectator ? (liveCodes[spectatingTargetId]?.code || '/* Waiting for player to type... */') : code}
                  onChange={handleCodeChange} theme="vs-dark"
                  options={{ fontSize:13, fontFamily:'"JetBrains Mono",monospace', fontLigatures:true,
                    minimap:{enabled:false}, scrollBeyondLastLine:false, lineNumbers:'on',
                    renderLineHighlight:'line', cursorBlinking:'smooth', cursorSmoothCaretAnimation:'on',
                    automaticLayout:true, tabSize:4, wordWrap:'on', readOnly: isFrozen || isSpectator,
                    padding:{top:12,bottom:12}, lineHeight:1.6 }} />
              </div>

              {/* Power-ups (hidden on small screens) */}
              <div className="px-3 sm:px-4 py-2 shrink-0 hidden sm:block"
                style={{ borderTop:'1px solid var(--border)', background:'var(--bg-2)' }}>
                <PowerUpBar roomId={roomId} players={players} myId={player?.id} />
              </div>
            </div>
          )}

          {/* Right panel: scoreboard + test cases (desktop) / standalone board tab (mobile) */}
          <div className={`shrink-0 flex flex-col gap-3 p-3 overflow-y-auto
            ${mobileTab==='board' ? 'flex w-full' : 'hidden'} lg:flex lg:w-72`}
            style={{ borderLeft:'1px solid var(--border)', background:'var(--bg)' }}>
            <LiveScoreboard leaderboard={leaderboard} myId={player?.id} anonymousMode={anonymousMode} />
            <div className="card flex-1" style={{ minHeight:200 }}>
              <TestCasePanel submissionResult={submissionResult} runResult={runResult}
                isRunning={isRunning} isSubmitting={isSubmitting} />
            </div>

            {/* Room Chat */}
            <div className="card flex flex-col" style={{ height: 250 }}>
              <div className="text-xs font-bold mb-2 pb-2" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>Room Chat</div>
              <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1 custom-scrollbar">
                {chatMessages.length === 0 ? (
                  <div className="text-xs text-center mt-4" style={{ color: 'var(--text-dim)' }}>No messages yet.</div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="text-xs">
                      <span className="font-bold" style={{ color: msg.playerId === player?.id ? 'var(--accent)' : 'var(--blue)' }}>
                        {msg.playerName}:{' '}
                      </span>
                      <span style={{ color: 'var(--text)' }}>{msg.message}</span>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="input-cyber flex-1 px-2 py-1 text-xs"
                  maxLength={200}
                />
                <button type="submit" className="btn-primary px-2 py-1 text-xs" disabled={!chatInput.trim()}>Send</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
