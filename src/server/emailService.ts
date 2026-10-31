import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import {
  serverDb,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from './db.ts';
import type { InternshipApplication, EmailLogRecord, EmailLogType } from '../types/index.ts';

export interface EmailDispatchResult {
  success: boolean;
  status: 'Sent' | 'Failed';
  messageId?: string;
  error?: string;
  provider?: string;
  timestamp: string;
  alreadySent?: boolean;
}

export interface OutboundEmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
  applicationId: string;
  logType: EmailLogType;
  metadata?: Record<string, any>;
  force?: boolean;
}

function cleanUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        cleaned[k] = cleanUndefined(v);
      }
    }
    return cleaned;
  }
  return obj;
}

export class EmailService {
  public static getSupportEmail(): string {
    return process.env.SUPPORT_EMAIL || 'support@companytech.internal';
  }

  public static getFromAddress(isResend: boolean = false): string {
    if (process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.trim().length > 0) {
      return process.env.RESEND_FROM_EMAIL.trim();
    }
    if (isResend) {
      // Resend requires onboarding@resend.dev unless a custom domain is verified
      return 'Company Tech <onboarding@resend.dev>';
    }
    return process.env.SMTP_FROM || 'Company Tech Admissions <admissions@companytech.internal>';
  }

  /**
   * Helper to inspect sender domain and configuration status
   */
  public static verifySenderConfiguration(): {
    resendConfigured: boolean;
    fromEmail: string;
    supportEmail: string;
    provider: string;
    domainHint: string;
  } {
    const resendApiKey = process.env.RESEND_API_KEY;
    const isResendConfigured = !!resendApiKey && !resendApiKey.includes('MY_') && resendApiKey.trim().length > 0;
    const fromEmail = this.getFromAddress(isResendConfigured);
    const supportEmail = this.getSupportEmail();
    const provider = isResendConfigured ? 'Resend' : process.env.SMTP_HOST ? 'SMTP' : 'Unconfigured';
    const domainHint = isResendConfigured
      ? fromEmail.includes('resend.dev')
        ? 'Using Resend Sandbox Domain (onboarding@resend.dev). Deliverable to verified email / test recipients.'
        : `Using Custom Configured Sender Domain (${fromEmail})`
      : 'Outbound provider not configured. Configure RESEND_API_KEY in environment.';

    return {
      resendConfigured: isResendConfigured,
      fromEmail,
      supportEmail,
      provider,
      domainHint,
    };
  }

  /**
   * Checks if an email of a specific type has already been delivered for an application (Idempotency)
   */
  public static async checkIfAlreadySent(
    applicationId: string,
    type: EmailLogType
  ): Promise<{ alreadySent: boolean; logRecord?: EmailLogRecord }> {
    try {
      const logId = `${applicationId}_${type}`;
      const logRef = doc(serverDb, 'emailLogs', logId);
      const logSnap = await getDoc(logRef);

      if (logSnap.exists()) {
        const data = logSnap.data() as EmailLogRecord;
        if (data.status === 'Sent') {
          return { alreadySent: true, logRecord: data };
        }
      }
    } catch (e) {
      console.warn(`[EmailService] Check alreadySent note for ${applicationId}/${type}:`, e);
    }
    return { alreadySent: false };
  }

