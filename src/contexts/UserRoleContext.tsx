
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { MockUser, mockUsers } from '@/data/mockUsers';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'Citizen Reporter' | 'NGO Member' | 'Government Official' | 'Company Representative' | 'Country Admin' | 'Platform Admin' | 'Change Maker';

export const ALL_ROLES: UserRole[] = ['Citizen Reporter', 'NGO Member', 'Government Official', 'Company Representative', 'Country Admin', 'Platform Admin', 'Change Maker'];

export interface UserRoleData {
  role: UserRole;
  organization?: string;
  country?: string;
}

interface UserRoleContextType {
  roles: UserRoleData[];
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  user: MockUser | null;
  hasRole: (role: UserRole) => boolean;
  addRole: (roleData: UserRoleData) => Promise<void>;
  removeRole: (role: UserRole) => Promise<void>;
  isAuthenticated: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const [roles, setRoles] = useState<UserRoleData[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('Citizen Reporter');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // For demo purposes, we'll use mock data, but in production this would fetch from Supabase
  const user = useMemo(() => {
    if (!isAuthenticated) return null;
    
    // Find user based on current role for demo
    const foundUser = mockUsers.find(u => u.role === currentRole);
    return foundUser || mockUsers[0];
  }, [currentRole, isAuthenticated]);

  const hasRole = (role: UserRole): boolean => {
    return roles.some(r => r.role === role);
  };

  const addRole = async (roleData: UserRoleData): Promise<void> => {
    if (!user) return;
    
    try {
      // In production, this would insert into Supabase
      // const { error } = await supabase
      //   .from('user_roles')
      //   .insert({
      //     user_id: user.id,
      //     role: roleData.role,
      //     organization: roleData.organization,
      //     country: roleData.country
      //   });
      
      // For demo, just update local state
      if (!hasRole(roleData.role)) {
        setRoles(prev => [...prev, roleData]);
      }
    } catch (error) {
      console.error('Error adding role:', error);
    }
  };

  const removeRole = async (role: UserRole): Promise<void> => {
    if (!user) return;
    
    try {
      // In production, this would delete from Supabase
      // const { error } = await supabase
      //   .from('user_roles')
      //   .delete()
      //   .eq('user_id', user.id)
      //   .eq('role', role);
      
      // For demo, just update local state
      setRoles(prev => prev.filter(r => r.role !== role));
      
      // If removing current role, switch to first available role
      if (currentRole === role && roles.length > 1) {
        const remainingRoles = roles.filter(r => r.role !== role);
        if (remainingRoles.length > 0) {
          setCurrentRole(remainingRoles[0].role);
        }
      }
    } catch (error) {
      console.error('Error removing role:', error);
    }
  };

  // Initialize with demo data
  useEffect(() => {
    // For demo purposes, initialize with default roles
    // In production, this would fetch from Supabase when user authenticates
    const initializeRoles = () => {
      setRoles([
        { role: 'Citizen Reporter' },
        { role: 'Change Maker' }
      ]);
      setIsAuthenticated(true);
    };

    initializeRoles();
  }, []);

  return (
    <UserRoleContext.Provider value={{ 
      roles, 
      currentRole, 
      setCurrentRole, 
      user, 
      hasRole, 
      addRole, 
      removeRole,
      isAuthenticated 
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
