
import { mockUsers } from "./mockUsers";

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

export const mockReports: Report[] = [
  {
    id: "REP-001",
    title: "Clean Water Initiative in Rural Kenya",
    sdg_goal: "6",
    project_status: "in_progress",
    location: "Kajiado County, Kenya",
    description: "Drilling and installation of 20 boreholes to provide clean water access to pastoralist communities.",
    submitted_at: "2025-05-20",
    lat: -1.85,
    lng: 36.7833,
    validations: 12,
    verifications: [
      ...Array.from({ length: 10 }, (_, i) => ({ id: i + 1, userId: 100 + i, userName: `User ${100+i}`, action: 'confirm' as const, createdAt: new Date().toISOString() })),
      ...Array.from({ length: 2 }, (_, i) => ({ id: i + 11, userId: 200 + i, userName: `User ${200+i}`, action: 'dispute' as const, createdAt: new Date().toISOString() })),
    ],
    verification_score: 83,
    official: true,
    country_code: "KEN",
    cost: 50000,
    costCurrency: "USD",
    targetUnit: "wells built",
    targetValue: 20,
    currentValue: 15,
    progressHistory: [
      { value: 5, recordedAt: "2025-03-10", notes: "Initial phase complete" },
      { value: 15, recordedAt: "2025-05-15", notes: "Phase 2 construction finished" },
    ],
  },
  {
    id: "REP-002",
    title: "Girls' Education Program in Northern Nigeria",
    sdg_goal: "4",
    project_status: "completed",
    location: "Kano State, Nigeria",
    description: "A program to increase primary school enrollment for girls through scholarships and community engagement.",
    submitted_at: "2025-04-15",
    lat: 11.5,
    lng: 8.5,
    validations: 25,
    verifications: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, userId: 300 + i, userName: `User ${300+i}`, action: 'confirm' as const, createdAt: new Date().toISOString() })),
    verification_score: 100,
    official: false,
    country_code: "NGA",
    cost: 120000,
    costCurrency: "USD",
    targetUnit: "students enrolled",
    targetValue: 500,
    currentValue: 500,
  },
  {
    id: "REP-003",
    title: "Solar Mini-Grid Installation",
    sdg_goal: "7",
    project_status: "planned",
    location: "Accra, Ghana",
    description: "Development of a solar-powered mini-grid to provide electricity to an off-grid community.",
    submitted_at: "2025-06-01",
    lat: 5.6037,
    lng: -0.187,
    validations: 3,
    verifications: [],
    verification_score: undefined,
    official: true,
    country_code: "GHA",
    cost: 750000,
    costCurrency: "GHS",
    usd_exchange_rate: 14.5,
  },
  {
    id: "REP-004",
    title: "Community Health Clinic Upgrade",
    sdg_goal: "3",
    project_status: "stalled",
    location: "Addis Ababa, Ethiopia",
    description: "Renovation and re-equipment of a local health clinic. Project currently stalled due to funding issues.",
    submitted_at: "2025-03-10",
    lat: 9.03,
    lng: 38.74,
    validations: 8,
    verifications: [],
    verification_score: undefined,
    official: false,
    country_code: "ETH",
    cost: 80000,
    costCurrency: "USD",
  },
  {
    id: "REP-005",
    title: "Sustainable Agriculture Training",
    sdg_goal: "2",
    project_status: "completed",
    location: "Western Cape, South Africa",
    description: "Training program for smallholder farmers on sustainable and climate-resilient agricultural practices.",
    submitted_at: "2025-05-30",
    lat: -33.2278,
    lng: 21.8569,
    validations: 1,
    verifications: [],
    verification_score: undefined,
    official: false,
    country_code: "ZAF",
    cost: 450000,
    costCurrency: "ZAR",
    usd_exchange_rate: 18.2,
  },
  {
    id: "REP-006",
    title: "Youth Tech Hub Launch",
    sdg_goal: "9",
    project_status: "in_progress",
    location: "Lagos, Nigeria",
    description: "Establishment of a technology and innovation hub for young entrepreneurs in Yaba.",
    submitted_at: "2025-06-10",
    lat: 6.5244,
    lng: 3.3792,
    validations: 0,
    verifications: [],
    verification_score: undefined,
    official: false,
    country_code: "NGA",
    cost: 280000000,
    costCurrency: "NGN",
    usd_exchange_rate: 1480,
  },
];

export const getOfficialProjects = (countryCode?: string): Report[] => {
  const officialProjects = mockReports.filter(p => p.official);
  if (countryCode) {
    return officialProjects.filter(p => p.country_code === countryCode);
  }
  return officialProjects;
};
