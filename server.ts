import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  serverDb,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from './src/server/db.ts';
import { EmailService } from './src/server/emailService.ts';
import { generateOfferLetterPdf } from './src/lib/pdfGenerator.ts';
import { APPROVED_ROLES, InternshipRole, InternshipApplication } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Generous body limit for optional resume base64 upload
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'madhurashekarraju@gmail.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@companytech.internal';

const VALID_ROLES = new Set(APPROVED_ROLES.map((r) => r.id));
const knownApplicationIds = new Set<string>(['CT-2026-2WFWHF', 'CT-2026-WAP6CW']);

function generateApplicationId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CT-2026-${rand}`;
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

// System configuration endpoint
app.get('/api/system/config', (req, res) => {
  const hasResend = !!process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('MY_');
  const hasSmtp = !!process.env.SMTP_HOST;
  const outboundProvider = hasResend ? 'Resend' : hasSmtp ? 'SMTP' : 'Unconfigured';

  res.json({
    organization: 'Company Tech',
    adminEmail: ADMIN_EMAIL,
    supportEmail: SUPPORT_EMAIL,
    outboundProvider,
    rolesCount: APPROVED_ROLES.length,
    timestamp: new Date().toISOString(),
  });
});

// 1. Submit Application
app.post('/api/applications/submit', async (req, res) => {
  try {
    const {
      fullName,
      email,
      college,
      pursuingYear,
      experienceLevel,
      role,
      resumeFileName,
      resumeBase64,
    } = req.body;

    // Strict Server-side Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.length > 100) {
      return res.status(400).json({ error: 'Full name is required (2-100 characters).' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim()) || email.length > 150) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!college || typeof college !== 'string' || college.trim().length < 2 || college.length > 150) {
      return res.status(400).json({ error: 'College or university name is required.' });
    }

    if (!pursuingYear || typeof pursuingYear !== 'string' || pursuingYear.trim().length === 0) {
      return res.status(400).json({ error: 'Pursuing academic year is required.' });
    }

    if (!['Fresher', 'Experienced'].includes(experienceLevel)) {
      return res.status(400).json({ error: 'Experience level must be either Fresher or Experienced.' });
    }

    if (!VALID_ROLES.has(role as InternshipRole)) {
      return res.status(400).json({ error: 'Invalid internship role selected.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanFullName = fullName.trim();
    const cleanCollege = college.trim();
    const cleanPursuingYear = pursuingYear.trim();

    // Duplicate Policy Verification:
    // Check if applicant already has an active Pending or Accepted application for the exact same role.
    const rollKey = `${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}__${(role as string).replace(/[^a-zA-Z0-9]/g, '_')}`;
    const rollRef = doc(serverDb, 'applicationRoll', rollKey);
    const rollSnap = await getDoc(rollRef);

    if (rollSnap.exists()) {
      const rollData = rollSnap.data();
      if (rollData.status === 'Pending') {
        return res.status(409).json({
          error: `Duplicate Application Notice: You already have an active application under review for the ${role} position (ID: ${rollData.applicationId}). To protect submission integrity, redundant applications are rejected.`,
          applicationId: rollData.applicationId,
          existingStatus: 'Pending',
        });
      }
      if (rollData.status === 'Accepted') {
        return res.status(409).json({
          error: `Notice: You have already been accepted for the ${role} position under Application ID: ${rollData.applicationId}.`,
          applicationId: rollData.applicationId,
          existingStatus: 'Accepted',
        });
      }
    }

    // Generate unique Application ID
    let applicationId = generateApplicationId();
    let collisionCheck = await getDoc(doc(serverDb, 'internshipApplications', applicationId));
    while (collisionCheck.exists()) {
      applicationId = generateApplicationId();
      collisionCheck = await getDoc(doc(serverDb, 'internshipApplications', applicationId));
    }

    const nowIso = new Date().toISOString();

    const applicationRecord: any = {
      applicationId,
      fullName: cleanFullName,
      email: normalizedEmail,
      college: cleanCollege,
      pursuingYear: cleanPursuingYear,
      experienceLevel,
      role: role as InternshipRole,
      status: 'Pending',
      appliedAt: nowIso,
      emailProcessing: {
        applicantConfirmation: { status: 'Pending' },
        supportNotification: { status: 'Pending' },
        decisionEmail: { status: 'Pending' },
        pdfGeneration: { status: 'Pending' },
      },
    };

    if (resumeFileName) {
      applicationRecord.resumeFileName = resumeFileName;
      applicationRecord.resumeStoragePath = `applications/${applicationId}/resume_${resumeFileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    }
    if (resumeBase64) {
      applicationRecord.resumeBase64 = resumeBase64;
    }

    // Save to Cloud Firestore
    await setDoc(doc(serverDb, 'internshipApplications', applicationId), cleanUndefined(applicationRecord));
    await setDoc(rollRef, {
      applicationId,
      email: normalizedEmail,
      role,
      status: 'Pending',
      createdAt: nowIso,
    });
    knownApplicationIds.add(applicationId);
    console.log(`[Backend] Saved new application ${applicationId} and roll ${rollKey} to Firestore.`);

    // Dispatch real applicant confirmation email & support notification
    const [applicantEmailResult, supportEmailResult] = await Promise.all([
      EmailService.sendApplicantConfirmationEmail(applicationRecord),
      EmailService.sendSupportNotificationEmail(applicationRecord),
    ]);

    // Update email tracking states in Firestore
    applicationRecord.emailProcessing.applicantConfirmation = cleanUndefined({
      status: applicantEmailResult.status,
      lastAttemptAt: applicantEmailResult.timestamp,
      error: applicantEmailResult.error,
      provider: applicantEmailResult.provider,
      messageId: applicantEmailResult.messageId,
    });

    applicationRecord.emailProcessing.supportNotification = cleanUndefined({
      status: supportEmailResult.status,
      lastAttemptAt: supportEmailResult.timestamp,
      error: supportEmailResult.error,
      provider: supportEmailResult.provider,
      messageId: supportEmailResult.messageId,
    });

    await updateDoc(doc(serverDb, 'internshipApplications', applicationId), {
      emailProcessing: cleanUndefined(applicationRecord.emailProcessing),
    });

    return res.status(201).json({
      success: true,
      applicationId,
      status: 'Pending',
      appliedAt: nowIso,
      emailProcessing: applicationRecord.emailProcessing,
    });
  } catch (error: any) {
    console.error('[Backend] Application submission error:', error);
    return res.status(500).json({
      error: `Application submission failed on the server: ${error.message || String(error)}`,
    });
  }
});

