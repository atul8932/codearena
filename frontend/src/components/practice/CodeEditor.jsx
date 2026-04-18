import { useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { JUDGE0_LANGUAGES } from '../../services/judge0';

const MONACO_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment',   foreground: '4a5568', fontStyle: 'italic' },
    { token: 'keyword',   foreground: '00e676', fontStyle: 'bold' },
    { token: 'string',    foreground: 'ffd740' },
    { token: 'number',    foreground: 'ff6b9d' },
    { token: 'type',      foreground: '40c4ff' },
    { token: 'function',  foreground: 'e040fb' },
  ],
  colors: {
    'editor.background':          '#0a0f0a',
    'editor.foreground':          '#e8f5e9',
    'editorLineNumber.foreground': '#2a4a2a',
    'editorLineNumber.activeForeground': '#00e676',
    'editor.lineHighlightBackground': '#152015',
    'editorCursor.foreground':    '#00e676',
    'editor.selectionBackground': 'rgba(0,230,118,0.2)',
    'editorGutter.background':    '#0a0f0a',
    'editorWidget.background':    '#111811',
    'editorSuggestWidget.background': '#111811',
    'editorSuggestWidget.border': '#1a3a1a',
    'editorSuggestWidget.selectedBackground': '#1a3a1a',
  },
};

const DEFAULT_CODE = {
  71: '# Python 3\ndef solution():\n    pass\n\nif __name__ == "__main__":\n    solution()\n',
  63: '// JavaScript\nconst readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\nrl.on("line", l => lines.push(l.trim()));\nrl.on("close", () => {\n    // your code here\n    console.log("Hello, World!");\n});\n',
  54: '// C++\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your code here\n    return 0;\n}\n',
  62: '// Java\nimport java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        Scanner sc = new Scanner(System.in);\n        // your code here\n    }\n}\n',
  50: '// C\n#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}\n',
  60: '// Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    // your code here\n    fmt.Println("Hello, World!")\n}\n',
  73: '// Rust\nuse std::io::{self, BufRead};\n\nfn main() {\n    let stdin = io::stdin();\n    for line in stdin.lock().lines() {\n        let _line = line.unwrap();\n        // your code here\n    }\n}\n',
};

export default function CodeEditor({
  code,
  onChange,
  languageId,
  onLanguageChange,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  errors = [],
  disabled = false,
}) {
  const editorRef = useRef(null);
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(false);

  const lang = JUDGE0_LANGUAGES.find((l) => l.id === languageId) || JUDGE0_LANGUAGES[0];

  function handleMount(editor, monaco) {
    editorRef.current = editor;
    monaco.editor.defineTheme('codearena', MONACO_THEME);
    monaco.editor.setTheme('codearena');
    // Decorate error lines
    errors.forEach((line) => {
      editor.deltaDecorations([], [{
        range: new monaco.Range(line, 1, line, 1),
        options: { isWholeLine: true, className: 'error-line' },
      }]);
    });
  }

  function handleLanguageChange(e) {
    const newId = Number(e.target.value);
    onLanguageChange(newId);
    if (!code?.trim() || code === DEFAULT_CODE[languageId]) {
      onChange(DEFAULT_CODE[newId] || '');
    }
  }

  const Spinner = () => (
    <span className="inline-block w-3 h-3 border-2 rounded-full mr-1.5"
      style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000', animation: 'spin 0.8s linear infinite' }} />
  );

  return (
    <div className="flex flex-col h-full" style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0 flex-wrap"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>

        {/* Language selector */}
        <select
          value={languageId}
          onChange={handleLanguageChange}
          disabled={disabled}
          className="text-xs px-2 py-1.5 rounded-lg outline-none font-mono"
          style={{
            background: 'var(--bg)', color: 'var(--accent)',
            border: '1px solid var(--border)', cursor: 'pointer',
          }}>
          {JUDGE0_LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>

        {/* Font size */}
        <div className="flex items-center gap-1">
          <button onClick={() => setFontSize(s => Math.max(10, s - 1))}
            className="w-6 h-6 rounded text-xs flex items-center justify-center"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            A-
          </button>
          <span className="text-xs font-mono w-6 text-center" style={{ color: 'var(--text-dim)' }}>{fontSize}</span>
          <button onClick={() => setFontSize(s => Math.min(24, s + 1))}
            className="w-6 h-6 rounded text-xs flex items-center justify-center"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            A+
          </button>
        </div>

        {/* Word wrap */}
        <button onClick={() => setWordWrap(w => !w)}
          className="text-xs px-2 py-1 rounded"
          style={{
            background: wordWrap ? 'rgba(0,230,118,0.12)' : 'var(--bg)',
            border: `1px solid ${wordWrap ? 'rgba(0,230,118,0.3)' : 'var(--border)'}`,
            color: wordWrap ? 'var(--accent)' : 'var(--text-dim)',
          }}>
          ↵ Wrap
        </button>

        {/* Reset */}
        <button
          onClick={() => onChange(DEFAULT_CODE[languageId] || '')}
          className="text-xs px-2 py-1 rounded"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          ↺ Reset
        </button>

        <div className="flex-1" />

        {/* Run */}
        <button onClick={onRun} disabled={isRunning || isSubmitting || disabled}
          className="text-xs px-4 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-40"
          style={{ background: 'rgba(64,196,255,0.12)', border: '1px solid rgba(64,196,255,0.3)', color: '#40c4ff' }}>
          {isRunning ? <><Spinner />Running…</> : '▶ Run'}
        </button>

        {/* Submit */}
        <button onClick={onSubmit} disabled={isRunning || isSubmitting || disabled}
          className="text-xs px-4 py-1.5 rounded-lg font-bold transition-all disabled:opacity-40"
          style={{ background: isSubmitting ? 'rgba(0,230,118,0.3)' : 'var(--accent)', color: '#000' }}>
          {isSubmitting ? <><Spinner />Submitting…</> : '⚡ Submit'}
        </button>
      </div>

      {/* ── Monaco Editor ── */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language={lang.monaco}
          value={code}
          onChange={(v) => onChange(v || '')}
          onMount={handleMount}
          options={{
            fontSize,
            wordWrap:          wordWrap ? 'on' : 'off',
            minimap:           { enabled: false },
            lineNumbers:       'on',
            scrollBeyondLastLine: false,
            automaticLayout:   true,
            tabSize:           4,
            insertSpaces:      true,
            suggestOnTriggerCharacters: true,
            quickSuggestions:  true,
            padding:           { top: 12, bottom: 12 },
            smoothScrolling:   true,
            cursorSmoothCaretAnimation: 'on',
            readOnly:          disabled,
            renderLineHighlight: 'all',
            scrollbar: { vertical: 'auto', horizontal: 'auto' },
          }}
        />
      </div>

      {/* ── Custom Input ── */}
      <div className="shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <details className="group">
          <summary className="px-3 py-2 text-xs cursor-pointer select-none flex items-center gap-2"
            style={{ color: 'var(--text-dim)', listStyle: 'none' }}>
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            Custom stdin (optional)
          </summary>
          <textarea
            placeholder="Enter custom input here…"
            rows={3}
            className="w-full px-3 py-2 text-xs font-mono resize-none outline-none"
            style={{ background: 'var(--bg)', color: 'var(--text)', border: 'none' }}
            id="custom-stdin"
          />
        </details>
      </div>
    </div>
  );
}

export { DEFAULT_CODE };
