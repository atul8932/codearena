import { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  onAuthStateChanged,
  signOut,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  getRedirectResult,
  signInWithRedirect,
} from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes (covers redirect result too)
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    // Pick up the user after returning from Google redirect
    getRedirectResult(auth).catch((err) => {
      // Silently ignore — common non-error: user hasn't done a redirect yet
      if (err?.code && err.code !== 'auth/popup-closed-by-user') {
        console.error('getRedirectResult error:', err.code);
      }
    });

    return unsub;
  }, []);

  // Uses redirect instead of popup → eliminates cross-origin COOP warnings
  const signInWithGoogle = () => signInWithRedirect(auth, googleProvider);

  const signUp = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/auth`,
        handleCodeInApp: false,
      };
      await sendEmailVerification(cred.user, actionCodeSettings);
      console.log('✅ Verification email sent to', email);
    } catch (verifyErr) {
      console.error('❌ sendEmailVerification failed:', verifyErr.code, verifyErr.message);
      // Don't throw — account was created; user can resend
    }
    return cred;
  };

  const signIn = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  const resendVerification = () =>
    auth.currentUser ? sendEmailVerification(auth.currentUser) : Promise.reject();

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  return (
    <AuthContext.Provider value={{
      user, loading,
      signInWithGoogle, signUp, signIn, logout,
      resendVerification, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