// 2. Track Application Status
app.get('/api/applications/track', async (req, res) => {
  try {
    const { applicationId, email } = req.query;

    if (!applicationId || typeof applicationId !== 'string') {
      return res.status(400).json({ error: 'Application ID is required.' });
    }

    const docRef = doc(serverDb, 'internshipApplications', applicationId.trim());
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: 'Application record not found. Please check your Application ID.' });
    }

    const appData = docSnap.data() as InternshipApplication;

    // Security check: if email is passed, verify ownership
    if (email && typeof email === 'string') {
      if (appData.email.toLowerCase() !== email.trim().toLowerCase()) {
        return res.status(403).json({ error: 'The email provided does not match the registered applicant email.' });
      }
    }

    return res.json({
      applicationId: appData.applicationId,
      fullName: appData.fullName,
      role: appData.role,
      college: appData.college,
      status: appData.status,
      appliedAt: appData.appliedAt,
      decision: appData.decision,
      offerLetterUrl: appData.offerLetterUrl,
    });
  } catch (error: any) {
    console.error('[Backend] Track status error:', error);
    return res.status(500).json({ error: 'Failed to retrieve application record.' });
  }
});

// Helper for Admin Authorization Verification
function verifyAdminAuthorization(req: express.Request): { authorized: boolean; email?: string } {
  const adminHeader = req.headers['x-admin-email'] as string;
  const adminAuthHeader = req.headers['authorization'];

  if (adminHeader && adminHeader.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return { authorized: true, email: adminHeader };
  }

  // Check query or body
  const bodyEmail = req.body?.adminEmail || req.query?.adminEmail;
  if (bodyEmail && String(bodyEmail).toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return { authorized: true, email: String(bodyEmail) };
  }

  return { authorized: false };
}

