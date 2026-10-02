export type UserRole = 'citizen_reporter' | 'ngo_member' | 'government_official' | 'company_representative' | 'country_admin' | 'platform_admin' | 'change_maker' | 'admin' | 'funder';

export const ALL_ROLES: UserRole[] = ['citizen_reporter', 'ngo_member', 'government_official', 'company_representative', 'country_admin', 'platform_admin', 'change_maker', 'admin', 'funder'];

// Roles a user may assign to themselves. Excludes the privileged/admin roles,
// which must only ever be granted by an existing admin (server-side RLS
// enforces this too - this list keeps the UI from offering them at all).
export const SELF_ASSIGNABLE_ROLES: UserRole[] = ALL_ROLES.filter(
  role => !['admin', 'platform_admin', 'country_admin'].includes(role)
);
