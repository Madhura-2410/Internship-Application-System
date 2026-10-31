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
  deleteDoc,
} from './src/server/db.ts';
import crypto from 'crypto';
import { EmailService } from './src/server/emailService.ts';
import { generateOfferLetterPdf } from './src/lib/pdfGenerator.ts';
import { APPROVED_ROLES, InternshipRole, InternshipApplication, InternshipRequirement } from './src/types/index.ts';

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
const knownApplicationIds = new Set<string>([
  'CT-2026-2WFWHF',
  'CT-2026-WAP6CW',
  'CT-2026-V78UY3',
  'CT-2026-UDSW7P',
  'CT-2026-FNGAJU',
]);

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
  const senderDiagnostics = EmailService.verifySenderConfiguration();

  res.json({
    organization: 'Company Tech',
    adminEmail: ADMIN_EMAIL,
    supportEmail: SUPPORT_EMAIL,
    outboundProvider: senderDiagnostics.provider,
    resendConfigured: senderDiagnostics.resendConfigured,
    fromEmail: senderDiagnostics.fromEmail,
    domainHint: senderDiagnostics.domainHint,
    rolesCount: APPROVED_ROLES.length,
    timestamp: new Date().toISOString(),
  });
});

// Known Requirements Set for fast Firestore resolution
const knownRequirementIds = new Set<string>([
  'req-frontend-developer',
  'req-backend-developer',
  'req-full-stack-developer',
  'req-ai-ml-engineer',
  'req-ui-ux-designer',
  'req-graphic-designer',
  'req-digital-marketing-intern',
  'req-social-media-manager',
  'req-content-writer',
  'req-business-development-intern',
  'req-community-manager',
  'req-hr-intern',
]);

