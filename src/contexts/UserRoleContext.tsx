
import React, { createContext, useState, useContext, ReactNode } from 'react';

export type UserRole = 'Citizen Reporter' | 'NGO Member' | 'Government Official' | 'Company Representative' | 'Country Admin' | 'Platform Admin';

export const ALL_ROLES: UserRole[] = ['Citizen Reporter', 'NGO Member', 'Government Official', 'Company Representative', 'Country Admin', 'Platform Admin'];

interface UserRoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>('Citizen Reporter');

  return (
    <UserRoleContext.Provider value={{ role, setRole }}>
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
