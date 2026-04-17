import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtError = (code) => ({
  'auth/email-already-in-use':    'This email is already registered.',
  'auth/invalid-email':           'Please enter a valid email.',
  'auth/weak-password':           'Password must be at least 6 characters.',
  'auth/user-not-found':          'No account found with this email.',
  'auth/wrong-password':          'Incorrect password.',
  'auth/invalid-credential':      'Invalid email or password.',
  'auth/too-many-requests':       'Too many attempts. Please try later.',
  'auth/popup-closed-by-user':    'Sign-in popup was closed.',
  'auth/network-request-failed':  'Network error. Check your connection.',
}[code] || 'Something went wrong. Please try again.');

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['var(--accent)', 'var(--orange)', 'var(--bronze)', 'var(--green)'];
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[0,1,2,3].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colors[score-1] : 'var(--surface-3)' }} />
        ))}
      </div>
      <span className="text-xs font-mono" style={{ color: colors[score-1] || 'var(--text-dim)' }}>
        {labels[score-1] || 'Too short'}
      </span>
    </div>
  );
}

// ── Input Field ───────────────────────────────────────────────────────────────
function Field({ label, id, type='text', value, onChange, placeholder, autoFocus }) {
  const [show, setShow] = useState(false);
  const isPass = type === 'password';
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color:'var(--text-muted)' }}>{label}</label>
      <div className="relative">
        <input
          id={id} type={isPass ? (show ? 'text' : 'password') : type}
          value={value} onChange={onChange} placeholder={placeholder}
          autoFocus={autoFocus} autoComplete={isPass ? 'current-password' : 'off'}
          className="input-cyber w-full pr-9"
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color:'var(--text-dim)', background:'none', border:'none', cursor:'pointer' }}>
            {show ? '🙈' : '👁️'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Google Button ─────────────────────────────────────────────────────────────
function GoogleBtn({ onClick, loading }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
      style={{ background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text)' }}>
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9L37 9.7C33.5 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c11 0 19.5-8 19.5-19.5 0-1.3-.1-2.7-.4-4z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9L37 9.7C33.5 6.5 29 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"/>
        <path fill="#4CAF50" d="M24 43.5c4.9 0 9.4-1.9 12.8-5L31 33.9C29.1 35.2 26.7 36 24 36c-5.2 0-9.5-2.9-11.3-7.1l-6.6 5.1C9.6 39 16.3 43.5 24 43.5z"/>
        <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.5 5.9l5.8 4.6C40.1 35.3 43.5 30.1 43.5 24c0-1.3-.1-2.7-.4-4z"/>
      </svg>
      {loading ? 'Signing in...' : 'Continue with Google'}
    </button>
  );
}

// ── Email Verification Screen ─────────────────────────────────────────────────
function VerifyEmailScreen({ user, onResend, onLogout }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const handleResend = async () => {
    setSending(true);
    try { await onResend(); setSent(true); toast.success('Verification email sent!'); }
    catch { toast.error('Failed to resend. Try again.'); }
    finally { setSending(false); }
  };
  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      className="text-center">
      <div className="text-5xl mb-4">📧</div>
      <h2 className="text-xl font-bold mb-2" style={{ color:'var(--text)' }}>Verify your email</h2>
      <p className="text-sm mb-1" style={{ color:'var(--text-muted)' }}>
        We sent a verification link to:
      </p>
      <p className="text-sm font-mono font-bold mb-5" style={{ color:'var(--accent)' }}>{user?.email}</p>
      <p className="text-xs mb-6" style={{ color:'var(--text-dim)' }}>
        Click the link in the email, then refresh this page. Check your spam folder if you don't see it.
      </p>
      <div className="space-y-2">
        <button onClick={() => window.location.reload()} className="btn-primary w-full">
          ✅ I've verified — Continue
        </button>
        <button onClick={handleResend} disabled={sending || sent} className="btn-ghost w-full disabled:opacity-40">
          {sent ? '✓ Email resent!' : sending ? 'Sending...' : '📨 Resend verification email'}
        </button>
        <button onClick={onLogout} className="w-full text-xs mt-2 py-2" style={{ color:'var(--text-dim)', background:'none', border:'none', cursor:'pointer' }}>
          ← Use a different account
        </button>
      </div>
    </motion.div>
  );
}

// ── Forgot Password Screen ────────────────────────────────────────────────────
function ForgotPasswordScreen({ onReset, onBack }) {
  const [email, setEmail] = useState('');
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email address.');
    setLoading(true);
    try {
      await onReset(email);
      setSent(true);
      toast.success('Reset email sent!');
    } catch (err) {
      toast.error(fmtError(err.code));
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="text-center">
      <div className="text-5xl mb-4">🔑</div>
      <h2 className="text-xl font-bold mb-2" style={{ color:'var(--text)' }}>Check your email</h2>
      <p className="text-sm mb-5" style={{ color:'var(--text-muted)' }}>
        Password reset link sent to <strong style={{ color:'var(--accent)' }}>{email}</strong>
      </p>
      <button onClick={onBack} className="btn-primary w-full">← Back to Sign In</button>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
      <button onClick={onBack} className="flex items-center gap-1 text-xs mb-5 transition-colors"
        style={{ color:'var(--text-dim)', background:'none', border:'none', cursor:'pointer' }}>
        ← Back to sign in
      </button>
      <h2 className="text-xl font-bold mb-1" style={{ color:'var(--text)' }}>Reset password</h2>
      <p className="text-xs mb-5" style={{ color:'var(--text-dim)' }}>
        Enter your email and we'll send a reset link.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email address" id="reset-email" type="email" value={email}
          onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoFocus />
        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? '⏳ Sending...' : '📨 Send reset email'}
        </button>
      </form>
    </motion.div>
  );
}

