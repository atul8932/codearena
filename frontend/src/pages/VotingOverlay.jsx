import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import socket from '../services/socket';

export default function VotingOverlay() {
  const { problemPool, votes, votingTimeLeft, players, player } = useGameStore();
  const roomId = useGameStore.getState().room?.id;

  const handleVote = (id) => {
    socket.emit('voteProblem', { roomId, problemId: id });
  };

  const getVoteCount = (id) => {
    return Object.values(votes || {}).filter(vid => vid === id).length;
  };

  const myVote = votes[player?.id];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6"
      style={{ background: 'rgba(10,10,10,0.98)', backdropFilter: 'blur(20px)' }}
    >
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] mb-4 border border-neon-blue/30 text-neon-blue bg-neon-blue/5">
            SELECTION PHASE
          </div>
          <h2 className="text-4xl font-bold mb-4 font-display">VOTE FOR PROBLEM</h2>
          <div className="flex items-center justify-center gap-4">
            <div className="text-sm font-mono text-slate-400">DECISION DEADLINE:</div>
            <div className="text-3xl font-black font-mono text-neon-pink w-16">
              {String(votingTimeLeft).padStart(2, '0')}s
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problemPool.map((p) => {
            const voteCount = getVoteCount(p.id);
            const isSelected = myVote === p.id;

            return (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleVote(p.id)}
                className={`card relative overflow-hidden group transition-all p-0 flex flex-col text-left ${
                  isSelected ? 'border-neon-blue shadow-[0_0_20px_rgba(0,240,255,0.2)]' : 'border-white/5 hover:border-white/20'
                }`}
              >
                {/* Progress bar for votes */}
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-neon-blue transition-all duration-500" 
                  style={{ width: `${(voteCount / 4) * 100}%` }}
                />

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${
                      p.difficulty === 'Easy' ? 'border-green-500/50 text-green-400 bg-green-500/5' :
                      p.difficulty === 'Medium' ? 'border-amber-500/50 text-amber-400 bg-amber-500/5' :
                      'border-red-500/50 text-red-400 bg-red-500/5'
                    }`}>
                      {p.difficulty}
                    </span>
                    <div className="text-2xl font-black text-white/10 group-hover:text-neon-blue/20 transition-colors">
                      {voteCount}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mb-3 text-white group-hover:text-neon-blue transition-colors">
                    {p.id}. {p.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(p.tags || []).map(tag => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-6">
                    {p.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Voting Status Indicators */}
        <div className="mt-12 flex justify-center gap-2">
          {Object.values(players).filter(p => !p.isSpectator).map(p => {
            const hasVoted = !!votes[p.id];
            return (
              <div 
                key={p.id} 
                title={p.name}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  hasVoted ? 'bg-neon-blue shadow-[0_0_8px_rgba(0,240,255,1)]' : 'bg-white/10'
                }`} 
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
