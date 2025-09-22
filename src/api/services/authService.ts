import { apiClient } from '../apiClient';
import type { User } from '../../types/auth';

class AuthService {
  async login(phone: string, password: string) {
    try {
      const response = await apiClient.post('/api/core/auth/login', {
        phone,
        password,
      });
      
      
      // Check the actual API response success field
      if (response.data.success === true) {
        const userData = response.data.data as User;
        const token = userData.token || '';
        
        // Store both token and phone in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('phone', phone);
        
        return {
          success: true,
          user: userData,
          token: token,
        };
      } else {
        // API returned success: false
        return {
          success: false,
          error: response.data.message || 'Login failed',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error: ' + (error as Error).message,
      };
    }
  }

  async getCurrentUser() {
    try {
      const response = await apiClient.get('/api/core/auth/me');
      
      if (response.data.success === true) {
        const userData = response.data.data as User;
        
        if (userData) {
          return {
            success: true,
            user: userData,
          };
        }
      }
      
      return {
        success: false,
        error: response.data.message || 'Failed to get user info',
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: 'Failed to get user info: ' + (error as Error).message,
      };
    }
  }

  async logout() {
    try {
      await apiClient.post('/api/core/auth/logout');
      // Clear both token and phone on logout
      localStorage.removeItem('token');
      localStorage.removeItem('phone');
      return { success: true };
    } catch (error) {
      // Even if logout fails, clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('phone');
      return { success: false, error: error };
    }
  }
}

export const authService = new AuthService();