// ── Main AuthPage ─────────────────────────────────────────────────────────────
export default function AuthPage() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, signUp, signIn, logout, resendVerification, resetPassword } = useAuth();

  const [tab, setTab]           = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);

  // Form fields
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');

  // If user is logged in and email verified → go to landing
  if (user?.emailVerified) {
    navigate('/', { replace: true });
    return null;
  }

  // If user logged in but email NOT verified → show verify screen
  if (user && !user.emailVerified) {
    return (
      <AuthShell>
        <VerifyEmailScreen user={user} onResend={resendVerification} onLogout={logout} />
      </AuthShell>
    );
  }

  const handleGoogle = async () => {
    setGLoading(true);
    try {
      const cred = await signInWithGoogle();
      // Google accounts are always verified — go straight in
      if (cred.user) navigate('/', { replace: true });
    } catch (err) {
      toast.error(fmtError(err.code));
    } finally {
      setGLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name.trim())           return toast.error('Enter your display name.');
    if (!email)                 return toast.error('Enter your email.');
    if (password.length < 6)    return toast.error('Password must be at least 6 characters.');
    if (password !== confirm)   return toast.error('Passwords do not match.');
    setLoading(true);
    try {
      await signUp(email, password, name.trim());
      toast.success('Account created! Please verify your email.');
      // Will redirect to verify screen via auth state change
    } catch (err) {
      toast.error(fmtError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Fill in all fields.');
    setLoading(true);
    try {
      const cred = await signIn(email, password);
      if (!cred.user.emailVerified) {
        toast('Please verify your email first.', { icon:'📧' });
        // stays on verify screen
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      toast.error(fmtError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t) => {
    setTab(t); setName(''); setEmail(''); setPassword(''); setConfirm('');
  };

  return (
    <AuthShell>
      <AnimatePresence mode="wait">
        {tab === 'forgot' ? (
          <ForgotPasswordScreen key="forgot" onReset={resetPassword} onBack={() => switchTab('signin')} />
        ) : (
          <motion.div key={tab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-8 }} transition={{ duration:0.2 }}>

            {/* ── Header ── */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold" style={{ color:'var(--text)' }}>
                {tab === 'signin' ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-xs mt-1" style={{ color:'var(--text-dim)' }}>
                {tab === 'signin'
                  ? 'Sign in to access CodeArena'
                  : 'Join the arena and start competing'}
              </p>
            </div>

            {/* ── Google OAuth ── */}
            <GoogleBtn onClick={handleGoogle} loading={gLoading} />

            {/* ── Divider ── */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background:'var(--border)' }} />
              <span className="text-xs" style={{ color:'var(--text-dim)' }}>or with email</span>
              <div className="flex-1 h-px" style={{ background:'var(--border)' }} />
            </div>

            {/* ── Form ── */}
            <form onSubmit={tab === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
              {tab === 'signup' && (
                <Field label="Display Name" id="name" value={name}
                  onChange={e => setName(e.target.value)} placeholder="Your arena name" autoFocus />
              )}
              <Field label="Email address" id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                autoFocus={tab === 'signin'} />
              <div>
                <Field label="Password" id="password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                {tab === 'signup' && <PasswordStrength password={password} />}
              </div>
              {tab === 'signup' && (
                <Field label="Confirm Password" id="confirm" type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
              )}

              {tab === 'signin' && (
                <div className="text-right">
                  <button type="button" onClick={() => setTab('forgot')}
                    className="text-xs transition-colors"
                    style={{ color:'var(--accent)', background:'none', border:'none', cursor:'pointer' }}>
                    Forgot password?
                  </button>
                </div>
              )}

              <button type="submit" disabled={loading || gLoading}
                className="btn-primary w-full py-3 text-sm disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      style={{ animation:'spin 0.8s linear infinite' }} />
                    {tab === 'signin' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : tab === 'signin' ? '⚡ Sign In' : '🚀 Create Account'}
              </button>
            </form>

            {/* ── Switch tab ── */}
            <p className="text-center text-xs mt-5" style={{ color:'var(--text-dim)' }}>
              {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => switchTab(tab === 'signin' ? 'signup' : 'signin')}
                className="font-semibold transition-colors"
                style={{ color:'var(--accent)', background:'none', border:'none', cursor:'pointer' }}>
                {tab === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>

          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}

// ── Shell (centered card layout) ─────────────────────────────────────────────
function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background:'var(--bg)' }}>
      {/* Top bar */}
      <div className="flex items-center px-6 shrink-0"
        style={{ height:52, borderBottom:'1px solid var(--border)', background:'var(--bg-2)' }}>
        <span className="text-sm font-bold" style={{ color:'var(--text)' }}>
          Code<span style={{ color:'var(--accent)' }}>Arena</span>
        </span>
        <span className="ml-3 badge-pink text-xs">Beta</span>
      </div>

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div initial={{ opacity:0, scale:0.98 }} animate={{ opacity:1, scale:1 }}
          transition={{ duration:0.25 }}
          className="w-full max-w-sm">
          {/* Glow accent */}
          <div className="relative">
            <div className="absolute -inset-px rounded-2xl pointer-events-none"
              style={{ background:'linear-gradient(135deg,rgba(239,68,68,0.15),rgba(249,115,22,0.05))', filter:'blur(1px)' }} />
            <div className="relative rounded-2xl p-7 sm:p-8"
              style={{ background:'var(--surface)', border:'1px solid var(--border)' }}>
              {children}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs mt-4" style={{ color:'var(--text-dim)' }}>
            Real-Time Multiplayer Coding Battles
          </p>
        </motion.div>
      </div>
    </div>
  );
}
