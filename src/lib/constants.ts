
export const sdgGoals = [
  { value: "1", label: "Goal 1: No Poverty" },
  { value: "2", label: "Goal 2: Zero Hunger" },
  { value: "3", label: "Goal 3: Good Health and Well-being" },
  { value: "4", label: "Goal 4: Quality Education" },
  { value: "5", label: "Goal 5: Gender Equality" },
  { value: "6", label: "Goal 6: Clean Water and Sanitation" },
  { value: "7", label: "Goal 7: Affordable and Clean Energy" },
  { value: "8", label: "Goal 8: Decent Work and Economic Growth" },
  { value: "9", label: "Goal 9: Industry, Innovation and Infrastructure" },
  { value: "10", label: "Goal 10: Reduced Inequality" },
  { value: "11", label: "Goal 11: Sustainable Cities and Communities" },
  { value: "12", label: "Goal 12: Responsible Consumption and Production" },
  { value: "13", label: "Goal 13: Climate Action" },
  { value: "14", label: "Goal 14: Life Below Water" },
  { value: "15", label: "Goal 15: Life on Land" },
  { value: "16", label: "Goal 16: Peace and Justice Strong Institutions" },
  { value: "17", label: "Goal 17: Partnerships to achieve the Goal" },
];

export const projectStatuses = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "stalled", label: "Stalled / On Hold" },
  { value: "cancelled", label: "Cancelled" },
];

export const projectStatusColors: { [key: string]: string } = {
  planned: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  stalled: "bg-orange-100 text-orange-800",
  cancelled: "bg-red-100 text-red-800",
};

export const sdgGoalColors: { [key: string]: string } = {
  "1": "#e5243b",
  "2": "#dda63a",
  "3": "#4c9f38",
  "4": "#c5192d",
  "5": "#ff3a21",
  "6": "#26bde2",
  "7": "#fcc30b",
  "8": "#a21942",
  "9": "#fd6925",
  "10": "#dd1367",
  "11": "#fd9d24",
  "12": "#bf8b2e",
  "13": "#3f7e44",
  "14": "#0a97d9",
  "15": "#56c02b",
  "16": "#00689d",
  "17": "#19486a",
};

export const projectStatusChartColors: { [key: string]: string } = {
  planned: "#3b82f6",
  in_progress: "#f59e0b",
  completed: "#22c55e",
  stalled: "#f97316",
  cancelled: "#ef4444",
};
