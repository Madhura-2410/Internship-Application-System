export type InternshipRole =
  | 'Frontend Developer'
  | 'Backend Developer'
  | 'Full-Stack Developer'
  | 'AI/ML Engineer'
  | 'UI/UX Designer'
  | 'Graphic Designer'
  | 'Digital Marketing Intern'
  | 'Social Media Manager'
  | 'Content Writer'
  | 'Business Development Intern'
  | 'Community Manager'
  | 'HR Intern';

export interface RoleDefinition {
  id: InternshipRole;
  title: string;
  category: string;
  description: string;
  eligibility: string;
  duration: string;
  availability: string;
}

export interface InternshipRequirement {
  id: string;
  jobTitle: string;
  department: string;
  description: string;
  requiredSkills: string[];
  eligibilityCriteria: string;
  experienceLevel: 'Fresher' | 'Experienced' | 'Both';
  duration: string;
  openingsCount: number;
  location: string;
  applicationDeadline: string;
  status: 'open' | 'closed';
  adminUid?: string;
  adminEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export const APPROVED_ROLES: RoleDefinition[] = [
  {
    id: 'Frontend Developer',
    title: 'Frontend Developer',
    category: 'Engineering',
    description: 'Build modern, responsive, and high-performance user interfaces using React, TypeScript, and Tailwind CSS.',
    eligibility: "Open to 1st–4th year undergrads and recent grads with proficiency in React, JavaScript/TypeScript, and responsive web design.",
    duration: '1, 2, or 3 Months (Full-Time or Flexible Remote)',
    availability: 'Actively Accepting Applications',
  },
  {
    id: 'Backend Developer',
    title: 'Backend Developer',
    category: 'Engineering',
    description: 'Design robust REST APIs, cloud functions, and database schemas with Node.js, Express, and Firestore.',
    eligibility: "Open to 1st–4th year students & graduates with background in Node.js, REST API design, and database systems.",
    duration: '1, 2, or 3 Months (Full-Time or Flexible Remote)',
    availability: 'Actively Accepting Applications',
  },
  {
    id: 'Full-Stack Developer',
    title: 'Full-Stack Developer',
    category: 'Engineering',
    description: 'Work across the entire stack from responsive client applications to secure scalable cloud services.',
    eligibility: 'Open to enrolled students & graduates with full-stack web foundations in React, Node.js, and cloud backends.',
    duration: '1, 2, or 3 Months (Full-Time or Flexible Remote)',
    availability: 'Actively Accepting Applications',
  },
  {
    id: 'AI/ML Engineer',
    title: 'AI/ML Engineer',
    category: 'Engineering',
    description: 'Implement predictive models, generative AI integrations, NLP workflows, and prompt engineering pipelines.',
    eligibility: 'Computer Science, Data Science, or AI enthusiasts with Python or TypeScript machine learning experience.',
    duration: '1, 2, or 3 Months (Full-Time or Flexible Remote)',
    availability: 'Actively Accepting Applications',
  },
  {
    id: 'UI/UX Designer',
    title: 'UI/UX Designer',
    category: 'Design',
    description: 'Craft intuitive user journeys, wireframes, design systems, and pixel-perfect interactive prototypes.',
    eligibility: 'Design students and graduates with portfolio evidence in Figma, user research, wireframing, and interaction design.',
    duration: '1, 2, or 3 Months (Full-Time or Flexible Remote)',
    availability: 'Actively Accepting Applications',
  },
  {
    id: 'Graphic Designer',
    title: 'Graphic Designer',
    category: 'Design',
    description: 'Produce captivating visual assets, branding materials, marketing collateral, and social graphics.',
    eligibility: 'Visual arts, graphic design, or multimedia candidates with portfolio showcasing digital brand design & typography.',
    duration: '1, 2, or 3 Months (Full-Time or Flexible Remote)',
    availability: 'Actively Accepting Applications',
  },
  {
    id: 'Digital Marketing Intern',
    title: 'Digital Marketing Intern',
    category: 'Marketing',
    description: 'Execute growth campaigns, search engine optimization, ad performance analytics, and lead generation.',
    eligibility: 'Marketing, Communications, or Business students with an understanding of SEO, social campaigns, and web analytics.',
    duration: '1, 2, or 3 Months (Full-Time or Flexible Remote)',
    availability: 'Actively Accepting Applications',
  },
  {
    id: 'Social Media Manager',
    title: 'Social Media Manager',
    category: 'Marketing',
    description: 'Manage brand channels, develop creative content schedules, engage tech communities, and track growth metrics.',
    eligibility: 'Open to creative communicators with experience in social strategy, technical community management, or copywriting.',
    duration: '1, 2, or 3 Months (Full-Time or Flexible Remote)',
    availability: 'Actively Accepting Applications',
  },
  {
    id: 'Content Writer',
    title: 'Content Writer',
    category: 'Content',
    description: 'Write engaging technical articles, newsletters, product documentation, and compelling case studies.',
    eligibility: 'Writers with strong English proficiency, tech literacy, and the ability to articulate complex software topics clearly.',
    duration: '1, 2, or 3 Months (Full-Time or Flexible Remote)',
    availability: 'Actively Accepting Applications',
  },
  {
    id: 'Business Development Intern',
    title: 'Business Development Intern',
    category: 'Business',
    description: 'Identify strategic partnership opportunities, conduct market research, and assist in client relationship development.',
    eligibility: 'Business, Economics, or Engineering students with strong analytical, presentation, and outreach capabilities.',
    duration: '1, 2, or 3 Months (Full-Time or Flexible Remote)',
    availability: 'Actively Accepting Applications',
  },
  {
    id: 'Community Manager',
    title: 'Community Manager',
    category: 'Community',
    description: 'Nurture developer communities, host virtual tech events, support student outreach, and coordinate hackathons.',
    eligibility: 'Enthusiastic organizers with strong public presence, passion for tech community building, and event planning.',
    duration: '1, 2, or 3 Months (Full-Time or Flexible Remote)',
    availability: 'Actively Accepting Applications',
  },
  {
    id: 'HR Intern',
    title: 'HR Intern',
    category: 'Human Resources',
    description: 'Coordinate recruitment cycles, applicant communications, onboarding operations, and talent management.',
    eligibility: 'Human Resources, Psychology, or Management students with interpersonal flair and organizational discipline.',
    duration: '1, 2, or 3 Months (Full-Time or Flexible Remote)',
    availability: 'Actively Accepting Applications',
  },
];

export type UserRole = 'employee' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export type ExperienceLevel = 'Fresher' | 'Experienced';

export type ApplicationStatus = 'Pending' | 'Accepted' | 'Rejected';

export type InternshipDuration = '1 month' | '2 months' | '3 months';

export type DeliveryStatus = 'Pending' | 'Sent' | 'Failed';

export type EmailLogType =
  | 'applicant_confirmation'
  | 'support_notification'
  | 'decision_acceptance'
  | 'decision_rejection';

export interface EmailLogRecord {
  id: string; // e.g. `${applicationId}_applicant_confirmation`
  applicationId: string;
  type: EmailLogType;
  recipient: string;
  subject: string;
  status: DeliveryStatus;
  provider: string;
  messageId?: string;
  error?: string;
  attemptCount: number;
  lastAttemptAt: string;
  hasAttachment?: boolean;
  attachmentName?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    applicantName?: string;
    role?: string;
    duration?: string;
    joiningDate?: string;
  };
}