const INITIAL_REQUIREMENTS: InternshipRequirement[] = APPROVED_ROLES.map((r) => {
  const reqId = `req-${r.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return {
    id: reqId,
    jobTitle: r.title,
    department: r.category,
    description: `${r.description} Work directly alongside senior engineering and product leaders at Company Tech. Engage in agile sprints, technical mentorship, and impactful deliverable milestones.`,
    requiredSkills: r.id === 'Frontend Developer' ? ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'HTML/CSS']
      : r.id === 'Backend Developer' ? ['Node.js', 'Express', 'Cloud Firestore', 'REST APIs', 'TypeScript']
      : r.id === 'Full-Stack Developer' ? ['React', 'Node.js', 'TypeScript', 'Firestore', 'Tailwind CSS']
      : r.id === 'AI/ML Engineer' ? ['Python', 'TypeScript', 'Gemini API', 'Machine Learning', 'NLP']
      : r.id === 'UI/UX Designer' ? ['Figma', 'Wireframing', 'User Research', 'Design Systems', 'Prototyping']
      : r.id === 'Graphic Designer' ? ['Photoshop', 'Illustrator', 'Figma', 'Visual Design', 'Branding']
      : r.id === 'Digital Marketing Intern' ? ['SEO', 'Google Analytics', 'Content Marketing', 'Ad Campaigns']
      : r.id === 'Social Media Manager' ? ['Social Media Strategy', 'Copywriting', 'Canva', 'Community Engagement']
      : r.id === 'Content Writer' ? ['Technical Writing', 'Copywriting', 'SEO Content', 'Documentation']
      : r.id === 'Business Development Intern' ? ['Market Research', 'Lead Generation', 'Client Outreach', 'Presentations']
      : r.id === 'Community Manager' ? ['Discord/Slack Moderation', 'Event Planning', 'Tech Outreach', 'Hackathons']
      : ['Talent Sourcing', 'Applicant Screening', 'Interview Coordination', 'HR Operations'],
    eligibilityCriteria: r.eligibility,
    experienceLevel: 'Both',
    duration: '1, 2, or 3 Months (Full-Time or Flexible Remote)',
    openingsCount: 5,
    location: 'Remote / Hybrid (Bangalore)',
    applicationDeadline: '2026-12-31',
    status: 'open',
    adminUid: 'admin-system-verified',
    adminEmail: ADMIN_EMAIL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
});

// Seed requirements in Firestore on bootstrap if needed
async function ensureRequirementsSeeded() {
  try {
    for (const req of INITIAL_REQUIREMENTS) {
      const ref = doc(serverDb, 'requirements', req.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, cleanUndefined(req));
        console.log(`[Backend] Seeded requirement ${req.id} in Firestore.`);
      }
    }
  } catch (err) {
    console.warn('[Backend] Requirement seeding note:', err);
  }
}
// Run non-blocking seed
ensureRequirementsSeeded();

// Auth: Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email format.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    const cleanName = (name && typeof name === 'string' && name.trim()) || normalizedEmail.split('@')[0];

    const isMasterAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase();

    // Strict Admin Authorization Check
    if (role === 'admin' && !isMasterAdmin) {
      return res.status(403).json({
        error: `Unauthorized Admin Registration: Only the authorized Company Tech administrator (${ADMIN_EMAIL}) is permitted to register with an Admin role. Please select Employee to apply.`,
      });
    }

    const assignedRole = isMasterAdmin ? 'admin' : (role === 'admin' ? 'admin' : 'employee');
    const userDocId = normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const userDocRef = doc(serverDb, 'users', userDocId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return res.status(409).json({
        error: 'An account with this email address already exists. Please switch to Sign In.',
      });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');
    const uid = `ct-user-${crypto.randomBytes(8).toString('hex')}`;
    const nowIso = new Date().toISOString();

    const userProfile = {
      uid,
      email: normalizedEmail,
      name: cleanName,
      role: assignedRole,
      createdAt: nowIso,
    };

    await setDoc(userDocRef, {
      ...userProfile,
      passwordHash,
      salt,
      updatedAt: nowIso,
    });

    if (assignedRole === 'admin') {
      await setDoc(doc(serverDb, 'admins', uid), {
        uid,
        email: normalizedEmail,
        role: 'admin',
        createdAt: nowIso,
      });
    }

    console.log(`[Backend Auth] Successfully registered ${normalizedEmail} as ${assignedRole}`);
    return res.status(201).json({
      success: true,
      profile: userProfile,
    });
  } catch (err: any) {
    console.error('[Backend Auth] Registration error:', err);
    return res.status(500).json({ error: `Registration error: ${err.message || String(err)}` });
  }
});

// Auth: Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both your email and password.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const userDocId = normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const userDocRef = doc(serverDb, 'users', userDocId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return res.status(401).json({
        error: 'Invalid credentials. No registered account found with this email. Please check your email or register a new account.',
      });
    }

    const userData = userDocSnap.data();
    if (!userData.passwordHash || !userData.salt) {
      return res.status(401).json({ error: 'Account credentials not configured for password sign-in.' });
    }

    const hashToVerify = crypto.scryptSync(password, userData.salt, 64).toString('hex');
    if (hashToVerify !== userData.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials. The password entered is incorrect.' });
    }

    const isMasterAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase();
    const finalRole = isMasterAdmin ? 'admin' : (userData.role || 'employee');

    const profile = {
      uid: userData.uid || `ct-user-${userDocId}`,
      email: normalizedEmail,
      name: userData.name || normalizedEmail.split('@')[0],
      role: finalRole,
      createdAt: userData.createdAt || new Date().toISOString(),
    };

    console.log(`[Backend Auth] Successful login for ${normalizedEmail} (${finalRole})`);
    return res.json({
      success: true,
      profile,
    });
  } catch (err: any) {
    console.error('[Backend Auth] Login error:', err);
    return res.status(500).json({ error: `Login error: ${err.message || String(err)}` });
  }
});

// Requirements: List All Requirements (Open for applicants, All for Admin)
app.get('/api/requirements', async (req, res) => {
  try {
    await ensureRequirementsSeeded();
    const results: any[] = [];

    // Count applications by role
    const applicationCounts: Record<string, number> = {};
    for (const id of knownApplicationIds) {
      try {
        const snap = await getDoc(doc(serverDb, 'internshipApplications', id));
        if (snap.exists()) {
          const app = snap.data();
          if (app.role) {
            applicationCounts[app.role] = (applicationCounts[app.role] || 0) + 1;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    for (const id of knownRequirementIds) {
      try {
        const snap = await getDoc(doc(serverDb, 'requirements', id));
        if (snap.exists()) {
          const data = snap.data() as InternshipRequirement;
          const count = applicationCounts[data.jobTitle] || 0;
          results.push({ ...data, applicationCount: count });
        }
      } catch (e) {
        console.warn(`[Backend] Could not fetch requirement ${id}:`, e);
      }
    }

    // Sort: open first, then by createdAt desc
    results.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'open' ? -1 : 1;
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return res.json({
      count: results.length,
      requirements: results,
    });
  } catch (err: any) {
    console.error('[Backend] Failed to load requirements:', err);
    return res.status(500).json({ error: 'Failed to retrieve requirements.' });
  }
});

// Requirements: Post New Requirement (Admin Only)
app.post('/api/requirements', async (req, res) => {
  try {
    const authCheck = verifyAdminAuthorization(req);
    if (!authCheck.authorized) {
      return res.status(403).json({ error: 'Unauthorized: Admin privileges required to post requirements.' });
    }

    const {
      jobTitle,
      department,
      description,
      requiredSkills,
      eligibilityCriteria,
      experienceLevel,
      duration,
      openingsCount,
      location,
      applicationDeadline,
      status,
    } = req.body;

    if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length < 2) {
      return res.status(400).json({ error: 'Job title is required.' });
    }
    if (!department || typeof department !== 'string') {
      return res.status(400).json({ error: 'Department is required.' });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({ error: 'A descriptive job overview is required (at least 10 characters).' });
    }

    const cleanTitle = jobTitle.trim();
    const reqId = `req-${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();

    const skillsArray = Array.isArray(requiredSkills)
      ? requiredSkills.map((s: any) => String(s).trim()).filter(Boolean)
      : typeof requiredSkills === 'string'
      ? requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Problem Solving', 'Teamwork'];

    const newRequirement: InternshipRequirement = {
      id: reqId,
      jobTitle: cleanTitle,
      department: department.trim(),
      description: description.trim(),
      requiredSkills: skillsArray,
      eligibilityCriteria: (eligibilityCriteria && String(eligibilityCriteria).trim()) || 'Open to all students and recent graduates.',
      experienceLevel: ['Fresher', 'Experienced', 'Both'].includes(experienceLevel) ? experienceLevel : 'Both',
      duration: (duration && String(duration).trim()) || '1, 2, or 3 Months',
      openingsCount: Math.max(1, Number(openingsCount) || 5),
      location: (location && String(location).trim()) || 'Remote',
      applicationDeadline: (applicationDeadline && String(applicationDeadline).trim()) || '2026-12-31',
      status: status === 'closed' ? 'closed' : 'open',
      adminUid: 'admin-system-verified',
      adminEmail: authCheck.email || ADMIN_EMAIL,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await setDoc(doc(serverDb, 'requirements', reqId), cleanUndefined(newRequirement));
    knownRequirementIds.add(reqId);
    console.log(`[Backend] Admin published new requirement: ${reqId} (${cleanTitle})`);

    return res.status(201).json({
      success: true,
      requirement: newRequirement,
    });
  } catch (err: any) {
    console.error('[Backend] Failed to post requirement:', err);
    return res.status(500).json({ error: `Failed to post requirement: ${err.message || String(err)}` });
  }
});

// Requirements: Update Requirement (Admin Only)
app.put('/api/requirements/:id', async (req, res) => {
  try {
    const authCheck = verifyAdminAuthorization(req);
    if (!authCheck.authorized) {
      return res.status(403).json({ error: 'Unauthorized: Admin privileges required to update requirements.' });
    }

    const { id } = req.params;
    const reqRef = doc(serverDb, 'requirements', id);
    const reqSnap = await getDoc(reqRef);

    if (!reqSnap.exists()) {
      return res.status(404).json({ error: `Requirement ${id} not found.` });
    }

    const existing = reqSnap.data() as InternshipRequirement;
    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    delete updates.id; // immutable

    if (updates.requiredSkills && typeof updates.requiredSkills === 'string') {
      updates.requiredSkills = updates.requiredSkills.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (updates.openingsCount) {
      updates.openingsCount = Math.max(1, Number(updates.openingsCount) || 1);
    }

    const updated = { ...existing, ...updates };
    await setDoc(reqRef, cleanUndefined(updated));
    console.log(`[Backend] Admin updated requirement ${id}. Status: ${updated.status}`);

    return res.json({
      success: true,
      requirement: updated,
    });
  } catch (err: any) {
    console.error('[Backend] Update requirement error:', err);
    return res.status(500).json({ error: `Update failed: ${err.message || String(err)}` });
  }
});

// Requirements: Delete Requirement (Admin Only)
app.delete('/api/requirements/:id', async (req, res) => {
  try {
    const authCheck = verifyAdminAuthorization(req);
    if (!authCheck.authorized) {
      return res.status(403).json({ error: 'Unauthorized: Admin privileges required to delete requirements.' });
    }

    const { id } = req.params;
    await deleteDoc(doc(serverDb, 'requirements', id));
    knownRequirementIds.delete(id);
    console.log(`[Backend] Admin deleted requirement ${id}`);

    return res.json({ success: true, id });
  } catch (err: any) {
    console.error('[Backend] Delete requirement error:', err);
    return res.status(500).json({ error: `Delete failed: ${err.message || String(err)}` });
  }
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
      applicantUid,
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
    if (applicantUid && typeof applicantUid === 'string') {
      applicationRecord.applicantUid = applicantUid.trim();
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

// 2b. Retrieve Applications for Current Authenticated User
app.get('/api/applications/my-applications', async (req, res) => {
  try {
    const { email, uid } = req.query;

    if (!email && !uid) {
      return res.status(400).json({ error: 'User identifier (email or uid) is required.' });
    }

    const normalizedEmail = email ? String(email).trim().toLowerCase() : '';
    const targetUid = uid ? String(uid).trim() : '';

    const myApps: InternshipApplication[] = [];
    for (const id of knownApplicationIds) {
      try {
        const snap = await getDoc(doc(serverDb, 'internshipApplications', id));
        if (snap.exists()) {
          const app = snap.data() as InternshipApplication;
          const matchEmail = normalizedEmail && app.email.toLowerCase() === normalizedEmail;
          const matchUid = targetUid && app.applicantUid === targetUid;
          if (matchEmail || matchUid) {
            myApps.push(app);
          }
        }
      } catch (e) {
        console.warn(`[Backend] Could not check app ${id}:`, e);
      }
    }

    // Sort descending by appliedAt
    myApps.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

    return res.json({
      count: myApps.length,
      applications: myApps,
    });
  } catch (error: any) {
    console.error('[Backend] Failed to load my-applications:', error);
    return res.status(500).json({ error: 'Failed to retrieve applications.' });
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

      // 1. Atomically update application status in Firestore FIRST before processing notification
      await updateDoc(docRef, cleanUndefined({
        status: 'Rejected',
        decision: cleanUndefined(decisionMetadata),
      }));

      const rollKey = `${appData.email.replace(/[^a-zA-Z0-9]/g, '_')}__${appData.role.replace(/[^a-zA-Z0-9]/g, '_')}`;
      try {
        await updateDoc(doc(serverDb, 'applicationRoll', rollKey), { status: 'Rejected' });
      } catch (e) {
        console.warn('Roll update note:', e);
      }

      console.log(`[Backend] Application ${id} status successfully updated to Rejected in Firestore. Processing notification...`);

      // 2. Dispatch predefined professional rejection email
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

      // 3. Record updated delivery tracking in Firestore
      await updateDoc(docRef, cleanUndefined({
        emailProcessing: cleanUndefined(emailProcessing),
      }));

      console.log(`[Backend] Application ${id} rejection notification completed. Status: ${emailResult.status}.`);

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

// 5. Retry Notification / PDF Generation for Failed Operations with Idempotency Guard
app.post('/api/applications/:id/retry', async (req, res) => {
  try {
    const authCheck = verifyAdminAuthorization(req);
    if (!authCheck.authorized) {
      return res.status(403).json({ error: 'Unauthorized: Admin privileges required.' });
    }

    const { id } = req.params;
    const { target, force } = req.body; // 'applicantConfirmation' | 'supportNotification' | 'decisionEmail'

    if (!['applicantConfirmation', 'supportNotification', 'decisionEmail'].includes(target)) {
      return res.status(400).json({ error: 'Invalid retry target specified.' });
    }

    const docRef = doc(serverDb, 'internshipApplications', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: `Application ${id} not found.` });
    }

    const appData = docSnap.data() as InternshipApplication;
    const emailProcessing = { ...appData.emailProcessing };

    // Idempotency check: If email has already been successfully delivered and no explicit force resend requested
    const currentTargetStatus = (emailProcessing as any)[target]?.status;
    if (currentTargetStatus === 'Sent' && !force) {
      return res.json({
        success: true,
        status: 'Sent',
        target,
        alreadySent: true,
        message: 'This notification has already been successfully delivered. Pass force: true to re-send intentionally.',
        emailProcessing,
      });
    }

    let dispatchResult: any = null;

    if (target === 'applicantConfirmation') {
      dispatchResult = await EmailService.sendApplicantConfirmationEmail(appData, !!force);
      emailProcessing.applicantConfirmation = {
        status: dispatchResult.status,
        lastAttemptAt: dispatchResult.timestamp,
        error: dispatchResult.error,
        provider: dispatchResult.provider,
        messageId: dispatchResult.messageId,
      };
    } else if (target === 'supportNotification') {
      dispatchResult = await EmailService.sendSupportNotificationEmail(appData, !!force);
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
          appData.decision.joiningDate || '',
          !!force
        );
      } else if (appData.status === 'Rejected') {
        dispatchResult = await EmailService.sendRejectionEmail(appData, appData.decision?.rejectionReason, !!force);
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

// 6. Admin Email Delivery Logs (Separate Firestore records)
app.get('/api/admin/email-logs', async (req, res) => {
  try {
    const authCheck = verifyAdminAuthorization(req);
    if (!authCheck.authorized) {
      return res.status(403).json({ error: 'Unauthorized: Admin privileges required.' });
    }

    const { applicationId } = req.query;
    const logsRef = collection(serverDb, 'emailLogs');
    let q = query(logsRef);
    if (applicationId && typeof applicationId === 'string') {
      q = query(logsRef, where('applicationId', '==', applicationId.trim()));
    }

    const snap = await getDocs(q);
    const logs: any[] = [];
    snap.forEach((d) => {
      logs.push(d.data());
    });

    logs.sort((a, b) => new Date(b.lastAttemptAt || 0).getTime() - new Date(a.lastAttemptAt || 0).getTime());

    return res.json({
      count: logs.length,
      logs,
    });
  } catch (err: any) {
    console.error('[Backend] Failed to load email-logs:', err);
    return res.status(500).json({ error: 'Failed to retrieve email delivery logs.' });
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
