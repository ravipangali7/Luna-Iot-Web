import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { hasRole, hasAnyPermission, hasAllPermissions } from '../../utils/roleUtils';

interface RoleBasedWidgetProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  requireAllPermissions?: boolean; // If true, user must have ALL permissions; if false, ANY permission
  fallback?: React.ReactNode;
}

const RoleBasedWidget: React.FC<RoleBasedWidgetProps> = ({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  requireAllPermissions = false,
  fallback = null
}) => {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !hasRole(user, allowedRoles)) {
    return fallback;
  }

  // Check permission-based access
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions 
      ? hasAllPermissions(user, requiredPermissions)
      : hasAnyPermission(user, requiredPermissions);
    
    if (!hasRequiredPermissions) {
      return fallback;
    }
  }

  return <>{children}</>;
};

export default RoleBasedWidget;
