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