  /**
   * Dispatches an outbound email and persists separate Firestore tracking records in the `emailLogs` collection.
   */
  public static async dispatchEmail(payload: OutboundEmailPayload): Promise<EmailDispatchResult> {
    const timestamp = new Date().toISOString();
    const logId = `${payload.applicationId}_${payload.logType}`;
    const logRef = doc(serverDb, 'emailLogs', logId);

    // 1. Idempotency Check
    if (!payload.force) {
      const { alreadySent, logRecord } = await this.checkIfAlreadySent(payload.applicationId, payload.logType);
      if (alreadySent && logRecord) {
        console.log(`[EmailService] Idempotency guard: Email ${logId} already marked Sent at ${logRecord.lastAttemptAt}. Skipping redundant dispatch.`);
        return {
          success: true,
          status: 'Sent',
          messageId: logRecord.messageId,
          provider: logRecord.provider,
          timestamp: logRecord.lastAttemptAt,
          alreadySent: true,
        };
      }
    }

    // 2. Fetch existing attempt count if any
    let existingAttemptCount = 0;
    try {
      const snap = await getDoc(logRef);
      if (snap.exists()) {
        existingAttemptCount = snap.data().attemptCount || 0;
      }
    } catch (e) {
      // ignore
    }

    const currentAttemptCount = existingAttemptCount + 1;

    // 3. Record Initial Pending State in separate Firestore document
    const initialLogRecord: EmailLogRecord = {
      id: logId,
      applicationId: payload.applicationId,
      type: payload.logType,
      recipient: payload.to,
      subject: payload.subject,
      status: 'Pending',
      provider: 'Pending',
      attemptCount: currentAttemptCount,
      lastAttemptAt: timestamp,
      hasAttachment: !!payload.attachments && payload.attachments.length > 0,
      attachmentName: payload.attachments?.[0]?.filename,
      createdAt: snapExistsCreatedAt(existingAttemptCount, timestamp),
      updatedAt: timestamp,
      metadata: payload.metadata,
    };

    try {
      await setDoc(logRef, cleanUndefined(initialLogRecord));
    } catch (dbErr) {
      console.warn(`[EmailService] Initial log write warning for ${logId}:`, dbErr);
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;

    let dispatchResult: EmailDispatchResult = {
      success: false,
      status: 'Failed',
      timestamp,
    };

    // 4. Dispatch via Resend API (Official Resend SDK with fetch fallback)
    if (resendApiKey && resendApiKey.trim().length > 0 && !resendApiKey.includes('MY_')) {
      const fromAddress = this.getFromAddress(true);
      console.log(`[EmailService] Dispatching via Resend SDK to ${payload.to} from ${fromAddress}`);

      try {
        const resend = new Resend(resendApiKey.trim());

        const resendEmailOptions: any = {
          from: fromAddress,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        };

        if (payload.attachments && payload.attachments.length > 0) {
          resendEmailOptions.attachments = payload.attachments.map((att) => ({
            filename: att.filename,
            content: Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content, 'base64'),
          }));
        }

        const { data, error } = await resend.emails.send(resendEmailOptions);

        if (error) {
          console.error('[EmailService] Resend SDK returned error:', error);
          dispatchResult = {
            success: false,
            status: 'Failed',
            error: `Resend Error (${error.name || 'Error'}): ${error.message}`,
            provider: 'Resend',
            timestamp,
          };
        } else if (data && data.id) {
          console.log(`[EmailService] Resend delivered message successfully. ID: ${data.id}`);
          dispatchResult = {
            success: true,
            status: 'Sent',
            messageId: data.id,
            provider: 'Resend',
            timestamp,
          };
        } else {
          dispatchResult = {
            success: false,
            status: 'Failed',
            error: 'Resend returned empty response without message identifier.',
            provider: 'Resend',
            timestamp,
          };
        }
      } catch (sdkErr: any) {
        console.error('[EmailService] Resend SDK invocation exception:', sdkErr);
        dispatchResult = {
          success: false,
          status: 'Failed',
          error: `Resend Exception: ${sdkErr.message || String(sdkErr)}`,
          provider: 'Resend',
          timestamp,
        };
      }
    }
    // 5. Fallback: SMTP Configuration if available
    else if (smtpHost && smtpHost.trim().length > 0) {
      console.log(`[EmailService] Dispatching via SMTP host ${smtpHost} to ${payload.to}`);
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          },
        });

        const mailOptions: any = {
          from: this.getFromAddress(false),
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
        };

        if (payload.attachments) {
          mailOptions.attachments = payload.attachments;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] SMTP email sent: ${info.messageId}`);
        dispatchResult = {
          success: true,
          status: 'Sent',
          messageId: info.messageId,
          provider: 'SMTP',
          timestamp,
        };
      } catch (smtpErr: any) {
        console.error('[EmailService] SMTP delivery failed:', smtpErr);
        dispatchResult = {
          success: false,
          status: 'Failed',
          error: `SMTP Delivery Exception: ${smtpErr.message || String(smtpErr)}`,
          provider: 'SMTP',
          timestamp,
        };
      }
    }
    // 6. No provider configured
    else {
      console.warn('[EmailService] Outbound email provider not configured (RESEND_API_KEY required). Tracking real failed state in Firestore.');
      dispatchResult = {
        success: false,
        status: 'Failed',
        error: 'Delivery blocked: Resend API credentials not configured. Configure RESEND_API_KEY in environment.',
        provider: 'Unconfigured',
        timestamp,
      };
    }

    // 7. Update Separate Firestore Record in `emailLogs`
    try {
      await updateDoc(logRef, cleanUndefined({
        status: dispatchResult.status,
        provider: dispatchResult.provider || 'Resend',
        messageId: dispatchResult.messageId || null,
        error: dispatchResult.error || null,
        attemptCount: currentAttemptCount,
        lastAttemptAt: timestamp,
        updatedAt: timestamp,
      }));
      console.log(`[EmailService] Recorded delivery outcome in Firestore emailLogs/${logId}: ${dispatchResult.status}`);
    } catch (updateErr) {
      console.warn(`[EmailService] Could not update emailLogs/${logId}:`, updateErr);
    }

    return dispatchResult;
  }

  /**
   * 1. Send Applicant Confirmation Email
   * Triggered upon successful application creation in Firestore
   */
  public static async sendApplicantConfirmationEmail(
    app: InternshipApplication,
    force?: boolean
  ): Promise<EmailDispatchResult> {
    const subject = `Application Received: ${app.role} Internship - Company Tech (ID: ${app.applicationId})`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #0f172a; font-size: 22px; letter-spacing: -0.5px;">COMPANY TECH</h2>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Admissions & Talent Operations</p>
        </div>
        <p style="font-size: 15px; line-height: 1.6;">Dear <strong>${app.fullName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6;">Thank you for applying for the <strong>${app.role}</strong> internship at <strong>Company Tech</strong>. We have securely registered your application in our admissions database.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 14px;"><strong>Application Reference ID:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 15px; color: #0f172a;">${app.applicationId}</code></p>
          <p style="margin: 0 0 8px; font-size: 14px;"><strong>Internship Track:</strong> ${app.role}</p>
          <p style="margin: 0 0 8px; font-size: 14px;"><strong>College / Institute:</strong> ${app.college}</p>
          <p style="margin: 0; font-size: 14px;"><strong>Current Status:</strong> <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600;">Pending Review</span></p>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Our technical team and recruitment committee are currently reviewing candidate profiles. You can verify your live application status anytime using your Application ID on the Company Tech portal.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Company Tech Admissions Team • admissions@companytech.internal</p>
      </div>
    `;
    const text = `Dear ${app.fullName},\n\nThank you for applying for the ${app.role} internship at Company Tech. Your application ID is: ${app.applicationId}.\nStatus: Pending Review.\nCollege: ${app.college}\n\nCompany Tech Admissions`;

    return this.dispatchEmail({
      to: app.email,
      subject,
      html,
      text,
      applicationId: app.applicationId,
      logType: 'applicant_confirmation',
      metadata: {
        applicantName: app.fullName,
        role: app.role,
        college: app.college,
      },
      force,
    });
  }

  /**
   * 2. Send Support Notification Email
   * Triggered upon successful application creation in Firestore
   */
  public static async sendSupportNotificationEmail(
    app: InternshipApplication,
    force?: boolean
  ): Promise<EmailDispatchResult> {
    const supportEmail = this.getSupportEmail();
    const subject = `[New Application] ${app.fullName} - ${app.role} (ID: ${app.applicationId})`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 18px;">
          <h3 style="margin: 0; color: #1e3a8a;">New Internship Application Submitted</h3>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Company Tech Administrative Alert</p>
        </div>
        <p style="font-size: 14px;">A new internship application has been recorded in Cloud Firestore:</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 140px;">Application ID:</td><td style="padding: 6px 0; font-weight: bold; font-family: monospace;">${app.applicationId}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Candidate Name:</td><td style="padding: 6px 0; font-weight: bold;">${app.fullName}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Email:</td><td style="padding: 6px 0;">${app.email}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Role:</td><td style="padding: 6px 0; font-weight: bold; color: #1d4ed8;">${app.role}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">College:</td><td style="padding: 6px 0;">${app.college}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Pursuing Year:</td><td style="padding: 6px 0;">${app.pursuingYear}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Experience:</td><td style="padding: 6px 0;">${app.experienceLevel}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Resume Attached:</td><td style="padding: 6px 0;">${app.resumeFileName ? 'Yes (' + app.resumeFileName + ')' : 'None'}</td></tr>
        </table>
        <p style="font-size: 13px; color: #475569;">Please sign in to the authorized administrator dashboard to review, accept, or reject this candidate.</p>
      </div>
    `;
    const text = `New Application Submitted:\nID: ${app.applicationId}\nName: ${app.fullName}\nEmail: ${app.email}\nRole: ${app.role}\nCollege: ${app.college}\nReview in Admin Dashboard.`;

    return this.dispatchEmail({
      to: supportEmail,
      subject,
      html,
      text,
      applicationId: app.applicationId,
      logType: 'support_notification',
      metadata: {
        applicantName: app.fullName,
        role: app.role,
        college: app.college,
      },
      force,
    });
  }

  /**
   * 3. Send Official Offer Letter Email with Attached PDF
   * Triggered when an authorized administrator accepts an application
   */
  public static async sendOfferLetterEmail(
    app: InternshipApplication,
    pdfBuffer: Buffer,
    duration: string,
    joiningDate: string,
    force?: boolean
  ): Promise<EmailDispatchResult> {
    const subject = `Official Offer Letter: ${app.role} Internship - Company Tech (ID: ${app.applicationId})`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #065f46; font-size: 22px;">COMPANY TECH</h2>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Official Internship Appointment</p>
        </div>
        <p style="font-size: 15px; line-height: 1.6;">Dear <strong>${app.fullName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #065f46; font-weight: 600;">Congratulations! We are delighted to formally offer you the position of <strong>${app.role} Intern</strong> at Company Tech.</p>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">Your formal Offer Letter and Appointment Document has been generated and is attached to this email as an official PDF document.</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 6px; font-size: 14px;"><strong>Application ID:</strong> ${app.applicationId}</p>
          <p style="margin: 0 0 6px; font-size: 14px;"><strong>Internship Duration:</strong> ${duration}</p>
          <p style="margin: 0 0 6px; font-size: 14px;"><strong>Joining Date:</strong> ${joiningDate}</p>
          <p style="margin: 0; font-size: 14px;"><strong>Authorized Signatory:</strong> HR Support and Co-Founder</p>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Please download and retain the attached offer letter for your records. Further onboarding instructions will be shared prior to your commencement date.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Company Tech Admissions & HR Operations • admissions@companytech.internal</p>
      </div>
    `;
    const text = `Dear ${app.fullName},\n\nCongratulations! You have been accepted for the ${app.role} internship at Company Tech for a duration of ${duration}, starting on ${joiningDate}.\nYour official offer letter is attached.\n\nCompany Tech Admissions & HR Operations`;

    return this.dispatchEmail({
      to: app.email,
      subject,
      html,
      text,
      attachments: [
        {
          filename: `Company_Tech_Offer_Letter_${app.applicationId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
      applicationId: app.applicationId,
      logType: 'decision_acceptance',
      metadata: {
        applicantName: app.fullName,
        role: app.role,
        duration,
        joiningDate,
      },
      force,
    });
  }

  /**
   * 4. Send Predefined Rejection Email
   * Triggered when an authorized administrator rejects an application
   */
  public static async sendRejectionEmail(
    app: InternshipApplication,
    reason?: string,
    force?: boolean
  ): Promise<EmailDispatchResult> {
    const subject = `Application Update: ${app.role} Internship - Company Tech (ID: ${app.applicationId})`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="border-bottom: 2px solid #475569; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #1e293b; font-size: 22px;">COMPANY TECH</h2>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Admissions & Recruitment Committee</p>
        </div>
        <p style="font-size: 15px; line-height: 1.6;">Dear <strong>${app.fullName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6;">Thank you for your interest in the <strong>${app.role}</strong> internship at <strong>Company Tech</strong> and for taking the time to share your academic accomplishments with us.</p>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">After a thorough and competitive evaluation of all candidates for this cycle, we regret to inform you that we are unable to offer you an internship position at this time.</p>
        ${
          reason
            ? `<div style="background: #f8fafc; border-left: 3px solid #94a3b8; padding: 10px 14px; margin: 16px 0; font-size: 13px; color: #475569;">${reason}</div>`
            : ''
        }
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">The volume of highly qualified applications was substantial, making our selection process particularly difficult. We will keep your profile in our talent network for prospective future openings that match your skills.</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">We wish you every success in your ongoing academic endeavors and future professional pursuits.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Company Tech Recruitment Team • admissions@companytech.internal • Ref: ${app.applicationId}</p>
      </div>
    `;
    const text = `Dear ${app.fullName},\n\nThank you for applying for the ${app.role} internship at Company Tech (Application ID: ${app.applicationId}).\nWe regret to inform you that we are unable to offer you an internship position at this time.\nWe wish you all the best in your career pursuits.\n\nCompany Tech Recruitment Team`;

    return this.dispatchEmail({
      to: app.email,
      subject,
      html,
      text,
      applicationId: app.applicationId,
      logType: 'decision_rejection',
      metadata: {
        applicantName: app.fullName,
        role: app.role,
        reason: reason || 'Competitive evaluation',
      },
      force,
    });
  }
}

function snapExistsCreatedAt(attemptCount: number, defaultIso: string): string {
  return attemptCount > 0 ? defaultIso : defaultIso;
}
