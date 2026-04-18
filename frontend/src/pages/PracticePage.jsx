import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

import CodeEditor, { DEFAULT_CODE } from '../components/practice/CodeEditor';
import TestCasesPanel from '../components/practice/TestCasesPanel';
import ResultDisplay  from '../components/practice/ResultDisplay';
import { execute, executeBatch, enrichResults, JUDGE0_LANGUAGES } from '../services/judge0';
import { generateEdgeCases, analyzeAllFailures } from '../utils/edgeCaseEngine';

// ─── Sample problem bank ──────────────────────────────────────────────────────
const PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['array', 'hash'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers that add up to \`target\`.

**Constraints:**
- 2 ≤ nums.length ≤ 10⁴  
- -10⁹ ≤ nums[i] ≤ 10⁹  
- Exactly one valid answer exists.

**Input format:**
\`\`\`
n
num1 num2 ... numN
target
\`\`\`

**Example:**
\`\`\`
Input:  4 / 2 7 11 15 / 9
Output: 0 1
\`\`\``,
    testCases: [
      { id: 's1', label: 'Basic (2+7=9)',  stdin: '4\n2 7 11 15\n9',  expectedOutput: '0 1' },
      { id: 's2', label: 'Middle pair',    stdin: '4\n3 2 4 6\n6',    expectedOutput: '1 2' },
      { id: 's3', label: 'Last two',       stdin: '3\n3 3 5\n6',      expectedOutput: '0 1' },
    ],
    edgeCases: [
      { id: 'e1', label: 'Min size (n=2)',     stdin: '2\n1 9\n10',           expectedOutput: '0 1', isEdge: true, severity: 'high',   category: 'boundary',  description: 'Array of length 2 — minimum allowed.',    hint: 'Loop bounds must handle n=2 without off-by-one.' },
      { id: 'e2', label: 'Negative values',    stdin: '4\n-3 4 3 90\n0',      expectedOutput: '0 1', isEdge: true, severity: 'high',   category: 'negative',  description: 'Array contains negatives.',                hint: 'Check if your complement lookup handles negatives.' },
      { id: 'e3', label: 'Duplicate answer',   stdin: '4\n5 5 3 1\n10',       expectedOutput: '0 1', isEdge: true, severity: 'medium', category: 'duplicate', description: 'Two same numbers sum to target.',           hint: 'The same index must not be used twice.' },
      { id: 'e4', label: 'Large values',       stdin: '3\n1000000000 -1000000000 5\n5', expectedOutput: '2 2', isEdge: true, severity: 'medium', category: 'overflow', description: 'Near INT_MAX values.', hint: 'Use long/int64 for intermediate sums.' },
    ],
    starterCode: {
      71: `# Python 3 — Read stdin, find two indices
import sys
input = sys.stdin.readline

def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        comp = target - n
        if comp in seen:
            return seen[comp], i
        seen[n] = i

n = int(input())
nums = list(map(int, input().split()))
target = int(input())
i, j = two_sum(nums, target)
print(i, j)
`,
      63: `// JavaScript (Node.js)
const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const n = parseInt(lines[0]);
const nums = lines[1].split(' ').map(Number);
const target = parseInt(lines[2]);

function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (map.has(comp)) return [map.get(comp), i];
    map.set(nums[i], i);
  }
}

const [i, j] = twoSum(nums, target);
console.log(i, j);
`,
      54: `#include <bits/stdc++.h>
using namespace std;
int main(){
    int n; cin>>n;
    vector<int> nums(n);
    for(auto &x:nums) cin>>x;
    int target; cin>>target;
    unordered_map<int,int> m;
    for(int i=0;i<n;i++){
        int comp=target-nums[i];
        if(m.count(comp)){cout<<m[comp]<<" "<<i;return 0;}
        m[nums[i]]=i;
    }
}
`,
    },
  },
  {
    id: 'valid-parens',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    tags: ['string', 'stack'],
    description: `Given a string \`s\` containing only \`(\`, \`)\`, \`{\`, \`}\`, \`[\`, \`]\`, determine if the input string is valid.

A string is valid if:
- Open brackets are closed by the same type.
- Brackets are closed in the correct order.
- Every close bracket has a matching open bracket.

**Input:** A single line with the bracket string.
**Output:** \`true\` or \`false\``,
    testCases: [
      { id: 's1', label: 'Simple valid',   stdin: '()',      expectedOutput: 'true'  },
      { id: 's2', label: 'Mixed valid',    stdin: '()[]{}', expectedOutput: 'true'  },
      { id: 's3', label: 'Interleaved',    stdin: '(]',     expectedOutput: 'false' },
    ],
    edgeCases: [
      { id: 'e1', label: 'Empty string',   stdin: '',       expectedOutput: 'true',  isEdge: true, severity: 'high',   category: 'boundary', description: 'Empty string — trivially valid.', hint: 'Stack should be empty at end — correct for empty input too.' },
      { id: 'e2', label: 'Single open',    stdin: '(',      expectedOutput: 'false', isEdge: true, severity: 'high',   category: 'boundary', description: 'Only one unmatched open bracket.',hint: 'Stack not empty at end → false.' },
      { id: 'e3', label: 'Single close',   stdin: ')',      expectedOutput: 'false', isEdge: true, severity: 'high',   category: 'boundary', description: 'Close bracket with nothing to match.', hint: 'Popping empty stack must return false.' },
      { id: 'e4', label: 'Nested deep',    stdin: '((({{{[[[]]]}}})))', expectedOutput: 'true', isEdge: true, severity: 'medium', category: 'performance', description: 'Deeply nested valid brackets.', hint: 'Recursion may stack overflow; use iterative stack.' },
    ],
    starterCode: {
      71: `s = input().strip()
stack = []
mapping = {')':'(', '}':'{', ']':'['}
for c in s:
    if c in mapping:
        top = stack.pop() if stack else '#'
        if mapping[c] != top:
            print('false')
            exit()
    else:
        stack.append(c)
print('true' if not stack else 'false')
`,
      63: `const s = require('fs').readFileSync('/dev/stdin','utf8').trim();
const stack = [];
const map = {')':'(','}':'{',']':'['};
for(const c of s){
  if(map[c]){if(stack.pop()!==map[c]){console.log('false');process.exit();}}
  else stack.push(c);
}
console.log(stack.length===0?'true':'false');
`,
    },
  },
  {
    id: 'max-subarray',
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    tags: ['array', 'dynamic programming'],
    description: `Given an integer array \`nums\`, find the subarray with the largest sum and return its sum (Kadane's Algorithm).

**Input format:**
\`\`\`
n
num1 num2 ... numN
\`\`\`

**Example:**
\`\`\`
Input:  9 / -2 1 -3 4 -1 2 1 -5 4
Output: 6
\`\`\``,
    testCases: [
      { id: 's1', label: 'Classic Kadane', stdin: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6' },
      { id: 's2', label: 'All positive',   stdin: '5\n1 2 3 4 5',              expectedOutput: '15' },
      { id: 's3', label: 'All negative',   stdin: '4\n-3 -1 -2 -4',           expectedOutput: '-1' },
    ],
    edgeCases: [
      { id: 'e1', label: 'Single element', stdin: '1\n42',       expectedOutput: '42',  isEdge: true, severity: 'high',   category: 'boundary', description: 'Only one element in array.', hint: 'max_current = max_global = nums[0] — initialize correctly.' },
      { id: 'e2', label: 'Two elements',   stdin: '2\n-1 5',     expectedOutput: '5',   isEdge: true, severity: 'medium', category: 'boundary', description: 'Array of length 2 with mix of signs.', hint: 'Check if loop starts at index 0 or 1.' },
      { id: 'e3', label: 'All zeros',      stdin: '4\n0 0 0 0',  expectedOutput: '0',   isEdge: true, severity: 'medium', category: 'duplicate', description: 'All elements are zero.', hint: 'Result should be 0, not negative.' },
      { id: 'e4', label: 'INT_MIN boundary', stdin: '3\n-2147483648 1 -2147483648', expectedOutput: '1', isEdge: true, severity: 'high', category: 'overflow', description: 'Values at INT_MIN boundary.', hint: 'Initializing with INT_MIN and then subtracting causes overflow.' },
    ],
    starterCode: {
      71: `import sys
input = sys.stdin.readline
n = int(input())
nums = list(map(int, input().split()))
max_cur = max_global = nums[0]
for x in nums[1:]:
    max_cur = max(x, max_cur + x)
    max_global = max(max_global, max_cur)
print(max_global)
`,
      63: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const nums = lines[1].split(' ').map(Number);
let cur = nums[0], best = nums[0];
for(let i=1;i<nums.length;i++){cur=Math.max(nums[i],cur+nums[i]);best=Math.max(best,cur);}
console.log(best);
`,
    },
  },
];

const DIFF_COLORS = {
  Easy:   { color: '#00e676', bg: 'rgba(0,230,118,0.1)',  border: 'rgba(0,230,118,0.2)'  },
  Medium: { color: '#ffd740', bg: 'rgba(255,215,64,0.1)', border: 'rgba(255,215,64,0.2)' },
  Hard:   { color: '#ff1744', bg: 'rgba(255,23,68,0.1)',  border: 'rgba(255,23,68,0.2)'  },
};

// ─── Validation ───────────────────────────────────────────────────────────────
function validateSubmission(code, languageId) {
  if (!code || !code.trim()) return 'Code cannot be empty.';
  if (code.trim().split('\n').length < 2) return 'Code seems too short — please write a full solution.';
  if (!languageId) return 'Please select a language.';
  if (!JUDGE0_LANGUAGES.find(l => l.id === languageId)) return 'Unsupported language selected.';
  return null;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PracticePage() {
  const navigate = useNavigate();

  const [selectedProblemId, setSelectedProblemId] = useState(PROBLEMS[0].id);
  const [languageId, setLanguageId] = useState(71);
  const [code, setCode]             = useState('');
  const [results, setResults]       = useState(null);
  const [failures, setFailures]     = useState([]);
  const [isRunning, setIsRunning]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePanel, setActivePanel]   = useState('tests'); // 'tests' | 'results'
  const [showProblemList, setShowProblemList] = useState(false);

  const problem    = PROBLEMS.find(p => p.id === selectedProblemId) || PROBLEMS[0];
  const edgeCases  = generateEdgeCases(problem);
  const allCases   = [...(problem.testCases || []), ...edgeCases];

  // Use starter code when switching problem or language
  function selectProblem(p) {
    setSelectedProblemId(p.id);
    setCode(p.starterCode?.[languageId] || DEFAULT_CODE[languageId] || '');
    setResults(null);
    setFailures([]);
    setShowProblemList(false);
  }

  function handleLanguageChange(newId) {
    setLanguageId(newId);
    setCode(problem.starterCode?.[newId] || DEFAULT_CODE[newId] || '');
    setResults(null);
  }

  // ── Run: only sample test cases ──
  const handleRun = useCallback(async () => {
    const err = validateSubmission(code, languageId);
    if (err) { toast.error(err); return; }

    const customStdin = document.getElementById('custom-stdin')?.value?.trim() || null;
    setIsRunning(true);
    setActivePanel('results');
    setResults(null);

    try {
      const cases = customStdin
        ? [{ label: 'Custom Input', stdin: customStdin, expectedOutput: '' }]
        : problem.testCases.map(tc => ({ ...tc, code, languageId }));

      const raw = await executeBatch(cases.map(tc => ({ code, languageId, ...tc })));
      const enriched = enrichResults(raw);
      setResults(enriched);
      setFailures(analyzeAllFailures(enriched));
      setActivePanel('results');
    } catch (e) {
      toast.error(`Execution failed: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  }, [code, languageId, problem]);

  // ── Submit: sample + edge cases ──
  const handleSubmit = useCallback(async () => {
    const err = validateSubmission(code, languageId);
    if (err) { toast.error(err); return; }

    setIsSubmitting(true);
    setActivePanel('results');
    setResults(null);

    try {
      const submissions = allCases.map(tc => ({ code, languageId, ...tc }));
      const raw = await executeBatch(submissions);
      const enriched = enrichResults(raw);
      setResults(enriched);
      const f = analyzeAllFailures(enriched);
      setFailures(f);
      setActivePanel(f.length > 0 ? 'results' : 'tests');

      const passed = enriched.filter(r => r.passed).length;
      const total  = enriched.length;
      if (passed === total) toast.success(`🏆 All ${total} cases passed!`);
      else toast.error(`${passed}/${total} passed — check failures below`);
    } catch (e) {
      toast.error(`Submission failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [code, languageId, allCases]);

  const sampleResults = results?.slice(0, problem.testCases.length);
  const edgeResults   = results?.slice(problem.testCases.length);

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── TopNav ── */}
      <div className="top-nav shrink-0">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--accent)', color: '#000' }}>⚡</div>
          <span className="text-sm font-bold text-glow-subtle" style={{ color: 'var(--text)' }}>
            CODE<span className="text-glow-green" style={{ color: 'var(--accent)' }}>ARENA</span>
          </span>
        </button>

        {/* Problem selector */}
        <div className="relative mx-4">
          <button
            onClick={() => setShowProblemList(s => !s)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold mr-1"
              style={{ background: DIFF_COLORS[problem.difficulty]?.bg, color: DIFF_COLORS[problem.difficulty]?.color }}>
              {problem.difficulty}
            </span>
            {problem.title}
            <span className="ml-1" style={{ color: 'var(--text-dim)' }}>▾</span>
          </button>

          <AnimatePresence>
            {showProblemList && (
              <motion.div
                initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                className="absolute top-full left-0 mt-1 z-50 rounded-xl overflow-hidden"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 240, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                {PROBLEMS.map(p => {
                  const dc = DIFF_COLORS[p.difficulty];
                  return (
                    <button key={p.id} onClick={() => selectProblem(p)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 transition-all text-xs"
                      style={{ borderBottom: '1px solid var(--border-2)', background: p.id === problem.id ? 'rgba(0,230,118,0.05)' : 'transparent' }}>
                      <span className="px-1.5 py-0.5 rounded font-bold text-[10px]"
                        style={{ background: dc?.bg, color: dc?.color, border: `1px solid ${dc?.border}` }}>
                        {p.difficulty}
                      </span>
                      <span style={{ color: p.id === problem.id ? 'var(--accent)' : 'var(--text)' }}>{p.title}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1" />
        <span className="season-badge hidden sm:inline-flex">Practice Mode</span>
        <button onClick={() => navigate('/leaderboard')} className="btn-ghost text-xs px-3">🏆</button>
        <button onClick={() => navigate('/')} className="btn-ghost text-xs px-3">← Home</button>
      </div>

      {/* ── Main layout: Problem | Editor | Results ── */}
      <div className="flex-1 flex overflow-hidden min-h-0" style={{ height: 'calc(100vh - 52px)' }}>

        {/* ── Problem panel ── */}
        <div className="w-80 shrink-0 overflow-y-auto hidden lg:block"
          style={{ borderRight: '1px solid var(--border)' }}>
          <div className="p-4 space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-base font-bold text-glow-subtle" style={{ color: 'var(--text)' }}>{problem.title}</h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-xs font-bold"
                  style={{ background: DIFF_COLORS[problem.difficulty]?.bg, color: DIFF_COLORS[problem.difficulty]?.color, border: `1px solid ${DIFF_COLORS[problem.difficulty]?.border}` }}>
                  {problem.difficulty}
                </span>
                {problem.tags?.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded text-[10px]"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-invert prose-sm max-w-none text-xs leading-relaxed"
              style={{ color: 'var(--text-muted)' }}>
              <ReactMarkdown>{problem.description}</ReactMarkdown>
            </div>

            {/* Edge case preview */}
            <div>
              <p className="section-title mb-2">🤖 Auto-Generated Edge Cases</p>
              <div className="space-y-1">
                {edgeCases.slice(0, 6).map((ec) => (
                  <div key={ec.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border-2)' }}>
                    <span className="text-xs">{ec.category === 'boundary' ? '⚡' : ec.category === 'overflow' ? '💥' : ec.category === 'performance' ? '⏱' : '•'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{ec.label}</span>
                    <span className="ml-auto text-[10px] font-bold"
                      style={{ color: ec.severity === 'high' ? '#ff1744' : ec.severity === 'medium' ? '#ffd740' : '#40c4ff' }}>
                      {ec.severity}
                    </span>
                  </div>
                ))}
                {edgeCases.length > 6 && (
                  <p className="text-[10px] text-center pt-1" style={{ color: 'var(--text-dim)' }}>+{edgeCases.length - 6} more edge cases auto-generated</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Editor ── */}
        <div className="flex-1 min-w-0 flex flex-col p-3 gap-3">
          <CodeEditor
            code={code || problem.starterCode?.[languageId] || DEFAULT_CODE[languageId] || ''}
            onChange={setCode}
            languageId={languageId}
            onLanguageChange={handleLanguageChange}
            onRun={handleRun}
            onSubmit={handleSubmit}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* ── Right panel: Tests + Results ── */}
        <div className="w-80 shrink-0 flex flex-col" style={{ borderLeft: '1px solid var(--border)' }}>
          {/* Tab switcher */}
          <div className="flex shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            {[{ key: 'tests', label: '🧪 Tests' }, { key: 'results', label: '📊 Results' }].map(t => (
              <button key={t.key} onClick={() => setActivePanel(t.key)}
                className="flex-1 py-2.5 text-xs font-semibold transition-all"
                style={{
                  borderBottom: activePanel === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activePanel === t.key ? 'var(--accent)' : 'var(--text-dim)',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {activePanel === 'tests' ? (
                <motion.div key="tests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <TestCasesPanel
                    testCases={problem.testCases}
                    edgeCases={edgeCases}
                    results={results}
                    isRunning={isRunning || isSubmitting}
                  />
                </motion.div>
              ) : (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <ResultDisplay
                    results={results}
                    failures={failures}
                    isRunning={isRunning || isSubmitting}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Judge0 API key notice ── */}
      {!import.meta.env.VITE_JUDGE0_URL && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl text-xs max-w-xs"
          style={{ background: 'rgba(255,215,64,0.08)', border: '1px solid rgba(255,215,64,0.25)', color: '#ffd740' }}>
          <span className="font-bold">⚠️ Using free Judge0 CE</span> — add <code className="mx-1 px-1 rounded" style={{ background: 'rgba(0,0,0,0.3)' }}>VITE_JUDGE0_URL</code> to .env.local for a dedicated instance.
        </div>
      )}
    </div>
  );
}
