const axios = require('axios');

// Judge0 CE language IDs
const LANGUAGE_IDS = {
  python: 71,   // Python 3.8.1
  javascript: 63, // Node.js 12.14.0
  cpp: 54,      // C++ (GCC 9.2.0)
  java: 62,     // Java (OpenJDK 13.0.1)
  c: 50,        // C (GCC 9.2.0)
};

const JUDGE0_BASE = `https://${process.env.JUDGE0_HOST}`;

const headers = {
  'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
  'X-RapidAPI-Host': process.env.JUDGE0_HOST,
  'Content-Type': 'application/json',
};

/**
 * Submit code to Judge0 and wait for the result.
 * @param {string} code - Source code
 * @param {string} language - 'python' | 'javascript' | 'cpp' | 'java' | 'c'
 * @param {string} stdin - Input to the program
 * @param {string} expectedOutput - Expected output for comparison
 * @returns {Object} { accepted, output, time, memory, status }
 */
async function executeCode(code, language, stdin = '', expectedOutput = '') {
  const languageId = LANGUAGE_IDS[language] || LANGUAGE_IDS.python;

  try {
    // Step 1: Submit
    const submitRes = await axios.post(
      `${JUDGE0_BASE}/submissions?base64_encoded=false&wait=false`,
      {
        source_code: code,
        language_id: languageId,
        stdin,
        expected_output: expectedOutput,
        cpu_time_limit: 5,
        memory_limit: 256000,
      },
      { headers }
    );

    const token = submitRes.data.token;
    if (!token) throw new Error('No token received from Judge0');

    // Step 2: Poll for result (max 10 attempts × 1.5s = 15s timeout)
    let result = null;
    for (let i = 0; i < 10; i++) {
      await sleep(1500);
      const pollRes = await axios.get(
        `${JUDGE0_BASE}/submissions/${token}?base64_encoded=false`,
        { headers }
      );
      const data = pollRes.data;

      // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4+=Error
      if (data.status.id > 2) {
        result = data;
        break;
      }
    }

    if (!result) return { accepted: false, output: 'Execution timeout', status: 'TLE' };

    const accepted = result.status.id === 3;
    return {
      accepted,
      output: result.stdout || result.stderr || result.compile_output || '',
      time: result.time,
      memory: result.memory,
      status: result.status.description,
      statusId: result.status.id,
    };
  } catch (err) {
    console.error('Judge0 error:', err.message);

    // If Judge0 API key is not set, return a mock result for development
    if (!process.env.JUDGE0_API_KEY || process.env.JUDGE0_API_KEY === 'your_rapidapi_key_here') {
      return mockExecute(code, language, stdin, expectedOutput);
    }
    return { accepted: false, output: 'Execution service error', status: 'Error' };
  }
}

/**
 * Run code against multiple test cases and return pass/fail per case.
 * @param {string} code
 * @param {string} language
 * @param {Array<{input: string, output: string}>} testCases
 * @returns {{ passed: number, total: number, results: Array }}
 */
async function runTestCases(code, language, testCases) {
  const results = [];
  for (const tc of testCases) {
    const res = await executeCode(code, language, tc.input, tc.output.trim());
    results.push({
      input: tc.input,
      expectedOutput: tc.output,
      actualOutput: res.output,
      accepted: res.accepted,
      time: res.time,
      status: res.status,
    });
  }
  const passed = results.filter((r) => r.accepted).length;
  return { passed, total: testCases.length, results };
}

// ─── Mock Execution (when no Judge0 key) ─────────────────────────────────────
function mockExecute(code, language, stdin, expectedOutput) {
  console.warn('🔧 Using mock code execution (Judge0 key not set)');
  // Simple heuristic: if code length > 20 chars, randomly pass ~60% of the time
  const accepted = code.length > 20 && Math.random() > 0.4;
  return {
    accepted,
    output: accepted ? expectedOutput : 'Wrong answer',
    time: (Math.random() * 0.5 + 0.1).toFixed(3),
    memory: Math.floor(Math.random() * 5000 + 2000),
    status: accepted ? 'Accepted' : 'Wrong Answer',
    statusId: accepted ? 3 : 4,
    isMock: true,
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = { executeCode, runTestCases, LANGUAGE_IDS };
