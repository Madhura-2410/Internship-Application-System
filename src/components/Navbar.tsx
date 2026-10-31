import React, { useState } from 'react';
import { Briefcase, Shield, UserCheck, LogOut, AlertTriangle, X } from 'lucide-react';
import { UserProfile, UserRole } from '../types';

export const AUTHORIZED_ADMIN_EMAIL = 'madhurashekarraju@gmail.com';

export type ActiveMode = 'employee' | 'admin';
export type ActiveTab = 'roles' | 'tracker' | 'dashboard' | 'post-requirement';

interface NavbarProps {
  activeMode: ActiveMode;
  setActiveMode: (mode: ActiveMode) => void;
  currentTab: ActiveTab;
  setCurrentTab: (tab: ActiveTab) => void;
  userProfile: UserProfile | null;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMode,
  setActiveMode,
  currentTab,
  setCurrentTab,
  userProfile,
  onSignOut,
}) => {
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  const isMasterAdmin =
    userProfile?.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  const handleRoleChange = (selected: UserRole) => {
    if (selected === 'admin') {
      if (isMasterAdmin) {
        setActiveMode('admin');
        setCurrentTab('dashboard');
        setAccessDeniedMessage(null);
      } else {
        setAccessDeniedMessage(
          `Access Denied: Your account (${userProfile?.email}) is not authorized for Administrator access. Admin privileges are strictly restricted to the authorized organization administrator (${AUTHORIZED_ADMIN_EMAIL}).`
        );
      }
    } else {
      setActiveMode('employee');
      setCurrentTab('roles');
      setAccessDeniedMessage(null);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div
              onClick={() => {
                if (activeMode === 'admin') {
                  setCurrentTab('dashboard');
                } else {
                  setCurrentTab('roles');
                }
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-teal-600 transition-colors">
                <Briefcase className="w-5 h-5 text-teal-400 group-hover:text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                    COMPANY TECH
                  </span>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                    {activeMode === 'admin' ? 'Admin Portal' : 'Admissions'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                  Internship Application & Management Automation System
                </p>
              </div>
            </div>

            {/* Strict Toolbar Navigation */}
            <nav className="flex items-center gap-2 sm:gap-3">
              {activeMode === 'employee' ? (
                /* Employee Mode: Exactly 3 options: Open Roles, Track Status, Role dropdown */
                <>
                  <button
                    onClick={() => setCurrentTab('roles')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      currentTab === 'roles'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Open Roles
                  </button>

                  <button
                    onClick={() => setCurrentTab('tracker')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      currentTab === 'tracker'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Track Status
                  </button>

                  {/* Role Dropdown */}
                  <div className="relative inline-block">
                    <select
                      value="employee"
                      onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                      className="px-2.5 py-1.5 text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                      title="Current Mode: Employee. Select Admin to switch if authorized."
                    >
                      <option value="employee">Role: Employee</option>
                      <option value="admin">Role: Admin</option>
                    </select>
                  </div>
                </>
              ) : (
                /* Admin Mode: Exactly 3 options: Dashboard, Post Requirement, Role dropdown */
                <>
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      currentTab === 'dashboard'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => setCurrentTab('post-requirement')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      currentTab === 'post-requirement'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>Post Requirement</span>
                  </button>

                  {/* Role Dropdown */}
                  <div className="relative inline-block">
                    <select
                      value="admin"
                      onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                      className="px-2.5 py-1.5 text-xs sm:text-sm font-bold bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-xl border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                      title="Current Mode: Admin. Select Employee to switch to candidate portal."
                    >
                      <option value="admin">Role: Admin</option>
                      <option value="employee">Role: Employee</option>
                    </select>
                  </div>
                </>
              )}
            </nav>

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-3">
              {userProfile && (
                <div className="flex items-center gap-2.5">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {userProfile.name}
                    </span>
                    <div className="flex items-center justify-end gap-1 text-[10px]">
                      {activeMode === 'admin' ? (
                        <span className="font-bold text-teal-700 flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5" />
                          <span>Administrator</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-500 flex items-center gap-0.5">
                          <UserCheck className="w-2.5 h-2.5 text-teal-600" />
                          <span>Employee</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={onSignOut}
                    title="Sign out of account"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Access Denied Modal if unauthorized user attempts Admin mode */}
      {accessDeniedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl border border-rose-200 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Access Restricted
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {accessDeniedMessage}
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setAccessDeniedMessage(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Understood, Return to Employee Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