export interface EmailProcessingState {
  applicantConfirmation: {
    status: DeliveryStatus;
    lastAttemptAt?: string;
    error?: string;
    provider?: string;
    messageId?: string;
  };
  supportNotification: {
    status: DeliveryStatus;
    lastAttemptAt?: string;
    error?: string;
    provider?: string;
    messageId?: string;
  };
  decisionEmail: {
    status: DeliveryStatus;
    lastAttemptAt?: string;
    error?: string;
    provider?: string;
    messageId?: string;
  };
  pdfGeneration: {
    status: 'Pending' | 'Generated' | 'Failed';
    lastAttemptAt?: string;
    error?: string;
    storagePath?: string;
  };
}

export interface DecisionMetadata {
  action: 'Accepted' | 'Rejected';
  adminUid: string;
  adminEmail: string;
  timestamp: string;
  duration?: InternshipDuration;
  joiningDate?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface InternshipApplication {
  applicationId: string;
  applicantUid?: string;
  fullName: string;
  email: string;
  college: string;
  pursuingYear: string;
  experienceLevel: ExperienceLevel;
  role: InternshipRole;
  resumeUrl?: string;
  resumeStoragePath?: string;
  resumeFileName?: string;
  resumeBase64?: string;
  status: ApplicationStatus;
  appliedAt: string; // ISO string / server timestamp
  decision?: DecisionMetadata;
  offerLetterStoragePath?: string;
  offerLetterUrl?: string;
  emailProcessing: EmailProcessingState;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin';
  createdAt: string;
}
