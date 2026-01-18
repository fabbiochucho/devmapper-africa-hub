import type { UserRole } from '@/contexts/UserRoleContext';

export interface RoleDomainConfig {
  role: UserRole;
  label: string;
  description: string;
  requiredDomains: string[];
  domainHint: string;
  examples: string[];
}

// Domain patterns for each role type
export const roleDomainConfigs: RoleDomainConfig[] = [
  {
    role: 'citizen_reporter',
    label: 'Citizen Reporter',
    description: 'Report SDG projects in your community',
    requiredDomains: [], // No domain restriction for citizens
    domainHint: 'Any email address',
    examples: ['user@gmail.com', 'user@yahoo.com']
  },
  {
    role: 'ngo_member',
    label: 'NGO Member',
    description: 'Manage NGO projects and impact',
    requiredDomains: ['.org', '.ngo', 'ngo.', 'charity.', 'foundation.'],
    domainHint: 'Requires .org, .ngo, or organization email',
    examples: ['user@redcross.org', 'staff@unicef.ngo']
  },
  {
    role: 'government_official',
    label: 'Government Official',
    description: 'Track national SDG progress',
    requiredDomains: ['.gov', '.gov.', '.go.', 'government.', 'ministry.', '.mil'],
    domainHint: 'Requires government email domain (.gov)',
    examples: ['official@health.gov.ke', 'user@ministry.gov.ng']
  },
  {
    role: 'company_representative',
    label: 'Corporate Representative',
    description: 'Manage corporate sustainability',
    requiredDomains: ['.com', '.co.', '.inc', '.ltd', '.corp', '.biz', '.io', '.tech'],
    domainHint: 'Requires corporate email domain',
    examples: ['user@company.com', 'rep@business.co.ke']
  },
  {
    role: 'change_maker',
    label: 'Change Maker',
    description: 'Lead grassroots impact initiatives',
    requiredDomains: [], // No domain restriction for change makers
    domainHint: 'Any email address',
    examples: ['activist@gmail.com', 'leader@community.org']
  }
];

export const getRoleConfig = (role: UserRole): RoleDomainConfig | undefined => {
  return roleDomainConfigs.find(config => config.role === role);
};

export const validateEmailForRole = (email: string, role: UserRole): { valid: boolean; message: string } => {
  const config = getRoleConfig(role);
  
  if (!config) {
    return { valid: false, message: 'Invalid role selected' };
  }
  
  // Roles with no domain restriction
  if (config.requiredDomains.length === 0) {
    return { valid: true, message: '' };
  }
  
  const emailLower = email.toLowerCase();
  const domain = emailLower.split('@')[1] || '';
  
  // Check if domain matches any of the required patterns
  const isValidDomain = config.requiredDomains.some(pattern => {
    // Handle patterns like '.gov' (suffix), 'gov.' (contains), '.gov.' (contains)
    if (pattern.startsWith('.') && !pattern.endsWith('.')) {
      // Suffix pattern like '.gov', '.org'
      return domain.endsWith(pattern) || domain.includes(pattern + '.');
    } else if (pattern.endsWith('.')) {
      // Prefix/contains pattern like 'ngo.', 'ministry.'
      return domain.includes(pattern);
    } else {
      // Exact contains pattern
      return domain.includes(pattern);
    }
  });
  
  if (!isValidDomain) {
    return {
      valid: false,
      message: `${config.label} registration requires ${config.domainHint}. Example: ${config.examples[0]}`
    };
  }
  
  return { valid: true, message: '' };
};

export const getAvailableRolesForEmail = (email: string): UserRole[] => {
  const availableRoles: UserRole[] = [];
  
  for (const config of roleDomainConfigs) {
    const { valid } = validateEmailForRole(email, config.role);
    if (valid) {
      availableRoles.push(config.role);
    }
  }
  
  return availableRoles;
};

export const getSuggestedRoleForEmail = (email: string): UserRole => {
  const domain = email.toLowerCase().split('@')[1] || '';
  
  // Check for government domains first (most specific)
  if (domain.includes('.gov') || domain.includes('.go.') || domain.includes('government') || domain.includes('ministry')) {
    return 'government_official';
  }
  
  // Check for NGO domains
  if (domain.endsWith('.org') || domain.endsWith('.ngo') || domain.includes('charity') || domain.includes('foundation')) {
    return 'ngo_member';
  }
  
  // Check for corporate domains
  if (domain.endsWith('.com') || domain.endsWith('.io') || domain.endsWith('.tech') || domain.includes('.co.')) {
    return 'company_representative';
  }
  
  // Default to citizen reporter
  return 'citizen_reporter';
};
