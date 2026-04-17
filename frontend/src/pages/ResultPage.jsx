import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import useGameStore from '../store/gameStore';
import socket from '../services/socket';
import { TopNav, PageShell } from './LandingPage';

// ─── Rank badge colours ───────────────────────────────────────────────────────
const RANK_CFG = {
  1: { bg:'#F5A623', text:'#111', label:'#1' },
  2: { bg:'#9ca3af', text:'#111', label:'#2' },
  3: { bg:'#E8871A', text:'#111', label:'#3' },
};

function RankDot({ rank }) {
  const color = { 1:'#F5A623', 2:'#9ca3af', 3:'#E8871A' }[rank];
  if (!color) return <span className="text-sm font-bold" style={{ color:'var(--text-dim)' }}>{rank}</span>;
  return <span className="inline-block w-5 h-5 rounded-full" style={{ background:color }} />;
}

function SortIcon({ col, sortBy, dir }) {
  const active = sortBy===col;
  return (
    <span className="inline-flex flex-col ml-1" style={{ fontSize:8, gap:1, opacity:.5 }}>
      <span style={{ color: active&&dir==='asc'  ? 'var(--text)' : 'currentColor' }}>▲</span>
      <span style={{ color: active&&dir==='desc' ? 'var(--text)' : 'currentColor' }}>▼</span>
    </span>
  );
}

const fmtTime = (secs) => {
  if (!secs && secs!==0) return '—';
  const m = String(Math.floor(secs/60)).padStart(2,'0');
  const s = String(secs%60).padStart(2,'0');
  return `00:${m}:${s}`;
};

