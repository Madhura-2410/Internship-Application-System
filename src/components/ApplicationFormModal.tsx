import React, { useState } from 'react';
import {
  InternshipRole,
  ExperienceLevel,
  EmailProcessingState,
} from '../types';
import {
  Briefcase,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Copy,
  Check,
  Search,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ApplicationFormModalProps {
  role: InternshipRole;
  userEmail: string;
  userName?: string;
  userUid?: string;
  onClose: () => void;
  onSuccessNavigateToTracker: (applicationId: string) => void;
}

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  role,
  userEmail,
  userName = '',
  userUid = '',
  onClose,
  onSuccessNavigateToTracker,
}) => {
  const [fullName, setFullName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');
  const [college, setCollege] = useState('');
  const [pursuingYear, setPursuingYear] = useState('3rd Year');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Fresher');

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeBase64, setResumeBase64] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Success state
  const [submittedData, setSubmittedData] = useState<{
    applicationId: string;
    appliedAt: string;
    email: string;
    role: string;
    emailProcessing?: EmailProcessingState;
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const allowedExtensions = ['pdf', 'doc', 'docx'];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !allowedExtensions.includes(ext)) {
      setFileError('Invalid file type. Please upload a PDF, DOC, or DOCX document.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds the 5MB maximum limit.');
      return;
    }

    setResumeFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setResumeBase64(reader.result as string);
    };
    reader.onerror = () => {
      setFileError('Failed to read the file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setResumeFile(null);
    setResumeBase64(null);
    setFileError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setDuplicateWarning(null);

    if (fullName.trim().length < 2) {
      setServerError('Please enter your full name (minimum 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setServerError('Please enter a valid email address.');
      return;
    }

    if (college.trim().length < 2) {
      setServerError('Please enter your college or university name.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          college: college.trim(),
          pursuingYear,
          experienceLevel,
          role,
          resumeFileName: resumeFile?.name,
          resumeBase64: resumeBase64 || undefined,
          applicantUid: userUid || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setDuplicateWarning(data.error);
        } else {
          setServerError(data.error || 'Failed to submit application. Please check your network and retry.');
        }
        setIsSubmitting(false);
        return;
      }

      // Success
      setSubmittedData({
        applicationId: data.applicationId,
        appliedAt: data.appliedAt,
        email: email.trim().toLowerCase(),
        role,
        emailProcessing: data.emailProcessing,
      });
    } catch (err: any) {
      console.error('Submission error:', err);
      setServerError('An unexpected network error occurred while submitting. Please verify your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedData ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Application Successfully Registered
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-3">
              Application Submitted for {submittedData.role}
            </h2>
            <p className="text-slate-600 text-sm mt-2 max-w-lg mx-auto">
              Your application has been validated and recorded with an immutable timestamp in Cloud Firestore.
            </p>

            {/* Application ID Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 my-6 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Your Official Application Identifier
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl font-extrabold text-slate-900 tracking-wider">
                  {submittedData.applicationId}
                </span>
                <button
                  onClick={() => handleCopyId(submittedData.applicationId)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 text-xs"
                  title="Copy ID to Clipboard"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
                <span><strong>Track:</strong> {submittedData.role}</span>
                <span>•</span>
                <span><strong>Account:</strong> {submittedData.email}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <button
                onClick={() => onSuccessNavigateToTracker(submittedData.applicationId)}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Search className="w-4 h-4" />
                <span>Go to Track Application Status</span>
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Back to Open Roles
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Form Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  Internship Application
                </span>
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  Company Tech 2026 Cohort
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-2">
                Apply for {role}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fill in your academic and background details. Submissions are reviewed directly by Company Tech evaluators.
              </p>
            </div>

            {/* Duplicate Notice Banner */}
            {duplicateWarning && (
              <div className="mb-5 bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 flex items-start gap-3 shadow-xs">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <h4 className="font-bold">Duplicate Application Notice</h4>
                  <p className="mt-1 leading-relaxed">{duplicateWarning}</p>
                </div>
              </div>
            )}

            {/* Server Error Banner */}
            {serverError && (
              <div className="mb-5 bg-rose-50 border border-rose-300 rounded-xl p-4 text-rose-900 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <h4 className="font-bold">Submission Error</h4>
                  <p className="mt-1">{serverError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Target Role Badge */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-teal-800 font-bold block text-[11px] uppercase tracking-wider">
                    Selected Internship Track
                  </span>
                  <span className="font-bold text-teal-950 text-sm">{role}</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  Confirmed Role
                </span>
              </div>

              {/* Personal details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. alex.morgan@university.edu"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-xs sm:text-sm"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Associated with your account credentials.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    College / University <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pursuing Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={pursuingYear}
                    onChange={(e) => setPursuingYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-xs sm:text-sm bg-white"
                  >
                    <option value="1st Year">1st Year (Freshman)</option>
                    <option value="2nd Year">2nd Year (Sophomore)</option>
                    <option value="3rd Year">3rd Year (Junior)</option>
                    <option value="4th Year">4th Year (Senior)</option>
                    <option value="Graduated / Post-Graduate">Graduated / Post-Graduate</option>
                  </select>
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Experience Level <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      experienceLevel === 'Fresher'
                        ? 'border-teal-600 bg-teal-50/50 text-teal-950 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalExperienceLevel"
                      checked={experienceLevel === 'Fresher'}
                      onChange={() => setExperienceLevel('Fresher')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="text-xs font-bold">Fresher</div>
                      <div className="text-[10px] text-slate-500">Student / Beginner</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      experienceLevel === 'Experienced'
                        ? 'border-teal-600 bg-teal-50/50 text-teal-950 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalExperienceLevel"
                      checked={experienceLevel === 'Experienced'}
                      onChange={() => setExperienceLevel('Experienced')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="text-xs font-bold">Experienced</div>
                      <div className="text-[10px] text-slate-500">Prior projects / internship</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Resume Upload (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resume / CV Document (Optional)
                </label>

                {resumeFile ? (
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-teal-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-sm">
                          {resumeFile.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB • Ready for submission
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-teal-50/20 transition-all">
                      <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-800">
                        Click to select resume (PDF, DOC, DOCX up to 5MB)
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    {fileError && (
                      <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{fileError}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-teal-700 transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Validating & Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Application</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
