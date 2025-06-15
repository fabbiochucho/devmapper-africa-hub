
import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import { MockUser, mockUsers } from '@/data/mockUsers';

export type UserRole = 'Citizen Reporter' | 'NGO Member' | 'Government Official' | 'Company Representative' | 'Country Admin' | 'Platform Admin';

export const ALL_ROLES: UserRole[] = ['Citizen Reporter', 'NGO Member', 'Government Official', 'Company Representative', 'Country Admin', 'Platform Admin'];

interface UserRoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  user: MockUser;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>('Citizen Reporter');

  const user = useMemo(() => {
    // For this mock setup, we find the first user with the selected role.
    const foundUser = mockUsers.find(u => u.role === role);
    // Fallback to the first user if no specific role user is found.
    return foundUser || mockUsers[0];
  }, [role]);


  return (
    <UserRoleContext.Provider value={{ role, setRole, user }}>
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
