// Government-responsibility taxonomy: which arm/function of government a
// report or rating concerns. Independent from reports.issue_type (the
// "nature of the problem" - damage/complaint/violation), this classifies
// "whose job this is" - shared between report classification (Feature 1)
// and country rating dimensions (Feature 3), so the two features speak the
// same vocabulary.
export const responsibilityAreas = [
  { value: "infrastructure", label: "Infrastructure", description: "Roads, bridges, public buildings, transport" },
  { value: "water_sanitation", label: "Water & Sanitation", description: "Water supply, sewage, waste management" },
  { value: "health", label: "Health", description: "Clinics, hospitals, public health services" },
  { value: "education", label: "Education", description: "Schools, teacher supply, learning materials" },
  { value: "economic_revenue", label: "Economic & Revenue", description: "Taxation, markets, local economic development" },
  { value: "agriculture", label: "Agriculture", description: "Farming support, land use, food security" },
  { value: "civil_registration", label: "Civil Registration", description: "Birth/death records, IDs, permits" },
  { value: "governance", label: "Governance", description: "Transparency, public participation, service delivery" },
] as const;

export type ResponsibilityAreaValue = typeof responsibilityAreas[number]["value"];
