import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSchoolAccess } from '../../hooks/useSchoolAccess';
import { hasRole } from '../../utils/roleUtils';
import { ROLES } from '../../utils/roleUtils';

interface ModuleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  moduleType?: 'school' | 'alert-system'; // Type of module to check access for
  fallbackPath?: string;
  fallbackComponent?: React.ReactNode;
}

const ModuleBasedRoute: React.FC<ModuleBasedRouteProps> = ({
  children,
  allowedRoles = [],
  moduleType,
  fallbackPath = '/live-tracking',
  fallbackComponent
}) => {
  const { user, isLoading } = useAuth();
  const { hasAccess: hasSchoolAccess, loading: schoolAccessLoading } = useSchoolAccess();

  if (isLoading || (moduleType === 'school' && schoolAccessLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has role-based access (e.g., Super Admin)
  const hasRoleAccess = allowedRoles.length > 0 && hasRole(user, allowedRoles);
  
  // Check module-based access
  let hasModuleAccess = false;
  if (moduleType === 'school') {
    hasModuleAccess = hasSchoolAccess;
  }
  // Add other module types here as needed (e.g., alert-system)

  // Allow access if user has role-based access OR module-based access
  if (hasRoleAccess || hasModuleAccess) {
    return <>{children}</>;
  }

  // No access - redirect or show fallback
  return fallbackComponent ? <>{fallbackComponent}</> : <Navigate to={fallbackPath} replace />;
};

export default ModuleBasedRoute;

