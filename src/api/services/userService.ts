import { apiClient } from '../apiClient';
import type { User } from '../../types/auth';
import type { PaginatedResponse, PaginationParams } from '../../types/pagination';

class UserService {
  async getLightUsers(): Promise<{ success: boolean; data?: Array<{ id: number; name: string; phone: string; status: string }>; error?: string }> {
    try {
      const response = await apiClient.get('/api/core/user/users/light', {
        timeout: 30000 // 30 seconds should be enough for optimized endpoint
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch users' };
      }
    } catch (error) {
      console.error('Get light users error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

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

  async getUsersPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<User>> {
    try {
      const { page = 1, page_size = 20, search = '' } = params;
      
      const response = await apiClient.get('/api/core/user/users/paginated', {
        params: { page, page_size, search },
        timeout: 30000
      });
      
      if (response.data.success) {
        return {
          success: true,
          data: {
            items: response.data.data.users,
            pagination: response.data.data.pagination,
            search_query: response.data.data.search_query
          }
        };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
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

  async searchUsersByPhones(phoneNumbers: string[]): Promise<{ success: boolean; data?: User[]; error?: string }> {
    try {
      // Filter out empty phone numbers and trim whitespace
      const validPhones = phoneNumbers
        .map(phone => phone.trim())
        .filter(phone => phone.length > 0);
      
      if (validPhones.length === 0) {
        return { success: false, error: 'No valid phone numbers provided' };
      }

      // Search for each phone number in parallel
      const searchPromises = validPhones.map(phone => 
        this.getUserByPhone(phone).catch(() => ({ success: false, data: undefined, error: `User not found for ${phone}` }))
      );

      const results = await Promise.all(searchPromises);
      
      // Filter successful results and collect users
      const users: User[] = [];
      const errors: string[] = [];
      
      results.forEach((result, index) => {
        if (result.success && result.data) {
          users.push(result.data);
        } else {
          errors.push(`Phone ${validPhones[index]}: ${result.error || 'Not found'}`);
        }
      });

      return { 
        success: true, 
        data: users,
        error: errors.length > 0 ? errors.join('; ') : undefined
      };
    } catch (error) {
      console.error('Search users by phones error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }
}

export const userService = new UserService();
