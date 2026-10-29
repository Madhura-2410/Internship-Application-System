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

export const APPROVED_ROLES: { id: InternshipRole; title: string; category: string; description: string }[] = [
  {
    id: 'Frontend Developer',
    title: 'Frontend Developer',
    category: 'Engineering',
    description: 'Build modern, responsive, and high-performance user interfaces using React, TypeScript, and Tailwind CSS.',
  },
  {
    id: 'Backend Developer',
    title: 'Backend Developer',
    category: 'Engineering',
    description: 'Design robust REST APIs, cloud functions, and database schemas with Node.js, Express, and Firestore.',
  },
  {
    id: 'Full-Stack Developer',
    title: 'Full-Stack Developer',
    category: 'Engineering',
    description: 'Work across the entire stack from responsive client applications to secure scalable cloud services.',
  },
  {
    id: 'AI/ML Engineer',
    title: 'AI/ML Engineer',
    category: 'Engineering',
    description: 'Implement predictive models, generative AI integrations, NLP workflows, and prompt engineering pipelines.',
  },
  {
    id: 'UI/UX Designer',
    title: 'UI/UX Designer',
    category: 'Design',
    description: 'Craft intuitive user journeys, wireframes, design systems, and pixel-perfect interactive prototypes.',
  },
  {
    id: 'Graphic Designer',
    title: 'Graphic Designer',
    category: 'Design',
    description: 'Produce captivating visual assets, branding materials, marketing collateral, and social graphics.',
  },
  {
    id: 'Digital Marketing Intern',
    title: 'Digital Marketing Intern',
    category: 'Marketing',
    description: 'Execute growth campaigns, search engine optimization, ad performance analytics, and lead generation.',
  },
  {
    id: 'Social Media Manager',
    title: 'Social Media Manager',
    category: 'Marketing',
    description: 'Manage brand channels, develop creative content schedules, engage tech communities, and track growth metrics.',
  },
  {
    id: 'Content Writer',
    title: 'Content Writer',
    category: 'Content',
    description: 'Write engaging technical articles, newsletters, product documentation, and compelling case studies.',
  },
  {
    id: 'Business Development Intern',
    title: 'Business Development Intern',
    category: 'Business',
    description: 'Identify strategic partnership opportunities, conduct market research, and assist in client relationship development.',
  },
  {
    id: 'Community Manager',
    title: 'Community Manager',
    category: 'Community',
    description: 'Nurture developer communities, host virtual tech events, support student outreach, and coordinate hackathons.',
  },
  {
    id: 'HR Intern',
    title: 'HR Intern',
    category: 'Human Resources',
    description: 'Coordinate recruitment cycles, applicant communications, onboarding operations, and talent management.',
  },
];

export type ExperienceLevel = 'Fresher' | 'Experienced';

export type ApplicationStatus = 'Pending' | 'Accepted' | 'Rejected';

export type InternshipDuration = '1 month' | '2 months' | '3 months';

export type DeliveryStatus = 'Pending' | 'Sent' | 'Failed';

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
