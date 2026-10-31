import React, { useState, useEffect } from 'react';
import { InternshipRequirement, APPROVED_ROLES } from '../types';
import {
  Briefcase,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Users,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  RotateCcw,
  Search,
  Filter,
  Eye,
  X,
  Lock,
  Unlock,
} from 'lucide-react';

interface PostRequirementProps {
  adminEmail: string;
  onRequirementUpdated?: () => void;
}

export const PostRequirement: React.FC<PostRequirementProps> = ({
  adminEmail,
  onRequirementUpdated,
}) => {
  const [requirements, setRequirements] = useState<(InternshipRequirement & { applicationCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form Mode: 'create' or 'edit'
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [jobTitle, setJobTitle] = useState('Frontend Developer');
  const [customTitle, setCustomTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState(
    'Build modern, responsive, and high-performance user interfaces using React, TypeScript, and Tailwind CSS. Work directly with senior engineering mentors on production tasks.'
  );
  const [requiredSkills, setRequiredSkills] = useState('React, TypeScript, Tailwind CSS, Vite, HTML/CSS');
  const [eligibilityCriteria, setEligibilityCriteria] = useState(
    'Open to 1st–4th year undergrads & graduates in CS/IT or related fields with proficiency in web fundamentals.'
  );
  const [experienceLevel, setExperienceLevel] = useState<'Fresher' | 'Experienced' | 'Both'>('Both');
  const [duration, setDuration] = useState('1, 2, or 3 Months');
  const [openingsCount, setOpeningsCount] = useState<number>(5);
  const [location, setLocation] = useState('Remote / Hybrid (Bangalore)');
  const [applicationDeadline, setApplicationDeadline] = useState('2026-12-31');
  const [status, setStatus] = useState<'open' | 'closed'>('open');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

  const fetchRequirements = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/requirements');
      if (!res.ok) throw new Error('Failed to retrieve requirements from Firestore.');
      const data = await res.json();
      setRequirements(data.requirements || []);
    } catch (err: any) {
      console.error('Fetch requirements error:', err);
      setActionError(err.message || 'Failed to fetch requirements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const handleRoleSelection = (selected: string) => {
    setJobTitle(selected);
    const approved = APPROVED_ROLES.find((r) => r.id === selected);
    if (approved) {
      setDepartment(approved.category);
      setDescription(`${approved.description} Work directly alongside senior engineering and product leaders at Company Tech.`);
      setEligibilityCriteria(approved.eligibility);
      if (selected === 'Frontend Developer') setRequiredSkills('React, TypeScript, Tailwind CSS, Vite, HTML/CSS');
      else if (selected === 'Backend Developer') setRequiredSkills('Node.js, Express, Cloud Firestore, REST APIs, TypeScript');
      else if (selected === 'Full-Stack Developer') setRequiredSkills('React, Node.js, TypeScript, Firestore, Tailwind CSS');
      else if (selected === 'AI/ML Engineer') setRequiredSkills('Python, TypeScript, Gemini API, Machine Learning, NLP');
      else if (selected === 'UI/UX Designer') setRequiredSkills('Figma, Wireframing, User Research, Design Systems, Prototyping');
      else if (selected === 'Graphic Designer') setRequiredSkills('Photoshop, Illustrator, Figma, Visual Design, Branding');
      else if (selected === 'Digital Marketing Intern') setRequiredSkills('SEO, Google Analytics, Content Marketing, Ad Campaigns');
      else if (selected === 'Social Media Manager') setRequiredSkills('Social Media Strategy, Copywriting, Canva, Community Engagement');
      else if (selected === 'Content Writer') setRequiredSkills('Technical Writing, Copywriting, SEO Content, Documentation');
      else if (selected === 'Business Development Intern') setRequiredSkills('Market Research, Lead Generation, Client Outreach, Presentations');
      else if (selected === 'Community Manager') setRequiredSkills('Discord/Slack Moderation, Event Planning, Tech Outreach, Hackathons');
      else setRequiredSkills('Talent Sourcing, Applicant Screening, Interview Coordination, HR Operations');
    }
  };

  const handleEditClick = (req: InternshipRequirement) => {
    setEditingId(req.id);
    const isApproved = APPROVED_ROLES.some((r) => r.id === req.jobTitle);
    if (isApproved) {
      setJobTitle(req.jobTitle);
      setCustomTitle('');
    } else {
      setJobTitle('Custom');
      setCustomTitle(req.jobTitle);
    }
    setDepartment(req.department);
    setDescription(req.description);
    setRequiredSkills(Array.isArray(req.requiredSkills) ? req.requiredSkills.join(', ') : req.requiredSkills);
    setEligibilityCriteria(req.eligibilityCriteria);
    setExperienceLevel(req.experienceLevel || 'Both');
    setDuration(req.duration || '1, 2, or 3 Months');
    setOpeningsCount(req.openingsCount || 5);
    setLocation(req.location || 'Remote');
    setApplicationDeadline(req.applicationDeadline || '2026-12-31');
    setStatus(req.status || 'open');

    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setJobTitle('Frontend Developer');
    setCustomTitle('');
    handleRoleSelection('Frontend Developer');
    setStatus('open');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const finalTitle = jobTitle === 'Custom' ? customTitle.trim() : jobTitle;
    if (!finalTitle) {
      setActionError('Please specify a valid Job Title.');
      return;
    }

    if (description.trim().length < 10) {
      setActionError('Please provide a detailed description (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        jobTitle: finalTitle,
        department,
        description: description.trim(),
        requiredSkills,
        eligibilityCriteria: eligibilityCriteria.trim(),
        experienceLevel,
        duration,
        openingsCount: Number(openingsCount) || 5,
        location,
        applicationDeadline,
        status,
      };

      if (editingId) {
        // Update
        const res = await fetch(`/api/requirements/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': adminEmail,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update requirement.');
        setActionSuccess(`Successfully updated requirement "${finalTitle}".`);
        setEditingId(null);
      } else {
        // Create
        const res = await fetch('/api/requirements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': adminEmail,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to post requirement.');
        setActionSuccess(`Successfully published new requirement "${finalTitle}" to Cloud Firestore.`);
      }

      await fetchRequirements();
      if (onRequirementUpdated) onRequirementUpdated();
    } catch (err: any) {
      console.error('Submit requirement error:', err);
      setActionError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (req: InternshipRequirement) => {
    setActionError(null);
    setActionSuccess(null);
    const newStatus = req.status === 'open' ? 'closed' : 'open';
    try {
      const res = await fetch(`/api/requirements/${req.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update requirement status.');
      setActionSuccess(
        `Requirement "${req.jobTitle}" is now ${newStatus === 'open' ? 'OPEN (Accepting Applications)' : 'CLOSED'}.`
      );
      await fetchRequirements();
      if (onRequirementUpdated) onRequirementUpdated();
    } catch (err: any) {
      console.error('Toggle status error:', err);
      setActionError(err.message || 'Failed to toggle status.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the requirement for "${title}" from Firestore?`)) {
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/requirements/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-email': adminEmail,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete requirement.');
      setActionSuccess(`Deleted requirement "${title}".`);
      await fetchRequirements();
      if (onRequirementUpdated) onRequirementUpdated();
    } catch (err: any) {
      console.error('Delete requirement error:', err);
      setActionError(err.message || 'Failed to delete requirement.');
    }
  };

  const filteredRequirements = requirements.filter((req) => {
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        req.jobTitle.toLowerCase().includes(q) ||
        req.department.toLowerCase().includes(q) ||
        req.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white mb-8 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
                Admin Suite
              </span>
              <span className="text-xs text-slate-400">Cloud Firestore Storage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
              Post & Manage Internship Requirements
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Publish new internship openings or modify active cohort requirements. Updates reflect immediately on the candidate Open Roles portal with live application counters.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRequirements}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Postings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{actionError}</div>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{actionSuccess}</div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  {editingId ? <Edit2 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingId ? 'Edit Requirement' : 'Publish New Opening'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {editingId ? 'Updating existing Firestore document' : 'Saves directly to Cloud Firestore'}
                  </p>
                </div>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded-lg hover:bg-slate-100"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Job Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Internship Track / Job Title <span className="text-rose-500">*</span>
                </label>
                <select
                  value={jobTitle}
                  onChange={(e) => handleRoleSelection(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {APPROVED_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.category})
                    </option>
                  ))}
                  <option value="Custom">+ Custom Requirement</option>
                </select>
              </div>

              {jobTitle === 'Custom' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Custom Track Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Cloud Security Intern"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Department & Experience */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Content">Content</option>
                    <option value="Business">Business</option>
                    <option value="Community">Community</option>
                    <option value="Human Resources">Human Resources</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as any)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Both">Both (Fresher & Exp)</option>
                    <option value="Fresher">Fresher Only</option>
                    <option value="Experienced">Experienced Only</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Job Description & Responsibilities <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize key tasks, deliverables, and projects..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Required Skills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Required Skills <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="e.g. React, TypeScript, Git, Tailwind"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Eligibility Criteria */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Eligibility Criteria</label>
                <input
                  type="text"
                  value={eligibilityCriteria}
                  onChange={(e) => setEligibilityCriteria(e.target.value)}
                  placeholder="e.g. Enrolled undergraduate or 2024–2027 graduate"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Openings & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Openings Count</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={openingsCount}
                    onChange={(e) => setOpeningsCount(Number(e.target.value) || 1)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 1, 2, or 3 Months"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Location & Deadline */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Remote / Hybrid (Bangalore)"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={applicationDeadline}
                    onChange={(e) => setApplicationDeadline(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Status: {status === 'open' ? 'Open' : 'Closed'}</span>
                  <span className="text-[10px] text-slate-500">
                    {status === 'open' ? 'Actively accepting applications' : 'Applications closed for this role'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus(status === 'open' ? 'closed' : 'open')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    status === 'open'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {status === 'open' ? 'Mark Closed' : 'Mark Open'}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving to Firestore...</span>
                  </>
                ) : editingId ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Publish Requirement to Firestore</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Requirements List Column */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Current Openings & Cohorts ({requirements.length})
                </h2>
                <p className="text-[11px] text-slate-500">
                  Manage availability, edit details, or track application volumes
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search roles..."
                    className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-36 sm:w-44"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs font-semibold px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="open">Open Only</option>
                  <option value="closed">Closed Only</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
                Loading postings from Cloud Firestore...
              </div>
            ) : filteredRequirements.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No matching requirements found. Use the form on the left to publish one.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequirements.map((req) => {
                  const isOpen = req.status === 'open';
                  const appCount = req.applicationCount || 0;

                  return (
                    <div
                      key={req.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isOpen
                          ? 'bg-white border-slate-200 hover:border-teal-300 shadow-2xs'
                          : 'bg-slate-50/60 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                              {req.jobTitle}
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {req.department}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                                isOpen
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span>{isOpen ? 'Open' : 'Closed'}</span>
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                              {appCount} {appCount === 1 ? 'applicant' : 'applicants'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                            {req.description}
                          </p>

                          {/* Chips */}
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 font-medium">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{req.location || 'Remote'}</span>
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>{req.openingsCount} openings</span>
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{req.duration}</span>
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Deadline: {req.applicationDeadline}</span>
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <button
                            onClick={() => handleToggleStatus(req)}
                            title={isOpen ? 'Close applications' : 'Reopen applications'}
                            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                              isOpen
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {isOpen ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            <span>{isOpen ? 'Close' : 'Reopen'}</span>
                          </button>

                          <button
                            onClick={() => handleEditClick(req)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDelete(req.id, req.jobTitle)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
