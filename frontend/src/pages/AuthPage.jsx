import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';


const fmtError = (code) => ({
  'auth/email-already-in-use':   'This email is already registered.',
  'auth/invalid-email':          'Please enter a valid email.',
  'auth/weak-password':          'Password must be at least 6 characters.',
  'auth/user-not-found':         'No account found with this email.',
  'auth/wrong-password':         'Incorrect password.',
  'auth/invalid-credential':     'Invalid email or password.',
  'auth/too-many-requests':      'Too many attempts. Try again later.',
  'auth/popup-closed-by-user':   'Sign-in was cancelled.',
  'auth/network-request-failed': 'Network error. Check your connection.',
}[code] || 'Something went wrong. Please try again.');

// ── Animated background particles ────────────────────────────────────────────
function Particles() {
  const pts = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    dur: Math.random() * 8 + 6,
    delay: Math.random() * 4,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pts.map(p => (
        <motion.div key={p.id}
          className="absolute rounded-full"
          style={{ left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size, background:'rgba(0,230,118,0.2)' }}
          animate={{ y:[-20,20,-20], opacity:[0.2,0.6,0.2] }}
          transition={{ duration:p.dur, delay:p.delay, repeat:Infinity, ease:'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── Password strength ─────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const cfg = [null,
    { label:'Weak',   color:'#ef4444' },
    { label:'Fair',   color:'#f97316' },
    { label:'Good',   color:'#eab308' },
    { label:'Strong', color:'#22c55e' },
  ][score];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? cfg?.color : 'rgba(255,255,255,0.06)' }} />
        ))}
      </div>
      {cfg && <p className="text-xs font-mono" style={{ color: cfg.color }}>{cfg.label}</p>}
    </div>
  );
}

// ── Floating input ────────────────────────────────────────────────────────────
function FloatInput({ label, id, type='text', value, onChange, placeholder, autoFocus }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPass = type === 'password';
  return (
    <div className="relative">
      <label htmlFor={id} className="block text-xs font-semibold mb-1.5 tracking-wide"
        style={{ color: focused ? 'var(--accent)' : 'var(--text-dim)' }}>
        {label}
      </label>
      <div className="relative">
        <input id={id} type={isPass && !show ? 'password' : type === 'password' ? 'text' : type}
          value={value} onChange={onChange} placeholder={placeholder} autoFocus={autoFocus}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 pr-10"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${focused ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
            color: 'var(--text)',
            boxShadow: focused ? '0 0 0 3px rgba(239,68,68,0.08)' : 'none',
          }} />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-50 hover:opacity-100 transition-opacity"
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)' }}>
            {show ? '🙈' : '👁️'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Google button ─────────────────────────────────────────────────────────────
function GoogleBtn({ onClick, disabled }) {
  return (
    <motion.button type="button" onClick={onClick} disabled={disabled}
      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
      style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--text)' }}>
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9L37 9.7C33.5 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c11 0 19.5-8 19.5-19.5 0-1.3-.1-2.7-.4-4z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9L37 9.7C33.5 6.5 29 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"/>
        <path fill="#4CAF50" d="M24 43.5c4.9 0 9.4-1.9 12.8-5L31 33.9C29.1 35.2 26.7 36 24 36c-5.2 0-9.5-2.9-11.3-7.1l-6.6 5.1C9.6 39 16.3 43.5 24 43.5z"/>
        <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.5 5.9l5.8 4.6C40.1 35.3 43.5 30.1 43.5 24c0-1.3-.1-2.7-.4-4z"/>
      </svg>
      Continue with Google
    </motion.button>
  );
}

// ── Verify Email screen ───────────────────────────────────────────────────────
function VerifyEmailScreen({ user, onResend, onLogout }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    try { await onResend(); setSent(true); toast.success('Verification email sent!'); }
    catch { toast.error('Failed to resend.'); }
    finally { setLoading(false); }
  };
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-3xl"
        style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)' }}>📧</div>
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color:'var(--text)' }}>Check your inbox</h2>
        <p className="text-sm" style={{ color:'var(--text-dim)' }}>We sent a verification link to</p>
        <p className="text-sm font-bold mt-1" style={{ color:'var(--accent)' }}>{user?.email}</p>
      </div>
      <div className="p-3 rounded-xl text-xs" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', color:'var(--text-dim)' }}>
        Click the link in the email, then come back and refresh.
      </div>
      <div className="space-y-2 pt-1">
        <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
          onClick={() => window.location.reload()}
          className="w-full py-3 rounded-xl text-sm font-semibold"
          style={{ background:'var(--accent)', color:'#fff' }}>
          ✅ I've verified — Continue
        </motion.button>
        <button onClick={handle} disabled={loading || sent}
          className="w-full py-2.5 rounded-xl text-sm transition-all disabled:opacity-40"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--text-muted)' }}>
          {sent ? '✓ Sent!' : loading ? 'Sending...' : '📨 Resend email'}
        </button>
        <button onClick={onLogout} className="text-xs w-full pt-1" style={{ color:'var(--text-dim)', background:'none', border:'none', cursor:'pointer' }}>
          ← Use a different account
        </button>
      </div>
    </motion.div>
  );
}

