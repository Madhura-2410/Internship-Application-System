import React, { useState } from 'react';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '../types';
import {
  Briefcase,
  Shield,
  UserCheck,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Building,
} from 'lucide-react';

const AUTHORIZED_ADMIN_EMAIL = 'madhurashekarraju@gmail.com';

interface AuthPageProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<UserRole>('employee');

  // Loading & error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Helper to fetch or create user profile in Firestore
  const resolveUserProfile = async (
    uid: string,
    email: string,
    displayName?: string | null,
    requestedRole?: UserRole
  ): Promise<UserProfile> => {
    const normalizedEmail = email.toLowerCase();
    const isMasterAdmin = normalizedEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

    const userRef = doc(db, 'users', uid);
    let userSnap;
    try {
      userSnap = await getDoc(userRef);
    } catch (err) {
      console.warn('Error reading user profile from Firestore:', err);
    }

    if (userSnap && userSnap.exists()) {
      const data = userSnap.data();
      const finalRole: UserRole = isMasterAdmin ? 'admin' : (data.role as UserRole) || 'employee';

      // Ensure admin collection sync if admin
      if (finalRole === 'admin') {
        try {
          await setDoc(doc(db, 'admins', uid), {
            uid,
            email: normalizedEmail,
            role: 'admin',
            createdAt: new Date().toISOString(),
          }, { merge: true });
        } catch (e) {
          console.warn('Admin record sync note:', e);
        }
      }

      return {
        uid,
        email: normalizedEmail,
        name: data.name || displayName || normalizedEmail.split('@')[0],
        role: finalRole,
        createdAt: data.createdAt || new Date().toISOString(),
      };
    }

    // Profile does not exist yet: create it!
    const effectiveRole: UserRole = isMasterAdmin
      ? 'admin'
      : requestedRole === 'admin' && isMasterAdmin
      ? 'admin'
      : 'employee';

    const newProfile: UserProfile = {
      uid,
      email: normalizedEmail,
      name: displayName || regName.trim() || normalizedEmail.split('@')[0],
      role: effectiveRole,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(userRef, newProfile);
      if (effectiveRole === 'admin') {
        await setDoc(doc(db, 'admins', uid), {
          uid,
          email: normalizedEmail,
          role: 'admin',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Profile write note:', err);
    }

    return newProfile;
  };

  // 1. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!loginEmail.trim() || !loginPassword) {
      setError('Please provide both your registered email and password.');
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      const user = cred.user;
      const profile = await resolveUserProfile(user.uid, user.email || loginEmail.trim(), user.displayName);
      onAuthSuccess(profile);
    } catch (err: any) {
      console.warn('Firebase client sign-in notice, attempting server-backed Firestore authentication:', err);
      // Fallback to secure server auth endpoint
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginEmail.trim(),
            password: loginPassword,
          }),
        });
        const data = await res.json();
        if (res.ok && data.profile) {
          onAuthSuccess(data.profile);
          return;
        } else if (!res.ok && data.error) {
          setError(data.error);
          return;
        }
      } catch (serverErr: any) {
        console.warn('Server auth note:', serverErr);
      }

      let msg = 'Failed to sign in. Please verify your email and password.';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        msg = 'Invalid credentials. Please verify your registered email and password or register a new account.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Access temporarily disabled due to multiple failed login attempts. Please try again shortly.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanName = regName.trim();

    if (cleanName.length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // Strict Admin Authorization Check
    if (regRole === 'admin') {
      if (cleanEmail !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        setError(
          `Unauthorized Admin Registration: Only the authorized Company Tech administrator (${AUTHORIZED_ADMIN_EMAIL}) is permitted to register with an Admin role. Please select the Employee role to apply for internships.`
        );
        return;
      }
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, regPassword);
      const user = cred.user;

      if (cleanName) {
        try {
          await updateProfile(user, { displayName: cleanName });
        } catch (nameErr) {
          console.warn('Could not update profile displayName:', nameErr);
        }
      }

      const profile = await resolveUserProfile(user.uid, cleanEmail, cleanName, regRole);
      onAuthSuccess(profile);
    } catch (err: any) {
      console.warn('Firebase client sign-up error, executing server-backed Firestore registration:', err);
      // When Firebase Auth operation-not-allowed or network error occurs, seamlessly register via backend in Firestore
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.message?.includes('operation-not-allowed') ||
        err.code === 'auth/network-request-failed'
      ) {
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanEmail,
              password: regPassword,
              name: cleanName,
              role: regRole,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Registration failed.');
          }
          onAuthSuccess(data.profile);
          return;
        } catch (serverErr: any) {
          setError(serverErr.message || 'Failed to complete registration.');
          return;
        }
      }

      let msg = 'Failed to create account. Please check your details and try again.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please switch to Sign In.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please choose a stronger password (at least 6 characters).';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'The email address entered is not valid.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;
      if (!user.email) {
        throw new Error('Google account does not have a verified email.');
      }
      const profile = await resolveUserProfile(user.uid, user.email, user.displayName);
      onAuthSuccess(profile);
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setError(err.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Brand Header */}
        <div className="bg-slate-900 p-7 text-center relative overflow-hidden">
          <div className="w-12 h-12 bg-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center mx-auto mb-3 border border-teal-500/30">
            <Briefcase className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded border border-teal-800">
            Admissions Portal
          </span>
          <h1 className="text-2xl font-black text-white mt-2 tracking-tight">
            COMPANY TECH
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Internship Application & Management Automation System
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
            className={`py-2.5 rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            className={`py-2.5 rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-7">
          {error && (
            <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Notice</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {successNotice && (
            <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In with Credentials</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                  <span className="bg-white px-2">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Sign in with Google</span>
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setError(null);
                  }}
                  className="font-bold text-teal-700 hover:text-teal-900 underline ml-0.5"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="alex.morgan@university.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Create Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Register Role As <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label
                    className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      regRole === 'employee'
                        ? 'border-teal-600 bg-teal-50/50 text-teal-950 font-bold ring-1 ring-teal-500/30'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      checked={regRole === 'employee'}
                      onChange={() => setRegRole('employee')}
                      className="mt-0.5 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="text-xs font-bold">Employee</div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Intern applicant & candidate access
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      regRole === 'admin'
                        ? 'border-teal-600 bg-teal-50/50 text-teal-950 font-bold ring-1 ring-teal-500/30'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      checked={regRole === 'admin'}
                      onChange={() => setRegRole('admin')}
                      className="mt-0.5 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1">
                        <span>Admin</span>
                        <Shield className="w-3 h-3 text-teal-700" />
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Admissions committee governance
                      </div>
                    </div>
                  </label>
                </div>

                {regRole === 'admin' && (
                  <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                    <strong>Admin Verification Policy:</strong> Administrator privileges are restricted to pre-authorized Company Tech personnel (e.g. <code>{AUTHORIZED_ADMIN_EMAIL}</code>). Unauthorized users will be denied admin access.
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 text-center text-xs text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError(null);
                  }}
                  className="font-bold text-teal-700 hover:text-teal-900 underline ml-0.5"
                >
                  Sign In Here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
