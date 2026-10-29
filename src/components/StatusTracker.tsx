import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileDown,
  AlertCircle,
  Building,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { downloadOfferLetterPdf } from '../lib/pdfGenerator';

interface StatusTrackerProps {
  initialApplicationId?: string;
  initialEmail?: string;
}

export const StatusTracker: React.FC<StatusTrackerProps> = ({
  initialApplicationId = '',
  initialEmail = '',
}) => {
  const [appId, setAppId] = useState(initialApplicationId);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<any | null>(null);

  // Auto-search if initialApplicationId is supplied
  React.useEffect(() => {
    if (initialApplicationId) {
      setAppId(initialApplicationId);
      if (initialEmail) setEmail(initialEmail);
      performSearch(initialApplicationId, initialEmail);
    }
  }, [initialApplicationId, initialEmail]);

  const performSearch = async (idToSearch: string, emailToSearch: string) => {
    if (!idToSearch.trim()) {
      setError('Please enter your Application ID.');
      return;
    }

    setLoading(true);
    setError(null);
    setRecord(null);

    try {
      const params = new URLSearchParams({ applicationId: idToSearch.trim() });
      if (emailToSearch.trim()) {
        params.append('email', emailToSearch.trim().toLowerCase());
      }

      const res = await fetch(`/api/applications/track?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Unable to locate application record.');
        return;
      }

      setRecord(data);
    } catch (err: any) {
      console.error('Track error:', err);
      setError('Failed to reach the admissions server. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(appId, email);
  };

  const handleDownloadOfferLetter = () => {
    if (!record) return;
    if (record.offerLetterUrl && record.offerLetterUrl.startsWith('data:application/pdf')) {
      const link = document.createElement('a');
      link.href = record.offerLetterUrl;
      link.download = `Company_Tech_Offer_Letter_${record.applicationId}.pdf`;
      link.click();
    } else {
      // Fallback: Generate fresh PDF client-side using record details
      downloadOfferLetterPdf({
        applicationId: record.applicationId,
        fullName: record.fullName,
        email: email || record.email || '',
        college: record.college || 'Candidate University',
        role: record.role,
        duration: record.decision?.duration || '1 month',
        joiningDate: record.decision?.joiningDate || 'Immediate',
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-12 px-4 sm:px-6">
      <div className="text-center mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          Applicant Status Tracking
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
          Track Your Application Status
        </h1>
        <p className="text-slate-600 text-sm mt-2 max-w-lg mx-auto">
          Enter your unique Application ID to inspect live admissions committee decisions, timestamps, and offer documents.
        </p>
      </div>

      {/* Search Card */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Application ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="e.g. CT-2026-X9K2L1"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Email (Optional verification)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@university.edu"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Searching Records...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Check Live Status</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-8 flex items-start gap-3 text-rose-900 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Record Lookup Notice</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Results Display */}
      {record && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-extrabold text-slate-900">
                  {record.applicationId}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Company Tech
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-800 mt-1">
                {record.fullName} • {record.role}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {record.college} • Applied: {new Date(record.appliedAt).toLocaleDateString()}
              </p>
            </div>

            {/* Status Badge */}
            <div>
              {record.status === 'Accepted' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Application Accepted</span>
                </div>
              ) : record.status === 'Rejected' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs">
                  <XCircle className="w-4 h-4 text-slate-500" />
                  <span>Application Concluded</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 font-bold text-xs">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Pending Technical Review</span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Decision Information */}
          {record.status === 'Accepted' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-emerald-950 text-base">
                      Offer of Internship Extended!
                    </h3>
                    <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                      Congratulations! The Company Tech admissions committee has accepted your application for the <strong>{record.role}</strong> track.
                    </p>
                  </div>
                </div>

                {record.decision && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-emerald-200/60 text-xs">
                    <div>
                      <span className="text-emerald-800 font-semibold block">Internship Duration:</span>
                      <span className="font-bold text-emerald-950 text-sm">{record.decision.duration}</span>
                    </div>
                    <div>
                      <span className="text-emerald-800 font-semibold block">Joining Date:</span>
                      <span className="font-bold text-emerald-950 text-sm">{record.decision.joiningDate}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Offer Letter Download Button */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Official Appointment Offer Letter (PDF)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authenticated document issued with Company Tech branding and signature of HR Support and Co-Founder.
                  </p>
                </div>
                <button
                  onClick={handleDownloadOfferLetter}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-xs shrink-0"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Offer Letter (PDF)</span>
                </button>
              </div>
            </div>
          )}

          {record.status === 'Pending' && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 text-amber-950 text-xs space-y-2">
              <h4 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Review Currently in Progress</span>
              </h4>
              <p className="leading-relaxed">
                Your application has been logged in Cloud Firestore and queued for evaluation by our recruitment panel.
                Decision updates and appointment documents will be reflected here and communicated via email.
              </p>
            </div>
          )}

          {record.status === 'Rejected' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-700 text-xs space-y-2">
              <h4 className="font-bold text-sm text-slate-900">
                Application Status Update
              </h4>
              <p className="leading-relaxed">
                Thank you for your interest in Company Tech. Due to a high volume of competitive applicants for this cycle, we are unable to extend an offer for this cohort. We encourage you to participate in upcoming application cycles.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
