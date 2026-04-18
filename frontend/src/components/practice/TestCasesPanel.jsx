import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEVERITY_COLORS, CATEGORY_ICONS } from '../../utils/edgeCaseEngine';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  accepted: { icon: '✅', label: 'Passed',    color: '#00e676', bg: 'rgba(0,230,118,0.08)',   border: 'rgba(0,230,118,0.2)' },
  wrong:    { icon: '❌', label: 'Wrong',     color: '#ff1744', bg: 'rgba(255,23,68,0.08)',   border: 'rgba(255,23,68,0.2)' },
  tle:      { icon: '⏱', label: 'TLE',       color: '#ffd740', bg: 'rgba(255,215,64,0.08)',  border: 'rgba(255,215,64,0.2)' },
  runtime:  { icon: '⚠️', label: 'Runtime',  color: '#ff6b9d', bg: 'rgba(255,107,157,0.08)', border: 'rgba(255,107,157,0.2)' },
  compile:  { icon: '🔴', label: 'Compile',  color: '#e040fb', bg: 'rgba(224,64,251,0.08)',  border: 'rgba(224,64,251,0.2)' },
  pending:  { icon: '⏳', label: 'Running',  color: '#40c4ff', bg: 'rgba(64,196,255,0.08)',  border: 'rgba(64,196,255,0.2)' },
  error:    { icon: '🚫', label: 'Error',    color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)' },
};

function getStatusCfg(result) {
  if (!result) return STATUS_CFG.pending;
  if (result.passed) return STATUS_CFG.accepted;
  const t = result.status?.type || 'error';
  return STATUS_CFG[t] || STATUS_CFG.error;
}

// ─── Single test case row ─────────────────────────────────────────────────────
function TestCaseRow({ tc, result, index, isSelected, onSelect }) {
  const cfg = getStatusCfg(result);
  const hasResult = !!result;

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => onSelect(index)}
      className="w-full text-left px-3 py-2.5 transition-all"
      style={{
        background:   isSelected ? cfg.bg      : 'transparent',
        borderLeft:   `2px solid ${isSelected ? cfg.color : 'transparent'}`,
        borderBottom: '1px solid var(--border-2)',
      }}>
      <div className="flex items-center gap-2">
        {/* Status dot / icon */}
        {hasResult ? (
          <span className="text-sm shrink-0">{cfg.icon}</span>
        ) : (
          <span className="w-4 h-4 rounded-full border shrink-0"
            style={{ borderColor: 'var(--border)' }} />
        )}

        {/* Label */}
        <span className="text-xs font-medium truncate flex-1" style={{ color: isSelected ? cfg.color : 'var(--text)' }}>
          {tc.label}
        </span>

        {/* Edge badge */}
        {tc.isAuto && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0"
            style={{ background: 'rgba(224,64,251,0.1)', color: '#e040fb', border: '1px solid rgba(224,64,251,0.2)' }}>
            AUTO
          </span>
        )}
        {tc.isEdge && !tc.isAuto && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0"
            style={{ background: 'rgba(255,215,64,0.1)', color: '#ffd740', border: '1px solid rgba(255,215,64,0.2)' }}>
            EDGE
          </span>
        )}

        {/* Severity dot */}
        {tc.severity && (
          <span className="w-2 h-2 rounded-full shrink-0"
            style={{ background: SEVERITY_COLORS[tc.severity]?.color || '#6b7280' }} />
        )}
      </div>

      {/* Time */}
      {result?.time && (
        <div className="mt-0.5 text-[10px] font-mono pl-6" style={{ color: 'var(--text-dim)' }}>
          {result.time}s · {result.memory ? `${Math.round(result.memory / 1024)}KB` : '—'}
        </div>
      )}
    </motion.button>
  );
}

