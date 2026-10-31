/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { testConnection, auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Navbar, ActiveMode, ActiveTab, AUTHORIZED_ADMIN_EMAIL } from './components/Navbar';
import { AuthPage } from './components/AuthPage';
import { RolesSection } from './components/RolesSection';
import { StatusTracker } from './components/StatusTracker';
import { AdminDashboard } from './components/AdminDashboard';
import { PostRequirement } from './components/PostRequirement';
import { ApplicationFormModal } from './components/ApplicationFormModal';
import { ContactModal } from './components/ContactModal';
import { Footer } from './components/Footer';
import { InternshipRole, UserProfile, UserRole } from './types';
import { ShieldAlert, Briefcase } from 'lucide-react';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active Mode & Tab State
  const [activeMode, setActiveMode] = useState<ActiveMode>('employee');
  const [currentTab, setCurrentTab] = useState<ActiveTab>('roles');

  // Modals for individual opening interaction
  const [applyingRole, setApplyingRole] = useState<InternshipRole | null>(null);
  const [contactingRole, setContactingRole] = useState<InternshipRole | null>(null);
  const [trackedAppId, setTrackedAppId] = useState<string>('');

  // Firestore connection test on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Firebase Auth state & load user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const normalizedEmail = user.email.toLowerCase();
        const isMasterAdmin = normalizedEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

        let role: UserRole = isMasterAdmin ? 'admin' : 'employee';
        let name = user.displayName || normalizedEmail.split('@')[0];

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.name) name = data.name;
            if (!isMasterAdmin && data.role) {
              role = data.role as UserRole;
            }
          }
        } catch (err) {
          console.warn('Profile fetch note:', err);
        }

        const profile: UserProfile = {
          uid: user.uid,
          email: normalizedEmail,
          name,
          role,
          createdAt: user.metadata.creationTime || new Date().toISOString(),
        };

        setUserProfile(profile);
        if (profile.role === 'admin') {
          setActiveMode('admin');
          setCurrentTab('dashboard');
        } else {
          setActiveMode('employee');
          setCurrentTab('roles');
        }
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
    if (profile.role === 'admin') {
      setActiveMode('admin');
      setCurrentTab('dashboard');
    } else {
      setActiveMode('employee');
      setCurrentTab('roles');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign-out note:', e);
    }
    setUserProfile(null);
    setActiveMode('employee');
    setCurrentTab('roles');
  };

  // 1. Initial Loading Spinner
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4 animate-pulse">
          <Briefcase className="w-6 h-6" />
        </div>
        <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400 tracking-wide">
          Connecting to Company Tech Admissions...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated: Render Login and Sign-up First (Requirement 1)
  if (!userProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-teal-500 selection:text-white">
        <main className="flex-1 flex flex-col justify-center">
          <AuthPage onAuthSuccess={handleAuthSuccess} />
        </main>
        <Footer />
      </div>
    );
  }

  // 3. Authenticated: Render App with Role-Based Navigation & Mode (Requirements 2 & 3)
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-teal-500 selection:text-white">
      {/* Strict Role-Based Navbar (3 options in Employee Mode; 3 options in Admin Mode) */}
      <Navbar
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userProfile={userProfile}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* EMPLOYEE MODE VIEWS */}
        {activeMode === 'employee' && (
          <>
            {/* Open Roles Page (Primary landing after sign in) */}
            {currentTab === 'roles' && (
              <RolesSection
                onApplyOnline={(role) => setApplyingRole(role)}
                onContactCompany={(role) => setContactingRole(role)}
              />
            )}

            {/* Track Application Status */}
            {currentTab === 'tracker' && (
              <StatusTracker
                userEmail={userProfile.email}
                userUid={userProfile.uid}
                initialApplicationId={trackedAppId}
                onBrowseRoles={() => setCurrentTab('roles')}
              />
            )}
          </>
        )}

        {/* ADMIN MODE VIEWS */}
        {activeMode === 'admin' && (
          <>
            {userProfile.role === 'admin' ? (
              <>
                {/* Admin Dashboard */}
                {currentTab === 'dashboard' && (
                  <AdminDashboard adminEmail={userProfile.email} />
                )}

                {/* Post Requirement Admin Suite */}
                {currentTab === 'post-requirement' && (
                  <PostRequirement adminEmail={userProfile.email} />
                )}
              </>
            ) : (
              /* Access Denied Card if non-admin attempts Admin view */
              <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
                <div className="w-12 h-12 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center mx-auto mb-3 text-rose-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Access Restricted
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Administrator evaluation tools are strictly limited to authorized Company Tech admissions administrators ({AUTHORIZED_ADMIN_EMAIL}). Your account is registered as an Employee.
                </p>
                <button
                  onClick={() => {
                    setActiveMode('employee');
                    setCurrentTab('roles');
                  }}
                  className="mt-5 w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Return to Employee Open Roles
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modern Footer */}
      <Footer />

      {/* Apply Online Modal triggered per internship opening */}
      {applyingRole && (
        <ApplicationFormModal
          role={applyingRole}
          userEmail={userProfile.email}
          userName={userProfile.name}
          userUid={userProfile.uid}
          onClose={() => setApplyingRole(null)}
          onSuccessNavigateToTracker={(applicationId) => {
            setApplyingRole(null);
            setTrackedAppId(applicationId);
            setActiveMode('employee');
            setCurrentTab('tracker');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Contact Company Modal triggered per internship opening */}
      {contactingRole && (
        <ContactModal
          role={contactingRole}
          onClose={() => setContactingRole(null)}
        />
      )}
    </div>
  );
}
