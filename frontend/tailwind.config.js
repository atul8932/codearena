/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'dark-bg':      '#111111',
        'dark-card':    '#202020',
        'dark-surface': '#272727',
        'dark-border':  'rgba(255,255,255,0.07)',
        'neon-blue':    '#60a5fa',
        'neon-purple':  '#a78bfa',
        'neon-pink':    '#ef4444',
        'neon-green':   '#22c55e',
        'neon-amber':   '#F5A623',
        'neon-orange':  '#f97316',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        cyber:   ['"JetBrains Mono"', 'monospace'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-blue':   '0 0 12px rgba(96,165,250,0.2)',
        'neon-purple': '0 0 12px rgba(167,139,250,0.2)',
        'neon-pink':   '0 0 12px rgba(239,68,68,0.25)',
        'neon-green':  '0 0 12px rgba(34,197,94,0.2)',
        'glow-sm':     '0 0 6px rgba(239,68,68,0.2)',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
      },
    },
  },
  plugins: [],
};
