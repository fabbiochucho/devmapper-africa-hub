
import { UserRole } from "@/contexts/UserRoleContext";

export interface MockUser {
  id: number;
  name: string;
  email: string;
  password: string; // Plain text for mock purposes
  role: UserRole;
  verified: boolean;
  organization?: string;
  country?: string;
  createdAt: string;
  lastLogin?: string;
}

export const mockUsers: MockUser[] = [
  {
    id: 1,
    name: "Demo Citizen",
    email: "citizen@demo.com",
    password: "password",
    role: "Citizen Reporter",
    verified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Demo NGO Member",
    email: "ngo@demo.com",
    password: "password",
    role: "NGO Member",
    verified: true,
    organization: "Dev Watch NGO",
    country: "GHA",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Demo Government Official",
    email: "gov@demo.com",
    password: "password",
    role: "Government Official",
    verified: true,
    organization: "Ministry of Development",
    country: "KEN",
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Demo Company Rep",
    email: "corp@demo.com",
    password: "password",
    role: "Company Representative",
    verified: true,
    organization: "Sustainable Corp Ltd",
    country: "NGA",
    createdAt: new Date().toISOString(),
  },
];
