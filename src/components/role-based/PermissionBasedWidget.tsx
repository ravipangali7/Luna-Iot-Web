import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../../utils/roleUtils';

interface PermissionBasedWidgetProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions; if false, ANY permission
  fallback?: React.ReactNode;
}

const PermissionBasedWidget: React.FC<PermissionBasedWidgetProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null
}) => {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  // Check single permission
  if (permission && !hasPermission(user, permission)) {
    return fallback;
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(user, permissions)
      : hasAnyPermission(user, permissions);
    
    if (!hasRequiredPermissions) {
      return fallback;
    }
  }

  return <>{children}</>;
};

export default PermissionBasedWidget;
