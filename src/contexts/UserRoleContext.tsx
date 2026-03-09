
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'citizen_reporter' | 'ngo_member' | 'government_official' | 'company_representative' | 'country_admin' | 'platform_admin' | 'change_maker' | 'admin';

export const ALL_ROLES: UserRole[] = ['citizen_reporter', 'ngo_member', 'government_official', 'company_representative', 'country_admin', 'platform_admin', 'change_maker', 'admin'];

export interface UserRoleData {
  role: UserRole;
  organization?: string;
  country?: string;
  is_active: boolean;
}

interface UserRoleContextType {
  roles: UserRoleData[];
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  hasRole: (role: UserRole) => boolean;
  addRole: (roleData: UserRoleData) => Promise<void>;
  removeRole: (role: UserRole) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const [roles, setRoles] = useState<UserRoleData[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('citizen_reporter');
  const [loading, setLoading] = useState(true);
  const { user: authUser, session, loading: authLoading, userRoles: authRoles } = useAuth();

  const isAuthenticated = !!authUser;

  const hasRole = (role: UserRole): boolean => {
    return roles.some(r => r.role === role);
  };

  const fetchUserRoles = useCallback(async (userId: string) => {
    try {
      // If AuthContext already has roles loaded, use them to avoid a duplicate query
      if (authRoles.length > 0) {
        const userRoles: UserRoleData[] = authRoles.map(role => ({
          role: role as UserRole,
          is_active: true
        }));
        setRoles(userRoles);
        if (userRoles.length > 0) {
          setCurrentRole(userRoles[0].role);
        }
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role, organization, country, is_active')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const userRoles = data?.map(role => ({
        role: role.role as UserRole,
        organization: role.organization,
        country: role.country,
        is_active: role.is_active
      })) || [];

      setRoles(userRoles);
      
      if (userRoles.length > 0) {
        setCurrentRole(userRoles[0].role);
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      setRoles([{ role: 'citizen_reporter', is_active: true }]);
      setCurrentRole('citizen_reporter');
    }
  }, [authRoles]);

  const addRole = async (roleData: UserRoleData): Promise<void> => {
    if (!authUser) return;
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: authUser.id,
          role: roleData.role,
          organization: roleData.organization,
          country: roleData.country,
          is_active: true
        });
      
      if (error) throw error;
      
      // Refresh roles
      fetchUserRoles(authUser.id);
    } catch (error) {
      console.error('Error adding role:', error);
    }
  };

  const removeRole = async (role: UserRole): Promise<void> => {
    if (!authUser) return;
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', authUser.id)
        .eq('role', role);
      
      if (error) throw error;
      
      // Refresh roles
      fetchUserRoles(authUser.id);
      
      // If removing current role, switch to first available role
      if (currentRole === role) {
        const remainingRoles = roles.filter(r => r.role !== role);
        if (remainingRoles.length > 0) {
          setCurrentRole(remainingRoles[0].role);
        } else {
          setCurrentRole('citizen_reporter');
        }
      }
    } catch (error) {
      console.error('Error removing role:', error);
    }
  };

  // Fetch user roles when authenticated
  useEffect(() => {
    if (authUser && !authLoading) {
      fetchUserRoles(authUser.id);
    } else if (!authUser) {
      setRoles([]);
      setCurrentRole('citizen_reporter');
    }
    setLoading(authLoading);
  }, [authUser, authLoading, fetchUserRoles]);

  return (
    <UserRoleContext.Provider value={{ 
      roles, 
      currentRole, 
      setCurrentRole, 
      hasRole, 
      addRole, 
      removeRole,
      isAuthenticated,
      loading
    }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};