// ─── Diff view ────────────────────────────────────────────────────────────────
function DiffView({ expected, actual }) {
  const expLines = (expected || '').split('\n');
  const actLines = (actual   || '').split('\n');
  const maxLen   = Math.max(expLines.length, actLines.length);

  return (
    <div className="font-mono text-xs overflow-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ background: 'rgba(0,230,118,0.05)', borderBottom: '1px solid var(--border)', color: '#00e676' }}>
          Expected
        </div>
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ background: 'rgba(255,23,68,0.05)', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', color: '#ff1744' }}>
          Your Output
        </div>
        {Array.from({ length: maxLen }).map((_, i) => {
          const e = expLines[i] ?? '';
          const a = actLines[i] ?? '';
          const match = e === a;
          return [
            <div key={`e${i}`} className="px-3 py-1"
              style={{ background: match ? 'transparent' : 'rgba(0,230,118,0.05)', color: 'var(--text)' }}>
              {e || <span style={{ color: 'var(--text-dim)' }}>∅</span>}
            </div>,
            <div key={`a${i}`} className="px-3 py-1"
              style={{ borderLeft: '1px solid var(--border)', background: match ? 'transparent' : 'rgba(255,23,68,0.05)', color: match ? 'var(--text)' : '#ff6b9d' }}>
              {a || <span style={{ color: 'var(--text-dim)' }}>∅</span>}
            </div>,
          ];
        })}
      </div>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function TestCaseDetail({ tc, result }) {
  const [showRaw, setShowRaw] = useState(false);
  if (!tc) return (
    <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-dim)' }}>
      Select a test case to view details
    </div>
  );

  const cfg = getStatusCfg(result);

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-xl">{cfg.icon}</span>
        <div>
          <div className="text-sm font-bold text-glow-subtle" style={{ color: cfg.color }}>{tc.label}</div>
          {result && (
            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {cfg.label} · {result.time ? `${result.time}s` : '—'} · {result.memory ? `${Math.round(result.memory/1024)}KB` : '—'}
            </div>
          )}
        </div>
        {tc.category && (
          <span className="ml-auto text-lg" title={tc.category}>{CATEGORY_ICONS[tc.category] || '•'}</span>
        )}
      </div>

      {/* Edge case description */}
      {tc.description && (
        <div className="px-3 py-2 rounded-lg text-xs"
          style={{ background: SEVERITY_COLORS[tc.severity]?.bg || 'var(--surface)', border: `1px solid ${SEVERITY_COLORS[tc.severity]?.border || 'var(--border)'}`, color: 'var(--text-muted)' }}>
          <span className="font-bold" style={{ color: SEVERITY_COLORS[tc.severity]?.color }}>{tc.severity?.toUpperCase()} · {tc.category}</span>
          <br />{tc.description}
        </div>
      )}

      {/* stdin */}
      {tc.stdin !== undefined && (
        <div>
          <p className="section-title mb-1">Input (stdin)</p>
          <pre className="text-xs px-3 py-2 rounded-lg font-mono overflow-auto max-h-24"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            {tc.stdin || <span style={{ color: 'var(--text-dim)' }}>(no input)</span>}
          </pre>
        </div>
      )}

      {/* Output comparison */}
      {result && tc.expectedOutput !== undefined && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="section-title">Output Comparison</p>
            <button onClick={() => setShowRaw(r => !r)}
              className="text-[10px] px-2 py-0.5 rounded"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              {showRaw ? 'Diff View' : 'Raw View'}
            </button>
          </div>
          {showRaw ? (
            <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {[['Expected', tc.expectedOutput, '#00e676'], ['Your Output', result.stdout, '#ff6b9d']].map(([label, val, color]) => (
                <div key={label}>
                  <p className="text-[10px] mb-1 font-bold" style={{ color }}>{label}</p>
                  <pre className="text-xs px-3 py-2 rounded-lg font-mono overflow-auto max-h-24"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                    {val || '(no output)'}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <DiffView expected={tc.expectedOutput} actual={result.stdout} />
          )}
        </div>
      )}

      {/* Errors */}
      {result && (result.stderr || result.compileOut) && (
        <div>
          <p className="section-title mb-1">Error Details</p>
          <pre className="text-xs px-3 py-2 rounded-lg font-mono overflow-auto max-h-32"
            style={{ background: 'rgba(255,23,68,0.05)', border: '1px solid rgba(255,23,68,0.2)', color: '#ff6b9d' }}>
            {result.compileOut || result.stderr}
          </pre>
        </div>
      )}

      {/* Hint */}
      {tc.hint && !result?.passed && (
        <div className="px-3 py-2 rounded-lg text-xs"
          style={{ background: 'rgba(255,215,64,0.06)', border: '1px solid rgba(255,215,64,0.2)' }}>
          <span className="font-bold" style={{ color: '#ffd740' }}>💡 Hint: </span>
          <span style={{ color: 'var(--text-muted)' }}>{tc.hint}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TestCasesPanel({ testCases, edgeCases, results, isRunning }) {
  const [activeTab, setActiveTab]     = useState('sample'); // 'sample' | 'edge'
  const [showEdge, setShowEdge]       = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const sampleCases = testCases || [];
  const edgeCasesAll = edgeCases || [];

  const visibleCases = activeTab === 'sample' ? sampleCases : edgeCasesAll;
  const selected     = visibleCases[selectedIdx];
  const selectedResult = results?.[activeTab === 'sample' ? selectedIdx : sampleCases.length + selectedIdx];

  const samplePassed = sampleCases.filter((_, i) => results?.[i]?.passed).length;
  const edgePassed   = edgeCasesAll.filter((_, i) => results?.[sampleCases.length + i]?.passed).length;

  return (
    <div className="flex flex-col h-full" style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* ── Tabs ── */}
      <div className="flex items-center gap-0 shrink-0"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'sample', label: 'Sample Cases', count: sampleCases.length, passed: samplePassed },
          { key: 'edge',   label: 'Edge Cases',   count: edgeCasesAll.length, passed: edgePassed },
        ].map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedIdx(0); }}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all"
            style={{
              borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
              color:        activeTab === tab.key ? 'var(--accent)' : 'var(--text-dim)',
              background:   'transparent',
            }}>
            {tab.label}
            {results && tab.count > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{
                  background: tab.passed === tab.count ? 'rgba(0,230,118,0.15)' : 'rgba(255,23,68,0.15)',
                  color:      tab.passed === tab.count ? '#00e676' : '#ff1744',
                }}>
                {tab.passed}/{tab.count}
              </span>
            )}
          </button>
        ))}
        <div className="flex-1" />
        {activeTab === 'edge' && (
          <button onClick={() => setShowEdge(s => !s)}
            className="text-[10px] px-3 py-2 transition-all"
            style={{ color: showEdge ? 'var(--accent)' : 'var(--text-dim)' }}>
            {showEdge ? '🙈 Hide' : '👁 Show'}
          </button>
        )}
        {isRunning && (
          <div className="px-3 flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
            <span className="w-3 h-3 rounded-full border-2 inline-block"
              style={{ borderColor: 'rgba(0,230,118,0.2)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
            <span className="text-[10px]">Running…</span>
          </div>
        )}
      </div>

      {/* ── Split: list + detail ── */}
      <div className="flex flex-1 min-h-0">
        {/* Case list */}
        <div className="w-44 shrink-0 overflow-y-auto" style={{ borderRight: '1px solid var(--border)' }}>
          {(showEdge || activeTab === 'sample') && visibleCases.length > 0 ? (
            visibleCases.map((tc, i) => {
              const rIdx = activeTab === 'sample' ? i : sampleCases.length + i;
              return (
                <TestCaseRow
                  key={tc.id || i}
                  tc={tc}
                  result={results?.[rIdx]}
                  index={i}
                  isSelected={selectedIdx === i}
                  onSelect={setSelectedIdx}
                />
              );
            })
          ) : (
            <div className="p-4 text-xs text-center" style={{ color: 'var(--text-dim)' }}>
              {activeTab === 'edge' && !showEdge ? 'Edge cases hidden' : 'No test cases'}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={`${activeTab}-${selectedIdx}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full">
              <TestCaseDetail tc={selected} result={selectedResult} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
