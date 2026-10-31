import React from 'react';
import { Briefcase, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          {/* Brand & Short Description */}
          <div className="max-w-md">
            <div className="flex items-center gap-2.5 text-white font-bold text-base mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="tracking-tight">COMPANY TECH</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Empowering next-generation technology leaders through structured, high-impact internship tracks and production-grade engineering immersion.
            </p>
          </div>

          {/* Essential Contact Details */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-xs">
            <a
              href="mailto:admissions@companytech.internal"
              className="flex items-center gap-2 text-slate-300 hover:text-teal-400 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>admissions@companytech.internal</span>
            </a>

            <a
              href="tel:+15550192834"
              className="flex items-center gap-2 text-slate-300 hover:text-teal-400 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>+1 (555) 019-2834</span>
            </a>

            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Global Technology Park, Suite 400</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} Company Tech Innovations. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Admissions & Recruitment Portal</span>
            <span>•</span>
            <span>Accredited Appointment Credentials</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
