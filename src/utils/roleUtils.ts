import type { User } from '../types/auth';

// Role constants
export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  DEALER: 'Dealer',
  CUSTOMER: 'Customer'
} as const;

// Role-based access helper functions
export const hasRole = (user: User, allowedRoles: string[]): boolean => {
  if (!user?.role) {
    return false;
  }
  
  // Handle both string and object role formats
  const userRole = typeof user.role === 'string' ? user.role : user.role.name;
  
  if (!userRole) {
    return false;
  }
  
  return allowedRoles.some(role => {
    switch (role.toLowerCase()) {
      case 'super admin':
        return userRole === ROLES.SUPER_ADMIN;
      case 'dealer':
        return userRole === ROLES.DEALER;
      case 'customer':
        return userRole === ROLES.CUSTOMER;
      default:
        return userRole === role;
    }
  });
};


// Convenience functions for common role checks
export const isSuperAdmin = (user: User): boolean => {
  if (!user?.role) return false;
  const userRole = typeof user.role === 'string' ? user.role : user.role.name;
  return userRole === ROLES.SUPER_ADMIN;
};

export const isDealer = (user: User): boolean => {
  if (!user?.role) return false;
  const userRole = typeof user.role === 'string' ? user.role : user.role.name;
  return userRole === ROLES.DEALER;
};

export const isCustomer = (user: User): boolean => {
  if (!user?.role) return false;
  const userRole = typeof user.role === 'string' ? user.role : user.role.name;
  return userRole === ROLES.CUSTOMER;
};

