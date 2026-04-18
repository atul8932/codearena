/**
 * EdgeCaseEngine.js
 * Generates, categorizes, and explains edge cases for coding problems.
 * Pure logic — no React, no API calls.
 */

// ─── Problem type detector ────────────────────────────────────────────────────
export function detectProblemType(problem) {
  const text = `${problem.title} ${problem.description}`.toLowerCase();
  const types = [];
  if (/array|list|subarray|sequence|element/i.test(text))   types.push('array');
  if (/string|character|substr|palindrome|anagram/i.test(text)) types.push('string');
  if (/tree|node|root|leaf|bst|binary/i.test(text))         types.push('tree');
  if (/graph|edge|vertex|path|cycle|connected/i.test(text)) types.push('graph');
  if (/number|integer|sum|product|prime|digit/i.test(text)) types.push('number');
  if (/matrix|grid|row|column|cell/i.test(text))            types.push('matrix');
  if (/sort|order|rank|ascending|descending/i.test(text))   types.push('sort');
  if (/hash|map|set|dict/i.test(text))                      types.push('hash');
  return types.length ? types : ['general'];
}

// ─── Edge case templates by type ─────────────────────────────────────────────
const ARRAY_EDGE_CASES = [
  {
    label:    'Empty Array',
    category: 'boundary',
    severity: 'high',
    description: 'An empty array [].',
    hint: 'Your code may not handle n=0. Add a length check.',
  },
  {
    label:    'Single Element',
    category: 'boundary',
    severity: 'high',
    description: 'Array with one element.',
    hint: 'Loops with two-pointer or index arithmetic can fail for n=1.',
  },
  {
    label:    'All Same Values',
    category: 'duplicate',
    severity: 'medium',
    description: 'All elements identical (e.g. [5,5,5,5]).',
    hint: 'Duplicate-sensitive algorithms may compute wrong uniqueness counts.',
  },
  {
    label:    'Already Sorted',
    category: 'boundary',
    severity: 'medium',
    description: 'Array already in ascending order.',
    hint: 'Some sort-based algorithms become O(n²) on sorted input.',
  },
  {
    label:    'Reverse Sorted',
    category: 'boundary',
    severity: 'medium',
    description: 'Array in descending order.',
    hint: 'Worst case for naive sorting; check for off-by-one in comparisons.',
  },
  {
    label:    'Negative Values',
    category: 'negative',
    severity: 'high',
    description: 'Array contains negative numbers.',
    hint: 'Greedy/DP logic that assumes positives may break with negatives.',
  },
  {
    label:    'Large Array (n=10^5)',
    category: 'performance',
    severity: 'high',
    description: 'Very large input to test O(n log n) vs O(n²).',
    hint: 'O(n²) solution will TLE. Use efficient data structures.',
  },
  {
    label:    'Mixed Positive & Negative',
    category: 'negative',
    severity: 'medium',
    description: 'Array has both positive and negative numbers.',
    hint: 'Check sum/product overflow and sign-change logic.',
  },
  {
    label:    'INT_MAX / INT_MIN',
    category: 'overflow',
    severity: 'high',
    description: 'Values at 32-bit integer boundaries.',
    hint: 'Integer overflow in C/Java; Python is safe. Check intermediate products.',
  },
  {
    label:    'Two Elements',
    category: 'boundary',
    severity: 'medium',
    description: 'Array with exactly two elements.',
    hint: 'Algorithms split arrays in half — check base case.',
  },
];

