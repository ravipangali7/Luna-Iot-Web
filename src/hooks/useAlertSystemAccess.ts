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
          // Super Admin has access to all Alert Systems
          setHasAccess(true);
          setAccessibleInstitutes([]); // Admin doesn't need specific institute list
        } else {
          // Regular users need to check their institute module access
          const response = await apiClient.get<{ success: boolean; data: InstituteModuleAccess[] }>('/api/institutes/modules/alert-system-institutes/');
          
          if (response.data.success && response.data.data) {
            const institutes = response.data.data;
            setAccessibleInstitutes(institutes);
            setHasAccess(institutes.length > 0);
          } else {
            setAccessibleInstitutes([]);
            setHasAccess(false);
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
    if (isAdmin) {
      return true; // Super Admin has access to all institutes
    }
    
    // Check if user has access to this specific institute
    return accessibleInstitutes.some(inst => 
      inst.institute_id === instituteId && inst.has_alert_system_access
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
