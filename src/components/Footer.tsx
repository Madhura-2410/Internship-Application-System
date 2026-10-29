import React from 'react';
import { Briefcase, ShieldCheck, Mail, Globe, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 text-white font-bold text-base mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                <Briefcase className="w-4 h-4" />
              </div>
              <span>COMPANY TECH</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-4">
              Autonomous, scalable technology solutions and global student talent development. Our structured internship tracks provide production engineering immersion and accredited appointments.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Certified Admissions & Secure Document Delivery</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              12 Cohort Tracks
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>Frontend & Backend Engineering</li>
              <li>Full-Stack Development</li>
              <li>AI / ML Research & Integration</li>
              <li>UI/UX & Graphic Design</li>
              <li>Digital Growth & Marketing</li>
              <li>Technical Content & HR Operations</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Admissions Support
            </h4>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>admissions@companytech.internal</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>admissions.companytech.internal</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Global Technology Park, Suite 400</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} Company Tech Innovations. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Confidential Admissions System</span>
            <span>•</span>
            <span>Firestore Persistent Storage</span>
            <span>•</span>
            <span>Zero Data Discard Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
