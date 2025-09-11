import { apiClient } from '../apiClient';
import type { Vehicle, VehicleFormData,  } from '../../types/vehicle';

class VehicleService {
  async getAllVehicles(): Promise<{ success: boolean; data?: Vehicle[]; error?: string }> {
    try {

      const response = await apiClient.get(`/api/vehicle`, {
        timeout: 120000 // 2 minutes for large responses
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicles' };
      }
    } catch (error) {
      console.error('Get vehicles error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getAllVehiclesDetailed(): Promise<{ success: boolean; data?: Vehicle[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/vehicle/detailed`, {
        timeout: 120000 // 2 minutes for large responses
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch detailed vehicles' };
      }
    } catch (error) {
      console.error('Get detailed vehicles error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getVehicleByImei(imei: string): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
    try {
      const response = await apiClient.get(`/api/vehicle/${imei}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicle' };
      }
    } catch (error) {
      console.error('Get vehicle error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async createVehicle(data: VehicleFormData): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
    try {
      const response = await apiClient.post('/api/vehicle/create', data, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create vehicle' };
      }
    } catch (error) {
      console.error('Create vehicle error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async updateVehicle(imei: string, data: VehicleFormData): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
    try {
      const response = await apiClient.put(`/api/vehicle/update/${imei}`, data, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update vehicle' };
      }
    } catch (error) {
      console.error('Update vehicle error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async deleteVehicle(imei: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/vehicle/delete/${imei}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete vehicle' };
      }
    } catch (error) {
      console.error('Delete vehicle error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async assignVehicleAccessToUser(
    imei: string, 
    userPhone: string, 
    permissions: Record<string, boolean>
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await apiClient.post('/api/vehicle/access', {
        imei,
        userPhone,
        permissions
      }, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to assign vehicle access' };
      }
    } catch (error) {
      console.error('Assign vehicle access error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getVehiclesForAccessAssignment(): Promise<{ success: boolean; data?: Vehicle[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/vehicle/access/available', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicles for assignment' };
      }
    } catch (error) {
      console.error('Get vehicles for assignment error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getVehicleAccessAssignments(imei: string): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/vehicle/${imei}/access`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicle access assignments' };
      }
    } catch (error) {
      console.error('Get vehicle access assignments error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async updateVehicleAccess(
    imei: string, 
    userId: number, 
    permissions: Record<string, boolean>
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
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

  async removeVehicleAccess(imei: string, userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete('/api/vehicle/access', {
        data: { imei, userId },
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to remove vehicle access' };
      }
    } catch (error) {
      console.error('Remove vehicle access error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }
}

export const vehicleService = new VehicleService();