const STRING_EDGE_CASES = [
  {
    label:    'Empty String',
    category: 'boundary',
    severity: 'high',
    description: 'Empty string "".',
    hint: 'Indexing into empty string causes IndexError/SIGSEGV.',
  },
  {
    label:    'Single Character',
    category: 'boundary',
    severity: 'high',
    description: 'String of length 1.',
    hint: 'Palindrome, anagram checks may break at length 1.',
  },
  {
    label:    'All Same Characters',
    category: 'duplicate',
    severity: 'medium',
    description: 'e.g. "aaaaa".',
    hint: 'Uniqueness / frequency-based logic may return wrong counts.',
  },
  {
    label:    'Special Characters',
    category: 'special',
    severity: 'medium',
    description: 'Includes !@#$%^&*()',
    hint: 'Character classification functions may not handle non-alphanumeric.',
  },
  {
    label:    'Whitespace Only',
    category: 'special',
    severity: 'medium',
    description: 'String of spaces "   ".',
    hint: 'trim() / strip() before comparison if whitespace is not significant.',
  },
  {
    label:    'Unicode / Emoji',
    category: 'special',
    severity: 'low',
    description: 'String contains multibyte Unicode.',
    hint: 'len() in Python gives character count; for Java/JS use .length carefully.',
  },
  {
    label:    'Long String (n=10^5)',
    category: 'performance',
    severity: 'high',
    description: 'Very long string for performance.',
    hint: 'O(n²) string concatenation in loops causes TLE. Use StringBuilder.',
  },
];

const NUMBER_EDGE_CASES = [
  { label: 'Zero Input',       category: 'boundary', severity: 'high',   description: 'n = 0.',              hint: 'Division by zero or loop not executing.' },
  { label: 'Negative Input',   category: 'negative', severity: 'high',   description: 'n < 0.',              hint: 'Check sign before math operations.' },
  { label: 'One',              category: 'boundary', severity: 'medium', description: 'n = 1.',              hint: 'Prime check, factorial, fibonacci — special at 1.' },
  { label: 'INT_MAX',          category: 'overflow',  severity: 'high',   description: `n = ${2**31 - 1}.`,  hint: 'Adding 1 overflows 32-bit signed int.' },
  { label: 'Large Prime',      category: 'performance', severity: 'medium', description: 'Large prime number.', hint: 'O(√n) primality check needed.' },
  { label: 'Floating Point',   category: 'precision', severity: 'medium', description: 'Fractional values.',  hint: 'Float comparison with == is unsafe; use epsilon.' },
];

const GENERAL_EDGE_CASES = [
  { label: 'Null / None Input', category: 'boundary', severity: 'high', description: 'No input provided.',   hint: 'Always validate input before processing.' },
  { label: 'Minimum Constraint', category: 'boundary', severity: 'high', description: 'Smallest allowed value.', hint: 'Off-by-one errors common at boundaries.' },
  { label: 'Maximum Constraint', category: 'performance', severity: 'high', description: 'Largest allowed value.', hint: 'Check time complexity — may TLE at max.' },
];

// ─── Main: generate edge cases for a problem ─────────────────────────────────
export function generateEdgeCases(problem) {
  const types = detectProblemType(problem);
  const cases = [];

  if (types.includes('array'))  cases.push(...ARRAY_EDGE_CASES);
  if (types.includes('string')) cases.push(...STRING_EDGE_CASES);
  if (types.includes('number')) cases.push(...NUMBER_EDGE_CASES);
  if (types.includes('general')) cases.push(...GENERAL_EDGE_CASES);

  // De-duplicate by label
  const seen = new Set();
  const unique = cases.filter((c) => {
    if (seen.has(c.label)) return false;
    seen.add(c.label);
    return true;
  });

  // Blend with any problem-defined edge cases
  const defined = problem.edgeCases || [];

  return [
    ...defined,
    ...unique.map((c, i) => ({
      id:          `auto_${i}`,
      label:       c.label,
      category:    c.category,
      severity:    c.severity,
      description: c.description,
      hint:        c.hint,
      stdin:       c.stdin || '',
      expectedOutput: c.expectedOutput || '',
      isAuto:      true,
    })),
  ];
}

