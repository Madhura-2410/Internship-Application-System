import React, { useState, useEffect } from 'react';
import { APPROVED_ROLES, InternshipRole, InternshipRequirement } from '../types';
import {
  Code,
  Server,
  Layers,
  Cpu,
  Palette,
  Image,
  TrendingUp,
  Share2,
  FileText,
  Briefcase,
  Users,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  Clock,
  GraduationCap,
  Mail,
  Search,
  MapPin,
  Lock,
} from 'lucide-react';

interface RolesSectionProps {
  onApplyOnline: (role: InternshipRole) => void;
  onContactCompany: (role: InternshipRole) => void;
}

const getRoleIcon = (roleName: string) => {
  switch (roleName) {
    case 'Frontend Developer':
      return <Code className="w-5 h-5 text-indigo-600" />;
    case 'Backend Developer':
      return <Server className="w-5 h-5 text-blue-600" />;
    case 'Full-Stack Developer':
      return <Layers className="w-5 h-5 text-violet-600" />;
    case 'AI/ML Engineer':
      return <Cpu className="w-5 h-5 text-emerald-600" />;
    case 'UI/UX Designer':
      return <Palette className="w-5 h-5 text-pink-600" />;
    case 'Graphic Designer':
      return <Image className="w-5 h-5 text-rose-600" />;
    case 'Digital Marketing Intern':
      return <TrendingUp className="w-5 h-5 text-amber-600" />;
    case 'Social Media Manager':
      return <Share2 className="w-5 h-5 text-cyan-600" />;
    case 'Content Writer':
      return <FileText className="w-5 h-5 text-orange-600" />;
    case 'Business Development Intern':
      return <Briefcase className="w-5 h-5 text-teal-600" />;
    case 'Community Manager':
      return <Users className="w-5 h-5 text-sky-600" />;
    case 'HR Intern':
      return <UserPlus className="w-5 h-5 text-purple-600" />;
    default:
      return <Briefcase className="w-5 h-5 text-teal-600" />;
  }
};

export const RolesSection: React.FC<RolesSectionProps> = ({
  onApplyOnline,
  onContactCompany,
}) => {
  const [requirements, setRequirements] = useState<InternshipRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Engineering',
    'Design',
    'Marketing',
    'Content',
    'Business',
    'Community',
    'Human Resources',
  ];

  // Fetch postings from Cloud Firestore via /api/requirements
  const fetchOpenings = async () => {
    try {
      const res = await fetch('/api/requirements');
      if (res.ok) {
        const data = await res.json();
        if (data.requirements && data.requirements.length > 0) {
          setRequirements(data.requirements);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not fetch requirements from API, using fallback:', e);
    } finally {
      setLoading(false);
    }

    // Fallback: build from APPROVED_ROLES
    const fallbacks: InternshipRequirement[] = APPROVED_ROLES.map((r) => ({
      id: `req-${r.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      jobTitle: r.title,
      department: r.category,
      description: r.description,
      requiredSkills: ['Problem Solving', 'Communication'],
      eligibilityCriteria: r.eligibility,
      experienceLevel: 'Both',
      duration: r.duration,
      openingsCount: 5,
      location: 'Remote / Hybrid (Bangalore)',
      applicationDeadline: '2026-12-31',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    setRequirements(fallbacks);
    setLoading(false);
  };

  useEffect(() => {
    fetchOpenings();
  }, []);

  const filteredRoles = requirements.filter((role) => {
    if (selectedCategory !== 'All' && role.department !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        role.jobTitle.toLowerCase().includes(q) ||
        role.description.toLowerCase().includes(q) ||
        role.department.toLowerCase().includes(q) ||
        (Array.isArray(role.requiredSkills) && role.requiredSkills.some((s) => s.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  return (
    <section className="py-10 bg-slate-50 min-h-[85vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Cloud Firestore Verified Postings
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-3">
            Available Internship Opportunities
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Explore active openings at Company Tech. Review the descriptions, eligibility, and duration below, then apply directly or contact our admissions team.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-8 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search openings by role, tech..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            <div className="w-7 h-7 border-2 border-teal-500/30 border-t-teal-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Loading active opportunities from Cloud Firestore...</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200 p-8">
            <p className="font-bold text-slate-800 text-sm">No openings match your search criteria.</p>
            <p className="text-slate-500 mt-1">Try resetting the filter or search term.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-4 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Roles Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map((role) => {
              const isOpen = role.status === 'open';

              return (
                <div
                  key={role.id}
                  className={`bg-white rounded-2xl border p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                    isOpen ? 'border-slate-200 hover:border-teal-500/40' : 'border-slate-200 bg-slate-50/50 opacity-90'
                  }`}
                >
                  <div>
                    {/* Header: Icon & Category */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        {getRoleIcon(role.jobTitle)}
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {role.department}
                      </span>
                    </div>

                    {/* Role Title */}
                    <h3 className="font-bold text-lg text-slate-900 mb-1.5">{role.jobTitle}</h3>

                    {/* Availability status */}
                    <div className="mb-3.5">
                      {isOpen ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Actively Accepting Applications</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold">
                          <Lock className="w-3 h-3 text-rose-600" />
                          <span>Applications Closed for this Cohort</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {role.description}
                    </p>

                    {/* Required Skills Chips */}
                    {role.requiredSkills && role.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {role.requiredSkills.slice(0, 4).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                        {role.requiredSkills.length > 4 && (
                          <span className="text-[10px] font-medium text-slate-400 px-1 py-0.5">
                            +{role.requiredSkills.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Role Meta: Eligibility & Duration */}
                    <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs mb-5">
                      {/* Eligibility */}
                      <div className="flex items-start gap-2 text-slate-700">
                        <GraduationCap className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800 block text-[11px]">Eligibility:</span>
                          <span className="text-slate-600 text-[11px] leading-tight block">
                            {role.eligibilityCriteria}
                          </span>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="flex items-start gap-2 text-slate-700">
                        <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800 block text-[11px]">Duration:</span>
                          <span className="text-slate-600 text-[11px] leading-tight block">
                            {role.duration}
                          </span>
                        </div>
                      </div>

                      {/* Location & Openings */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{role.location || 'Remote'}</span>
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{role.openingsCount} Openings</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Apply Online & Contact Company */}
                  <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                    {isOpen ? (
                      <button
                        type="button"
                        onClick={() => onApplyOnline(role.jobTitle as InternshipRole)}
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-teal-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span>Apply Online</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title="Applications are closed for this opening"
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Closed</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onContactCompany(role.jobTitle as InternshipRole)}
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>Contact Company</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
