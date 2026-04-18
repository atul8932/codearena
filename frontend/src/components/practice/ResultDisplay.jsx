import { motion, AnimatePresence } from 'framer-motion';

const STATUS_META = {
  accepted: { icon: '✅', color: '#00e676', label: 'All Tests Passed!'     },
  wrong:    { icon: '❌', color: '#ff1744', label: 'Wrong Answer'          },
  tle:      { icon: '⏱', color: '#ffd740', label: 'Time Limit Exceeded'   },
  runtime:  { icon: '⚠️', color: '#ff6b9d', label: 'Runtime Error'         },
  compile:  { icon: '🔴', color: '#e040fb', label: 'Compilation Error'     },
  partial:  { icon: '🟡', color: '#ffd740', label: 'Partially Correct'     },
  pending:  { icon: '⏳', color: '#40c4ff', label: 'Executing…'            },
  idle:     { icon: '💡', color: '#6b7280', label: 'Submit to see results' },
};

function ProgressBar({ value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ background: color }}
      />
    </div>
  );
}

function FailureCard({ failure, index }) {
  const typeColor = {
    compilation: '#e040fb',
    tle:         '#ffd740',
    runtime:     '#ff6b9d',
    wrong:       '#ff1744',
  }[failure.type] || '#6b7280';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl p-4 space-y-2"
      style={{ background: `rgba(${hexToRgb(typeColor)}, 0.05)`, border: `1px solid rgba(${hexToRgb(typeColor)}, 0.2)` }}>

      <div className="flex items-center gap-2">
        <span className="text-sm font-bold" style={{ color: typeColor }}>{failure.title}</span>
        {failure.testLabel && (
          <span className="text-[10px] px-2 py-0.5 rounded font-mono"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)' }}>
            {failure.testLabel}
          </span>
        )}
        {failure.isEdge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
            style={{ background: 'rgba(224,64,251,0.1)', color: '#e040fb' }}>EDGE</span>
        )}
      </div>

      <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{failure.message}</p>

      {failure.fixes?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#ffd740' }}>
            💡 Suggested Fixes
          </p>
          <ul className="space-y-1">
            {failure.fixes.map((fix, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                <span style={{ color: typeColor, flexShrink: 0 }}>→</span>
                {fix}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function PerformanceStats({ results }) {
  const finished = results.filter(r => r.time);
  if (!finished.length) return null;
  const times = finished.map(r => parseFloat(r.time)).filter(Boolean);
  const mems  = finished.map(r => r.memory).filter(Boolean);

  const avg  = times.length ? (times.reduce((a,b) => a+b, 0) / times.length).toFixed(3) : '—';
  const max  = times.length ? Math.max(...times).toFixed(3) : '—';
  const mem  = mems.length  ? Math.round(Math.max(...mems) / 1024) : '—';

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'Avg Time', value: `${avg}s`, color: '#40c4ff' },
        { label: 'Max Time', value: `${max}s`, color: '#ffd740' },
        { label: 'Peak Mem', value: `${mem}KB`, color: '#e040fb' },
      ].map(({ label, value, color }) => (
        <div key={label} className="text-center p-2 rounded-lg"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-bold font-mono text-glow-subtle" style={{ color }}>{value}</div>
          <div className="text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function ResultDisplay({ results, failures, status, isRunning }) {
  if (isRunning) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(0,230,118,0.2)', borderTopColor: 'var(--accent)' }} />
          <div className="absolute inset-2 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(64,196,255,0.2)', borderTopColor: '#40c4ff', animationDirection: 'reverse', animationDuration: '0.6s' }} />
          <span className="absolute inset-0 flex items-center justify-center text-lg">⚡</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-glow-green" style={{ color: 'var(--accent)' }}>Executing Code</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Running against all test cases…</p>
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <div className="text-5xl opacity-20">🧪</div>
        <div className="text-center">
          <p className="text-sm font-bold" style={{ color: 'var(--text-dim)' }}>No Results Yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Click Run to test, Submit to evaluate all cases</p>
        </div>
        <div className="w-full max-w-xs space-y-2 text-xs" style={{ color: 'var(--text-dim)' }}>
          {[
            ['▶ Run', 'Executes with sample test cases only'],
            ['⚡ Submit', 'Runs all test cases including edge cases'],
          ].map(([btn, desc]) => (
            <div key={btn} className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{btn}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const passed  = results.filter(r => r.passed).length;
  const total   = results.length;
  const allPass = passed === total;

  // Determine overall status type
  let overallType = 'partial';
  if (allPass) overallType = 'accepted';
  else if (results.some(r => r.status?.type === 'compile')) overallType = 'compile';
  else if (results.some(r => r.status?.type === 'tle'))     overallType = 'tle';
  else if (results.some(r => r.status?.type === 'runtime')) overallType = 'runtime';
  else if (results.some(r => r.status?.type === 'wrong'))   overallType = 'wrong';

  const meta = STATUS_META[overallType] || STATUS_META.idle;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={results.length + passed}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full overflow-y-auto p-4 space-y-4">

        {/* ── Verdict banner ── */}
        <div className="px-4 py-4 rounded-xl flex items-center gap-4"
          style={{ background: `rgba(${hexToRgb(meta.color)}, 0.07)`, border: `1px solid rgba(${hexToRgb(meta.color)}, 0.25)` }}>
          <span className="text-3xl">{meta.icon}</span>
          <div className="flex-1">
            <div className="text-base font-bold text-glow-subtle" style={{ color: meta.color }}>{meta.label}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
              {passed} / {total} test cases passed
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black font-mono" style={{ color: meta.color }}>
              {Math.round((passed / total) * 100)}%
            </div>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <ProgressBar value={passed} total={total} color={meta.color} />

        {/* ── Quick stats grid ── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '✅ Passed',   value: passed,                                 color: '#00e676' },
            { label: '❌ Failed',   value: results.filter(r => r.status?.type === 'wrong').length, color: '#ff1744' },
            { label: '⚠️ Runtime',  value: results.filter(r => r.status?.type === 'runtime').length, color: '#ff6b9d' },
            { label: '⏱ TLE',      value: results.filter(r => r.status?.type === 'tle').length,    color: '#ffd740' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-2 rounded-lg"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="text-lg font-bold" style={{ color: value > 0 ? color : 'var(--text-dim)' }}>{value}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Performance ── */}
        <PerformanceStats results={results} />

        {/* ── Failure analysis ── */}
        {failures && failures.length > 0 && (
          <div>
            <p className="section-title mb-2">🔍 Failure Analysis</p>
            <div className="space-y-2">
              {failures.map((f, i) => <FailureCard key={i} failure={f} index={i} />)}
            </div>
          </div>
        )}

        {/* ── All passed celebration ── */}
        {allPass && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-4 py-4 rounded-xl text-center space-y-1"
            style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)' }}>
            <div className="text-2xl">🏆</div>
            <p className="text-sm font-bold text-glow-green" style={{ color: 'var(--accent)' }}>Excellent!</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Your solution handles all sample and edge cases correctly.
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
