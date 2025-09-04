import { apiClient } from '../apiClient';
import type { Device, DeviceFormData } from '../../types/device';

class DeviceService {
  async getAllDevices(): Promise<{ success: boolean; data?: Device[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/device`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch devices' };
      }
    } catch (error) {
      console.error('Get devices error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getDeviceByImei(imei: string): Promise<{ success: boolean; data?: Device; error?: string }> {
    try {
      const response = await apiClient.get(`/api/device/${imei}`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch device' };
      }
    } catch (error) {
      console.error('Get device error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async createDevice(data: DeviceFormData): Promise<{ success: boolean; data?: Device; error?: string }> {
    try {
      const response = await apiClient.post('/api/device/create', data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create device' };
      }
    } catch (error) {
      console.error('Create device error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async updateDevice(imei: string, data: DeviceFormData): Promise<{ success: boolean; data?: Device; error?: string }> {
    try {
      const response = await apiClient.put(`/api/device/update/${imei}`, data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update device' };
      }
    } catch (error) {
      console.error('Update device error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async deleteDevice(imei: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/device/delete/${imei}`);
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete device' };
      }
    } catch (error) {
      console.error('Delete device error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async assignDeviceToUser(imei: string, userPhone: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await apiClient.post('/api/device/assign', {
        imei,
        userPhone
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to assign device' };
      }
    } catch (error) {
      console.error('Assign device error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async removeDeviceAssignment(imei: string, userPhone: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete('/api/device/assign', {
        data: { imei, userPhone },
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to remove device assignment' };
      }
    } catch (error) {
      console.error('Remove device assignment error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }
}

export const deviceService = new DeviceService();