// 3. List Applications for Administrator
app.get('/api/applications', async (req, res) => {
  try {
    const authCheck = verifyAdminAuthorization(req);
    if (!authCheck.authorized) {
      return res.status(403).json({ error: 'Unauthorized: Admin authentication required.' });
    }

    const applications: InternshipApplication[] = [];
    for (const id of knownApplicationIds) {
      try {
        const snap = await getDoc(doc(serverDb, 'internshipApplications', id));
        if (snap.exists()) {
          applications.push(snap.data() as InternshipApplication);
        }
      } catch (docErr) {
        console.warn(`[Backend] Could not load application ${id}:`, docErr);
      }
    }

    // Sort descending by appliedAt
    applications.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

    return res.json({
      count: applications.length,
      applications,
    });
  } catch (error: any) {
    console.error('[Backend] Failed to list applications:', error);
    return res.status(500).json({ error: 'Failed to fetch applications from Firestore.' });
  }
});

// 4. Accept or Reject Decision Workflow
app.post('/api/applications/:id/decision', async (req, res) => {
  try {
    const authCheck = verifyAdminAuthorization(req);
    if (!authCheck.authorized) {
      return res.status(403).json({ error: 'Unauthorized: Admin privileges required.' });
    }

    const { id } = req.params;
    const { action, duration, joiningDate, rejectionReason, notes, adminUid } = req.body;

    if (!['Accepted', 'Rejected'].includes(action)) {
      return res.status(400).json({ error: 'Decision action must be either Accepted or Rejected.' });
    }

    const docRef = doc(serverDb, 'internshipApplications', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: `Application ${id} not found.` });
    }

    const appData = docSnap.data() as InternshipApplication;

    // Idempotency: Prevent conflicting decisions
    if (appData.status !== 'Pending') {
      return res.status(409).json({
        error: `Decision Conflict: Application ${id} is already marked as ${appData.status}. Final decisions cannot be overturned directly.`,
        currentStatus: appData.status,
      });
    }

    const decisionTimestamp = new Date().toISOString();

    if (action === 'Accepted') {
      // Validate duration and joiningDate strictly
      if (!['1 month', '2 months', '3 months'].includes(duration)) {
        return res.status(400).json({
          error: 'Internship duration must be strictly 1 month, 2 months, or 3 months.',
        });
      }

      if (!joiningDate || typeof joiningDate !== 'string' || joiningDate.trim().length === 0) {
        return res.status(400).json({ error: 'Applicant joining date is required for acceptance.' });
      }

      const decisionMetadata = {
        action: 'Accepted' as const,
        adminUid: adminUid || 'admin-system-verified',
        adminEmail: authCheck.email || ADMIN_EMAIL,
        timestamp: decisionTimestamp,
        duration,
        joiningDate: joiningDate.trim(),
        notes: notes || '',
      };

      // 1. Generate Authentic PDF Offer Letter
      let pdfBuffer: Buffer | null = null;
      let pdfGenerationStatus: 'Generated' | 'Failed' = 'Generated';
      let pdfError: string | undefined = undefined;
      let offerLetterStoragePath = `applications/${id}/Company_Tech_Offer_Letter_${id}.pdf`;
      let offerLetterUrl = '';

      try {
        const docPdf = generateOfferLetterPdf({
          applicationId: appData.applicationId,
          fullName: appData.fullName,
          email: appData.email,
          college: appData.college,
          role: appData.role,
          duration,
          joiningDate: joiningDate.trim(),
        });

        const arrayBuffer = docPdf.output('arraybuffer');
        pdfBuffer = Buffer.from(arrayBuffer);
        // Base64 data URI for instant viewing/download in web portal
        offerLetterUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
      } catch (pdfErr: any) {
        console.error('[Backend] PDF generation error:', pdfErr);
        pdfGenerationStatus = 'Failed';
        pdfError = pdfErr.message || String(pdfErr);
      }

      // 2. Dispatch Offer Letter Email with Attached PDF
      let emailResult: {
        status: 'Sent' | 'Failed';
        error?: string;
        timestamp: string;
        provider?: string;
        messageId?: string;
      } = {
        status: 'Failed',
        error: 'PDF could not be generated for attachment',
        timestamp: new Date().toISOString(),
        provider: undefined,
        messageId: undefined,
      };

      if (pdfBuffer) {
        const dispatch = await EmailService.sendOfferLetterEmail(
          appData,
          pdfBuffer,
          duration,
          joiningDate.trim()
        );
        emailResult = {
          status: dispatch.status,
          error: dispatch.error,
          timestamp: dispatch.timestamp,
          provider: dispatch.provider,
          messageId: dispatch.messageId,
        };
      }

      const emailProcessing = {
        ...appData.emailProcessing,
        decisionEmail: {
          status: emailResult.status,
          lastAttemptAt: emailResult.timestamp,
          error: emailResult.error,
          provider: emailResult.provider,
          messageId: emailResult.messageId,
        },
        pdfGeneration: {
          status: pdfGenerationStatus,
          lastAttemptAt: decisionTimestamp,
          error: pdfError,
          storagePath: offerLetterStoragePath,
        },
      };

      // Atomically update in Firestore
      await updateDoc(docRef, cleanUndefined({
        status: 'Accepted',
        decision: cleanUndefined(decisionMetadata),
        offerLetterStoragePath,
        offerLetterUrl,
        emailProcessing: cleanUndefined(emailProcessing),
      }));

      const rollKey = `${appData.email.replace(/[^a-zA-Z0-9]/g, '_')}__${appData.role.replace(/[^a-zA-Z0-9]/g, '_')}`;
      try {
        await updateDoc(doc(serverDb, 'applicationRoll', rollKey), { status: 'Accepted' });
      } catch (e) {
        console.warn('Roll update note:', e);
      }

      console.log(`[Backend] Application ${id} successfully accepted. Email status: ${emailResult.status}.`);

      return res.json({
        success: true,
        status: 'Accepted',
        applicationId: id,
        decision: decisionMetadata,
        pdfGenerationStatus,
        emailDeliveryStatus: emailResult.status,
        emailError: emailResult.error,
        offerLetterUrl,
      });
    } else {
      // Action: Rejected
      const decisionMetadata = {
        action: 'Rejected' as const,
        adminUid: adminUid || 'admin-system-verified',
        adminEmail: authCheck.email || ADMIN_EMAIL,
        timestamp: decisionTimestamp,
        rejectionReason: rejectionReason || 'High volume of competitive applications.',
        notes: notes || '',
      };

      // Dispatch rejection email
      const emailResult = await EmailService.sendRejectionEmail(appData, rejectionReason);

      const emailProcessing = {
        ...appData.emailProcessing,
        decisionEmail: {
          status: emailResult.status,
          lastAttemptAt: emailResult.timestamp,
          error: emailResult.error,
          provider: emailResult.provider,
          messageId: emailResult.messageId,
        },
      };

      // Atomically update in Firestore
      await updateDoc(docRef, cleanUndefined({
        status: 'Rejected',
        decision: cleanUndefined(decisionMetadata),
        emailProcessing: cleanUndefined(emailProcessing),
      }));

      const rollKey = `${appData.email.replace(/[^a-zA-Z0-9]/g, '_')}__${appData.role.replace(/[^a-zA-Z0-9]/g, '_')}`;
      try {
        await updateDoc(doc(serverDb, 'applicationRoll', rollKey), { status: 'Rejected' });
      } catch (e) {
        console.warn('Roll update note:', e);
      }

      console.log(`[Backend] Application ${id} rejected. Email status: ${emailResult.status}.`);

      return res.json({
        success: true,
        status: 'Rejected',
        applicationId: id,
        decision: decisionMetadata,
        emailDeliveryStatus: emailResult.status,
        emailError: emailResult.error,
      });
    }
  } catch (error: any) {
    console.error('[Backend] Decision error:', error);
    return res.status(500).json({ error: `Decision processing failed: ${error.message || String(error)}` });
  }
});

