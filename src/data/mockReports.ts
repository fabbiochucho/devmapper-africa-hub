
export type Report = {
  id: string;
  title: string;
  sdg_goal: string;
  project_status: "planned" | "in_progress" | "completed" | "stalled" | "cancelled";
  location: string;
  submitted_at: string;
};

export const mockReports: Report[] = [
  {
    id: "REP-001",
    title: "Clean Water Initiative in Rural Kenya",
    sdg_goal: "6",
    project_status: "in_progress",
    location: "Kajiado County, Kenya",
    submitted_at: "2025-05-20",
  },
  {
    id: "REP-002",
    title: "Girls' Education Program in Northern Nigeria",
    sdg_goal: "4",
    project_status: "completed",
    location: "Kano State, Nigeria",
    submitted_at: "2025-04-15",
  },
  {
    id: "REP-003",
    title: "Solar Mini-Grid Installation",
    sdg_goal: "7",
    project_status: "planned",
    location: "Accra, Ghana",
    submitted_at: "2025-06-01",
  },
  {
    id: "REP-004",
    title: "Community Health Clinic Upgrade",
    sdg_goal: "3",
    project_status: "stalled",
    location: "Addis Ababa, Ethiopia",
    submitted_at: "2025-03-10",
  },
  {
    id: "REP-005",
    title: "Sustainable Agriculture Training",
    sdg_goal: "2",
    project_status: "completed",
    location: "Western Cape, South Africa",
    submitted_at: "2025-05-30",
  },
  {
    id: "REP-006",
    title: "Youth Tech Hub Launch",
    sdg_goal: "9",
    project_status: "in_progress",
    location: "Lagos, Nigeria",
    submitted_at: "2025-06-10",
  },
];
