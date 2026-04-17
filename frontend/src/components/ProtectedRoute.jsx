import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps any route to require a verified Firebase user.
 * - Not logged in → redirect to /auth
 * - Logged in, unverified → still redirect to /auth (shows verify screen there)
 * - Logged in + verified → render children
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background:'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 rounded-full border-white/10 border-t-red-500"
            style={{ animation:'spin 0.8s linear infinite' }} />
          <span className="text-xs font-mono" style={{ color:'var(--text-dim)' }}>Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!user || !user.emailVerified) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
