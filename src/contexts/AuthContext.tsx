import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../api/services/authService';
import type { User } from '../types/auth';
import socketService from '../services/socketService';
import { 
  hasRole, 
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isSuperAdmin, 
  isDealer, 
  isCustomer,
  can,
  canAny,
  canAll,
  canView,
  canCreate,
  canEdit,
  canDelete,
  canPerformAction,
  canViewVehicles,
  canCreateVehicles,
  canEditVehicles,
  canDeleteVehicles,
  canViewDevices,
  canCreateDevices,
  canEditDevices,
  canDeleteDevices,
  canViewUsers,
  canCreateUsers,
  canEditUsers,
  canDeleteUsers,
  canViewRecharges,
  canCreateRecharges,
  canViewReports,
  canGenerateReports,
  canViewLiveTracking,
  canControlRelay,
  canViewGeofences,
  canCreateGeofences,
  canEditGeofences,
  canDeleteGeofences
} from '../utils/roleUtils';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  // Wallet methods
  updateWalletBalance: (balance: number) => void;
  refreshWalletBalance: () => Promise<void>;
  // Role-based helper methods
  hasRole: (allowedRoles: string[]) => boolean;
  isSuperAdmin: () => boolean;
  isDealer: () => boolean;
  isCustomer: () => boolean;
  // Permission-based helper methods
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  // Dynamic permission methods
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
  canAll: (permissions: string[]) => boolean;
  canView: (resource: string) => boolean;
  canCreate: (resource: string) => boolean;
  canEdit: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  canPerformAction: (resource: string, action: string) => boolean;
  // Convenience permission methods (backward compatibility)
  canViewVehicles: () => boolean;
  canCreateVehicles: () => boolean;
  canEditVehicles: () => boolean;
  canDeleteVehicles: () => boolean;
  canViewDevices: () => boolean;
  canCreateDevices: () => boolean;
  canEditDevices: () => boolean;
  canDeleteDevices: () => boolean;
  canViewUsers: () => boolean;
  canCreateUsers: () => boolean;
  canEditUsers: () => boolean;
  canDeleteUsers: () => boolean;
  canViewRecharges: () => boolean;
  canCreateRecharges: () => boolean;
  canViewReports: () => boolean;
  canGenerateReports: () => boolean;
  canViewLiveTracking: () => boolean;
  canControlRelay: () => boolean;
  canViewGeofences: () => boolean;
  canCreateGeofences: () => boolean;
  canEditGeofences: () => boolean;
  canDeleteGeofences: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on app initialization
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const phone = localStorage.getItem('phone');
        
        if (token && phone) {
          const response = await authService.getCurrentUser();
          
          if (response.success && response.user) {
            setUser(response.user);
            // Update socket service with current user for role-based access
            socketService.setCurrentUser(response.user);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('phone');
            setUser(null);
            // Clear user from socket service
            socketService.setCurrentUser(null);
          }
        } else {
          setUser(null);
          // Clear user from socket service
          socketService.setCurrentUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear credentials on error
        localStorage.removeItem('token');
        localStorage.removeItem('phone');
        setUser(null);
        // Clear user from socket service
        socketService.setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingAuth();
  }, []);

  const login = async (phone: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authService.login(phone, password);
      
      if (response.success && response.user) {
        setUser(response.user);
        // Update socket service with current user for role-based access
        socketService.setCurrentUser(response.user);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // Clear user from socket service
    socketService.setCurrentUser(null);
    // authService.logout() will handle clearing localStorage
    authService.logout();
  };

  const updateWalletBalance = (balance: number) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        wallet: prevUser.wallet ? {
          ...prevUser.wallet,
          balance,
          updated_at: new Date().toISOString()
        } : {
          id: 0, // Placeholder ID
          balance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    });
  };

  const refreshWalletBalance = async () => {
    if (!user?.id) return;
    
    try {
      const { walletService } = await import('../api/services/walletService');
      const result = await walletService.getWalletByUser(user.id);
      
      if (result.success && result.data) {
        updateWalletBalance(result.data.balance);
      }
    } catch (error) {
      console.error('Error refreshing wallet balance:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    // Wallet methods
    updateWalletBalance,
    refreshWalletBalance,
    // Role-based helper methods
    hasRole: (allowedRoles: string[]) => user ? hasRole(user, allowedRoles) : false,
    isSuperAdmin: () => user ? isSuperAdmin(user) : false,
    isDealer: () => user ? isDealer(user) : false,
    isCustomer: () => user ? isCustomer(user) : false,
    // Permission-based helper methods
    hasPermission: (permission: string) => user ? hasPermission(user, permission) : false,
    hasAnyPermission: (permissions: string[]) => user ? hasAnyPermission(user, permissions) : false,
    hasAllPermissions: (permissions: string[]) => user ? hasAllPermissions(user, permissions) : false,
    // Dynamic permission methods
    can: (permission: string) => user ? can(user, permission) : false,
    canAny: (permissions: string[]) => user ? canAny(user, permissions) : false,
    canAll: (permissions: string[]) => user ? canAll(user, permissions) : false,
    canView: (resource: string) => user ? canView(user, resource) : false,
    canCreate: (resource: string) => user ? canCreate(user, resource) : false,
    canEdit: (resource: string) => user ? canEdit(user, resource) : false,
    canDelete: (resource: string) => user ? canDelete(user, resource) : false,
    canPerformAction: (resource: string, action: string) => user ? canPerformAction(user, resource, action) : false,
    // Convenience permission methods (backward compatibility)
    canViewVehicles: () => user ? canViewVehicles(user) : false,
    canCreateVehicles: () => user ? canCreateVehicles(user) : false,
    canEditVehicles: () => user ? canEditVehicles(user) : false,
    canDeleteVehicles: () => user ? canDeleteVehicles(user) : false,
    canViewDevices: () => user ? canViewDevices(user) : false,
    canCreateDevices: () => user ? canCreateDevices(user) : false,
    canEditDevices: () => user ? canEditDevices(user) : false,
    canDeleteDevices: () => user ? canDeleteDevices(user) : false,
    canViewUsers: () => user ? canViewUsers(user) : false,
    canCreateUsers: () => user ? canCreateUsers(user) : false,
    canEditUsers: () => user ? canEditUsers(user) : false,
    canDeleteUsers: () => user ? canDeleteUsers(user) : false,
    canViewRecharges: () => user ? canViewRecharges(user) : false,
    canCreateRecharges: () => user ? canCreateRecharges(user) : false,
    canViewReports: () => user ? canViewReports(user) : false,
    canGenerateReports: () => user ? canGenerateReports(user) : false,
    canViewLiveTracking: () => user ? canViewLiveTracking(user) : false,
    canControlRelay: () => user ? canControlRelay(user) : false,
    canViewGeofences: () => user ? canViewGeofences(user) : false,
    canCreateGeofences: () => user ? canCreateGeofences(user) : false,
    canEditGeofences: () => user ? canEditGeofences(user) : false,
    canDeleteGeofences: () => user ? canDeleteGeofences(user) : false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };