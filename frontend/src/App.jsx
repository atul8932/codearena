import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useGame } from './hooks/useGame';

import LandingPage    from './pages/LandingPage';
import LobbyPage      from './pages/LobbyPage';
import BattlePage     from './pages/BattlePage';
import ResultPage     from './pages/ResultPage';
import AdminPage      from './pages/AdminPage';
import AuthPage       from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';

function AppInner() {
  useGame();

  return (
    <>
      <Toaster
        position="top-right"
        containerClassName="toaster-container"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#e5e7eb',
            border: '1px solid rgba(255,255,255,0.07)',
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px',
          },
          success: {
            style: { borderColor: 'rgba(34,197,94,0.3)' },
            iconTheme: { primary: '#22c55e', secondary: '#1a1a1a' },
          },
          error: {
            style: { borderColor: 'rgba(239,68,68,0.3)' },
            iconTheme: { primary: '#ef4444', secondary: '#1a1a1a' },
          },
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/auth"  element={<AuthPage />} />
        <Route path="/admin" element={<AdminPage />} />

        {/* Protected (requires verified Firebase account) */}
        <Route path="/" element={
          <ProtectedRoute><LandingPage /></ProtectedRoute>
        } />
        <Route path="/lobby/:roomId" element={
          <ProtectedRoute><LobbyPage /></ProtectedRoute>
        } />
        <Route path="/battle/:roomId" element={
          <ProtectedRoute><BattlePage /></ProtectedRoute>
        } />
        <Route path="/result/:roomId" element={
          <ProtectedRoute><ResultPage /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
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
