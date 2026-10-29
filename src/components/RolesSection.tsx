import React from 'react';
import { APPROVED_ROLES, InternshipRole } from '../types';
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
} from 'lucide-react';

interface RolesSectionProps {
  onSelectRole: (role: InternshipRole) => void;
}

const getRoleIcon = (role: InternshipRole) => {
  switch (role) {
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
  }
};

export const RolesSection: React.FC<RolesSectionProps> = ({ onSelectRole }) => {
  return (
    <section className="py-12 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Open Internship Cohorts 2026
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mt-3">
            12 Approved Internship Tracks at Company Tech
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Accelerate your professional trajectory with hands-on projects, executive mentorship, and official certified credentials upon completion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {APPROVED_ROLES.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-teal-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    {getRoleIcon(role.id)}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {role.category}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-1.5">{role.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  {role.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Accepting Candidates</span>
                </div>
                <button
                  onClick={() => onSelectRole(role.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:gap-1.5 transition-all"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