// 5. Retry Notification / PDF Generation for Failed Operations
app.post('/api/applications/:id/retry', async (req, res) => {
  try {
    const authCheck = verifyAdminAuthorization(req);
    if (!authCheck.authorized) {
      return res.status(403).json({ error: 'Unauthorized: Admin privileges required.' });
    }

    const { id } = req.params;
    const { target } = req.body; // 'applicantConfirmation' | 'supportNotification' | 'decisionEmail'

    const docRef = doc(serverDb, 'internshipApplications', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: `Application ${id} not found.` });
    }

    const appData = docSnap.data() as InternshipApplication;
    const emailProcessing = { ...appData.emailProcessing };
    let dispatchResult: any = null;

    if (target === 'applicantConfirmation') {
      dispatchResult = await EmailService.sendApplicantConfirmationEmail(appData);
      emailProcessing.applicantConfirmation = {
        status: dispatchResult.status,
        lastAttemptAt: dispatchResult.timestamp,
        error: dispatchResult.error,
        provider: dispatchResult.provider,
        messageId: dispatchResult.messageId,
      };
    } else if (target === 'supportNotification') {
      dispatchResult = await EmailService.sendSupportNotificationEmail(appData);
      emailProcessing.supportNotification = {
        status: dispatchResult.status,
        lastAttemptAt: dispatchResult.timestamp,
        error: dispatchResult.error,
        provider: dispatchResult.provider,
        messageId: dispatchResult.messageId,
      };
    } else if (target === 'decisionEmail') {
      if (appData.status === 'Accepted' && appData.decision) {
        const docPdf = generateOfferLetterPdf({
          applicationId: appData.applicationId,
          fullName: appData.fullName,
          email: appData.email,
          college: appData.college,
          role: appData.role,
          duration: appData.decision.duration || '1 month',
          joiningDate: appData.decision.joiningDate || new Date().toISOString().split('T')[0],
        });
        const pdfBuffer = Buffer.from(docPdf.output('arraybuffer'));
        dispatchResult = await EmailService.sendOfferLetterEmail(
          appData,
          pdfBuffer,
          appData.decision.duration || '1 month',
          appData.decision.joiningDate || ''
        );
      } else if (appData.status === 'Rejected') {
        dispatchResult = await EmailService.sendRejectionEmail(appData, appData.decision?.rejectionReason);
      } else {
        return res.status(400).json({ error: 'Cannot retry decision email for a Pending application.' });
      }

      emailProcessing.decisionEmail = {
        status: dispatchResult.status,
        lastAttemptAt: dispatchResult.timestamp,
        error: dispatchResult.error,
        provider: dispatchResult.provider,
        messageId: dispatchResult.messageId,
      };
    } else {
      return res.status(400).json({ error: 'Invalid retry target specified.' });
    }

    await updateDoc(docRef, cleanUndefined({ emailProcessing }));

    return res.json({
      success: dispatchResult.status === 'Sent',
      status: dispatchResult.status,
      target,
      error: dispatchResult.error,
      emailProcessing,
    });
  } catch (error: any) {
    console.error('[Backend] Retry error:', error);
    return res.status(500).json({ error: `Retry failed: ${error.message || String(error)}` });
  }
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Company Tech] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
