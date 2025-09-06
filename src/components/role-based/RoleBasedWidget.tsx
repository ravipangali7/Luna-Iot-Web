import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { hasRole } from '../../utils/roleUtils';

interface RoleBasedWidgetProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

const RoleBasedWidget: React.FC<RoleBasedWidgetProps> = ({
  children,
  allowedRoles,
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

  return <>{children}</>;
};

export default RoleBasedWidget;
