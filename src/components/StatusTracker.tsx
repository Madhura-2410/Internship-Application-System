import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileDown,
  AlertCircle,
  Calendar,
  Layers,
  Award,
  FileText,
  RotateCcw,
  ArrowRight,
  Briefcase,
  Eye,
  X,
  Building,
} from 'lucide-react';
import { InternshipApplication } from '../types';
import { downloadOfferLetterPdf } from '../lib/pdfGenerator';

interface StatusTrackerProps {
  userEmail: string;
  userUid: string;
  initialApplicationId?: string;
  onBrowseRoles?: () => void;
}

export const StatusTracker: React.FC<StatusTrackerProps> = ({
  userEmail,
  userUid,
  initialApplicationId = '',
  onBrowseRoles,
}) => {
  const [myApplications, setMyApplications] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected application for detail view modal
  const [selectedApp, setSelectedApp] = useState<InternshipApplication | null>(null);

  // Manual lookup state
  const [manualId, setManualId] = useState(initialApplicationId);
  const [manualSearching, setManualSearching] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Fetch applications belonging to this authenticated user
  const fetchMyApplications = async () => {
    if (!userEmail && !userUid) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (userEmail) params.append('email', userEmail.trim().toLowerCase());
      if (userUid) params.append('uid', userUid.trim());

      const res = await fetch(`/api/applications/my-applications?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to retrieve your application records.');
      }

      const data = await res.json();
      const apps: InternshipApplication[] = data.applications || [];
      setMyApplications(apps);

      // If initialApplicationId was passed, auto-select it in detail view
      if (initialApplicationId) {
        const found = apps.find((a) => a.applicationId === initialApplicationId);
        if (found) {
          setSelectedApp(found);
        }
      }
    } catch (err: any) {
      console.error('Fetch my-applications error:', err);
      setError(err.message || 'Error loading applications from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, [userEmail, userUid]);

  // Handle Manual Application ID Search
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;

    setManualSearching(true);
    setManualError(null);

    try {
      const res = await fetch(`/api/applications/track?applicationId=${encodeURIComponent(manualId.trim())}&email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Application record not found.');
      }

      setSelectedApp(data);
    } catch (err: any) {
      console.error('Manual search error:', err);
      setManualError(err.message || 'Could not find application record.');
    } finally {
      setManualSearching(false);
    }
  };

  // Download Offer Letter
  const handleDownloadOfferLetter = (app: InternshipApplication) => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[85vh]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Candidate Dashboard
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Live Firestore Records
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Track Application Status
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registered account: <strong className="text-slate-800">{userEmail}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMyApplications}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold">Retrieving your submitted applications...</p>
        </div>
      ) : error ? (
        <div className="p-10 text-center text-rose-800 bg-white rounded-2xl border border-rose-200">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <p className="font-bold text-sm">Failed to Load Applications</p>
          <p className="text-xs text-slate-600 mt-1">{error}</p>
          <button
            onClick={fetchMyApplications}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Retry
          </button>
        </div>
      ) : myApplications.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-600">
            <Briefcase className="w-7 h-7 text-teal-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No Applications Submitted Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            You haven't submitted any internship applications under <strong>{userEmail}</strong>. Browse our 12 approved internship tracks to apply today!
          </p>
          {onBrowseRoles && (
            <button
              onClick={onBrowseRoles}
              className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2"
            >
              <span>Explore Open Roles</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* List of Applications */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myApplications.map((app) => {
              const isAccepted = app.status === 'Accepted';
              const isRejected = app.status === 'Rejected';
              const isPending = app.status === 'Pending';

              return (
                <div
                  key={app.applicationId}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Application ID & Status Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                        {app.applicationId}
                      </span>

                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                          <span>Pending Review</span>
                        </span>
                      )}
                      {isAccepted && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Accepted</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          <XCircle className="w-3 h-3 text-slate-500" />
                          <span>Concluded</span>
                        </span>
                      )}
                    </div>

                    {/* Role Title */}
                    <h3 className="font-bold text-base text-slate-900 mb-1">
                      {app.role}
                    </h3>
                    <p className="text-xs text-slate-500 mb-3 truncate">
                      {app.college} • {app.pursuingYear}
                    </p>

                    {/* Applied Date */}
                    <div className="text-[11px] text-slate-400 mb-4 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                    </div>

                    {/* Acceptance Highlight */}
                    {isAccepted && app.decision && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 mb-4 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-emerald-900">
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Offer Extended ({app.decision.duration})</span>
                        </div>
                        <div className="text-[11px] text-emerald-800">
                          Joining Date: <strong>{app.decision.joiningDate}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: View Status & Download Offer if Accepted */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Status</span>
                    </button>

                    {isAccepted && (
                      <button
                        onClick={() => handleDownloadOfferLetter(app)}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
                        title="Download Offer Letter (PDF)"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Search Section (for looking up by ID if required) */}
      <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-xl mx-auto">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
          Manual Application Lookup
        </h4>
        <p className="text-xs text-slate-600 mb-4">
          Need to search for an application submitted with an external reference ID? Enter it below:
        </p>
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="e.g. CT-2026-X9K2L1"
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
          <button
            type="submit"
            disabled={manualSearching}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0 disabled:opacity-50"
          >
            {manualSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
        {manualError && (
          <p className="text-xs text-rose-600 mt-2 font-medium">{manualError}</p>
        )}
      </div>

      {/* DETAILED STATUS MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                {selectedApp.applicationId}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                Company Tech Admissions
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              {selectedApp.role} Internship
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidate: <strong>{selectedApp.fullName}</strong> • Applied: {new Date(selectedApp.appliedAt).toLocaleDateString()}
            </p>

            {/* Status Section */}
            <div className="my-5">
              {selectedApp.status === 'Accepted' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-950 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-emerald-950">
                        Application Accepted & Offer Extended!
                      </h3>
                      <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                        Congratulations! The Company Tech admissions panel has accepted your candidacy for the {selectedApp.role} cohort.
                      </p>
                    </div>
                  </div>

                  {selectedApp.decision && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-200/60 text-xs">
                      <div>
                        <span className="text-emerald-800 font-semibold block text-[11px]">Duration:</span>
                        <span className="font-bold text-emerald-950 text-sm">{selectedApp.decision.duration}</span>
                      </div>
                      <div>
                        <span className="text-emerald-800 font-semibold block text-[11px]">Joining Date:</span>
                        <span className="font-bold text-emerald-950 text-sm">{selectedApp.decision.joiningDate}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={() => handleDownloadOfferLetter(selectedApp)}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Download Official Offer Letter (PDF)</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedApp.status === 'Pending' && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 text-amber-950 space-y-2 text-xs">
                  <h4 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Review in Progress</span>
                  </h4>
                  <p className="leading-relaxed text-amber-900/90">
                    Your application is currently being evaluated by our engineering and recruitment leadership. Once a decision is reached, you will be notified via email and this status dashboard will be updated instantly.
                  </p>
                </div>
              )}

              {selectedApp.status === 'Rejected' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-700 space-y-2 text-xs">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-slate-500" />
                    <span>Application Cycle Concluded</span>
                  </h4>
                  <p className="leading-relaxed">
                    Thank you for your interest in Company Tech. While we were unable to extend an offer for this cohort due to competitive applicant volume, your profile remains in our talent database for future consideration.
                  </p>
                </div>
              )}
            </div>

            {/* Profile Overview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-3 mb-5">
              <div>
                <span className="text-slate-400 block text-[11px]">College / University</span>
                <span className="font-semibold text-slate-800">{selectedApp.college}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Academic Year</span>
                <span className="font-semibold text-slate-800">{selectedApp.pursuingYear}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Experience Level</span>
                <span className="font-semibold text-slate-800">{selectedApp.experienceLevel}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Signatory</span>
                <span className="font-semibold text-slate-800">HR Support and Co-Founder</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
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
