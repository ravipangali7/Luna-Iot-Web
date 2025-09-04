import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../api/services/authService';
import type { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
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
        
        console.log('Checking existing auth, token:', token ? 'exists' : 'none', 'phone:', phone ? 'exists' : 'none');
        
        if (token && phone) {
          // Try to get current user info
          console.log('Token and phone found, calling getCurrentUser...');
          const response = await authService.getCurrentUser();
          console.log('getCurrentUser response:', response);
          
          if (response.success && response.user) {
            console.log('User data retrieved successfully:', response.user);
            setUser(response.user);
          } else {
            console.log('getCurrentUser failed, clearing invalid credentials');
            // Clear invalid credentials
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };