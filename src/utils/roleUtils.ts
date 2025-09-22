import type { User } from '../types/auth';

// Role constants (using Django Group names)
export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  DEALER: 'Dealer',
  CUSTOMER: 'Customer'
} as const;

// Permission constants
export const PERMISSIONS = {
  // Vehicle permissions
  VIEW_VEHICLES: 'view_vehicle',
  CREATE_VEHICLES: 'add_vehicle',
  EDIT_VEHICLES: 'change_vehicle',
  DELETE_VEHICLES: 'delete_vehicle',
  
  // Device permissions
  VIEW_DEVICES: 'view_device',
  CREATE_DEVICES: 'add_device',
  EDIT_DEVICES: 'change_device',
  DELETE_DEVICES: 'delete_device',
  
  // User permissions
  VIEW_USERS: 'view_user',
  CREATE_USERS: 'add_user',
  EDIT_USERS: 'change_user',
  DELETE_USERS: 'delete_user',
  
  // Recharge permissions
  VIEW_RECHARGES: 'view_recharge',
  CREATE_RECHARGES: 'add_recharge',
  EDIT_RECHARGES: 'change_recharge',
  DELETE_RECHARGES: 'delete_recharge',
  
  // Report permissions
  VIEW_REPORTS: 'view_report',
  GENERATE_REPORTS: 'generate_report',
  
  // Live tracking permissions
  VIEW_LIVE_TRACKING: 'view_live_tracking',
  CONTROL_RELAY: 'control_relay',
  
  // Geofence permissions
  VIEW_GEOFENCES: 'view_geofence',
  CREATE_GEOFENCES: 'add_geofence',
  EDIT_GEOFENCES: 'change_geofence',
  DELETE_GEOFENCES: 'delete_geofence',
} as const;

// Role-based access helper functions
export const hasRole = (user: User, allowedRoles: string[]): boolean => {
  if (!user?.roles || user.roles.length === 0) {
    return false;
  }
  
  return user.roles.some(userRole => 
    allowedRoles.some(allowedRole => {
      switch (allowedRole.toLowerCase()) {
        case 'super admin':
          return userRole.name === ROLES.SUPER_ADMIN;
        case 'dealer':
          return userRole.name === ROLES.DEALER;
        case 'customer':
          return userRole.name === ROLES.CUSTOMER;
        default:
          return userRole.name === allowedRole;
      }
    })
  );
};

// Permission-based access helper functions
export const hasPermission = (user: User, permission: string): boolean => {
  if (!user?.permissions) {
    return false;
  }
  
  return user.permissions.includes(permission);
};

export const hasAnyPermission = (user: User, permissions: string[]): boolean => {
  if (!user?.permissions) {
    return false;
  }
  
  return permissions.some(permission => user.permissions.includes(permission));
};

export const hasAllPermissions = (user: User, permissions: string[]): boolean => {
  if (!user?.permissions) {
    return false;
  }
  
  return permissions.every(permission => user.permissions.includes(permission));
};

// Convenience functions for common role checks (now using Django Groups)
export const isSuperAdmin = (user: User): boolean => {
  return user?.roles?.some(role => role.name === ROLES.SUPER_ADMIN) || false;
};

export const isDealer = (user: User): boolean => {
  return user?.roles?.some(role => role.name === ROLES.DEALER) || false;
};

export const isCustomer = (user: User): boolean => {
  return user?.roles?.some(role => role.name === ROLES.CUSTOMER) || false;
};

// Dynamic permission checker - replaces all hardcoded permission functions
export const can = (user: User, permission: string): boolean => {
  return hasPermission(user, permission);
};

// Dynamic permission checker for multiple permissions
export const canAny = (user: User, permissions: string[]): boolean => {
  return hasAnyPermission(user, permissions);
};

export const canAll = (user: User, permissions: string[]): boolean => {
  return hasAllPermissions(user, permissions);
};

// Helper function to check if user can perform any action on a resource
export const canPerformAction = (user: User, resource: string, action: string): boolean => {
  const permission = `${action}_${resource}`.toLowerCase();
  return hasPermission(user, permission);
};

// Helper function to check if user can view a resource
export const canView = (user: User, resource: string): boolean => {
  return canPerformAction(user, resource, 'view');
};

// Helper function to check if user can create a resource
export const canCreate = (user: User, resource: string): boolean => {
  return canPerformAction(user, resource, 'add');
};

// Helper function to check if user can edit a resource
export const canEdit = (user: User, resource: string): boolean => {
  return canPerformAction(user, resource, 'change');
};

// Helper function to check if user can delete a resource
export const canDelete = (user: User, resource: string): boolean => {
  return canPerformAction(user, resource, 'delete');
};

// Backward compatibility - keep some common functions for easier migration
export const canViewVehicles = (user: User): boolean => {
  return canView(user, 'vehicle');
};

export const canCreateVehicles = (user: User): boolean => {
  return canCreate(user, 'vehicle');
};

export const canEditVehicles = (user: User): boolean => {
  return canEdit(user, 'vehicle');
};

export const canDeleteVehicles = (user: User): boolean => {
  return canDelete(user, 'vehicle');
};

export const canViewDevices = (user: User): boolean => {
  return canView(user, 'device');
};

export const canCreateDevices = (user: User): boolean => {
  return canCreate(user, 'device');
};

export const canEditDevices = (user: User): boolean => {
  return canEdit(user, 'device');
};

export const canDeleteDevices = (user: User): boolean => {
  return canDelete(user, 'device');
};

export const canViewUsers = (user: User): boolean => {
  return canView(user, 'user');
};

export const canCreateUsers = (user: User): boolean => {
  return canCreate(user, 'user');
};

export const canEditUsers = (user: User): boolean => {
  return canEdit(user, 'user');
};

export const canDeleteUsers = (user: User): boolean => {
  return canDelete(user, 'user');
};

export const canViewRecharges = (user: User): boolean => {
  return canView(user, 'recharge');
};

export const canCreateRecharges = (user: User): boolean => {
  return canCreate(user, 'recharge');
};

export const canViewReports = (user: User): boolean => {
  return canView(user, 'report');
};

export const canGenerateReports = (user: User): boolean => {
  return hasPermission(user, PERMISSIONS.GENERATE_REPORTS);
};

export const canViewLiveTracking = (user: User): boolean => {
  return hasPermission(user, PERMISSIONS.VIEW_LIVE_TRACKING);
};

export const canControlRelay = (user: User): boolean => {
  return hasPermission(user, PERMISSIONS.CONTROL_RELAY);
};

export const canViewGeofences = (user: User): boolean => {
  return canView(user, 'geofence');
};

export const canCreateGeofences = (user: User): boolean => {
  return canCreate(user, 'geofence');
};

export const canEditGeofences = (user: User): boolean => {
  return canEdit(user, 'geofence');
};

export const canDeleteGeofences = (user: User): boolean => {
  return canDelete(user, 'geofence');
};

