
export interface GovernmentDashboardData {
  overview: {
    totalProjects: number;
    totalBudget: number;
    pendingReview: number;
    completionRate: number;
  };
  sdgProgress: {
    goal: number;
    projects: number;
    budget: number;
    progress: number;
  }[];
  regionalStats: {
    region: string;
    projects: number;
    budget: number;
  }[];
  recentActivity: {
    id: number;
    type: string;
    title: string;
    location?: string;
    amount?: number;
    timestamp: string;
  }[];
}

const mockData: { [key: string]: GovernmentDashboardData } = {
  KEN: {
    overview: {
      totalProjects: 198,
      totalBudget: 38200000,
      pendingReview: 45,
      completionRate: 76,
    },
    sdgProgress: [
      { goal: 6, projects: 45, budget: 8900000, progress: 78 },
      { goal: 4, projects: 38, budget: 7200000, progress: 82 },
      { goal: 9, projects: 32, budget: 6100000, progress: 71 },
      { goal: 7, projects: 28, budget: 5400000, progress: 65 },
    ],
    regionalStats: [
      { region: "Nairobi", projects: 65, budget: 11200000 },
      { region: "Rift Valley", projects: 52, budget: 9800000 },
      { region: "Coast", projects: 41, budget: 8100000 },
      { region: "Western", projects: 30, budget: 6400000 },
    ],
    recentActivity: [
      {
        id: 1,
        type: "project_approved",
        title: "Kisumu Solar Power Plant",
        location: "Kisumu County",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        type: "budget_allocated",
        title: "Rural Health Clinics Upgrade",
        amount: 1500000,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  NGA: {
     overview: {
      totalProjects: 234,
      totalBudget: 45600000,
      pendingReview: 67,
      completionRate: 89,
    },
    sdgProgress: [
      { goal: 1, projects: 50, budget: 10000000, progress: 60 },
      { goal: 8, projects: 45, budget: 9500000, progress: 75 },
      { goal: 3, projects: 40, budget: 8000000, progress: 68 },
      { goal: 7, projects: 35, budget: 7500000, progress: 72 },
    ],
    regionalStats: [
      { region: "Lagos", projects: 89, budget: 15200000 },
      { region: "Kano", projects: 67, budget: 12800000 },
      { region: "Rivers", projects: 45, budget: 9600000 },
      { region: "Abuja", projects: 33, budget: 7900000 },
    ],
    recentActivity: [
      {
        id: 1,
        type: "project_approved",
        title: "Water Infrastructure Project",
        location: "Lagos State",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        type: "budget_allocated",
        title: "Education Modernization",
        amount: 2400000,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  DEFAULT: {
    overview: {
      totalProjects: 234,
      totalBudget: 45600000,
      pendingReview: 67,
      completionRate: 89,
    },
    sdgProgress: [
      { goal: 6, projects: 45, budget: 8900000, progress: 78 },
      { goal: 4, projects: 38, budget: 7200000, progress: 82 },
      { goal: 3, projects: 32, budget: 6100000, progress: 71 },
      { goal: 7, projects: 28, budget: 5400000, progress: 65 },
    ],
    regionalStats: [
      { region: "Central", projects: 89, budget: 15200000 },
      { region: "Northern", projects: 67, budget: 12800000 },
      { region: "Eastern", projects: 45, budget: 9600000 },
      { region: "Western", projects: 33, budget: 7900000 },
    ],
    recentActivity: [
      {
        id: 1,
        type: "project_approved",
        title: "Water Infrastructure Project",
        location: "Lagos State",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        type: "budget_allocated",
        title: "Education Modernization",
        amount: 2400000,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ],
  }
};

export const getGovernmentDashboardData = (countryCode: string): GovernmentDashboardData => {
  return mockData[countryCode] || mockData['DEFAULT'];
};
