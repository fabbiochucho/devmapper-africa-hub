
export type ChangeMakerType = 'individual' | 'group' | 'ngo' | 'corporate';

export interface ChangeMakerMember {
  name: string;
  role: string;
  bio: string;
  email: string;
  photo?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

export interface ChangeMaker {
  id: string;
  type: ChangeMakerType;
  name: string;
  bio: string;
  description: string;
  sdg_goals: string[];
  location: string;
  country_code: string;
  lat?: number;
  lng?: number;
  photo: string;
  members?: ChangeMakerMember[]; // For groups
  email: string;
  phone?: string;
  website?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  projects: string[]; // Project IDs
  totalFunding: number;
  impactMetrics: {
    livesTouched: number;
    communitiesServed: number;
    projectsCompleted: number;
  };
  verifications: Array<{
    id: number;
    userId: number;
    userName: string;
    action: 'confirm' | 'dispute';
    notes?: string;
    createdAt: string;
  }>;
  verification_score: number;
  submitted_by: string;
  submitted_at: string;
  verified: boolean;
}

export const mockChangeMakers: ChangeMaker[] = [
  {
    id: "CM-001",
    type: "individual",
    name: "Amina Hassan",
    bio: "Education advocate with 10+ years experience in community development",
    description: "Dedicated to improving educational outcomes in underserved communities across Nigeria. Has successfully implemented digital learning programs in over 50 schools.",
    sdg_goals: ["4", "5", "10"],
    location: "Lagos, Nigeria",
    country_code: "NGA",
    lat: 6.5244,
    lng: 3.3792,
    photo: "/placeholder.svg",
    email: "amina.hassan@example.com",
    phone: "+234-xxx-xxxx",
    website: "https://aminaeducation.org",
    socialMedia: {
      linkedin: "https://linkedin.com/in/aminahassan",
      twitter: "https://twitter.com/aminahassan",
    },
    projects: ["REP-002"],
    totalFunding: 125000,
    impactMetrics: {
      livesTouched: 50000,
      communitiesServed: 25,
      projectsCompleted: 12
    },
    verifications: [
      { id: 1, userId: 101, userName: "User 101", action: 'confirm', createdAt: new Date().toISOString() },
      { id: 2, userId: 102, userName: "User 102", action: 'confirm', createdAt: new Date().toISOString() }
    ],
    verification_score: 88,
    submitted_by: "1",
    submitted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    verified: true
  },
  {
    id: "CM-002",
    type: "ngo",
    name: "Clean Water Initiative Kenya",
    bio: "Non-profit organization focused on providing clean water access across East Africa",
    description: "Leading NGO in water sanitation and hygiene (WASH) programs. Has provided clean water access to over 100 communities in Kenya, Uganda, and Tanzania.",
    sdg_goals: ["6", "3", "1"],
    location: "Nairobi, Kenya",
    country_code: "KEN",
    lat: -1.2921,
    lng: 36.8219,
    photo: "/placeholder.svg",
    email: "info@cleanwaterkenya.org",
    phone: "+254-xxx-xxxx",
    website: "https://cleanwaterkenya.org",
    socialMedia: {
      linkedin: "https://linkedin.com/company/cleanwaterkenya",
      facebook: "https://facebook.com/cleanwaterkenya",
    },
    projects: ["REP-001", "REP-003"],
    totalFunding: 450000,
    impactMetrics: {
      livesTouched: 125000,
      communitiesServed: 100,
      projectsCompleted: 25
    },
    verifications: [
      { id: 1, userId: 201, userName: "User 201", action: 'confirm', createdAt: new Date().toISOString() },
      { id: 2, userId: 202, userName: "User 202", action: 'confirm', createdAt: new Date().toISOString() },
      { id: 3, userId: 203, userName: "User 203", action: 'confirm', createdAt: new Date().toISOString() }
    ],
    verification_score: 95,
    submitted_by: "2",
    submitted_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    verified: true
  },
  {
    id: "CM-003",
    type: "corporate",
    name: "GreenTech Solutions Ltd",
    bio: "Corporate sustainability leader specializing in renewable energy solutions",
    description: "Technology company focused on developing and implementing sustainable energy solutions across Africa. Leading corporate partner in the fight against climate change.",
    sdg_goals: ["7", "13", "9"],
    location: "Cape Town, South Africa",
    country_code: "ZAF",
    lat: -33.9249,
    lng: 18.4241,
    photo: "/placeholder.svg",
    email: "partnerships@greentech.co.za",
    phone: "+27-xxx-xxxx",
    website: "https://greentech.co.za",
    socialMedia: {
      linkedin: "https://linkedin.com/company/greentech-solutions",
      twitter: "https://twitter.com/greentechsa",
    },
    projects: ["REP-003", "REP-007"],
    totalFunding: 890000,
    impactMetrics: {
      livesTouched: 75000,
      communitiesServed: 45,
      projectsCompleted: 18
    },
    verifications: [
      { id: 1, userId: 301, userName: "User 301", action: 'confirm', createdAt: new Date().toISOString() },
      { id: 2, userId: 302, userName: "User 302", action: 'confirm', createdAt: new Date().toISOString() }
    ],
    verification_score: 92,
    submitted_by: "3",
    submitted_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    verified: true
  },
  {
    id: "CM-004",
    type: "group",
    name: "Youth Climate Action Collective",
    bio: "Group of young climate activists working across West Africa",
    description: "Dynamic group of 15 young professionals and students dedicated to climate action and environmental conservation across Ghana, Nigeria, and Senegal.",
    sdg_goals: ["13", "15", "11"],
    location: "Accra, Ghana",
    country_code: "GHA",
    lat: 5.6037,
    lng: -0.187,
    photo: "/placeholder.svg",
    members: [
      {
        name: "Kofi Asante",
        role: "Lead Coordinator",
        bio: "Environmental science graduate with expertise in reforestation projects",
        email: "kofi@ycac.org",
        photo: "/placeholder.svg",
        socialMedia: { linkedin: "https://linkedin.com/in/kofiasante" }
      },
      {
        name: "Fatima Diallo",
        role: "Communications Lead",
        bio: "Digital marketing specialist focused on climate advocacy",
        email: "fatima@ycac.org",
        photo: "/placeholder.svg",
        socialMedia: { twitter: "https://twitter.com/fatimadiallo" }
      }
    ],
    email: "info@ycac.org",
    phone: "+233-xxx-xxxx",
    website: "https://youthclimateaction.org",
    socialMedia: {
      instagram: "https://instagram.com/youthclimateaction",
      twitter: "https://twitter.com/ycac_africa",
    },
    projects: ["REP-008"],
    totalFunding: 65000,
    impactMetrics: {
      livesTouched: 25000,
      communitiesServed: 15,
      projectsCompleted: 8
    },
    verifications: [
      { id: 1, userId: 401, userName: "User 401", action: 'confirm', createdAt: new Date().toISOString() }
    ],
    verification_score: 78,
    submitted_by: "4",
    submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    verified: false
  }
];
