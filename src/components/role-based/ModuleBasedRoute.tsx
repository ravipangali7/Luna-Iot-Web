import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSchoolAccess } from '../../hooks/useSchoolAccess';
import { useGarbageAccess } from '../../hooks/useGarbageAccess';
import { useAlertSystemAccess } from '../../hooks/useAlertSystemAccess';
import { useCommunitySirenAccess } from '../../hooks/useCommunitySirenAccess';
import { usePublicVehicleAccess } from '../../hooks/usePublicVehicleAccess';
import { hasRole } from '../../utils/roleUtils';

interface ModuleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  moduleType?: 'school' | 'alert-system' | 'community-siren' | 'garbage' | 'public-vehicle'; // Type of module to check access for
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
  const { hasAccess: hasGarbageAccess, loading: garbageAccessLoading } = useGarbageAccess();
  const { hasAccess: hasAlertSystemAccess, loading: alertSystemAccessLoading } = useAlertSystemAccess();
  const { hasAccess: hasCommunitySirenAccess, loading: communitySirenAccessLoading } = useCommunitySirenAccess();
  const { hasAccess: hasPublicVehicleAccess, loading: publicVehicleAccessLoading } = usePublicVehicleAccess();

  if (isLoading || (moduleType === 'school' && schoolAccessLoading) || (moduleType === 'garbage' && garbageAccessLoading) || (moduleType === 'alert-system' && alertSystemAccessLoading) || (moduleType === 'community-siren' && communitySirenAccessLoading) || (moduleType === 'public-vehicle' && publicVehicleAccessLoading)) {
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
  } else if (moduleType === 'garbage') {
    hasModuleAccess = hasGarbageAccess;
  } else if (moduleType === 'alert-system') {
    hasModuleAccess = hasAlertSystemAccess;
  } else if (moduleType === 'community-siren') {
    hasModuleAccess = hasCommunitySirenAccess;
  } else if (moduleType === 'public-vehicle') {
    hasModuleAccess = hasPublicVehicleAccess;
  }

  // Allow access if user has role-based access OR module-based access
  // If no allowedRoles specified, allow module access only
  if (allowedRoles.length === 0) {
    // No role restriction - allow if user has module access
    if (hasModuleAccess) {
      return <>{children}</>;
    }
  } else {
    // Role restriction specified - allow if user has role access OR module access
    if (hasRoleAccess || hasModuleAccess) {
      return <>{children}</>;
    }
  }

  // No access - redirect or show fallback
  return fallbackComponent ? <>{fallbackComponent}</> : <Navigate to={fallbackPath} replace />;
};

export default ModuleBasedRoute;

