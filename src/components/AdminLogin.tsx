import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Shield, AlertCircle, ArrowRight } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: (admin: { email: string; uid: string }) => void;
  onCancel: () => void;
}

export const AUTHORIZED_ADMIN_EMAIL = 'madhurashekarraju@gmail.com';

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      // 1. Authenticate via Firebase Google Authentication popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user || !user.email) {
        await signOut(auth);
        throw new Error('Google sign-in did not return a verified email address.');
      }

      const authenticatedEmail = user.email.toLowerCase();

      // 2. Strict Authorized Email Verification
      if (authenticatedEmail !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        setError(
          `Unauthorized Account (${authenticatedEmail}): Administrator privileges are strictly restricted to the authorized Company Tech administrator (${AUTHORIZED_ADMIN_EMAIL}). Access has been revoked.`
        );
        setLoading(false);
        return;
      }

      // 3. Admin Profile Verification & Initialization in Cloud Firestore
      try {
        const adminRef = doc(db, 'admins', user.uid);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {
          // Initialize official admin record
          await setDoc(adminRef, {
            uid: user.uid,
            email: authenticatedEmail,
            role: 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          console.log(`[AdminLogin] Initialized new admin profile in Firestore for ${user.uid}`);
        }

        // Also ensure user profile document reflects admin role
        const userRef = doc(db, 'users', user.uid);
        await setDoc(
          userRef,
          {
            uid: user.uid,
            email: authenticatedEmail,
            name: user.displayName || 'Authorized Administrator',
            role: 'admin',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (dbErr: any) {
        console.error('[AdminLogin] Firestore admin profile verification failed:', dbErr);
        await signOut(auth);
        setError(
          `Admin Profile Initialization Failed: Cloud Firestore could not verify or initialize the administrator record (${dbErr.message || String(dbErr)}). Access denied.`
        );
        setLoading(false);
        return;
      }

      // 4. Verification successful - proceed to Admin Portal
      onSuccess({
        email: authenticatedEmail,
        uid: user.uid,
      });
    } catch (err: any) {
      console.error('[AdminLogin] Google authentication exception:', err);
      let userFriendlyMessage = 'Google administrator authentication failed.';
      if (err.code === 'auth/popup-closed-by-user') {
        userFriendlyMessage = 'Sign-in cancelled. The Google authentication popup was closed before completing.';
      } else if (err.code === 'auth/popup-blocked') {
        userFriendlyMessage = 'Popup blocked by browser. Please enable popups for this domain to sign in.';
      } else if (err.code === 'auth/operation-not-allowed') {
        userFriendlyMessage = 'Google Sign-In is currently disabled in the Firebase Console. Please verify that the Google Auth provider is enabled in your Firebase project.';
      } else if (err.code === 'auth/network-request-failed') {
        userFriendlyMessage = 'Network error: Unable to connect to Firebase Authentication servers. Please check your internet connection.';
      } else if (err.message) {
        userFriendlyMessage = err.message;
      }
      setError(userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#172321]/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Close dialog"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#172321] text-[#d6ef70] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#172321] bg-[#d6ef70]/40 px-2.5 py-0.5 rounded-full border border-[#9ac637]/40">
            Admissions Governance
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-2 font-heading">
            Administrator Authentication
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Restricted access portal for admissions decisions, offer letter generation, and notification management.
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Access Verification Failed</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-[11px] text-slate-600 leading-relaxed">
          <span className="font-bold text-slate-800">Authorized Administrator:</span>
          <div className="font-mono text-slate-900 bg-slate-200/60 px-2 py-1 rounded mt-1 select-all">
            {AUTHORIZED_ADMIN_EMAIL}
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            All non-admin Google accounts will be rejected and automatically signed out.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#172321] text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2.5 shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign In with Authorized Google Account</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
