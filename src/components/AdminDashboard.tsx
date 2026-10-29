import React, { useState, useEffect } from 'react';
import {
  InternshipApplication,
  InternshipRole,
  ApplicationStatus,
  APPROVED_ROLES,
  InternshipDuration,
} from '../types';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  FileDown,
  RotateCcw,
  Eye,
  FileText,
  AlertTriangle,
  Mail,
  Calendar,
  Users,
  Settings,
  Shield,
  Download,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { downloadOfferLetterPdf } from '../lib/pdfGenerator';

interface AdminDashboardProps {
  adminEmail: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminEmail }) => {
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ApplicationStatus>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [experienceFilter, setExperienceFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modals
  const [selectedApp, setSelectedApp] = useState<InternshipApplication | null>(null);
  const [acceptingApp, setAcceptingApp] = useState<InternshipApplication | null>(null);
  const [rejectingApp, setRejectingApp] = useState<InternshipApplication | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Decision Form States
  const [acceptDuration, setAcceptDuration] = useState<InternshipDuration>('1 month');
  const [acceptJoiningDate, setAcceptJoiningDate] = useState(() => {
    // Default to next Monday
    const d = new Date();
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
    return d.toISOString().split('T')[0];
  });
  const [acceptNotes, setAcceptNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('High volume of competitive applications for this cohort.');
  const [isProcessingDecision, setIsProcessingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  // Retry state
  const [retryingTarget, setRetryingTarget] = useState<string | null>(null);

  // System config state
  const [systemConfig, setSystemConfig] = useState<any | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/applications', {
        headers: {
          'x-admin-email': adminEmail,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch application records.');
      }

      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Error connecting to Firestore database.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const res = await fetch('/api/system/config');
      if (res.ok) {
        const data = await res.json();
        setSystemConfig(data);
      }
    } catch (e) {
      console.warn('Config fetch note:', e);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchSystemConfig();
  }, [adminEmail]);

  // Handle Accept
  const handleConfirmAccept = async () => {
    if (!acceptingApp) return;

    if (!acceptJoiningDate) {
      setDecisionError('Please choose an official joining date.');
      return;
    }

    setIsProcessingDecision(true);
    setDecisionError(null);

    try {
      const res = await fetch(`/api/applications/${acceptingApp.applicationId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail,
        },
        body: JSON.stringify({
          action: 'Accepted',
          duration: acceptDuration,
          joiningDate: acceptJoiningDate,
          notes: acceptNotes,
          adminEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to record acceptance.');
      }

      setAcceptingApp(null);
      await fetchApplications();
    } catch (err: any) {
      console.error('Accept error:', err);
      setDecisionError(err.message || 'Error executing acceptance workflow.');
    } finally {
      setIsProcessingDecision(false);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectingApp) return;

    setIsProcessingDecision(true);
    setDecisionError(null);

    try {
      const res = await fetch(`/api/applications/${rejectingApp.applicationId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail,
        },
        body: JSON.stringify({
          action: 'Rejected',
          rejectionReason: rejectReason,
          adminEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to record rejection.');
      }

      setRejectingApp(null);
      await fetchApplications();
    } catch (err: any) {
      console.error('Reject error:', err);
      setDecisionError(err.message || 'Error executing rejection workflow.');
    } finally {
      setIsProcessingDecision(false);
    }
  };

  // Handle Retry Email / Notification
  const handleRetryNotification = async (appId: string, target: string) => {
    setRetryingTarget(`${appId}-${target}`);
    try {
      const res = await fetch(`/api/applications/${appId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail,
        },
        body: JSON.stringify({ target, adminEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Retry attempt failed.');
      } else {
        await fetchApplications();
        // Update selectedApp view if open
        if (selectedApp && selectedApp.applicationId === appId) {
          setSelectedApp((prev) => (prev ? { ...prev, emailProcessing: data.emailProcessing } : null));
        }
      }
    } catch (err: any) {
      console.error('Retry error:', err);
      alert('Failed to retry operation: ' + err.message);
    } finally {
      setRetryingTarget(null);
    }
  };

  // Download Offer Letter helper
  const handleDownloadPdf = (app: InternshipApplication) => {
    if (app.offerLetterUrl && app.offerLetterUrl.startsWith('data:application/pdf')) {
      const link = document.createElement('a');
      link.href = app.offerLetterUrl;
      link.download = `Company_Tech_Offer_Letter_${app.applicationId}.pdf`;
      link.click();
    } else {
      downloadOfferLetterPdf({
        applicationId: app.applicationId,
        fullName: app.fullName,
        email: app.email,
        college: app.college,
        role: app.role,
        duration: app.decision?.duration || '1 month',
        joiningDate: app.decision?.joiningDate || 'Immediate',
      });
    }
  };

  // Filter calculations
  const filteredApps = applications.filter((app) => {
    // Search
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = app.fullName.toLowerCase().includes(q);
      const matchEmail = app.email.toLowerCase().includes(q);
      const matchCollege = app.college.toLowerCase().includes(q);
      const matchId = app.applicationId.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchCollege && !matchId) return false;
    }

    // Status
    if (statusFilter !== 'All' && app.status !== statusFilter) return false;

    // Role
    if (roleFilter !== 'All' && app.role !== roleFilter) return false;

    // Experience
    if (experienceFilter !== 'All' && app.experienceLevel !== experienceFilter) return false;

    return true;
  });

  // Sort
  filteredApps.sort((a, b) => {
    const timeA = new Date(a.appliedAt).getTime();
    const timeB = new Date(b.appliedAt).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  // Metrics
  const totalCount = applications.length;
  const pendingCount = applications.filter((a) => a.status === 'Pending').length;
  const acceptedCount = applications.filter((a) => a.status === 'Accepted').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;
  const failedNotificationsCount = applications.filter((a) => {
    const ep = a.emailProcessing;
    return (
      ep?.applicantConfirmation?.status === 'Failed' ||
      ep?.supportNotification?.status === 'Failed' ||
      ep?.decisionEmail?.status === 'Failed'
    );
  }).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Admin Governance Center
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Live Firestore Sync
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Company Tech Admissions Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Signed in as authorized administrator: <strong className="text-slate-800">{adminEmail}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Email & System Setup</span>
          </button>
          <button
            onClick={fetchApplications}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Applications</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalCount}</div>
          <span className="text-[10px] text-slate-400">All recorded cohorts</span>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-950">{pendingCount}</div>
          <span className="text-[10px] text-amber-600 font-medium">Awaiting decision</span>
        </div>

        {/* Accepted */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Accepted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-950">{acceptedCount}</div>
          <span className="text-[10px] text-emerald-600 font-medium">Offer letters issued</span>
        </div>

        {/* Rejected */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold">
            <span>Concluded / Rejected</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{rejectedCount}</div>
          <span className="text-[10px] text-slate-400">Not selected</span>
        </div>

        {/* Outbound Email Recovery */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold">
            <span>Email Recovery</span>
            <Mail className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {failedNotificationsCount > 0 ? (
              <span className="text-amber-600">{failedNotificationsCount}</span>
            ) : (
              <span className="text-emerald-600">0</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400">
            {failedNotificationsCount > 0 ? 'Retry-safe notifications' : 'No failed deliveries'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, name, email, college..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
            >
              <option value="All">All Statuses ({totalCount})</option>
              <option value="Pending">Pending ({pendingCount})</option>
              <option value="Accepted">Accepted ({acceptedCount})</option>
              <option value="Rejected">Rejected ({rejectedCount})</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
            >
              <option value="All">All Roles (12 Tracks)</option>
              {APPROVED_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>Experience:</span>
            <button
              onClick={() => setExperienceFilter('All')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                experienceFilter === 'All' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setExperienceFilter('Fresher')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                experienceFilter === 'Fresher' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
              }`}
            >
              Fresher
            </button>
            <button
              onClick={() => setExperienceFilter('Experienced')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                experienceFilter === 'Experienced' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
              }`}
            >
              Experienced
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span>Sort:</span>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 underline"
            >
              {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Table / Applications List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold">Retrieving applications from Cloud Firestore...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center text-rose-800">
            <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
            <p className="font-bold text-sm">Failed to Load Application Records</p>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchApplications}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-slate-800">No applications match criteria</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query, status, or role filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Applicant Profile</th>
                  <th className="py-3 px-4">Role & Year</th>
                  <th className="py-3 px-4">Resume</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notifications</th>
                  <th className="py-3 px-4 text-right">Decisions & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => {
                  const hasResume = !!app.resumeFileName;
                  const isPending = app.status === 'Pending';
                  const isAccepted = app.status === 'Accepted';
                  const isRejected = app.status === 'Rejected';

                  return (
                    <tr
                      key={app.applicationId}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {app.applicationId}
                      </td>

                      {/* Profile */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{app.fullName}</div>
                        <div className="text-slate-500 text-[11px] truncate max-w-[180px]">
                          {app.email}
                        </div>
                        <div className="text-slate-400 text-[10px] truncate max-w-[180px]">
                          {app.college}
                        </div>
                      </td>

                      {/* Role & Year */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-teal-900">{app.role}</div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                          <span>{app.pursuingYear}</span>
                          <span>•</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                              app.experienceLevel === 'Experienced'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {app.experienceLevel}
                          </span>
                        </div>
                      </td>

                      {/* Resume */}
                      <td className="py-3.5 px-4">
                        {hasResume ? (
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </td>

                      {/* Applied Date */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{new Date(app.appliedAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(app.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                        {isAccepted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Accepted</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            <XCircle className="w-3 h-3 text-slate-500" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>

                      {/* Notifications / Diagnostics */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {/* Applicant confirmation */}
                          <span
                            title={`Applicant Confirmation: ${app.emailProcessing?.applicantConfirmation?.status || 'Pending'}`}
                            className={`w-2.5 h-2.5 rounded-full ${
                              app.emailProcessing?.applicantConfirmation?.status === 'Sent'
                                ? 'bg-emerald-500'
                                : app.emailProcessing?.applicantConfirmation?.status === 'Failed'
                                ? 'bg-rose-500'
                                : 'bg-slate-300'
                            }`}
                          />
                          {/* Support Alert */}
                          <span
                            title={`Support Alert: ${app.emailProcessing?.supportNotification?.status || 'Pending'}`}
                            className={`w-2.5 h-2.5 rounded-full ${
                              app.emailProcessing?.supportNotification?.status === 'Sent'
                                ? 'bg-blue-500'
                                : app.emailProcessing?.supportNotification?.status === 'Failed'
                                ? 'bg-rose-500'
                                : 'bg-slate-300'
                            }`}
                          />
                          {/* Decision Notification */}
                          {(isAccepted || isRejected) && (
                            <span
                              title={`Decision Email: ${app.emailProcessing?.decisionEmail?.status || 'Pending'}`}
                              className={`w-2.5 h-2.5 rounded-full ${
                                app.emailProcessing?.decisionEmail?.status === 'Sent'
                                  ? 'bg-purple-500'
                                  : app.emailProcessing?.decisionEmail?.status === 'Failed'
                                  ? 'bg-rose-500'
                                  : 'bg-slate-300'
                              }`}
                            />
                          )}
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="text-[10px] text-slate-400 hover:text-slate-700 ml-1"
                          >
                            Details
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => {
                                  setAcceptingApp(app);
                                  setDecisionError(null);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingApp(app);
                                  setDecisionError(null);
                                }}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isAccepted && (
                            <button
                              onClick={() => handleDownloadPdf(app)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[11px] font-bold transition-colors"
                              title="Download Genuine Offer Letter PDF"
                            >
                              <FileDown className="w-3.5 h-3.5 text-teal-600" />
                              <span>PDF</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {selectedApp.applicationId}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Status: {selectedApp.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {selectedApp.fullName}
            </h2>
            <p className="text-xs text-slate-500">
              Applied for: <strong className="text-slate-800">{selectedApp.role}</strong> on{' '}
              {new Date(selectedApp.appliedAt).toLocaleString()}
            </p>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-3 my-5 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Email Address</span>
                <span className="font-semibold text-slate-800">{selectedApp.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">College / University</span>
                <span className="font-semibold text-slate-800">{selectedApp.college}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Pursuing Year</span>
                <span className="font-semibold text-slate-800">{selectedApp.pursuingYear}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Experience Level</span>
                <span className="font-semibold text-slate-800">{selectedApp.experienceLevel}</span>
              </div>
            </div>

            {/* Resume File */}
            {selectedApp.resumeFileName ? (
              <div className="mb-5 p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">{selectedApp.resumeFileName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {selectedApp.resumeStoragePath || 'Stored privately in Firebase Storage'}
                    </div>
                  </div>
                </div>
                {selectedApp.resumeBase64 && (
                  <a
                    href={selectedApp.resumeBase64}
                    download={selectedApp.resumeFileName}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
              </div>
            ) : null}

            {/* Decision Info (if Accepted or Rejected) */}
            {selectedApp.decision && (
              <div className="mb-5 p-4 rounded-xl border text-xs bg-slate-50 border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Decision Audit Log</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    UID: {selectedApp.decision.adminUid}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">Action:</span>{' '}
                    <strong className={selectedApp.status === 'Accepted' ? 'text-emerald-700' : 'text-rose-700'}>
                      {selectedApp.decision.action}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Date:</span>{' '}
                    {new Date(selectedApp.decision.timestamp).toLocaleString()}
                  </div>
                  {selectedApp.decision.duration && (
                    <div>
                      <span className="text-slate-500">Duration:</span>{' '}
                      <strong>{selectedApp.decision.duration}</strong>
                    </div>
                  )}
                  {selectedApp.decision.joiningDate && (
                    <div>
                      <span className="text-slate-500">Joining Date:</span>{' '}
                      <strong>{selectedApp.decision.joiningDate}</strong>
                    </div>
                  )}
                </div>
                {selectedApp.status === 'Accepted' && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleDownloadPdf(selectedApp)}
                      className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Download Generated Offer Letter PDF</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Email & Notification Delivery Tracking Diagnostics */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>Outbound Notification & PDF Processing Diagnostics</span>
              </h4>

              {/* 1. Applicant Confirmation */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                <div>
                  <div className="font-semibold text-slate-800">1. Applicant Confirmation Email</div>
                  <div className="text-[11px] text-slate-500">
                    Status:{' '}
                    <span
                      className={`font-bold ${
                        selectedApp.emailProcessing?.applicantConfirmation?.status === 'Sent'
                          ? 'text-emerald-700'
                          : selectedApp.emailProcessing?.applicantConfirmation?.status === 'Failed'
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {selectedApp.emailProcessing?.applicantConfirmation?.status || 'Pending'}
                    </span>
                    {selectedApp.emailProcessing?.applicantConfirmation?.error && (
                      <span className="text-rose-600 block text-[10px] mt-0.5">
                        {selectedApp.emailProcessing.applicantConfirmation.error}
                      </span>
                    )}
                  </div>
                </div>
                {selectedApp.emailProcessing?.applicantConfirmation?.status !== 'Sent' && (
                  <button
                    onClick={() =>
                      handleRetryNotification(selectedApp.applicationId, 'applicantConfirmation')
                    }
                    disabled={retryingTarget === `${selectedApp.applicationId}-applicantConfirmation`}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    {retryingTarget === `${selectedApp.applicationId}-applicantConfirmation`
                      ? 'Retrying...'
                      : 'Retry Email'}
                  </button>
                )}
              </div>

              {/* 2. Support Notification */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                <div>
                  <div className="font-semibold text-slate-800">2. Admissions Support Alert</div>
                  <div className="text-[11px] text-slate-500">
                    Status:{' '}
                    <span
                      className={`font-bold ${
                        selectedApp.emailProcessing?.supportNotification?.status === 'Sent'
                          ? 'text-emerald-700'
                          : selectedApp.emailProcessing?.supportNotification?.status === 'Failed'
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {selectedApp.emailProcessing?.supportNotification?.status || 'Pending'}
                    </span>
                  </div>
                </div>
                {selectedApp.emailProcessing?.supportNotification?.status !== 'Sent' && (
                  <button
                    onClick={() =>
                      handleRetryNotification(selectedApp.applicationId, 'supportNotification')
                    }
                    disabled={retryingTarget === `${selectedApp.applicationId}-supportNotification`}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    {retryingTarget === `${selectedApp.applicationId}-supportNotification`
                      ? 'Retrying...'
                      : 'Retry Alert'}
                  </button>
                )}
              </div>

              {/* 3. Decision Email (if final) */}
              {(selectedApp.status === 'Accepted' || selectedApp.status === 'Rejected') && (
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                  <div>
                    <div className="font-semibold text-slate-800">
                      3. Decision Notice ({selectedApp.status === 'Accepted' ? 'Offer Letter PDF Attachment' : 'Rejection Letter'})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Status:{' '}
                      <span
                        className={`font-bold ${
                          selectedApp.emailProcessing?.decisionEmail?.status === 'Sent'
                            ? 'text-emerald-700'
                            : selectedApp.emailProcessing?.decisionEmail?.status === 'Failed'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {selectedApp.emailProcessing?.decisionEmail?.status || 'Pending'}
                      </span>
                      {selectedApp.emailProcessing?.decisionEmail?.error && (
                        <span className="text-rose-600 block text-[10px] mt-0.5">
                          {selectedApp.emailProcessing.decisionEmail.error}
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedApp.emailProcessing?.decisionEmail?.status !== 'Sent' && (
                    <button
                      onClick={() =>
                        handleRetryNotification(selectedApp.applicationId, 'decisionEmail')
                      }
                      disabled={retryingTarget === `${selectedApp.applicationId}-decisionEmail`}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      {retryingTarget === `${selectedApp.applicationId}-decisionEmail`
                        ? 'Retrying...'
                        : 'Retry Delivery'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACCEPT MODAL */}
      {acceptingApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setAcceptingApp(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Accept Internship Application
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {acceptingApp.applicationId} • {acceptingApp.fullName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Accepting this application will atomically set its status to <strong>Accepted</strong>, generate an authenticated PDF Offer Letter with Company Tech branding, and initiate email delivery.
            </p>

            {decisionError && (
              <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{decisionError}</span>
              </div>
            )}

            <div className="space-y-4 my-5 text-xs">
              {/* Internship Duration: Required strictly 1 month, 2 months, 3 months */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Internship Duration (Mandatory) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1 month', '2 months', '3 months'] as InternshipDuration[]).map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setAcceptDuration(dur)}
                      className={`py-2 px-3 rounded-xl border font-bold text-center transition-all ${
                        acceptDuration === dur
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Joining Date: Mandatory */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Commencement Date (Joining Date) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={acceptJoiningDate}
                  onChange={(e) => setAcceptJoiningDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                />
              </div>

              {/* Offer Letter Signatory Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                <span className="font-bold text-slate-800 block">Offer Letter Signatory:</span>
                <span>Authorized Signatory • HR Support and Co-Founder • Company Tech</span>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Internal Notes (Optional)
                </label>
                <input
                  type="text"
                  value={acceptNotes}
                  onChange={(e) => setAcceptNotes(e.target.value)}
                  placeholder="e.g. Recommended by senior mentor"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAcceptingApp(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={isProcessingDecision}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessingDecision ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating PDF & Recording Decision...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Acceptance & Issue Offer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setRejectingApp(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Conclude / Reject Application
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {rejectingApp.applicationId} • {rejectingApp.fullName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Confirming rejection will update status to <strong>Rejected</strong> and trigger the standard admissions update email to <strong>{rejectingApp.email}</strong>.
            </p>

            {decisionError && (
              <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{decisionError}</span>
              </div>
            )}

            <div className="my-4 text-xs">
              <label className="block font-bold text-slate-800 mb-1">
                Evaluation Rationale / Feedback
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingApp(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessingDecision}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessingDecision ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Decision...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Confirm Rejection & Dispatch Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM CONFIG & OUTBOUND EMAIL MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-5 h-5 text-slate-700" />
              <h3 className="font-bold text-base text-slate-900">
                Email Provider & Environment Diagnostics
              </h3>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold block text-slate-800 mb-1">
                  Current Outbound Email Status:
                </span>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      systemConfig?.outboundProvider !== 'Unconfigured'
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  <strong>{systemConfig?.outboundProvider || 'Checking...'}</strong>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div>
                  <span className="text-slate-500">Configured Support Mailbox:</span>{' '}
                  <code className="text-slate-900 font-mono">{systemConfig?.supportEmail || 'support@companytech.internal'}</code>
                </div>
                <div>
                  <span className="text-slate-500">Authorized Administrator:</span>{' '}
                  <code className="text-slate-900 font-mono">{systemConfig?.adminEmail || adminEmail}</code>
                </div>
              </div>

              <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-200 text-teal-950 text-[11px] leading-relaxed">
                <strong>Setting up Outbound Live Emails:</strong>
                <p className="mt-1">
                  To send live outbound emails to applicants with real PDF attachments over the internet, specify either <code>RESEND_API_KEY</code> or standard <code>SMTP_HOST</code>/<code>SMTP_USER</code>/<code>SMTP_PASS</code> in your environment variables.
                </p>
                <p className="mt-1">
                  All notification attempts are tracked with statuses <em>Pending</em>, <em>Sent</em>, or <em>Failed</em> with full error reasons and can be retried at any time from this dashboard.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
