
export type Report = {
  id: string;
  title: string;
  sdg_goal: string;
  project_status: "planned" | "in_progress" | "completed" | "stalled" | "cancelled";
  location: string;
  submitted_at: string;
  lat?: number;
  lng?: number;
  validations: number;
  cost?: number;
  costCurrency?: string;
  startDate?: string;
  endDate?: string;
  sponsor?: string;
  funder?: string;
  contractor?: string;
};

export const mockReports: Report[] = [
  {
    id: "REP-001",
    title: "Clean Water Initiative in Rural Kenya",
    sdg_goal: "6",
    project_status: "in_progress",
    location: "Kajiado County, Kenya",
    submitted_at: "2025-05-20",
    lat: -1.85,
    lng: 36.7833,
    validations: 12,
  },
  {
    id: "REP-002",
    title: "Girls' Education Program in Northern Nigeria",
    sdg_goal: "4",
    project_status: "completed",
    location: "Kano State, Nigeria",
    submitted_at: "2025-04-15",
    lat: 11.5,
    lng: 8.5,
    validations: 25,
  },
  {
    id: "REP-003",
    title: "Solar Mini-Grid Installation",
    sdg_goal: "7",
    project_status: "planned",
    location: "Accra, Ghana",
    submitted_at: "2025-06-01",
    lat: 5.6037,
    lng: -0.187,
    validations: 3,
  },
  {
    id: "REP-004",
    title: "Community Health Clinic Upgrade",
    sdg_goal: "3",
    project_status: "stalled",
    location: "Addis Ababa, Ethiopia",
    submitted_at: "2025-03-10",
    lat: 9.03,
    lng: 38.74,
    validations: 8,
  },
  {
    id: "REP-005",
    title: "Sustainable Agriculture Training",
    sdg_goal: "2",
    project_status: "completed",
    location: "Western Cape, South Africa",
    submitted_at: "2025-05-30",
    lat: -33.2278,
    lng: 21.8569,
    validations: 1,
  },
  {
    id: "REP-006",
    title: "Youth Tech Hub Launch",
    sdg_goal: "9",
    project_status: "in_progress",
    location: "Lagos, Nigeria",
    submitted_at: "2025-06-10",
    lat: 6.5244,
    lng: 3.3792,
    validations: 0,
  },
];
