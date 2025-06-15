
import { mockReports } from "@/data/mockReports";

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

export const getGovernmentDashboardData = (
  countryCode: string,
): GovernmentDashboardData => {
  const reports =
    countryCode === "DEFAULT"
      ? mockReports
      : mockReports.filter((p) => p.country_code === countryCode);

  // Overview
  const totalProjects = reports.length;
  const totalBudget = reports.reduce((sum, p) => sum + (p.cost || 0), 0);
  const pendingReview = reports.filter(
    (p) => p.project_status === "planned",
  ).length;
  const completedProjects = reports.filter(
    (p) => p.project_status === "completed",
  ).length;
  const completionRate =
    totalProjects > 0
      ? Math.round((completedProjects / totalProjects) * 100)
      : 0;

  // SDG Progress
  const sdgProgressMap = new Map<
    string,
    { projects: number; budget: number; completed: number; inProgress: number }
  >();
  for (const report of reports) {
    const sdg = report.sdg_goal;
    if (!sdgProgressMap.has(sdg)) {
      sdgProgressMap.set(sdg, {
        projects: 0,
        budget: 0,
        completed: 0,
        inProgress: 0,
      });
    }
    const current = sdgProgressMap.get(sdg)!;
    current.projects += 1;
    current.budget += report.cost || 0;
    if (report.project_status === "completed") {
      current.completed += 1;
    } else if (report.project_status === "in_progress") {
      current.inProgress += 1;
    }
  }
  const sdgProgress = Array.from(sdgProgressMap.entries())
    .map(([goal, data]) => {
      const total = data.projects;
      const progress =
        total > 0
          ? Math.round(
              ((data.completed * 1 + data.inProgress * 0.5) / total) * 100,
            )
          : 0;
      return {
        goal: Number(goal),
        projects: data.projects,
        budget: data.budget,
        progress: progress,
      };
    })
    .sort((a, b) => b.projects - a.projects)
    .slice(0, 4);

  // Regional Stats
  const regionalStatsMap = new Map<string, { projects: number; budget: number }>();
  for (const report of reports) {
    const region =
      countryCode === "DEFAULT"
        ? report.country_code || "Unknown"
        : report.location.split(",")[0].trim();
    if (!regionalStatsMap.has(region)) {
      regionalStatsMap.set(region, { projects: 0, budget: 0 });
    }
    const current = regionalStatsMap.get(region)!;
    current.projects += 1;
    current.budget += report.cost || 0;
  }
  const regionalStats = Array.from(regionalStatsMap.entries())
    .map(([region, data]) => ({
      region,
      ...data,
    }))
    .sort((a, b) => b.projects - a.projects);

  // Recent Activity
  const recentActivity = reports
    .sort(
      (a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
    )
    .slice(0, 3)
    .map((report, index) => ({
      id: index + 1,
      type: index % 2 === 0 ? "project_approved" : "budget_allocated",
      title: report.title,
      location: report.location.split(",")[0].trim(),
      amount: report.cost,
      timestamp: report.submitted_at,
    }));

  return {
    overview: {
      totalProjects,
      totalBudget,
      pendingReview,
      completionRate,
    },
    sdgProgress,
    regionalStats,
    recentActivity,
  };
};