export default function ResultPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { player, finalLeaderboard, winner, anonymousMode, resetGame } = useGameStore();
  const [sortBy,  setSortBy]  = useState('score');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => { if (!player) navigate('/'); }, [player]);

  const isWinner = winner?.id===player?.id;

  const handlePlayAgain = () => { resetGame(); navigate(`/lobby/${roomId}`); socket.emit('resetRoom',{ roomId }); };
  const handleExit = () => { socket.disconnect(); useGameStore.getState().resetAll(); navigate('/'); };

  const handleSort = (col) => {
    if (sortBy===col) setSortDir((d)=>d==='asc'?'desc':'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const sorted = [...finalLeaderboard].sort((a,b)=>{
    let va=a[sortBy]??0, vb=b[sortBy]??0;
    if (typeof va==='string') { va=va.toLowerCase(); vb=vb.toLowerCase(); }
    return sortDir==='asc' ? (va<vb?-1:va>vb?1:0) : (va>vb?-1:va<vb?1:0);
  });

  const top3 = finalLeaderboard.slice(0,3);
  const myEntry = finalLeaderboard.find((p)=>p.id===player?.id);
  const myRank  = finalLeaderboard.indexOf(myEntry)+1;
  const visibleRows = sorted.slice(0,7);
  const myInTop7 = myEntry && sorted.findIndex((p)=>p.id===player?.id)<7;

  const today = new Date().toLocaleDateString('en-GB',{ day:'2-digit', month:'2-digit', year:'2-digit' });

  return (
    <PageShell nav={
      <TopNav
        right={<span className="badge-pink text-xs">Battle Complete</span>}
      />
    }>
      {isWinner && <Confetti recycle={false} numberOfPieces={280} colors={['#F5A623','#9ca3af','#E8871A','#ef4444','#22c55e']} />}

      {/* Sub-header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom:'1px solid var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color:'var(--text)' }}>Leaderboard</h1>
          <p className="text-xs mt-0.5" style={{ color:'var(--accent)' }}>
            {isWinner ? '🏆 Victory! You dominated the arena!' : winner ? `${anonymousMode?'???':winner.name} takes the crown with ${winner.score} pts` : "Time's Up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary" style={{ background:'var(--accent)' }}>Current</button>
          {player?.isHost && <button onClick={handlePlayAgain} className="btn-secondary">🔄 Play Again</button>}
          <button onClick={handleExit} className="btn-secondary">🚪 Exit Arena</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-5 overflow-auto">

        {/* Top 3 horizontal badges */}
        {top3.length>0 && (
          <div className="flex gap-3 mb-5">
            {top3.map((p, i) => {
              const cfg = RANK_CFG[i+1];
              const isMe = p.id===player?.id;
              return (
                <motion.div key={p.id} initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
                  className="flex items-center gap-3 flex-1 px-4 py-3 rounded-xl"
                  style={{ background:'var(--surface)', border:`1px solid ${isMe?'rgba(239,68,68,0.3)':'var(--border)'}` }}>
                  {/* Rank square */}
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background:cfg.bg, color:cfg.text }}>
                    {cfg.label}
                  </div>
                  {/* Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                      className="shrink-0" style={{ color:'var(--text-dim)' }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span className="text-sm font-semibold truncate" style={{ color:isMe?'var(--gold)':'var(--text)' }}>
                      {anonymousMode?`Player ${i+1}`:p.name}
                    </span>
                    {isMe && <span className="badge-pink shrink-0" style={{ fontSize:9 }}>YOU</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border:'1px solid var(--border)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)' }}>
                {[
                  { key:null,    label:'#',               align:'left',  w:56  },
                  { key:'name',  label:'Participant',      align:'left',  w:null },
                  { key:'score', label:'Submission Time',  align:'left',  w:160 },
                  { key:'date',  label:'Date',             align:'left',  w:100 },
                  { key:'score', label:'Score',            align:'right', w:80  },
                ].map(({ key,label,align,w },ci)=>(
                  <th key={ci} onClick={()=>key&&handleSort(key)}
                    className="py-3 px-4 text-xs font-semibold tracking-wide"
                    style={{ textAlign:align, width:w||undefined, color:'var(--text-muted)', cursor:key?'pointer':'default', userSelect:'none', whiteSpace:'nowrap' }}>
                    {label}{key&&<SortIcon col={key} sortBy={sortBy} dir={sortDir} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((p,i)=>{
                const origRank = finalLeaderboard.indexOf(p)+1;
                const isMe = p.id===player?.id;
                return (
                  <motion.tr key={p.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.05+i*0.04 }}
                    style={{ borderBottom:'1px solid var(--border-2)', background:isMe?'rgba(239,68,68,0.04)':i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                    <td className="py-3 px-4">
                      <div className="w-6"><RankDot rank={origRank} /></div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                          className="shrink-0" style={{ color:'var(--text-dim)' }}>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span className="text-sm font-medium" style={{ color:isMe?'var(--gold)':'var(--text)' }}>
                          {anonymousMode?`Player ${origRank}`:p.name}
                        </span>
                        {isMe&&<span className="badge-pink" style={{ fontSize:9 }}>YOU</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm" style={{ color:isMe?'var(--gold)':'var(--text-muted)' }}>
                      {fmtTime(p.timeTaken||p.submissionTime)}
                    </td>
                    <td className="py-3 px-4 font-mono text-sm" style={{ color:isMe?'var(--gold)':'var(--text-dim)' }}>{today}</td>
                    <td className="py-3 px-4 text-right font-bold text-sm" style={{ color:isMe?'var(--gold)':'var(--text)' }}>
                      {p.score||0}
                    </td>
                  </motion.tr>
                );
              })}

              {/* Separator + pinned current player */}
              {myEntry && !myInTop7 && (
                <>
                  <tr style={{ borderBottom:'1px solid var(--border-2)' }}>
                    <td colSpan={5} className="py-1.5 px-4">
                      <span className="text-lg" style={{ color:'var(--text-dim)' }}>⋮</span>
                    </td>
                  </tr>
                  <motion.tr initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
                    style={{ background:'rgba(239,68,68,0.06)', borderTop:'1px solid rgba(239,68,68,0.12)' }}>
                    <td className="py-3 px-4 font-bold text-sm" style={{ color:'var(--accent)' }}>{myRank}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                          style={{ color:'var(--accent)' }}>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span className="text-sm font-medium" style={{ color:'var(--accent)' }}>
                          {anonymousMode?`Player ${myRank}`:myEntry.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm" style={{ color:'var(--accent)' }}>{fmtTime(myEntry.timeTaken||myEntry.submissionTime)}</td>
                    <td className="py-3 px-4 font-mono text-sm" style={{ color:'var(--accent)' }}>{today}</td>
                    <td className="py-3 px-4 text-right font-bold text-sm" style={{ color:'var(--accent)' }}>{myEntry.score||0}</td>
                  </motion.tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
