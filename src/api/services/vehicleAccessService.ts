import { apiClient } from '../apiClient';
import type { VehicleAccess, VehicleAccessFormData } from '../../types/vehicleAccess';
import type { Vehicle } from '../../types/vehicle';

class VehicleAccessService {
  // Get all vehicles with their access information (like Flutter)
  async getAllVehiclesWithAccess(): Promise<{ success: boolean; data?: Vehicle[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/vehicle/detailed', {
        timeout: 120000 // 2 minutes for large responses
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicles with access' };
      }
    } catch (error) {
      console.error('Get vehicles with access error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  // Get vehicle access assignments for a specific vehicle (like Flutter)
  async getVehicleAccessByVehicle(imei: string): Promise<{ success: boolean; data?: VehicleAccess[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/vehicle/${imei}/access`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicle access' };
      }
    } catch (error) {
      console.error('Get vehicle access by vehicle error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  // Create vehicle access (assign user to vehicle) - like Flutter
  async createVehicleAccess(data: VehicleAccessFormData): Promise<{ success: boolean; data?: VehicleAccess; error?: string }> {
    try {
      const response = await apiClient.post('/api/vehicle/access', {
        imei: data.imei,
        userId: data.userId,
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
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  // Update vehicle access permissions - like Flutter
  async updateVehicleAccess(imei: string, userId: number, permissions: Record<string, boolean>): Promise<{ success: boolean; data?: VehicleAccess; error?: string }> {
    try {
      const response = await apiClient.put('/api/vehicle/access', {
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
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  // Remove vehicle access (unassign user from vehicle) - like Flutter
  async deleteVehicleAccess(imei: string, userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete('/api/vehicle/access', {
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
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  // Get available users for vehicle access assignment
  async getAvailableUsers(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/users', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch users' };
      }
    } catch (error) {
      console.error('Get available users error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  // Get available vehicles for vehicle access assignment
  async getAvailableVehicles(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/vehicle', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicles' };
      }
    } catch (error) {
      console.error('Get available vehicles error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }
}

export const vehicleAccessService = new VehicleAccessService();
