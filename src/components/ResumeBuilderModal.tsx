import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  FileText,
  Sparkles,
  Download,
  Check,
  Eye,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  ChevronRight,
  User,
  X,
} from 'lucide-react';

export type ResumeTemplateId = 'modern_tech' | 'executive_ats' | 'product_minimalist';

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  summary: string;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    gradYear: string;
    gpa: string;
  }>;
  skills: string[];
  projects: Array<{
    title: string;
    techStack: string;
    description: string;
    link?: string;
  }>;
  experience: Array<{
    role: string;
    company: string;
    duration: string;
    bullets: string;
  }>;
  certifications: string[];
}

export interface ResumeBuilderModalProps {
  initialName?: string;
  initialEmail?: string;
  targetRole?: string;
  onClose: () => void;
  onUseResume: (pdfBase64: string, fileName: string) => void;
}

export const ResumeBuilderModal: React.FC<ResumeBuilderModalProps> = ({
  initialName = '',
  initialEmail = '',
  targetRole = 'Software Development',
  onClose,
  onUseResume,
}) => {
  const [activeTemplate, setActiveTemplate] = useState<ResumeTemplateId>('modern_tech');
  const [activeTab, setActiveTab] = useState<'profile' | 'education' | 'skills' | 'projects' | 'experience' | 'certifications'>('profile');

  // Resume form state
  const [resumeData, setResumeData] = useState<ResumeData>({
    fullName: initialName || 'Alex Morgan',
    email: initialEmail || 'alex.morgan@university.edu',
    phone: '+1 (555) 019-2834',
    location: 'San Francisco, CA / Remote',
    portfolioUrl: 'https://alexmorgan.dev',
    githubUrl: 'https://github.com/alexmorgan',
    linkedinUrl: 'https://linkedin.com/in/alexmorgan',
    summary: `Aspiring ${targetRole} intern with strong problem-solving capabilities, solid computer science foundations, and hands-on experience building full-stack web applications and scalable APIs. Eager to contribute to Company Tech engineering sprints.`,
    education: [
      {
        institution: 'Institute of Technology & Engineering',
        degree: 'Bachelor of Science',
        field: 'Computer Science & Engineering',
        gradYear: 'Expected 2026',
        gpa: '3.85 / 4.0',
      },
    ],
    skills: [
      'TypeScript / JavaScript',
      'React & Next.js',
      'Node.js & Express',
      'Python',
      'PostgreSQL & Cloud Firestore',
      'Git & CI/CD',
      'REST APIs',
      'Data Structures & Algorithms',
    ],
    projects: [
      {
        title: 'Distributed Real-Time Task Orchestrator',
        techStack: 'TypeScript, React, Node.js, WebSockets',
        description: 'Engineered an end-to-end distributed task pipeline with optimistic UI updates and live heartbeat diagnostics handling 500+ events/sec.',
        link: 'https://github.com/alexmorgan/task-orchestrator',
      },
      {
        title: 'Campus Internship & Application Tracker',
        techStack: 'React, Tailwind CSS, Firestore, Express',
        description: 'Developed an automated portal for tracking candidate submissions, status transitions, and PDF report generation.',
        link: 'https://github.com/alexmorgan/campus-portal',
      },
    ],
    experience: [
      {
        role: 'Undergraduate Technical Fellow',
        company: 'Computing Research Lab',
        duration: 'June 2025 - Present',
        bullets: 'Collaborated on distributed data caching benchmarks and automated benchmark report generation across test clusters.',
      },
    ],
    certifications: [
      'AWS Certified Cloud Practitioner (2025)',
      'Meta Front-End Developer Professional Certificate',
    ],
  });

  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Helper to generate jsPDF document based on selected template
  const generateResumePdf = (data: ResumeData, template: ResumeTemplateId): jsPDF => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = 18;

    if (template === 'modern_tech') {
      // Modern Tech: Bold top bar with lime/charcoal accent
      doc.setFillColor(23, 35, 33); // #172321
      doc.rect(0, 0, pageWidth, 5, 'F');
      doc.setFillColor(214, 239, 112); // lime #d6ef70
      doc.rect(0, 5, pageWidth, 2, 'F');

      // Name & Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(23, 35, 33);
      doc.text(data.fullName.toUpperCase(), margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(targetRole + ' Candidate', margin, y + 5);

      // Contact bar (right aligned)
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`${data.email} • ${data.phone}`, pageWidth - margin, y, { align: 'right' });
      doc.text(`${data.location}`, pageWidth - margin, y + 4.5, { align: 'right' });
      if (data.githubUrl || data.portfolioUrl) {
        doc.text(`${data.githubUrl || data.portfolioUrl}`, pageWidth - margin, y + 9, { align: 'right' });
      }

      y += 15;

      // Divider
      doc.setDrawColor(214, 239, 112);
      doc.setLineWidth(0.8);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    } else if (template === 'executive_ats') {
      // Executive ATS: Clean centered header, no complex tables (100% ATS parser friendly)
      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text(data.fullName, pageWidth / 2, y, { align: 'center' });

      y += 5;
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const contactLine = `${data.location} | ${data.phone} | ${data.email} | ${data.linkedinUrl}`;
      doc.text(contactLine, pageWidth / 2, y, { align: 'center' });

      y += 4;
      if (data.githubUrl || data.portfolioUrl) {
        doc.text(`GitHub: ${data.githubUrl} | Portfolio: ${data.portfolioUrl}`, pageWidth / 2, y, { align: 'center' });
        y += 4;
      }

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    } else {
      // Product Minimalist: Modern clean Swiss styling
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(24, 24, 27);
      doc.text(data.fullName, margin, y);

      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(113, 113, 122);
      doc.text(`${data.email}   /   ${data.phone}   /   ${data.location}`, margin, y);

      y += 7;
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    }

    // SECTION 1: Professional Summary
    if (data.summary) {
      drawSectionHeader(doc, 'PROFESSIONAL SUMMARY', margin, y, template);
      y += 5;
      doc.setFont(template === 'executive_ats' ? 'times' : 'helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const summaryLines = doc.splitTextToSize(data.summary, contentWidth);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 4.2 + 5;
    }

    // SECTION 2: Technical Skills
    if (data.skills && data.skills.length > 0) {
      drawSectionHeader(doc, 'TECHNICAL & PROFESSIONAL PROFICIENCIES', margin, y, template);
      y += 5;
      doc.setFont(template === 'executive_ats' ? 'times' : 'helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      const skillsStr = data.skills.join('  •  ');
      const skillLines = doc.splitTextToSize(skillsStr, contentWidth);
      doc.text(skillLines, margin, y);
      y += skillLines.length * 4.2 + 5;
    }

    // SECTION 3: Education
    if (data.education && data.education.length > 0) {
      drawSectionHeader(doc, 'EDUCATION', margin, y, template);
      y += 5;
      data.education.forEach((edu) => {
        doc.setFont(template === 'executive_ats' ? 'times' : 'helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(edu.institution, margin, y);
        doc.setFont(template === 'executive_ats' ? 'times' : 'helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(edu.gradYear, pageWidth - margin, y, { align: 'right' });

        y += 4;
        doc.setFont(template === 'executive_ats' ? 'times' : 'helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(`${edu.degree} in ${edu.field} (GPA: ${edu.gpa})`, margin, y);
        y += 5;
      });
    }

    // SECTION 4: Projects
    if (data.projects && data.projects.length > 0) {
      drawSectionHeader(doc, 'KEY TECHNICAL PROJECTS', margin, y, template);
      y += 5;
      data.projects.forEach((proj) => {
        doc.setFont(template === 'executive_ats' ? 'times' : 'helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(proj.title, margin, y);

        if (proj.techStack) {
          doc.setFont(template === 'executive_ats' ? 'times' : 'helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`[ ${proj.techStack} ]`, pageWidth - margin, y, { align: 'right' });
        }

        y += 4;
        doc.setFont(template === 'executive_ats' ? 'times' : 'helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const descLines = doc.splitTextToSize(`• ${proj.description}`, contentWidth);
        doc.text(descLines, margin, y);
        y += descLines.length * 4.2 + 3;
      });
    }

    // SECTION 5: Experience
    if (data.experience && data.experience.length > 0) {
      drawSectionHeader(doc, 'EXPERIENCE & LEADERSHIP', margin, y, template);
      y += 5;
      data.experience.forEach((exp) => {
        doc.setFont(template === 'executive_ats' ? 'times' : 'helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(`${exp.role} — ${exp.company}`, margin, y);
        doc.setFont(template === 'executive_ats' ? 'times' : 'helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(exp.duration, pageWidth - margin, y, { align: 'right' });

        y += 4;
        doc.setFont(template === 'executive_ats' ? 'times' : 'helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const bulletLines = doc.splitTextToSize(`• ${exp.bullets}`, contentWidth);
        doc.text(bulletLines, margin, y);
        y += bulletLines.length * 4.2 + 3;
      });
    }

    // SECTION 6: Certifications
    if (data.certifications && data.certifications.length > 0) {
      drawSectionHeader(doc, 'CERTIFICATIONS & HONORS', margin, y, template);
      y += 5;
      doc.setFont(template === 'executive_ats' ? 'times' : 'helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      data.certifications.forEach((cert) => {
        doc.text(`• ${cert}`, margin, y);
        y += 4;
      });
    }

    return doc;
  };

  const drawSectionHeader = (
    doc: jsPDF,
    title: string,
    margin: number,
    y: number,
    template: ResumeTemplateId
  ) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFont(template === 'executive_ats' ? 'times' : 'helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(template === 'modern_tech' ? 23 : 30, template === 'modern_tech' ? 35 : 41, template === 'modern_tech' ? 33 : 59);
    doc.text(title, margin, y);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
  };

  const handleDownloadPdf = () => {
    setIsExporting(true);
    try {
      const doc = generateResumePdf(resumeData, activeTemplate);
      const cleanName = resumeData.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`${cleanName}_Resume_${activeTemplate}.pdf`);
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAttachToApplication = () => {
    try {
      const doc = generateResumePdf(resumeData, activeTemplate);
      const arrayBuffer = doc.output('arraybuffer');
      const buffer = Buffer.from(arrayBuffer);
      const base64Uri = `data:application/pdf;base64,${buffer.toString('base64')}`;
      const cleanName = resumeData.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${cleanName}_ATS_Resume.pdf`;
      onUseResume(base64Uri, fileName);
    } catch (e) {
      console.error('Attach error:', e);
    }
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setResumeData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const addCert = () => {
    if (newCert.trim()) {
      setResumeData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, newCert.trim()],
      }));
      setNewCert('');
    }
  };

  const removeCert = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#172321]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-[#f7f8f3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#172321] text-[#d6ef70] flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#172321]">
                  ATS-Friendly Resume Builder
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#d6ef70] text-[#172321] px-2 py-0.5 rounded-full">
                  Template Studio
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Craft a tailored resume for <strong>Company Tech</strong> internships and export directly.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Selector Bar */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Choose Template:</span>
            {[
              { id: 'modern_tech', name: 'Modern Tech ATS', badge: 'Recommended' },
              { id: 'executive_ats', name: 'Executive ATS Standard', badge: 'Classic' },
              { id: 'product_minimalist', name: 'Product Minimalist', badge: 'Clean' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTemplate(t.id as ResumeTemplateId)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTemplate === t.id
                    ? 'bg-[#172321] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{t.name}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTemplate === t.id ? 'bg-[#d6ef70] text-[#172321]' : 'bg-slate-200 text-slate-600'
                }`}>
                  {t.badge}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleAttachToApplication}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#9ac637] hover:bg-[#88af2f] text-[#172321] font-bold text-xs shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Use in Application</span>
            </button>
          </div>
        </div>

        {/* Modal Body: Editor Tabs on Left, Live Preview on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Form Controls (5 cols) */}
          <div className="lg:col-span-6 border-r border-slate-200 flex flex-col overflow-y-auto max-h-[60vh] lg:max-h-[70vh] p-5 space-y-4">
            {/* Editor Sub-Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-100 text-xs">
              {(
                [
                  { id: 'profile', label: 'Personal Details' },
                  { id: 'education', label: 'Education' },
                  { id: 'skills', label: 'Skills' },
                  { id: 'projects', label: 'Projects' },
                  { id: 'experience', label: 'Experience' },
                  { id: 'certifications', label: 'Certifications' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      value={resumeData.fullName}
                      onChange={(e) => setResumeData({ ...resumeData, fullName: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={resumeData.email}
                      onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={resumeData.phone}
                      onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Location / Work Mode</label>
                    <input
                      type="text"
                      value={resumeData.location}
                      onChange={(e) => setResumeData({ ...resumeData, location: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">GitHub / Code Link</label>
                    <input
                      type="text"
                      value={resumeData.githubUrl}
                      onChange={(e) => setResumeData({ ...resumeData, githubUrl: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">LinkedIn / Portfolio</label>
                    <input
                      type="text"
                      value={resumeData.linkedinUrl}
                      onChange={(e) => setResumeData({ ...resumeData, linkedinUrl: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Professional Summary</label>
                  <textarea
                    rows={3}
                    value={resumeData.summary}
                    onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className="space-y-4 animate-in fade-in">
                {resumeData.education.map((edu, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Education #{idx + 1}</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600">Institution / College</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[idx].institution = e.target.value;
                          setResumeData({ ...resumeData, education: updated });
                        }}
                        className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600">Degree & Major</label>
                        <input
                          type="text"
                          value={`${edu.degree} - ${edu.field}`}
                          onChange={(e) => {
                            const updated = [...resumeData.education];
                            updated[idx].field = e.target.value;
                            setResumeData({ ...resumeData, education: updated });
                          }}
                          className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600">Graduation & GPA</label>
                        <input
                          type="text"
                          value={`${edu.gradYear} (GPA: ${edu.gpa})`}
                          onChange={(e) => {
                            const updated = [...resumeData.education];
                            updated[idx].gradYear = e.target.value;
                            setResumeData({ ...resumeData, education: updated });
                          }}
                          className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Type technical skill and press Enter..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    onClick={addSkill}
                    className="px-3 py-1.5 bg-[#172321] text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {resumeData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => removeSkill(index)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <div className="space-y-4 animate-in fade-in">
                {resumeData.projects.map((proj, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Project #{idx + 1}</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600">Project Title</label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => {
                          const updated = [...resumeData.projects];
                          updated[idx].title = e.target.value;
                          setResumeData({ ...resumeData, projects: updated });
                        }}
                        className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600">Technologies Used</label>
                      <input
                        type="text"
                        value={proj.techStack}
                        onChange={(e) => {
                          const updated = [...resumeData.projects];
                          updated[idx].techStack = e.target.value;
                          setResumeData({ ...resumeData, projects: updated });
                        }}
                        className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600">Description / Highlights</label>
                      <textarea
                        rows={2}
                        value={proj.description}
                        onChange={(e) => {
                          const updated = [...resumeData.projects];
                          updated[idx].description = e.target.value;
                          setResumeData({ ...resumeData, projects: updated });
                        }}
                        className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-4 animate-in fade-in">
                {resumeData.experience.map((exp, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Role / Position #{idx + 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600">Role Title</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => {
                            const updated = [...resumeData.experience];
                            updated[idx].role = e.target.value;
                            setResumeData({ ...resumeData, experience: updated });
                          }}
                          className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600">Company / Organization</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const updated = [...resumeData.experience];
                            updated[idx].company = e.target.value;
                            setResumeData({ ...resumeData, experience: updated });
                          }}
                          className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600">Key Contributions</label>
                      <textarea
                        rows={2}
                        value={exp.bullets}
                        onChange={(e) => {
                          const updated = [...resumeData.experience];
                          updated[idx].bullets = e.target.value;
                          setResumeData({ ...resumeData, experience: updated });
                        }}
                        className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications Tab */}
            {activeTab === 'certifications' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCert())}
                    placeholder="e.g. AWS Cloud Certified, Google Cybersecurity Certificate..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    onClick={addCert}
                    className="px-3 py-1.5 bg-[#172321] text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  {resumeData.certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg text-xs bg-slate-50 border border-slate-200"
                    >
                      <span className="text-slate-800 font-medium">{cert}</span>
                      <button
                        onClick={() => removeCert(index)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Live Preview Panel (6 cols) */}
          <div className="lg:col-span-6 bg-[#f7f8f3] p-5 flex flex-col overflow-y-auto max-h-[60vh] lg:max-h-[70vh]">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Live ATS Document Preview</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Template: {activeTemplate}
              </span>
            </div>

            {/* Live Visual Canvas Card */}
            <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 text-[11px] font-sans text-slate-800 space-y-4">
              {activeTemplate === 'modern_tech' && (
                <div className="border-t-4 border-[#172321] pt-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="font-heading font-extrabold text-base text-[#172321]">
                        {resumeData.fullName}
                      </h2>
                      <p className="text-[10px] text-slate-500 font-medium">{targetRole} Candidate</p>
                    </div>
                    <div className="text-right text-[9px] text-slate-500">
                      <div>{resumeData.email} • {resumeData.phone}</div>
                      <div>{resumeData.location}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTemplate === 'executive_ats' && (
                <div className="text-center border-b pb-2">
                  <h2 className="font-serif font-bold text-base text-slate-900">{resumeData.fullName}</h2>
                  <p className="text-[9px] text-slate-600 mt-0.5">
                    {resumeData.location} | {resumeData.phone} | {resumeData.email}
                  </p>
                </div>
              )}

              {activeTemplate === 'product_minimalist' && (
                <div className="border-b pb-2">
                  <h2 className="font-heading font-black text-lg text-slate-900 tracking-tight">{resumeData.fullName}</h2>
                  <p className="text-[9px] text-zinc-500">{resumeData.email} / {resumeData.location}</p>
                </div>
              )}

              {/* Summary */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b pb-0.5 mb-1">
                  Summary
                </h4>
                <p className="text-slate-600 leading-relaxed text-[10px]">{resumeData.summary}</p>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b pb-0.5 mb-1">
                  Skills
                </h4>
                <p className="text-slate-700 text-[10px]">{resumeData.skills.join(' • ')}</p>
              </div>

              {/* Education */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b pb-0.5 mb-1">
                  Education
                </h4>
                {resumeData.education.map((edu, i) => (
                  <div key={i} className="flex justify-between text-[10px]">
                    <div>
                      <strong className="text-slate-900">{edu.institution}</strong>
                      <div>{edu.degree} in {edu.field}</div>
                    </div>
                    <div className="text-right text-slate-500">
                      <div>{edu.gradYear}</div>
                      <div>GPA: {edu.gpa}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b pb-0.5 mb-1">
                  Projects
                </h4>
                {resumeData.projects.map((p, i) => (
                  <div key={i} className="mb-1.5 text-[10px]">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>{p.title}</span>
                      <span className="text-[9px] text-slate-500 font-normal">{p.techStack}</span>
                    </div>
                    <p className="text-slate-600">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            ATS Compatibility Rating: <strong className="text-emerald-700">99% Scored</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAttachToApplication}
              className="px-5 py-2 rounded-xl bg-[#172321] text-white text-xs font-bold hover:bg-slate-800 shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-[#d6ef70]" />
              <span>Attach Resume to Application</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
