# Company Tech - Internship Application & Management Automation System

A production-grade, full-stack Internship Application and Admissions Automation System for **Company Tech**, engineered with React 19, TypeScript, Express, Cloud Firestore, Firebase Authentication, and dynamic PDF generation.

---

## 1. System Architecture & Overview

The system automates the complete lifecycle of technical internship cohorts across 12 approved tracks:

```
[ Applicant Portal ] ---> [ Server-Side Validation & Duplicate Check ] ---> [ Cloud Firestore (Pending) ]
                                  |                                                   |
                                  v                                                   v
                  [ Unique Application ID (CT-2026-XXXX) ]             [ Real Notification Dispatch ]
                                                                             |
                                      +--------------------------------------+
                                      |
                                      v
 [ Administrator Dashboard ] ---> [ Accept / Reject Decision Engine ] ---> [ Atomic Firestore State ]
                                      |                                                |
                                      v                                                v
               [ Dynamic PDF Offer Generation (jsPDF) ]            [ Dispatch Real Offer/Notice ]
               (Signatory: HR Support and Co-Founder)              [ Durable Processing Records ]
```

### Approved Cohort Roles (12 Tracks):
1. **Frontend Developer**
2. **Backend Developer**
3. **Full-Stack Developer**
4. **AI/ML Engineer**
5. **UI/UX Designer**
6. **Graphic Designer**
7. **Digital Marketing Intern**
8. **Social Media Manager**
9. **Content Writer**
10. **Business Development Intern**
11. **Community Manager**
12. **HR Intern**

---

## 2. Key Features

- **Applicant Application Portal**:
  - Full Name, Email, College, Pursuing Year, Experience Level (Fresher / Experienced), Track selection, and optional Resume attachment (PDF/DOC/DOCX <= 5MB).
  - Client-side validation, server-side duplicate prevention policy, and atomic Firestore persistence.
  - Automatic cryptographic Application ID generation: `CT-2026-XXXXXX`.
  - Immutable server timestamps.
- **Application Status Tracking**:
  - Live lookup by Application ID and Email.
  - Real-time decision timeline and status alerts (Pending, Accepted, Concluded).
  - Instant 1-click download of official PDF offer letter when accepted.
- **Administrator Governance & Authentication**:
  - Restricted to exactly one authorized administrator account: `madhurashekarraju@gmail.com`.
  - Real-time Firestore sync via `onSnapshot` / REST endpoints.
  - Filterable by Status (Pending, Accepted, Rejected), Role (12 tracks), Experience Level, and Search query.
- **Acceptance Decision Workflow**:
  - Requires mandatory Internship Duration selection: strictly `1 month`, `2 months`, or `3 months`.
  - Requires applicant-specific Commencement (Joining) Date.
  - Generates authentic PDF Offer Letter with Company Tech letterhead, metadata, verification stamp, and signatory: **"HR Support and Co-Founder"**.
  - Stores offer letter path and dispatches official acceptance email with attached PDF.
- **Rejection Decision Workflow**:
  - Requires confirmation and records audit reason.
  - Atomically moves status from `Pending` to `Rejected` and sends the standardized admissions rejection email.
  - Idempotency guard: Final decisions cannot be overwritten or conflicted.
- **Durable Email Delivery & Processing Recovery**:
  - Separate state tracking for:
    1. Applicant Confirmation Email (`Pending`, `Sent`, `Failed`)
    2. Support Notification Mailbox (`Pending`, `Sent`, `Failed`)
    3. Decision Email & Attached PDF (`Pending`, `Sent`, `Failed`)
    4. PDF Generation State (`Pending`, `Generated`, `Failed`)
  - 1-click authorized retry action for failed notifications without modifying decision status.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React Icons.
- **Backend**: Express running Node.js with Vite middleware (`server.ts`).
- **Database & Auth**: Google Cloud Firestore, Firebase Authentication (`caramel-vault-pl37k`).
- **Document Engine**: `jspdf` for high-fidelity vector PDF generation.
- **Outbound Email Engine**: Modular email service supporting **Resend API** (`RESEND_API_KEY`) and **Nodemailer SMTP** (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).

---

## 4. Environment Variables Configuration

Copy `.env.example` to `.env`:

```bash
# Application URL
APP_URL="http://localhost:3000"

# Authorized Administrator Email
ADMIN_EMAIL="madhurashekarraju@gmail.com"

# Admissions Support Mailbox
SUPPORT_EMAIL="support@companytech.internal"

# Option A: Resend Outbound Email Provider (Recommended)
RESEND_API_KEY=""
RESEND_FROM_EMAIL="Company Tech Admissions <admissions@companytech.internal>"

# Option B: Standard SMTP Outbound Provider
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Company Tech Admissions <admissions@companytech.internal>"
```

*Note: If neither `RESEND_API_KEY` nor `SMTP_HOST` is configured, the system logs detailed delivery payloads, records exact error reasons in Firestore, and enables administrator retry once credentials are provided.*

---

## 5. Security & Access Rules (`firestore.rules`)

- Zero unauthenticated public listing of candidate data.
- Public candidates can only `create` applications that pass rigorous structural, field length, and enum validation.
- Only the verified authorized administrator (`madhurashekarraju@gmail.com`) can query/list all candidates or update decision states.
- Immutability of `applicationId`, `fullName`, `email`, and `appliedAt` fields during administrative updates.
- Acceptance requires strict valid durations (`1 month`, `2 months`, `3 months`) and joining date strings.

---

## 6. End-to-End Verification & Test Checklist

- [x] **Application Submission**: Creates exactly 1 Firestore record with unique `CT-2026-XXXX` ID and server timestamp.
- [x] **Duplicate Policy**: Blocks redundant pending applications for the same email and role with a descriptive notice.
- [x] **Application Tracking**: Applicants can look up live status using Application ID.
- [x] **Administrator Access**: Restricted to authorized account (`madhurashekarraju@gmail.com`).
- [x] **Metrics Calculation**: Dashboard metrics (Total, Pending, Accepted, Rejected) compute from real Firestore records.
- [x] **Acceptance Decision**: Requires duration (`1 month`, `2 months`, or `3 months`) and joining date.
- [x] **Offer Letter PDF**: Generates authentic letterhead with signatory title "HR Support and Co-Founder".
- [x] **Rejection Decision**: Atomically sets status to Rejected and initiates rejection notification.
- [x] **Delivery Tracking & Recovery**: Retries failed email notifications on demand.
- [x] **No Mock Data / No CodeNProfit Branding**: All copy, documents, and emails consistently use **Company Tech**.