// ── Forgot Password screen ────────────────────────────────────────────────────
function ForgotScreen({ onReset, onBack }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const handle = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email address.');
    setLoading(true);
    try { await onReset(email); setSent(true); toast.success('Reset email sent!'); }
    catch (err) { toast.error(fmtError(err.code)); }
    finally { setLoading(false); }
  };
  if (sent) return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-3xl"
        style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)' }}>🔑</div>
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color:'var(--text)' }}>Email sent!</h2>
        <p className="text-sm" style={{ color:'var(--text-dim)' }}>Check <span style={{ color:'var(--accent)' }}>{email}</span> for the reset link.</p>
      </div>
      <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }} onClick={onBack}
        className="w-full py-3 rounded-xl text-sm font-semibold"
        style={{ background:'var(--accent)', color:'#fff' }}>
        ← Back to Sign In
      </motion.button>
    </motion.div>
  );
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="space-y-5">
      <div>
        <button onClick={onBack} className="flex items-center gap-1 text-xs mb-5"
          style={{ color:'var(--text-dim)', background:'none', border:'none', cursor:'pointer' }}>← Back</button>
        <h2 className="text-xl font-bold" style={{ color:'var(--text)' }}>Forgot password?</h2>
        <p className="text-sm mt-1" style={{ color:'var(--text-dim)' }}>We'll send a reset link to your email.</p>
      </div>
      <form onSubmit={handle} className="space-y-4">
        <FloatInput label="Email address" id="reset-email" type="email" value={email}
          onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoFocus />
        <motion.button type="submit" disabled={loading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
          className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background:'linear-gradient(135deg, var(--accent), var(--blue))', color:'#000' }}>
          {loading ? '⏳ Sending...' : '📨 Send reset email'}
        </motion.button>
      </form>
    </motion.div>
  );
}

