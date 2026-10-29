import React from 'react';
import { Briefcase, Shield, UserCheck, LogOut, CheckCircle2 } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  currentTab: 'portal' | 'tracker' | 'roles' | 'admin';
  setCurrentTab: (tab: 'portal' | 'tracker' | 'roles' | 'admin') => void;
  adminUser: { email: string; uid?: string } | null;
  onAdminSignOut: () => void;
  openAdminLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  adminUser,
  onAdminSignOut,
  openAdminLogin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentTab('portal')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-teal-600 transition-colors">
              <Briefcase className="w-5 h-5 text-teal-400 group-hover:text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  COMPANY TECH
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                  Admissions
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Internship Application & Management System</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setCurrentTab('portal')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'portal'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Apply Online
            </button>
            <button
              onClick={() => setCurrentTab('roles')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'roles'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Open Roles (12)
            </button>
            <button
              onClick={() => setCurrentTab('tracker')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'tracker'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Track Status
            </button>
          </nav>

          {/* Admin Action Button / Profile */}
          <div className="flex items-center gap-3">
            {adminUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    currentTab === 'admin'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
                  }`}
                >
                  <Shield className="w-4 h-4 text-teal-600" />
                  <span className="hidden sm:inline">Admin Dashboard</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </button>
                <button
                  onClick={onAdminSignOut}
                  title="Sign out of Admin Dashboard"
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAdminLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
              >
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>Admin Sign-In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