// ─── Failure analyzer ────────────────────────────────────────────────────────
export function analyzeFailure(result) {
  const { statusId, stdout, stderr, compileOut, expectedOutput, label } = result;

  if (statusId === 6) {
    return {
      type:    'compilation',
      title:   'Compilation Error',
      message: compileOut || stderr || 'Code failed to compile.',
      fixes: [
        'Check for missing semicolons or brackets.',
        'Verify variable declarations and types.',
        'Ensure function signatures match the problem template.',
      ],
    };
  }

  if (statusId === 5) {
    return {
      type:    'tle',
      title:   'Time Limit Exceeded',
      message: `Your solution exceeded the time limit on "${label}".`,
      fixes: [
        'Check for nested loops — consider O(n log n) or O(n) solutions.',
        'Avoid recursion without memoization (DP approach recommended).',
        'Use hash maps / sets for O(1) lookups instead of linear search.',
        'Consider sorting + binary search instead of brute force.',
      ],
    };
  }

  if ([7, 8, 9, 10, 11, 12].includes(statusId)) {
    const isNull = /null|none|nullptr|NullPointerException/i.test(stderr);
    const isIndex = /index.*out|IndexError|ArrayIndex/i.test(stderr);
    const isStack = /stack overflow|RecursionError|maximum recursion/i.test(stderr);

    return {
      type:    'runtime',
      title:   'Runtime Error',
      message: stderr || 'An error occurred during execution.',
      fixes: [
        isNull  ? 'Check for null/None values before dereferencing.' : null,
        isIndex ? 'Verify array index bounds — use len(arr)-1 as max index.' : null,
        isStack ? 'Your recursion depth is too deep. Consider iterative approach.' : null,
        'Add input validation at the start of your function.',
        'Test with the boundary input shown in the edge case.',
      ].filter(Boolean),
    };
  }

  if (statusId === 4) {
    const actualTrim   = stdout?.trim() || '(no output)';
    const expectedTrim = expectedOutput?.trim() || '(empty)';
    return {
      type:    'wrong',
      title:   'Wrong Answer',
      message: `Expected "${expectedTrim}" but got "${actualTrim}".`,
      fixes: [
        'Add print statements to trace intermediate values.',
        'Check your algorithm logic for off-by-one errors.',
        'Verify you handle the specific edge case: ' + (result.label || 'this input'),
        'Check output formatting — trailing newlines / spaces matter.',
      ],
    };
  }

  return null;
}

// ─── Collect all failed analyses ─────────────────────────────────────────────
export function analyzeAllFailures(results) {
  return results
    .filter((r) => !r.passed)
    .map((r) => ({ ...analyzeFailure(r), testLabel: r.label, isEdge: r.isEdge }))
    .filter(Boolean);
}

// ─── Suggest edge cases when code passes all samples but may fail ────────────
export function suggestEdgeCasesToCheck(problem, language) {
  const types = detectProblemType(problem);
  const suggestions = [];

  if (types.includes('array')) {
    suggestions.push(
      { label: 'Try empty input []', example: '0\n' },
      { label: 'Try all negatives [-1,-2,-3]', example: '3\n-1 -2 -3\n' },
      { label: 'Try very large array (n=100000)', example: 'Generate a large array manually' },
    );
  }
  if (types.includes('string')) {
    suggestions.push(
      { label: 'Try empty string ""', example: '""' },
      { label: 'Try single character "a"', example: 'a' },
      { label: 'Try string with spaces "a b c"', example: 'a b c' },
    );
  }
  if (types.includes('number')) {
    suggestions.push(
      { label: 'Try n = 0', example: '0' },
      { label: 'Try n = -1', example: '-1' },
      { label: `Try n = ${2**31 - 1} (INT_MAX)`, example: `${2**31 - 1}` },
    );
  }

  return suggestions;
}

// ─── Severity color helper ────────────────────────────────────────────────────
export const SEVERITY_COLORS = {
  high:   { color: '#ff1744', bg: 'rgba(255,23,68,0.1)',   border: 'rgba(255,23,68,0.2)'   },
  medium: { color: '#ffd740', bg: 'rgba(255,215,64,0.1)',  border: 'rgba(255,215,64,0.2)'  },
  low:    { color: '#40c4ff', bg: 'rgba(64,196,255,0.1)',  border: 'rgba(64,196,255,0.2)'  },
};

export const CATEGORY_ICONS = {
  boundary:    '⚡',
  negative:    '➖',
  overflow:    '💥',
  duplicate:   '🔄',
  performance: '⏱',
  special:     '🔣',
  precision:   '🎯',
};
