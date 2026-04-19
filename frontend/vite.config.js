import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Fix: Firebase Auth signInWithPopup checks window.closed on the OAuth popup.
    // The default COOP 'same-origin' blocks this cross-origin call.
    // 'same-origin-allow-popups' allows popups while keeping security for the main page.
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },
})