// ── Main AuthPage ─────────────────────────────────────────────────────────────
export default function AuthPage() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, signUp, signIn, logout, resendVerification, resetPassword } = useAuth();
  const [tab, setTab]           = useState('signin');
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');

  // Redirect verified users
  useEffect(() => { if (user?.emailVerified) navigate('/', { replace:true }); }, [user]);

  if (user && !user.emailVerified) return (
    <Shell>
      <VerifyEmailScreen user={user} onResend={resendVerification} onLogout={logout} />
    </Shell>
  );
  if (user?.emailVerified) return null;

  const handleGoogle = async () => {
    setGLoading(true);
    try { await signInWithGoogle(); }
    catch (err) {
      // signInWithRedirect throws only on configuration errors (not user cancel)
      if (err?.code && err.code !== 'auth/popup-closed-by-user') {
        toast.error(fmtError(err.code));
      }
    } finally { setGLoading(false); }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name.trim())         return toast.error('Enter your display name.');
    if (!email)               return toast.error('Enter your email.');
    if (password.length < 6)  return toast.error('Password must be at least 6 characters.');
    if (password !== confirm) return toast.error('Passwords do not match.');
    setLoading(true);
    try { await signUp(email, password, name.trim()); toast.success('Account created! Check your email to verify.'); }
    catch (err) { toast.error(fmtError(err.code)); }
    finally { setLoading(false); }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Fill in all fields.');
    setLoading(true);
    try {
      const c = await signIn(email, password);
      if (c.user.emailVerified) navigate('/', { replace:true });
      else toast('Verify your email first.', { icon:'📧' });
    } catch (err) { toast.error(fmtError(err.code)); }
    finally { setLoading(false); }
  };

  const switchTab = (t) => { setTab(t); setName(''); setEmail(''); setPassword(''); setConfirm(''); };

  return (
    <Shell>
      <AnimatePresence mode="wait">
        {tab === 'forgot' ? (
          <ForgotScreen key="forgot" onReset={resetPassword} onBack={() => switchTab('signin')} />
        ) : (
          <motion.div key={tab} initial={{ opacity:0, x: tab==='signup'?20:-20 }} animate={{ opacity:1, x:0 }}
            exit={{ opacity:0 }} transition={{ duration:0.2 }}>

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-glow-subtle" style={{ color:'var(--text)' }}>
                {tab === 'signin' ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-sm mt-1" style={{ color:'var(--text-dim)' }}>
                {tab === 'signin' ? 'Sign in to enter the arena' : 'Join thousands of coders battling live'}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex p-1 rounded-xl mb-6" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
              {['signin','signup'].map(t => (
                <button key={t} onClick={() => switchTab(t)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                  style={tab===t
                    ? { background:'var(--accent)', color:'#000', boxShadow:'0 2px 12px rgba(0,230,118,0.3)' }
                    : { color:'var(--text-dim)', background:'transparent' }}>
                  {t === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Google */}
            <GoogleBtn onClick={handleGoogle} disabled={loading || gLoading} />

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.06)' }} />
              <span className="text-xs font-mono" style={{ color:'var(--text-dim)' }}>or</span>
              <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.06)' }} />
            </div>

            {/* Form */}
            <form onSubmit={tab==='signin' ? handleSignIn : handleSignUp} className="space-y-4">
              {tab === 'signup' && (
                <FloatInput label="Display Name" id="name" value={name}
                  onChange={e => setName(e.target.value)} placeholder="Your arena name" autoFocus />
              )}
              <FloatInput label="Email address" id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                autoFocus={tab==='signin'} />
              <div>
                <FloatInput label="Password" id="password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                {tab === 'signup' && <PasswordStrength password={password} />}
              </div>
              {tab === 'signup' && (
                <FloatInput label="Confirm Password" id="confirm" type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
              )}

              {tab === 'signin' && (
                <div className="text-right -mt-1">
                  <button type="button" onClick={() => setTab('forgot')}
                    className="text-xs transition-colors"
                    style={{ color:'var(--accent)', background:'none', border:'none', cursor:'pointer' }}>
                    Forgot password?
                  </button>
                </div>
              )}

              <motion.button type="submit" disabled={loading || gLoading}
                whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
                className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wide disabled:opacity-50 mt-2"
                style={{ background:'linear-gradient(135deg, var(--accent), var(--blue))', color:'#000', boxShadow:'0 4px 20px rgba(0,230,118,0.3)' }}>
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation:'spin 0.8s linear infinite' }} />
                      {tab === 'signin' ? 'Signing in...' : 'Creating account...'}
                    </span>
                  : tab === 'signin' ? '⚡ Enter Arena' : '🚀 Create Account'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </Shell>
  );
}

// ── Shell Layout ─────────────────────────────────────────────────────────────
function Shell({ children }) {
  return (
    <div className="min-h-screen flex" style={{ background:'var(--bg)' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 relative overflow-hidden p-10"
        style={{ background:'linear-gradient(160deg,#050f07 0%,#090f09 50%,#060f07 100%)', borderRight:'1px solid rgba(0,230,118,0.1)' }}>
        <Particles />
        {/* Top glow */}
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background:'linear-gradient(90deg,transparent,var(--accent),transparent)' }} />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base"
              style={{ background:'var(--accent)', color:'#000', boxShadow:'0 4px 16px rgba(0,230,118,0.4)' }}>⚡</div>
            <span className="text-base font-bold tracking-wide text-glow-subtle" style={{ color:'var(--text)' }}>
              CODE<span className="text-glow-green" style={{ color:'var(--accent)' }}>ARENA</span>
            </span>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4 text-glow-subtle" style={{ color:'var(--text)' }}>
            Code Faster.<br />
            <span style={{ background:'linear-gradient(90deg, var(--accent), var(--blue))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Win Harder.
            </span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color:'var(--text-dim)' }}>
            Real-time multiplayer coding battles where every millisecond counts. Compete live, climb the leaderboard, dominate the arena.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-4">
          {[
            { icon:'⚔️', label:'Real-Time Battles',   desc:'Compete head-to-head instantly' },
            { icon:'🔥', label:'Power-Up System',      desc:'Freeze, hint, double your score' },
            { icon:'🏆', label:'Live Leaderboards',    desc:'Rankings update every second' },
            { icon:'👁️', label:'Spectator Mode',       desc:'Watch top players battle it out' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                style={{ background:'rgba(0,230,118,0.07)', border:'1px solid rgba(0,230,118,0.15)' }}>{f.icon}</div>
              <div>
                <div className="text-sm font-semibold" style={{ color:'var(--text)' }}>{f.label}</div>
                <div className="text-xs" style={{ color:'var(--text-dim)' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-6">
          {[['2.4K+','Players'],['18K+','Battles'],['200+','Problems']].map(([v,l]) => (
            <div key={l}>
              <div className="text-xl font-bold text-glow-subtle" style={{ color:'var(--accent)' }}>{v}</div>
              <div className="text-xs" style={{ color:'var(--text-dim)' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Bottom decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background:'linear-gradient(90deg,transparent,rgba(0,230,118,0.2),transparent)' }} />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile brand bar */}
        <div className="lg:hidden flex items-center gap-2 px-6 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background:'var(--accent)', color:'#000' }}>⚡</div>
          <span className="text-sm font-bold text-glow-subtle" style={{ color:'var(--text)' }}>
            CODE<span className="text-glow-green" style={{ color:'var(--accent)' }}>ARENA</span>
          </span>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            className="w-full max-w-[380px]">
            {/* Card */}
            <div className="relative p-7 sm:p-8 rounded-2xl"
              style={{
                background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.08)',
                backdropFilter:'blur(20px)',
              }}>
              {/* Top accent line */}
              <div className="absolute top-0 left-8 right-8 h-px"
                style={{ background:'linear-gradient(90deg,transparent,rgba(0,230,118,0.4),transparent)' }} />
              {children}
            </div>

            <p className="text-center text-xs mt-5" style={{ color:'var(--text-dim)' }}>
              By continuing you agree to our <span style={{ color:'var(--accent)' }}>Terms</span> &amp; <span style={{ color:'var(--accent)' }}>Privacy Policy</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
