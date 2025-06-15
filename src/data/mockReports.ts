import { reverseGeocode } from "@/lib/geocode";

// Type definitions are kept to maintain the data contract with other components.
export type Verification = {
  id: number;
  userId: number;
  userName: string;
  action: 'confirm' | 'dispute';
  notes?: string;
  createdAt: string;
}

export type Report = {
  id: string;
  title: string;
  description?: string;
  sdg_goal: string;
  sdg_target?: string;
  project_status: "planned" | "in_progress" | "completed" | "stalled" | "cancelled";
  location: string;
  submitted_at: string;
  lat?: number;
  lng?: number;
  validations: number;
  cost?: number;
  costCurrency?: string;
  usd_exchange_rate?: number;
  startDate?: string;
  endDate?: string;
  sponsor?: string;
  funder?: string;
  contractor?: string;
  targetUnit?: string;
  targetValue?: number;
  currentValue?: number;
  progressHistory?: Array<{
    value: number;
    recordedAt: string;
    notes: string;
  }>;
  official?: boolean;
  country_code?: string;
  verifications: Verification[];
  verification_score?: number;
};

// Internal type for the new raw data structure provided by the user.
interface MapProject {
  id: number;
  title: string;
  content: string;
  sdg_goal: number;
  sdg_target: string;
  status: "pending" | "confirmed" | "completed";
  lat: number;
  lng: number;
  budget: number;
  verification_score: number;
  created_at: string;
}

// Function to get the new raw data.
function getRawMockProjects(): MapProject[] {
  return [
    {
      id: 1,
      title: "Clean Water Project - Nairobi",
      content:
        "Installing water purification systems in Kibera slum to provide clean drinking water access to over 10,000 residents. The project includes community training and maintenance programs.",
      sdg_goal: 6,
      sdg_target: "6.1",
      status: "confirmed",
      lat: -1.2921,
      lng: 36.8219,
      budget: 50000,
      verification_score: 85,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      title: "Education Center - Lagos",
      content:
        "Building a new primary school to serve 500 children in underserved communities. Includes teacher training and digital learning resources.",
      sdg_goal: 4,
      sdg_target: "4.1",
      status: "pending",
      lat: 6.5244,
      lng: 3.3792,
      budget: 120000,
      verification_score: 72,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      title: "Solar Energy Initiative - Cape Town",
      content:
        "Installing solar panels in rural communities to provide affordable clean energy access. Project covers 15 villages with 2,000 households.",
      sdg_goal: 7,
      sdg_target: "7.1",
      status: "completed",
      lat: -33.9249,
      lng: 18.4241,
      budget: 75000,
      verification_score: 92,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      title: "Healthcare Clinic - Accra",
      content:
        "Establishing a maternal health clinic to reduce infant mortality rates. Provides prenatal care, delivery services, and postnatal support.",
      sdg_goal: 3,
      sdg_target: "3.2",
      status: "confirmed",
      lat: 5.6037,
      lng: -0.187,
      budget: 80000,
      verification_score: 88,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      title: "Agricultural Training - Addis Ababa",
      content:
        "Training farmers in sustainable agriculture practices to combat hunger. Includes seed distribution and irrigation system installation.",
      sdg_goal: 2,
      sdg_target: "2.3",
      status: "pending",
      lat: 9.145,
      lng: 40.4897,
      budget: 35000,
      verification_score: 65,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 6,
      title: "Women's Empowerment Center - Kigali",
      content:
        "Creating economic opportunities for women through skills training and microfinance programs. Supporting 200 women entrepreneurs.",
      sdg_goal: 5,
      sdg_target: "5.5",
      status: "confirmed",
      lat: -1.9441,
      lng: 30.0619,
      budget: 45000,
      verification_score: 78,
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 7,
      title: "Urban Housing Project - Johannesburg",
      content:
        "Developing affordable housing units for low-income families. Includes community facilities and green spaces.",
      sdg_goal: 11,
      sdg_target: "11.1",
      status: "pending",
      lat: -26.2041,
      lng: 28.0473,
      budget: 200000,
      verification_score: 70,
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 8,
      title: "Reforestation Initiative - Kampala",
      content:
        "Planting 50,000 trees to combat deforestation and climate change. Involves local communities in tree care and maintenance.",
      sdg_goal: 15,
      sdg_target: "15.2",
      status: "confirmed",
      lat: 0.3476,
      lng: 32.5825,
      budget: 25000,
      verification_score: 89,
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 9,
      title: "Digital Skills Training - Dar es Salaam",
      content:
        "Providing digital literacy training to youth for better employment opportunities. Includes computer labs and internet access.",
      sdg_goal: 8,
      sdg_target: "8.6",
      status: "pending",
      lat: -6.7924,
      lng: 39.2083,
      budget: 60000,
      verification_score: 75,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 10,
      title: "Waste Management System - Abuja",
      content:
        "Implementing sustainable waste management and recycling programs. Includes community education and waste collection infrastructure.",
      sdg_goal: 12,
      sdg_target: "12.5",
      status: "confirmed",
      lat: 9.0765,
      lng: 7.3986,
      budget: 90000,
      verification_score: 82,
      created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}


const rawProjects = getRawMockProjects();

export const mockReports: Report[] = rawProjects.map(p => {
  const geocodeResult = reverseGeocode(p.lat, p.lng);
  
  let project_status: Report['project_status'] = 'planned';
  if (p.status === 'pending') {
    project_status = 'planned';
  } else if (p.status === 'confirmed') {
    project_status = 'in_progress';
  } else if (p.status === 'completed') {
    project_status = 'completed';
  }

  const confirmations = Math.round((p.verification_score / 100) * 10);
  const disputes = Math.max(0, 10 - confirmations);
  const verifications: Verification[] = [
    ...Array.from({ length: confirmations }, (_, i) => ({ id: i, userId: 100 + i, userName: `User ${100+i}`, action: 'confirm' as const, createdAt: new Date().toISOString() })),
    ...Array.from({ length: disputes }, (_, i) => ({ id: confirmations + i, userId: 200 + i, userName: `User ${200+i}`, action: 'dispute' as const, createdAt: new Date().toISOString() }))
  ];
  
  const city = p.title.split(" - ")[1] || "Unknown City";

  return {
    id: `REP-${p.id.toString().padStart(3, '0')}`,
    title: p.title,
    description: p.content,
    sdg_goal: p.sdg_goal.toString(),
    sdg_target: p.sdg_target,
    project_status: project_status,
    location: geocodeResult ? `${city}, ${geocodeResult.country}` : city,
    submitted_at: p.created_at,
    lat: p.lat,
    lng: p.lng,
    validations: verifications.length,
    verifications: verifications,
    verification_score: p.verification_score,
    country_code: geocodeResult?.country_code,
    cost: p.budget,
    costCurrency: 'USD',
    official: Math.random() > 0.5,
  };
});

export const getOfficialProjects = (countryCode?: string): Report[] => {
  const officialProjects = mockReports.filter(p => p.official);
  if (countryCode) {
    return officialProjects.filter(p => p.country_code === countryCode);
  }
  return officialProjects;
};
