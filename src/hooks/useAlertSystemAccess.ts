import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { ROLES } from '../utils/roleUtils';
import { apiClient } from '../api/apiClient';

interface InstituteModuleAccess {
  institute_id: number;
  institute_name: string;
  has_alert_system_access: boolean;
}

interface UseAlertSystemAccessReturn {
  hasAccess: boolean;
  loading: boolean;
  isAdmin: boolean;
  accessibleInstitutes: InstituteModuleAccess[];
  hasAccessToInstitute: (instituteId: number) => boolean;
}

export const useAlertSystemAccess = (instituteId?: number): UseAlertSystemAccessReturn => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessibleInstitutes, setAccessibleInstitutes] = useState<InstituteModuleAccess[]>([]);

  const isAdmin = user?.roles?.some(role => role.name === ROLES.SUPER_ADMIN) || false;

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);
        
        if (isAdmin) {
          // Admin has access to everything
          setHasAccess(true);
          setAccessibleInstitutes([]); // Admin doesn't need specific institute list
        } else {
          // Regular user - check their institute modules
          const response = await apiClient.get<{ data: InstituteModuleAccess[] }>(
            '/api/core/institute-module/alert-system-institutes/'
          );
          const institutes = response.data.data || [];
          setAccessibleInstitutes(institutes);
          
          if (instituteId) {
            // Check specific institute access
            const hasSpecificAccess = institutes.some(
              inst => inst.institute_id === instituteId && inst.has_alert_system_access
            );
            setHasAccess(hasSpecificAccess);
          } else {
            // General access check - user has access if they have any alert-system institutes
            setHasAccess(institutes.some(inst => inst.has_alert_system_access));
          }
        }
      } catch (error) {
        console.error('Error checking alert system access:', error);
        setHasAccess(false);
        setAccessibleInstitutes([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkAccess();
    } else {
      setLoading(false);
    }
  }, [user, instituteId, isAdmin]);

  const hasAccessToInstitute = useCallback((instituteId: number): boolean => {
    if (isAdmin) return true;
    return accessibleInstitutes.some(
      inst => inst.institute_id === instituteId && inst.has_alert_system_access
    );
  }, [isAdmin, accessibleInstitutes]);

  return {
    hasAccess,
    loading,
    isAdmin,
    accessibleInstitutes,
    hasAccessToInstitute
  };
};
