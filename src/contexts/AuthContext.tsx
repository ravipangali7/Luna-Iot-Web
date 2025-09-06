import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../api/services/authService';
import type { User } from '../types/auth';
import { 
  hasRole, 
  isSuperAdmin, 
  isDealer, 
  isCustomer
} from '../utils/roleUtils';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  // Role-based helper methods
  hasRole: (allowedRoles: string[]) => boolean;
  isSuperAdmin: () => boolean;
  isDealer: () => boolean;
  isCustomer: () => boolean;
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
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('phone');
            setUser(null);
          }
        } else {
          console.log('No token or phone found, user not authenticated');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear credentials on error
        localStorage.removeItem('token');
        localStorage.removeItem('phone');
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log('Auth check completed, isLoading set to false');
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
        console.log('Login successful, user set and credentials saved');
        return true;
      } else {
        console.log('Login failed:', response);
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
    console.log('Logging out, clearing user and credentials');
    setUser(null);
    // authService.logout() will handle clearing localStorage
    authService.logout();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    // Role-based helper methods
    hasRole: (allowedRoles: string[]) => user ? hasRole(user, allowedRoles) : false,
    isSuperAdmin: () => user ? isSuperAdmin(user) : false,
    isDealer: () => user ? isDealer(user) : false,
    isCustomer: () => user ? isCustomer(user) : false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };