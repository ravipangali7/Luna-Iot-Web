import { apiClient } from '../apiClient';
import type { User } from '../../types/auth';

class UserService {
  async getAllUsers(): Promise<{ success: boolean; data?: User[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/core/user/users', {
        timeout: 120000 // 2 minutes for large responses
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch users' };
      }
    } catch (error) {
      console.error('Get users error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getUserByPhone(phone: string): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      const response = await apiClient.get(`/api/core/user/user/${phone}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch user' };
      }
    } catch (error) {
      console.error('Get user error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async createUser(data: Partial<User>): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      const response = await apiClient.post('/api/core/user/user/create', data, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create user' };
      }
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async updateUser(phone: string, data: Partial<User>): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      const response = await apiClient.put(`/api/core/user/user/${phone}`, data, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update user' };
      }
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async deleteUser(phone: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/core/user/user/${phone}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete user' };
      }
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async updateFcmToken(fcmToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.post('/api/core/user/fcm-token', {
        fcmToken
      }, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to update FCM token' };
      }
    } catch (error) {
      console.error('Update FCM token error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getAllRoles(): Promise<{ success: boolean; data?: Array<{ id: number; name: string }>; error?: string }> {
    try {
      const response = await apiClient.get('/api/core/roles', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch roles' };
      }
    } catch (error) {
      console.error('Get roles error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }
}

export const userService = new UserService();
