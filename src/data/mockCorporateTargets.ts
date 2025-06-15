import { TargetFormValues } from "@/lib/targetSchema";

export type CorporateTarget = {
  id: number;
  title: string;
  description?: string;
  metric: string;
  targetValue: number;
  targetUnit: string;
  currentValue: number;
  progress: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  sdgGoal?: number;
  sdgTarget?: string;
  countryCode?: string;
  progressHistory?: {
    value: number;
    recordedAt: string;
    notes: string;
  }[];
};

let corporateTargets: CorporateTarget[] = [
  {
    id: 1,
    title: "Reduce Carbon Footprint by 20%",
    description: "Scope 1 and 2 emissions reduction across all operations.",
    metric: "CO2 Emissions Reduction",
    targetValue: 20,
    targetUnit: "%",
    currentValue: 8,
    progress: 40,
    deadline: "2026-12-31T00:00:00.000Z",
    createdAt: "2025-01-15T00:00:00.000Z",
    updatedAt: "2025-06-10T00:00:00.000Z",
    sdgGoal: 13,
    sdgTarget: "13.2",
    countryCode: "NGA",
    progressHistory: [
      { value: 4, recordedAt: "2025-03-31T00:00:00.000Z", notes: "Q1 update" },
      { value: 8, recordedAt: "2025-06-10T00:00:00.000Z", notes: "Q2 update" },
    ],
  },
  {
    id: 2,
    title: "Increase Renewable Energy Usage",
    description: "Transition to 50% renewable energy sources for all facilities.",
    metric: "Renewable Energy Mix",
    targetValue: 50,
    targetUnit: "%",
    currentValue: 35,
    progress: 70,
    deadline: "2027-06-30T00:00:00.000Z",
    createdAt: "2025-02-20T00:00:00.000Z",
    updatedAt: "2025-05-25T00:00:00.000Z",
    sdgGoal: 7,
    sdgTarget: "7.2",
    countryCode: "KEN",
    progressHistory: [
      { value: 20, recordedAt: "2025-04-01T00:00:00.000Z", notes: "Solar panels installed" },
      { value: 35, recordedAt: "2025-05-25T00:00:00.000Z", notes: "Wind farm online" },
    ],
  },
];

// Simulate API to get all targets
export const getCorporateTargets = async (): Promise<CorporateTarget[]> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return Promise.resolve(corporateTargets);
};

// Simulate API to add a new target
export const addCorporateTarget = async (
  targetData: TargetFormValues
): Promise<CorporateTarget> => {
  const newTarget: CorporateTarget = {
    id: corporateTargets.length > 0 ? Math.max(...corporateTargets.map(t => t.id)) + 1 : 1,
    title: targetData.title,
    metric: targetData.metric,
    targetValue: targetData.targetValue,
    targetUnit: targetData.targetUnit,
    deadline: targetData.deadline.toISOString(),
    currentValue: 0,
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  corporateTargets.push(newTarget);
  return Promise.resolve(newTarget);
};

// New function for the ESG Dashboard dialog
export const addCorporateEsgTarget = async (
  targetData: any
): Promise<CorporateTarget> => {
  const newTarget: CorporateTarget = {
    id: corporateTargets.length > 0 ? Math.max(...corporateTargets.map((t) => t.id)) + 1 : 1,
    title: targetData.title,
    description: targetData.description,
    metric: "Custom Metric", // The new form doesn't have metric
    targetValue: Number(targetData.targetValue),
    targetUnit: targetData.targetUnit,
    deadline: new Date(targetData.targetDate).toISOString(),
    currentValue: 0,
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sdgGoal: Number(targetData.sdgGoal),
    countryCode: targetData.countryCode,
    progressHistory: [],
  };
  corporateTargets.push(newTarget);
  return Promise.resolve(newTarget);
};

// New function to update target progress
export const updateCorporateTarget = async ({
  targetId,
  progressData,
}: {
  targetId: number;
  progressData: { value: string; notes: string };
}): Promise<CorporateTarget | null> => {
  const targetToUpdate = corporateTargets.find((t) => t.id === targetId);
  if (!targetToUpdate) {
    return Promise.resolve(null);
  }

  const value = Number(progressData.value);
  targetToUpdate.currentValue = value;
  targetToUpdate.progress = Math.round((value / targetToUpdate.targetValue) * 100);
  if (!targetToUpdate.progressHistory) {
    targetToUpdate.progressHistory = [];
  }
  targetToUpdate.progressHistory.push({
    value,
    recordedAt: new Date().toISOString(),
    notes: progressData.notes || `Updated to ${value} ${targetToUpdate.targetUnit || ""}`.trim(),
  });
  targetToUpdate.updatedAt = new Date().toISOString();

  return Promise.resolve(targetToUpdate);
};
