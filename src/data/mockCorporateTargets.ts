
import { TargetFormValues } from "@/lib/targetSchema";

export type CorporateTarget = {
  id: number;
  title: string;
  metric: string;
  targetValue: number;
  targetUnit: string;
  currentValue: number;
  progress: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
};

let corporateTargets: CorporateTarget[] = [
  {
    id: 1,
    title: "Reduce Carbon Footprint by 20%",
    metric: "CO2 Emissions Reduction",
    targetValue: 20,
    targetUnit: "%",
    currentValue: 8,
    progress: 40,
    deadline: "2026-12-31T00:00:00.000Z",
    createdAt: "2025-01-15T00:00:00.000Z",
    updatedAt: "2025-06-10T00:00:00.000Z",
  },
  {
    id: 2,
    title: "Increase Renewable Energy Usage",
    metric: "Renewable Energy Mix",
    targetValue: 50,
    targetUnit: "%",
    currentValue: 35,
    progress: 70,
    deadline: "2027-06-30T00:00:00.000Z",
    createdAt: "2025-02-20T00:00:00.000Z",
    updatedAt: "2025-05-25T00:00:00.000Z",
  },
];

// Simulate API to get all targets
export const getCorporateTargets = async (): Promise<CorporateTarget[]> => {
  return Promise.resolve(corporateTargets);
};

// Simulate API to add a new target
export const addCorporateTarget = async (
  targetData: TargetFormValues
): Promise<CorporateTarget> => {
  const { deadline, ...rest } = targetData;
  const newTarget: CorporateTarget = {
    id: corporateTargets.length > 0 ? Math.max(...corporateTargets.map(t => t.id)) + 1 : 1,
    ...rest,
    deadline: deadline.toISOString(),
    currentValue: 0,
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  corporateTargets.push(newTarget);
  return Promise.resolve(newTarget);
};
