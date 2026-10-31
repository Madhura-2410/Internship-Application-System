import React, { useState } from 'react';
import { Mail, Phone, Clock, MapPin, Check, Copy, X, Building, ShieldCheck } from 'lucide-react';
import { InternshipRole } from '../types';

interface ContactModalProps {
  role?: InternshipRole | null;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ role, onClose }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const hrEmail = 'admissions@companytech.internal';
  const hrPhone = '+1 (555) 019-2834';
  const hrPhoneClean = '+15550192834';

  const copyToClipboard = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Admissions & HR Support
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Contact Company Tech
            </h3>
          </div>
        </div>

        {role && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 text-xs text-slate-600">
            <span className="text-slate-400 block text-[11px]">Inquiring regarding track:</span>
            <span className="font-bold text-slate-800 text-sm">{role}</span>
          </div>
        )}

        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          Have questions regarding role requirements, eligibility, stipend structure, or onboarding? Connect directly with our Human Resources and Admissions committee via official channels.
        </p>

        {/* Contact Options */}
        <div className="space-y-3.5 mb-6">
          {/* Email Option */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Official Admissions Email
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">
                  {hrEmail}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`mailto:${hrEmail}?subject=Inquiry: ${role || 'Internship Application'} - Company Tech`}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </a>
              <button
                onClick={() => copyToClipboard(hrEmail, 'email')}
                className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs transition-colors"
                title="Copy email to clipboard"
              >
                {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Phone Call Option */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Admissions Hotline & Telephone
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">
                  {hrPhone}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${hrPhoneClean}`}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>
              <button
                onClick={() => copyToClipboard(hrPhone, 'phone')}
                className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs transition-colors"
                title="Copy phone number to clipboard"
              >
                {copiedPhone ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Operating Meta */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-2 mb-5">
          <div className="flex items-center gap-2 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span><strong>Admissions Office Hours:</strong> Monday – Friday: 9:00 AM – 6:00 PM EST</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span><strong>Location:</strong> Company Tech Admissions, Global Technology Park, Suite 400</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-emerald-800 font-medium">Responses guaranteed within 24–48 business hours.</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
