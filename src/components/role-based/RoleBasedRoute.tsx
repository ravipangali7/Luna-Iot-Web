import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { hasRole, hasAnyPermission, hasAllPermissions } from '../../utils/roleUtils';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  requireAllPermissions?: boolean; // If true, user must have ALL permissions; if false, ANY permission
  fallbackPath?: string;
  fallbackComponent?: React.ReactNode;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  requireAllPermissions = false,
  fallbackPath = '/live-tracking',
  fallbackComponent
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !hasRole(user, allowedRoles)) {
    return fallbackComponent ? <>{fallbackComponent}</> : <Navigate to={fallbackPath} replace />;
  }

  // Check permission-based access
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions 
      ? hasAllPermissions(user, requiredPermissions)
      : hasAnyPermission(user, requiredPermissions);
    
    if (!hasRequiredPermissions) {
      return fallbackComponent ? <>{fallbackComponent}</> : <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
