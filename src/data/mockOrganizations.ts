
export interface Organization {
  id: number;
  name: string;
  type: 'ngo' | 'company' | 'government';
  country: string;
  projects_count: number;
}

export const mockOrganizations: Organization[] = [
  {
    id: 1,
    name: "Water for All NGO",
    type: "ngo",
    country: "KEN",
    projects_count: 12,
  },
  {
    id: 2,
    name: "Sustainable Corp Ltd",
    type: "company",
    country: "NGA",
    projects_count: 5,
  },
  {
    id: 3,
    name: "Ministry of Development",
    type: "government",
    country: "KEN",
    projects_count: 25,
  },
  {
    id: 4,
    name: "Dev Watch NGO",
    type: "ngo",
    country: "GHA",
    projects_count: 8,
  },
];
