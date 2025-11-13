import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type { VehicleAccess, VehicleAccessFormData } from '../../types/vehicleAccess';
import type { Vehicle } from '../../types/vehicle';

class VehicleAccessService {
  // Get all vehicles with their access information (like Flutter)
  async getAllVehiclesWithAccess(): Promise<{ success: boolean; data?: Vehicle[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/fleet/vehicle/detailed', {
        timeout: 120000 // 2 minutes for large responses
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicles with access' };
      }
    } catch (error) {
      console.error('Get vehicles with access error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Get paginated vehicles with access information
  async getVehiclesWithAccessPaginated(page: number = 1): Promise<{ 
    success: boolean; 
    data?: { vehicles: Vehicle[]; pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      page_size: number;
      has_next: boolean;
      has_previous: boolean;
      next_page: number | null;
      previous_page: number | null;
    } }; 
    error?: string 
  }> {
    try {
      const response = await apiClient.get('/api/fleet/vehicle/access/paginated', {
        params: { page },
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch paginated vehicles with access' };
      }
    } catch (error) {
      console.error('Get paginated vehicles with access error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Search vehicles with access information
  async searchVehiclesWithAccess(query: string, page: number = 1): Promise<{ 
    success: boolean; 
    data?: { vehicles: Vehicle[]; pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      page_size: number;
      has_next: boolean;
      has_previous: boolean;
      next_page: number | null;
      previous_page: number | null;
    } }; 
    error?: string 
  }> {
    try {
      const response = await apiClient.get('/api/fleet/vehicle/access/search', {
        params: { q: query, page },
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to search vehicles with access' };
      }
    } catch (error) {
      console.error('Search vehicles with access error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Get vehicle access assignments for a specific vehicle (like Flutter)
  async getVehicleAccessByVehicle(imei: string): Promise<{ success: boolean; data?: VehicleAccess[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/fleet/vehicle/${imei}/access`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicle access' };
      }
    } catch (error) {
      console.error('Get vehicle access by vehicle error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Create vehicle access (assign user to vehicle) - like Flutter
  async createVehicleAccess(data: VehicleAccessFormData, userPhone?: string): Promise<{ success: boolean; data?: VehicleAccess; error?: string }> {
    try {
      const response = await apiClient.post('/api/fleet/vehicle/access', {
        imei: data.imei,
        userPhone: userPhone, // Send phone instead of userId
        permissions: data.permissions
      }, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create vehicle access' };
      }
    } catch (error) {
      console.error('Create vehicle access error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Update vehicle access permissions
  async updateVehicleAccess(imei: string, userPhone: string, permissions: Record<string, boolean>): Promise<{ success: boolean; data?: VehicleAccess; error?: string }> {
    try {
      // First get user ID from phone number
      const userResponse = await apiClient.get(`/api/core/user/user/${userPhone}`);
      if (!userResponse.data.success) {
        return { success: false, error: 'User not found' };
      }
      
      const userId = userResponse.data.data.id;
      
      const response = await apiClient.put('/api/fleet/vehicle/access/update', {
        imei,
        userId,
        permissions
      }, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update vehicle access' };
      }
    } catch (error) {
      console.error('Update vehicle access error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Remove vehicle access (unassign user from vehicle)
  async deleteVehicleAccess(imei: string, userPhone: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First get user ID from phone number
      const userResponse = await apiClient.get(`/api/core/user/user/${userPhone}`);
      if (!userResponse.data.success) {
        return { success: false, error: 'User not found' };
      }
      
      const userId = userResponse.data.data.id;
      
      const response = await apiClient.delete('/api/fleet/vehicle/access/remove', {
        data: { imei, userId },
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete vehicle access' };
      }
    } catch (error) {
      console.error('Delete vehicle access error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Remove vehicle access by user ID - for backend compatibility
  async deleteVehicleAccessById(imei: string, userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete('/api/fleet/vehicle/access', {
        data: { imei, userId },
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete vehicle access' };
      }
    } catch (error) {
      console.error('Delete vehicle access by ID error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Get available users for vehicle access assignment (using light endpoint for better performance)
  async getAvailableUsers(): Promise<{ success: boolean; data?: { id: number; name: string; phone: string; email?: string; status: string }[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/core/user/users/light', {
        timeout: 30000
      });
      
      if (response.data.success) {
        // Light users API returns: id, name, phone, status
        // Map to expected format (email is not in light users, so we'll set it as empty string)
        const users = response.data.data.map((user: { id: number; name: string; phone: string; status: string }) => ({
          id: user.id,
          name: user.name,
          phone: user.phone,
          status: user.status,
          email: '' // Light users API doesn't include email, set as empty string
        }));
        return { success: true, data: users };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch users' };
      }
    } catch (error) {
      console.error('Get available users error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Get available vehicles for vehicle access assignment
  async getAvailableVehicles(): Promise<{ success: boolean; data?: { id: number; imei: string; name: string; vehicleNo: string; vehicleType: string }[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/fleet/vehicle', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicles' };
      }
    } catch (error) {
      console.error('Get available vehicles error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Get vehicle access assignments for a specific vehicle (light version - faster)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getVehicleAccessAssignmentsLight(imei: string): Promise<{ success: boolean; data?: { vehicle: any; userVehicles: any[] }; error?: string }> {
    try {
      const response = await apiClient.get(`/api/fleet/vehicle/${imei}/access/light`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to get vehicle access assignments' };
      }
    } catch (error) {
      console.error('Get vehicle access assignments light error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Get vehicle access assignments for a specific vehicle (full version)
  async getVehicleAccessAssignments(imei: string): Promise<{ success: boolean; data?: VehicleAccess; error?: string }> {
    try {
      const response = await apiClient.get(`/api/fleet/vehicle/${imei}/access`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to get vehicle access assignments' };
      }
    } catch (error) {
      console.error('Get vehicle access assignments error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const vehicleAccessService = new VehicleAccessService();
