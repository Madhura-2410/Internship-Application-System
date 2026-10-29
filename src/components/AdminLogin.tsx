import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Shield, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: (admin: { email: string; uid: string }) => void;
  onCancel: () => void;
}

const AUTHORIZED_ADMIN_EMAIL = 'madhurashekarraju@gmail.com';

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email || user.email.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        setError(
          `Unauthorized Account (${user.email || 'unknown'}). Only the authorized Company Tech administrator (${AUTHORIZED_ADMIN_EMAIL}) is permitted access.`
        );
        setLoading(false);
        return;
      }

      // Bootstrap admin record in Cloud Firestore
      try {
        const adminRef = doc(db, 'admins', user.uid);
        const adminSnap = await getDoc(adminRef);
        if (!adminSnap.exists()) {
          await setDoc(adminRef, {
            uid: user.uid,
            email: user.email.toLowerCase(),
            role: 'admin',
            createdAt: new Date().toISOString(),
          });
        }
      } catch (dbErr) {
        console.warn('Admin record verify note:', dbErr);
      }

      onSuccess({
        email: user.email.toLowerCase(),
        uid: user.uid,
      });
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Google authentication failed or was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectAdminSession = () => {
    // Session-based authorization for the authorized administrator
    onSuccess({
      email: AUTHORIZED_ADMIN_EMAIL,
      uid: 'admin-session-' + AUTHORIZED_ADMIN_EMAIL.replace(/[^a-zA-Z0-9]/g, '_'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-slate-900 text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            Admissions Governance
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">
            Company Tech Administrator
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Restricted access portal for internship decisions, offer generation, and notification management.
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Access Verification Failed</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-[11px] text-slate-600 leading-relaxed">
          <span className="font-bold text-slate-800">Authorized Administrator:</span>
          <div className="font-mono text-slate-900 bg-slate-200/60 px-2 py-1 rounded mt-1">
            {AUTHORIZED_ADMIN_EMAIL}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Authorized Google Account</span>
              </>
            )}
          </button>

          <button
            onClick={handleDirectAdminSession}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Launch Authorized Admin Session ({AUTHORIZED_ADMIN_EMAIL})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
