import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type { 
  GarbageVehicle, 
  GarbageVehicleFormData, 
  GarbageVehicleList
} from '../../types/garbage';

class GarbageService {
  // ===== GARBAGE VEHICLE METHODS =====
  
  async getGarbageVehicles(): Promise<{ 
    success: boolean; 
    data?: Array<{ id: number; imei: string; name: string; vehicleNo: string; vehicleType: string; is_active: boolean }>; 
    error?: string 
  }> {
    try {
      const response = await apiClient.get(`/api/garbage/garbage-vehicle/vehicles/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicles' };
      }
    } catch (error) {
      console.error('Get garbage vehicles error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
  
  async getAllGarbageVehicles(page: number = 1, pageSize: number = 20, search?: string, instituteId?: number): Promise<{ 
    success: boolean; 
    data?: { garbage_vehicles: GarbageVehicleList[]; pagination: any }; 
    error?: string 
  }> {
    try {
      let url = `/api/garbage/garbage-vehicle/?page=${page}&page_size=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (instituteId) url += `&institute_id=${instituteId}`;
      
      const response = await apiClient.get(url);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch garbage vehicles' };
      }
    } catch (error) {
      console.error('Get garbage vehicles error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getGarbageVehicleById(vehicleId: number): Promise<{ success: boolean; data?: GarbageVehicle; error?: string }> {
    try {
      const response = await apiClient.get(`/api/garbage/garbage-vehicle/${vehicleId}/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch garbage vehicle' };
      }
    } catch (error) {
      console.error('Get garbage vehicle error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getGarbageVehiclesByInstitute(instituteId: number): Promise<{ success: boolean; data?: GarbageVehicleList[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/garbage/garbage-vehicle/by-institute/${instituteId}/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch garbage vehicles' };
      }
    } catch (error) {
      console.error('Get garbage vehicles by institute error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createGarbageVehicle(data: GarbageVehicleFormData): Promise<{ success: boolean; data?: GarbageVehicle; error?: string }> {
    try {
      const response = await apiClient.post(`/api/garbage/garbage-vehicle/create/`, data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create garbage vehicle' };
      }
    } catch (error: any) {
      console.error('Create garbage vehicle error:', error);
      const errorMessage = getErrorMessage(error);
      return { success: false, error: errorMessage };
    }
  }

  async updateGarbageVehicle(vehicleId: number, data: GarbageVehicleFormData): Promise<{ success: boolean; data?: GarbageVehicle; error?: string }> {
    try {
      const response = await apiClient.put(`/api/garbage/garbage-vehicle/${vehicleId}/update/`, data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update garbage vehicle' };
      }
    } catch (error: any) {
      console.error('Update garbage vehicle error:', error);
      const errorMessage = getErrorMessage(error);
      return { success: false, error: errorMessage };
    }
  }

  async deleteGarbageVehicle(vehicleId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/garbage/garbage-vehicle/${vehicleId}/delete/`);
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete garbage vehicle' };
      }
    } catch (error) {
      console.error('Delete garbage vehicle error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const garbageService = new GarbageService();

