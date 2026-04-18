import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useGame } from './hooks/useGame';

import LandingPage      from './pages/LandingPage';
import LobbyPage        from './pages/LobbyPage';
import BattlePage       from './pages/BattlePage';
import ResultPage       from './pages/ResultPage';
import AdminPage        from './pages/AdminPage';
import AuthPage         from './pages/AuthPage';
import ProfilePage      from './pages/ProfilePage';
import LeaderboardPage  from './pages/LeaderboardPage';
import PracticePage     from './pages/PracticePage';
import ProtectedRoute   from './components/ProtectedRoute';

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
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px',
          },
          success: {
            style: { borderColor: 'rgba(0,230,118,0.3)' },
            iconTheme: { primary: '#00e676', secondary: 'var(--surface)' },
          },
          error: {
            style: { borderColor: 'rgba(255,23,68,0.3)' },
            iconTheme: { primary: '#ff1744', secondary: 'var(--surface)' },
          },
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/auth"  element={<AuthPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/practice"    element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />

        {/* Protected (requires verified Firebase account) */}
        <Route path="/" element={
          <ProtectedRoute><LandingPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
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
