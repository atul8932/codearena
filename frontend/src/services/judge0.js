import axios from 'axios';

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_JUDGE0_URL     || 'https://ce.judge0.com';
const API_KEY  = import.meta.env.VITE_JUDGE0_API_KEY || '';
const USE_RAPIDAPI = !!import.meta.env.VITE_JUDGE0_RAPIDAPI_HOST;

const HEADERS = USE_RAPIDAPI
  ? {
      'X-RapidAPI-Key':  API_KEY,
      'X-RapidAPI-Host': import.meta.env.VITE_JUDGE0_RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com',
      'Content-Type':    'application/json',
    }
  : { 'Content-Type': 'application/json', ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}) };

// ─── Language registry ────────────────────────────────────────────────────────
export const JUDGE0_LANGUAGES = [
  { id: 71, name: 'Python 3',         monaco: 'python',     ext: 'py'  },
  { id: 63, name: 'JavaScript',       monaco: 'javascript', ext: 'js'  },
  { id: 54, name: 'C++ (GCC 9.2)',    monaco: 'cpp',        ext: 'cpp' },
  { id: 62, name: 'Java',             monaco: 'java',       ext: 'java'},
  { id: 50, name: 'C (GCC 9.2)',      monaco: 'c',          ext: 'c'   },
  { id: 60, name: 'Go',               monaco: 'go',         ext: 'go'  },
  { id: 73, name: 'Rust',             monaco: 'rust',       ext: 'rs'  },
  { id: 72, name: 'Ruby',             monaco: 'ruby',       ext: 'rb'  },
  { id: 74, name: 'TypeScript',       monaco: 'typescript', ext: 'ts'  },
  { id: 51, name: 'C# (Mono 6.6)',    monaco: 'csharp',     ext: 'cs'  },
];

// ─── Status mapping ───────────────────────────────────────────────────────────
export const STATUS = {
  1:  { label: 'In Queue',          type: 'pending'  },
  2:  { label: 'Processing',        type: 'pending'  },
  3:  { label: 'Accepted',          type: 'accepted' },
  4:  { label: 'Wrong Answer',      type: 'wrong'    },
  5:  { label: 'Time Limit Exceeded', type: 'tle'    },
  6:  { label: 'Compilation Error', type: 'compile'  },
  7:  { label: 'Runtime Error (SIGSEGV)', type: 'runtime' },
  8:  { label: 'Runtime Error (SIGXFSZ)', type: 'runtime' },
  9:  { label: 'Runtime Error (SIGFPE)',  type: 'runtime' },
  10: { label: 'Runtime Error (SIGABRT)', type: 'runtime' },
  11: { label: 'Runtime Error (NZEC)',    type: 'runtime' },
  12: { label: 'Runtime Error (Other)',   type: 'runtime' },
  13: { label: 'Internal Error',   type: 'internal' },
  14: { label: 'Exec Format Error', type: 'runtime'  },
};

export function mapStatus(statusId) {
  return STATUS[statusId] || { label: `Status ${statusId}`, type: 'unknown' };
}

// ─── Encode / decode ──────────────────────────────────────────────────────────
const b64 = (str) => btoa(unescape(encodeURIComponent(str)));
const unb64 = (str) => {
  try { return str ? decodeURIComponent(escape(atob(str))) : ''; }
  catch { return str || ''; }
};

// ─── Single submission ────────────────────────────────────────────────────────
export async function submitCode({ code, languageId, stdin = '', cpuTimeLimit = 5 }) {
  const payload = {
    source_code:    b64(code),
    language_id:    languageId,
    stdin:          b64(stdin),
    cpu_time_limit: cpuTimeLimit,
    base64_encoded: true,
  };

  const res = await axios.post(
    `${BASE_URL}/submissions?base64_encoded=true&wait=false`,
    payload,
    { headers: HEADERS, timeout: 15000 }
  );
  return res.data.token;
}

// ─── Poll until done ──────────────────────────────────────────────────────────
const TERMINAL_STATUSES = new Set([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

export async function pollSubmission(token, { maxAttempts = 20, delayMs = 1000 } = {}) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, delayMs));
    const res = await axios.get(
      `${BASE_URL}/submissions/${token}?base64_encoded=true`,
      { headers: HEADERS, timeout: 10000 }
    );
    const sub = res.data;
    if (TERMINAL_STATUSES.has(sub.status?.id)) {
      return {
        statusId:    sub.status.id,
        status:      mapStatus(sub.status.id),
        stdout:      unb64(sub.stdout),
        stderr:      unb64(sub.stderr),
        compileOut:  unb64(sub.compile_output),
        time:        sub.time,
        memory:      sub.memory,
        token,
      };
    }
  }
  throw new Error('Polling timeout — submission took too long');
}

// ─── Execute (submit + poll) ──────────────────────────────────────────────────
export async function execute({ code, languageId, stdin = '', cpuTimeLimit = 5 }) {
  if (!code?.trim()) throw new Error('Code cannot be empty');
  if (!languageId)   throw new Error('No language selected');

  const token = await submitCode({ code, languageId, stdin, cpuTimeLimit });
  return pollSubmission(token);
}

// ─── Batch execute ────────────────────────────────────────────────────────────
export async function executeBatch(submissions) {
  // submissions: [{ code, languageId, stdin, expectedOutput, label, isEdge }]
  const results = await Promise.allSettled(
    submissions.map((s, i) =>
      execute({ code: s.code, languageId: s.languageId, stdin: s.stdin || '' })
        .then((r) => ({
          ...r,
          index:          i,
          label:          s.label || `Test ${i + 1}`,
          expectedOutput: s.expectedOutput?.trim() || '',
          isEdge:         s.isEdge || false,
        }))
        .catch((err) => ({
          index:          i,
          label:          s.label || `Test ${i + 1}`,
          expectedOutput: s.expectedOutput?.trim() || '',
          isEdge:         s.isEdge || false,
          statusId:       -1,
          status:         { label: err.message, type: 'error' },
          stdout:         '',
          stderr:         err.message,
          error:          true,
        }))
    )
  );

  return results.map((r) => (r.status === 'fulfilled' ? r.value : { ...r.reason, error: true }));
}

// ─── Compare output ───────────────────────────────────────────────────────────
export function compareOutput(actual, expected) {
  const norm = (s) => s?.trim().replace(/\r\n/g, '\n').replace(/\s+$/gm, '') || '';
  return norm(actual) === norm(expected);
}

// ─── Enrich results with pass/fail ───────────────────────────────────────────
export function enrichResults(results) {
  return results.map((r) => {
    const passed = r.statusId === 3 && compareOutput(r.stdout, r.expectedOutput);
    return { ...r, passed };
  });
}
