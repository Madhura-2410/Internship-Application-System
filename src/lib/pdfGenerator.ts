import { jsPDF } from 'jspdf';
import { InternshipApplication } from '../types';

export interface OfferLetterDetails {
  applicationId: string;
  fullName: string;
  email: string;
  college: string;
  role: string;
  duration: string;
  joiningDate: string;
  issueDate?: string;
}

export function generateOfferLetterPdf(details: OfferLetterDetails): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryNavy = [15, 30, 65]; // #0F1E41
  const brandTeal = [14, 165, 160]; // #0EA5A0
  const darkGray = [45, 55, 72];
  const mutedGray = [110, 120, 135];
  const borderLight = [225, 230, 240];

  // Header accent bar
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 8, 'F');
  doc.setFillColor(brandTeal[0], brandTeal[1], brandTeal[2]);
  doc.rect(0, 8, pageWidth, 2.5, 'F');

  let y = 20;

  // Company Tech Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('COMPANY TECH', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text('Global Innovation & Technology Practice', margin, y + 4.5);

  // Company Contact / Meta (Right Aligned)
  doc.setFontSize(8);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text('Ref: CT/OFFER/2026/' + details.applicationId, pageWidth - margin, y - 1, { align: 'right' });
  const formattedIssueDate = details.issueDate || new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  doc.text('Date: ' + formattedIssueDate, pageWidth - margin, y + 3.5, { align: 'right' });
  doc.text('admissions@companytech.internal', pageWidth - margin, y + 8, { align: 'right' });

  y += 15;

  // Divider line
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  // Candidate Address Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('To,', margin, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(details.fullName, margin, y);

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(details.college, margin, y);

  y += 4;
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text(details.email + ' | Application ID: ' + details.applicationId, margin, y);

  y += 9;

  // Offer Letter Title
  doc.setFillColor(245, 248, 255);
  doc.roundedRect(margin, y - 4, contentWidth, 11, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('SUBJECT: OFFICIAL INTERNSHIP APPOINTMENT & OFFER LETTER', pageWidth / 2, y + 3.5, { align: 'center' });

  y += 15;

  // Salutation
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`Dear ${details.fullName},`, margin, y);

  y += 6;

  // Opening Paragraph
  const introText =
    `We are delighted to extend this formal offer of internship to you for the position of ${details.role} at Company Tech. ` +
    `Based on your academic standing at ${details.college} and your application profile, we were highly impressed by your potential and enthusiastically welcome you to our innovation division.`;
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, y);
  y += splitIntro.length * 4.6 + 4;

  // Key Appointment Details Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(215, 225, 240);
  doc.setLineWidth(0.4);
  const cardHeight = 36;
  doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'FD');

  const col1X = margin + 6;
  const col2X = margin + contentWidth / 2 + 4;
  let cardY = y + 7;

  // Item 1: Role
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text('APPOINTED ROLE:', col1X, cardY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(details.role, col1X, cardY + 4.5);

  // Item 2: Duration
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text('INTERNSHIP DURATION:', col2X, cardY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(brandTeal[0], brandTeal[1], brandTeal[2]);
  doc.text(details.duration, col2X, cardY + 4.5);

  cardY += 14;

  // Item 3: Joining Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text('COMMENCEMENT DATE:', col1X, cardY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(details.joiningDate, col1X, cardY + 4.5);

  // Item 4: Mode of Engagement
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text('WORK MODE & LOCATION:', col2X, cardY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Remote / Technology Workstation', col2X, cardY + 4.5);

  y += cardHeight + 7;

  // Terms and Guidelines
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Terms of Internship Engagement:', margin, y);
  y += 5;

  const terms = [
    'Mentorship & Guidance: You will collaborate under the mentorship of senior technology leaders and participate in active production sprints.',
    'Professional Conduct & Confidentiality: You agree to uphold strict standards of professional ethics and maintain the confidentiality of all proprietary code, architectures, and client data.',
    'Deliverables & Evaluation: Regular performance reviews and code milestones will be conducted. Satisfactory completion warrants an official Certificate of Completion and Letter of Recommendation.',
    'Stipend & Perks: Stipend allowances, computing resources, and full-time conversion opportunities are administered in alignment with performance benchmarks.',
  ];

  terms.forEach((term, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(brandTeal[0], brandTeal[1], brandTeal[2]);
    doc.text(`${idx + 1}.`, margin + 2, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    const termLines = doc.splitTextToSize(term, contentWidth - 8);
    doc.text(termLines, margin + 7, y);
    y += termLines.length * 4.2 + 2;
  });

  y += 5;

  // Closing greeting
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('We look forward to an impactful association and wish you remarkable success throughout your internship tenure.', margin, y);

  y += 12;

  // Signatory Block
  const sigBoxX = margin;
  const sigBoxWidth = contentWidth;

  // Signatory: HR Support and Co-Founder
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Sincerely,', sigBoxX, y);

  y += 6;

  // Signature Badge Emulation
  doc.setDrawColor(brandTeal[0], brandTeal[1], brandTeal[2]);
  doc.setFillColor(242, 252, 251);
  doc.roundedRect(sigBoxX, y, 78, 14, 1.5, 1.5, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(brandTeal[0], brandTeal[1], brandTeal[2]);
  doc.text('DIGITALLY VERIFIED', sigBoxX + 4, y + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text('Company Tech Admissions Operations', sigBoxX + 4, y + 10.5);

  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Authorized Signatory', sigBoxX, y);

  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('HR Support and Co-Founder', sigBoxX, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text('Company Tech Innovations & Admissions', sigBoxX, y);

  // Security Stamp on Right
  const stampX = pageWidth - margin - 50;
  const stampY = y - 26;
  doc.setDrawColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(stampX, stampY, 50, 26, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('OFFICIAL APPOINTMENT', stampX + 25, stampY + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text('SEAL OF VALIDATION', stampX + 25, stampY + 12, { align: 'center' });
  doc.text('ID: ' + details.applicationId, stampX + 25, stampY + 17, { align: 'center' });
  doc.setFont('courier', 'normal');
  doc.text('VERIFIED AUTH', stampX + 25, stampY + 22, { align: 'center' });

  // Footer bar at bottom
  const footerY = pageHeight - 14;
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text('Company Tech • Proprietary Internship Appointment Document • All Rights Reserved', margin, footerY + 2);
  doc.text(`Verification Ref: ${details.applicationId}`, pageWidth - margin, footerY + 2, { align: 'right' });

  return doc;
}

export function generateOfferLetterBlob(details: OfferLetterDetails): Blob {
  const doc = generateOfferLetterPdf(details);
  return doc.output('blob');
}

export function generateOfferLetterDataUri(details: OfferLetterDetails): string {
  const doc = generateOfferLetterPdf(details);
  return doc.output('datauristring');
}

export function downloadOfferLetterPdf(details: OfferLetterDetails, filename?: string): void {
  const doc = generateOfferLetterPdf(details);
  const fname = filename || `Company_Tech_Offer_Letter_${details.applicationId}.pdf`;
  doc.save(fname);
}

export interface RejectionLetterDetails {
  applicationId: string;
  fullName: string;
  email: string;
  college?: string;
  role: string;
  rejectionReason?: string;
  issueDate?: string;
}

export function generateRejectionLetterPdf(details: RejectionLetterDetails): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Colors (Deep Charcoal & Subtle Slate Theme)
  const primaryCharcoal = [23, 35, 33]; // #172321
  const slateDark = [51, 65, 85];
  const mutedSlate = [100, 116, 139];
  const borderLight = [226, 232, 240];
  const accentMuted = [140, 150, 165];

  // Header accent bar
  doc.setFillColor(primaryCharcoal[0], primaryCharcoal[1], primaryCharcoal[2]);
  doc.rect(0, 0, pageWidth, 8, 'F');
  doc.setFillColor(accentMuted[0], accentMuted[1], accentMuted[2]);
  doc.rect(0, 8, pageWidth, 2, 'F');

  let y = 20;

  // Company Tech Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryCharcoal[0], primaryCharcoal[1], primaryCharcoal[2]);
  doc.text('COMPANY TECH', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text('Admissions & Talent Evaluation Committee', margin, y + 4.5);

  // Meta info (Right Aligned)
  doc.setFontSize(8);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text('Ref: CT/DECISION/2026/' + details.applicationId, pageWidth - margin, y - 1, { align: 'right' });
  const formattedIssueDate = details.issueDate || new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  doc.text('Date: ' + formattedIssueDate, pageWidth - margin, y + 3.5, { align: 'right' });
  doc.text('admissions@companytech.internal', pageWidth - margin, y + 8, { align: 'right' });

  y += 15;

  // Divider line
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  // Candidate Address Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryCharcoal[0], primaryCharcoal[1], primaryCharcoal[2]);
  doc.text('To,', margin, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryCharcoal[0], primaryCharcoal[1], primaryCharcoal[2]);
  doc.text(details.fullName, margin, y);

  if (details.college) {
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(details.college, margin, y);
  }

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text(details.email + ' | Application ID: ' + details.applicationId, margin, y);

  y += 9;

  // Notice Title
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y - 4, contentWidth, 11, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryCharcoal[0], primaryCharcoal[1], primaryCharcoal[2]);
  doc.text('NOTICE: INTERNSHIP APPLICATION EVALUATION STATUS', pageWidth / 2, y + 3.5, { align: 'center' });

  y += 15;

  // Salutation
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Dear ${details.fullName},`, margin, y);

  y += 6;

  // Body Paragraphs
  const p1 =
    `Thank you for taking the time to apply for the ${details.role} internship position at Company Tech ` +
    `and for your interest in contributing to our technology initiatives. We sincerely appreciate the effort and commitment demonstrated in your application profile.`;
  const splitP1 = doc.splitTextToSize(p1, contentWidth);
  doc.text(splitP1, margin, y);
  y += splitP1.length * 4.6 + 4;

  const p2 =
    `For this cohort, our evaluation committee received an extraordinary number of highly qualified candidates from across academic institutions. ` +
    `After conducting a comprehensive and rigorous comparative assessment of all profiles against our current technical requirements, we regret to inform you that we are unable to extend an internship offer for this term.`;
  const splitP2 = doc.splitTextToSize(p2, contentWidth);
  doc.text(splitP2, margin, y);
  y += splitP2.length * 4.6 + 5;

  // Reason / Evaluation Context Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  const cardHeight = 24;
  doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text('EVALUATION OUTCOME CONTEXT:', margin + 6, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const reasonText = details.rejectionReason || 'Cohort capacity reached; high volume of competitive applicants.';
  const reasonLines = doc.splitTextToSize(reasonText, contentWidth - 12);
  doc.text(reasonLines, margin + 6, y + 12);

  y += cardHeight + 8;

  // Future Opportunities
  const p3 =
    `Please know that this decision in no way reflects upon your dedication or long-term potential. ` +
    `Your profile will remain on file in the Company Tech talent database for 12 months. Should a future opening or specialized project align with your technical background, our admissions team may contact you directly.`;
  const splitP3 = doc.splitTextToSize(p3, contentWidth);
  doc.text(splitP3, margin, y);
  y += splitP3.length * 4.6 + 4;

  const p4 = `We encourage you to continue developing your technical proficiencies and wish you the greatest success in your academic and professional endeavors.`;
  const splitP4 = doc.splitTextToSize(p4, contentWidth);
  doc.text(splitP4, margin, y);
  y += splitP4.length * 4.6 + 10;

  // Signatory Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryCharcoal[0], primaryCharcoal[1], primaryCharcoal[2]);
  doc.text('Sincerely,', margin, y);

  y += 6;

  // Verification Badge
  doc.setDrawColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, 78, 14, 1.5, 1.5, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('OFFICIALLY RECORDED', margin + 4, y + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text('Admissions & Recruitment Directorate', margin + 4, y + 10.5);

  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryCharcoal[0], primaryCharcoal[1], primaryCharcoal[2]);
  doc.text('Admissions & Recruitment Committee', margin, y);

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text('Company Tech Innovations & Admissions', margin, y);

  // Security Stamp
  const stampX = pageWidth - margin - 50;
  const stampY = y - 26;
  doc.setDrawColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(stampX, stampY, 50, 24, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryCharcoal[0], primaryCharcoal[1], primaryCharcoal[2]);
  doc.text('OFFICIAL DECISION', stampX + 25, stampY + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text('STATUS: CONCLUDED', stampX + 25, stampY + 12, { align: 'center' });
  doc.text('ID: ' + details.applicationId, stampX + 25, stampY + 17, { align: 'center' });

  // Footer bar at bottom
  const footerY = pageHeight - 14;
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text('Company Tech • Formal Admissions Evaluation Notice • All Rights Reserved', margin, footerY + 2);
  doc.text(`Verification Ref: ${details.applicationId}`, pageWidth - margin, footerY + 2, { align: 'right' });

  return doc;
}

export function downloadRejectionLetterPdf(details: RejectionLetterDetails, filename?: string): void {
  const doc = generateRejectionLetterPdf(details);
  const fname = filename || `Company_Tech_Evaluation_Letter_${details.applicationId}.pdf`;
  doc.save(fname);
}

