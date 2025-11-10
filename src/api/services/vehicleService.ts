import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type { Vehicle, VehicleFormData,  } from '../../types/vehicle';

class VehicleService {
  async getAllVehicles(): Promise<{ success: boolean; data?: Vehicle[]; error?: string }> {
    try {

      const response = await apiClient.get(`/api/fleet/vehicle`, {
        timeout: 120000 // 2 minutes for large responses
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicles' };
      }
    } catch (error) {
      console.error('Get vehicles error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getAllVehiclesDetailed(): Promise<{ success: boolean; data?: Vehicle[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/fleet/vehicle/detailed`, {
        timeout: 120000 // 2 minutes for large responses
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch detailed vehicles' };
      }
    } catch (error) {
      console.error('Get detailed vehicles error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getVehiclesPaginated(page: number = 1): Promise<{ 
    success: boolean; 
    data?: { vehicles: Vehicle[]; pagination: any }; 
    error?: string 
  }> {
    try {
      const response = await apiClient.get(`/api/fleet/vehicle/paginated?page=${page}`, {
        timeout: 120000 // 2 minutes for large responses
      });
      
      if (response.data.success) {
        console.log(response.data.data)
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch paginated vehicles' };
      }
    } catch (error) {
      console.error('Get paginated vehicles error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async searchVehicles(query: string, page: number = 1): Promise<{ 
    success: boolean; 
    data?: { vehicles: Vehicle[]; pagination: any }; 
    error?: string 
  }> {
    try {
      const response = await apiClient.get(`/api/fleet/vehicle/search?q=${encodeURIComponent(query)}&page=${page}`, {
        timeout: 120000 // 2 minutes for large responses
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to search vehicles' };
      }
    } catch (error) {
      console.error('Search vehicles error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getVehicleByImei(imei: string): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
    try {
      const response = await apiClient.get(`/api/fleet/vehicle/${imei}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicle' };
      }
    } catch (error) {
      console.error('Get vehicle error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createVehicle(data: VehicleFormData): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
    try {
      const response = await apiClient.post('/api/fleet/vehicle/create', data, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create vehicle' };
      }
    } catch (error) {
      console.error('Create vehicle error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateVehicle(imei: string, data: VehicleFormData): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
    try {
      const response = await apiClient.put(`/api/fleet/vehicle/update/${imei}`, data, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update vehicle' };
      }
    } catch (error) {
      console.error('Update vehicle error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deleteVehicle(imei: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/fleet/vehicle/delete/${imei}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete vehicle' };
      }
    } catch (error) {
      console.error('Delete vehicle error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async assignVehicleAccessToUser(
    imei: string, 
    userPhone: string, 
    permissions: Record<string, boolean>
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await apiClient.post('/api/fleet/vehicle/access', {
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
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getVehiclesForAccessAssignment(): Promise<{ success: boolean; data?: Vehicle[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/fleet/vehicle/access/available', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicles for assignment' };
      }
    } catch (error) {
      console.error('Get vehicles for assignment error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getVehicleAccessAssignments(imei: string): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/fleet/vehicle/${imei}/access`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicle access assignments' };
      }
    } catch (error) {
      console.error('Get vehicle access assignments error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateVehicleAccess(
    imei: string, 
    userId: number, 
    permissions: Record<string, boolean>
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await apiClient.put('/api/fleet/vehicle/access', {
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

  async removeVehicleAccess(imei: string, userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete('/api/fleet/vehicle/access', {
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
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async activateVehicle(imei: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await apiClient.put(`/api/fleet/vehicle/${imei}/activate`, {}, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to activate vehicle' };
      }
    } catch (error) {
      console.error('Activate vehicle error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deactivateVehicle(imei: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await apiClient.put(`/api/fleet/vehicle/${imei}/deactivate`, {}, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to deactivate vehicle' };
      }
    } catch (error) {
      console.error('Deactivate vehicle error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getLightVehicles(): Promise<{ success: boolean; data?: Vehicle[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/fleet/vehicle/light`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch light vehicles' };
      }
    } catch (error) {
      console.error('Get light vehicles error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const vehicleService = new VehicleService();
