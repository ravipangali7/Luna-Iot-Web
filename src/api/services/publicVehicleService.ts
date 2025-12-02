import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type { 
  PublicVehicle, 
  PublicVehicleFormData
} from '../../types/publicVehicle';

class PublicVehicleService {
  async getAllPublicVehicles(page: number = 1, pageSize: number = 20, search?: string, instituteId?: number): Promise<{ 
    success: boolean; 
    data?: { public_vehicles: PublicVehicle[]; pagination: any }; 
    error?: string 
  }> {
    try {
      let url = `/api/public-vehicle/public-vehicle/?page=${page}&page_size=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (instituteId) url += `&institute_id=${instituteId}`;
      
      const response = await apiClient.get(url);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch public vehicles' };
      }
    } catch (error) {
      console.error('Get public vehicles error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getPublicVehicleById(vehicleId: number): Promise<{ success: boolean; data?: PublicVehicle; error?: string }> {
    try {
      const response = await apiClient.get(`/api/public-vehicle/public-vehicle/${vehicleId}/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch public vehicle' };
      }
    } catch (error) {
      console.error('Get public vehicle error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getPublicVehiclesByInstitute(instituteId: number): Promise<{ success: boolean; data?: PublicVehicle[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/public-vehicle/public-vehicle/by-institute/${instituteId}/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch public vehicles' };
      }
    } catch (error) {
      console.error('Get public vehicles by institute error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getPublicVehicleVehicles(): Promise<{ 
    success: boolean; 
    data?: Array<{ id: number; imei: string; name: string; vehicleNo: string; vehicleType: string; is_active: boolean }>; 
    error?: string 
  }> {
    try {
      const response = await apiClient.get(`/api/public-vehicle/public-vehicle/vehicles/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicles' };
      }
    } catch (error) {
      console.error('Get public vehicle vehicles error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createPublicVehicle(data: PublicVehicleFormData): Promise<{ success: boolean; data?: PublicVehicle; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('institute', data.institute.toString());
      formData.append('vehicle', data.vehicle.toString());
      formData.append('description', data.description || '');
      formData.append('is_active', data.is_active.toString());
      
      // Append images
      if (data.images && data.images.length > 0) {
        data.images.forEach((image) => {
          formData.append('images', image);
        });
      }
      
      // Append image titles
      if (data.image_titles && data.image_titles.length > 0) {
        data.image_titles.forEach((title) => {
          formData.append('image_titles', title || '');
        });
      }
      
      const response = await apiClient.post(`/api/public-vehicle/public-vehicle/create/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create public vehicle' };
      }
    } catch (error: any) {
      console.error('Create public vehicle error:', error);
      const errorMessage = getErrorMessage(error);
      return { success: false, error: errorMessage };
    }
  }

  async updatePublicVehicle(vehicleId: number, data: PublicVehicleFormData): Promise<{ success: boolean; data?: PublicVehicle; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('institute', data.institute.toString());
      formData.append('vehicle', data.vehicle.toString());
      formData.append('description', data.description || '');
      formData.append('is_active', data.is_active.toString());
      
      // Append new images
      if (data.images && data.images.length > 0) {
        data.images.forEach((image) => {
          formData.append('images', image);
        });
      }
      
      // Append image titles for new images
      if (data.image_titles && data.image_titles.length > 0) {
        data.image_titles.forEach((title) => {
          formData.append('image_titles', title || '');
        });
      }
      
      // Append existing image titles
      if (data.existing_image_titles) {
        Object.keys(data.existing_image_titles).forEach((imageId) => {
          formData.append(`existing_image_titles[${imageId}]`, data.existing_image_titles![parseInt(imageId)] || '');
        });
      }
      
      // Append images to delete
      if (data.images_to_delete && data.images_to_delete.length > 0) {
        data.images_to_delete.forEach((imageId) => {
          formData.append('images_to_delete', imageId.toString());
        });
      }
      
      const response = await apiClient.put(`/api/public-vehicle/public-vehicle/${vehicleId}/update/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update public vehicle' };
      }
    } catch (error: any) {
      console.error('Update public vehicle error:', error);
      const errorMessage = getErrorMessage(error);
      return { success: false, error: errorMessage };
    }
  }

  async togglePublicVehicleActive(vehicleId: number, isActive: boolean): Promise<{ success: boolean; data?: PublicVehicle; error?: string }> {
    try {
      const response = await apiClient.patch(`/api/public-vehicle/public-vehicle/${vehicleId}/toggle-active/`, {
        is_active: isActive
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to toggle vehicle status' };
      }
    } catch (error) {
      console.error('Toggle public vehicle active error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deletePublicVehicle(vehicleId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/public-vehicle/public-vehicle/${vehicleId}/delete/`);
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete public vehicle' };
      }
    } catch (error) {
      console.error('Delete public vehicle error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const publicVehicleService = new PublicVehicleService();

