import React, { useState, useEffect } from 'react';
import { testConnection, auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { ApplicationForm } from './components/ApplicationForm';
import { RolesSection } from './components/RolesSection';
import { StatusTracker } from './components/StatusTracker';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { Footer } from './components/Footer';
import { InternshipRole } from './types';

const AUTHORIZED_ADMIN_EMAIL = 'madhurashekarraju@gmail.com';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'portal' | 'tracker' | 'roles' | 'admin'>('portal');
  const [selectedRole, setSelectedRole] = useState<InternshipRole>('Frontend Developer');
  const [trackTarget, setTrackTarget] = useState<{ id: string; email: string }>({
    id: '',
    email: '',
  });

  // Admin Auth State
  const [adminUser, setAdminUser] = useState<{ email: string; uid?: string } | null>(null);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  // Firestore Connection Test on Boot (Mandated by Firebase Skill)
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email && user.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        setAdminUser({
          email: user.email.toLowerCase(),
          uid: user.uid,
        });
      } else if (!user && adminUser?.uid?.startsWith('admin-session')) {
        // preserve active session state if session was set
      } else {
        setAdminUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSelectRoleFromRoles = (role: InternshipRole) => {
    setSelectedRole(role);
    setCurrentTab('portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTrackApplication = (applicationId: string, email: string) => {
    setTrackTarget({ id: applicationId, email });
    setCurrentTab('tracker');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLoginSuccess = (admin: { email: string; uid: string }) => {
    setAdminUser(admin);
    setShowAdminLoginModal(false);
    setCurrentTab('admin');
  };

  const handleAdminSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign-out note:', e);
    }
    setAdminUser(null);
    if (currentTab === 'admin') {
      setCurrentTab('portal');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-teal-500 selection:text-white">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        adminUser={adminUser}
        onAdminSignOut={handleAdminSignOut}
        openAdminLogin={() => setShowAdminLoginModal(true)}
      />

      <main className="flex-1">
        {currentTab === 'portal' && (
          <div>
            <ApplicationForm
              initialRole={selectedRole}
              onTrackApplication={handleTrackApplication}
            />
            <RolesSection onSelectRole={handleSelectRoleFromRoles} />
          </div>
        )}

        {currentTab === 'roles' && (
          <RolesSection onSelectRole={handleSelectRoleFromRoles} />
        )}

        {currentTab === 'tracker' && (
          <StatusTracker
            initialApplicationId={trackTarget.id}
            initialEmail={trackTarget.email}
          />
        )}

        {currentTab === 'admin' && (
          <div>
            {adminUser ? (
              <AdminDashboard adminEmail={adminUser.email} />
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-700">
                  🔒
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Administrator Authentication Required
                </h2>
                <p className="text-xs text-slate-500 mt-2">
                  Please sign in with the authorized Company Tech administrator account ({AUTHORIZED_ADMIN_EMAIL}) to access applicant evaluation tools.
                </p>
                <button
                  onClick={() => setShowAdminLoginModal(true)}
                  className="mt-5 w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Sign in as Administrator
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />

      {/* Admin Login Modal */}
      {showAdminLoginModal && (
        <AdminLogin
          onSuccess={handleAdminLoginSuccess}
          onCancel={() => setShowAdminLoginModal(false)}
        />
      )}
    </div>
  );
}
