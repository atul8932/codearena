import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useGame } from './hooks/useGame';

import LandingPage  from './pages/LandingPage';
import LobbyPage    from './pages/LobbyPage';
import BattlePage   from './pages/BattlePage';
import ResultPage   from './pages/ResultPage';
import AdminPage    from './pages/AdminPage';

/**
 * Inner component so useGame can use React Router's useNavigate hook.
 */
function AppInner() {
  useGame(); // Mount socket event listeners for the entire app lifetime

  return (
    <>
      {/* Cyberpunk-themed toast notifications */}
      <Toaster
        position="top-right"
        containerClassName="toaster-container"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0d0d1a',
            color: '#e2e8f0',
            border: '1px solid rgba(0, 245, 255, 0.2)',
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: '13px',
            backdropFilter: 'blur(8px)',
          },
          success: {
            style: { borderColor: 'rgba(57, 255, 20, 0.3)' },
            iconTheme: { primary: '#39ff14', secondary: '#0d0d1a' },
          },
          error: {
            style: { borderColor: 'rgba(255, 32, 110, 0.3)' },
            iconTheme: { primary: '#ff206e', secondary: '#0d0d1a' },
          },
        }}
      />

      <Routes>
        <Route path="/"              element={<LandingPage />} />
        <Route path="/lobby/:roomId" element={<LobbyPage />} />
        <Route path="/battle/:roomId" element={<BattlePage />} />
        <Route path="/result/:roomId" element={<ResultPage />} />
        <Route path="/admin"         element={<AdminPage />} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
