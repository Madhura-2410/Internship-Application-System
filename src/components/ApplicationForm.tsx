import React, { useState } from 'react';
import {
  APPROVED_ROLES,
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
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface ApplicationFormProps {
  initialRole?: InternshipRole;
  onTrackApplication: (applicationId: string, email: string) => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  initialRole,
  onTrackApplication,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [pursuingYear, setPursuingYear] = useState('3rd Year');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Fresher');
  const [selectedRole, setSelectedRole] = useState<InternshipRole>(
    initialRole || 'Frontend Developer'
  );

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

  // Update selected role if initialRole changes
  React.useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
    }
  }, [initialRole]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const file = e.target.files[0];
    const allowedExtensions = ['pdf', 'doc', 'docx'];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !allowedExtensions.includes(ext)) {
      setFileError('Invalid file type. Please upload a PDF, DOC, or DOCX document.');
      return;
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds the 5MB maximum limit.');
      return;
    }

    setResumeFile(file);

    // Convert to Base64 for secure backend transport
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

    // Client-side validation
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
          role: selectedRole,
          resumeFileName: resumeFile?.name,
          resumeBase64: resumeBase64 || undefined,
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
        role: selectedRole,
        emailProcessing: data.emailProcessing,
      });

      // Clear form
      setFullName('');
      setEmail('');
      setCollege('');
      setResumeFile(null);
      setResumeBase64(null);
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

  if (submittedData) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Application Confirmed
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-3">
            Application Successfully Submitted to Company Tech!
          </h2>
          <p className="text-slate-600 text-sm mt-2 max-w-lg mx-auto">
            Your application has been validated and recorded in Cloud Firestore with an immutable server timestamp.
          </p>
        </div>

        {/* Application ID Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 my-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Official Application Identifier
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
            <span><strong>Registered Email:</strong> {submittedData.email}</span>
          </div>
        </div>

        {/* Notification Delivery Diagnostic */}
        <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-700">
              <p className="font-semibold text-teal-900">Email Notifications Triggered</p>
              <p className="mt-0.5">
                Confirmation email initiated for <strong>{submittedData.email}</strong> and new-candidate alert sent to admissions support.
                {submittedData.emailProcessing?.applicantConfirmation.status === 'Sent' ? (
                  <span className="text-emerald-700 font-medium block mt-1">
                    ✓ Outbound provider accepted confirmation message (Ref: {submittedData.emailProcessing.applicantConfirmation.messageId || 'Queued'}).
                  </span>
                ) : submittedData.emailProcessing?.applicantConfirmation.status === 'Failed' ? (
                  <span className="text-amber-700 font-medium block mt-1">
                    ℹ️ Email dispatch noted: {submittedData.emailProcessing.applicantConfirmation.error || 'Outbound provider credentials pending in environment'}. Your application record is securely stored in Firestore and can be retried by administration.
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          <button
            onClick={() => onTrackApplication(submittedData.applicationId, submittedData.email)}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Track Application Status</span>
          </button>
          <button
            onClick={() => setSubmittedData(null)}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-10 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          Company Tech Careers & Admissions
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
          Internship Application Portal
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-xl mx-auto">
          Submit your profile for review by our engineering and business leadership. Selected applicants receive formal offer letters and certified experience certificates.
        </p>
      </div>

      {/* Duplicate Notice Banner */}
      {duplicateWarning && (
        <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <h4 className="font-bold">Duplicate Application Notice</h4>
            <p className="mt-1 leading-relaxed">{duplicateWarning}</p>
          </div>
        </div>
      )}

      {/* Server Error Banner */}
      {serverError && (
        <div className="mb-6 bg-rose-50 border border-rose-300 rounded-xl p-4 text-rose-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <h4 className="font-bold">Submission Error</h4>
            <p className="mt-1">{serverError}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
      >
        {/* Section 1: Candidate Details */}
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
              1
            </span>
            <span>Personal & Academic Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
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
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm"
              />
            </div>

            {/* Email */}
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
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Official offer documents & updates will be dispatched here.
              </span>
            </div>

            {/* College */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College / University <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. National Institute of Technology"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm"
              />
            </div>

            {/* Pursuing Year */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pursuing Academic Year <span className="text-rose-500">*</span>
              </label>
              <select
                value={pursuingYear}
                onChange={(e) => setPursuingYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-sm bg-white"
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
          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Experience Level <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  experienceLevel === 'Fresher'
                    ? 'border-teal-600 bg-teal-50/50 text-teal-950 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="experienceLevel"
                  checked={experienceLevel === 'Fresher'}
                  onChange={() => setExperienceLevel('Fresher')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <div className="text-xs font-bold">Fresher</div>
                  <div className="text-[11px] text-slate-500">Student or newcomer</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  experienceLevel === 'Experienced'
                    ? 'border-teal-600 bg-teal-50/50 text-teal-950 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="experienceLevel"
                  checked={experienceLevel === 'Experienced'}
                  onChange={() => setExperienceLevel('Experienced')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <div className="text-xs font-bold">Experienced</div>
                  <div className="text-[11px] text-slate-500">Prior internship/projects</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Selected Role */}
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
              2
            </span>
            <span>Select Internship Role (12 Approved Positions)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {APPROVED_ROLES.map((r) => {
              const isSelected = selectedRole === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all text-left flex flex-col justify-between ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      {r.category}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                  </div>
                  <div className="text-xs font-bold text-slate-900">{r.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Resume Upload (Optional) */}
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
                3
              </span>
              <span>Resume / Portfolio Attachment</span>
            </div>
            <span className="text-xs font-normal text-slate-400">Optional</span>
          </h3>

          {resumeFile ? (
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-teal-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-sm">
                    {resumeFile.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {(resumeFile.size / 1024 / 1024).toFixed(2)} MB • Ready for review
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <label className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-teal-50/20 transition-all">
                <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-800">
                  Click to select resume document or drag and drop
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Supported: PDF, DOC, DOCX (Max: 5MB)
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {fileError && (
                <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fileError}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Duplicate Policy Note */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
          <strong>Admissions Policy:</strong> Each candidate may maintain one active application under evaluation per role. If an earlier cycle was concluded as rejected, subsequent applications for future cohorts are permitted. Valid applications are never discarded silently.
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Recording Application & Generating ID...</span>
              </>
            ) : (
              <>
                <span>Submit Internship Application</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
