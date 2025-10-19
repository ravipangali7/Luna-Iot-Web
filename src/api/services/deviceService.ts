import { apiClient } from '../apiClient';
import type { Device, DeviceFormData } from '../../types/device';

class DeviceService {
  async getAllDevices(): Promise<{ success: boolean; data?: Device[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/device/device`);
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

  async getLightDevices(): Promise<{ success: boolean; data?: Device[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/device/device/light`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch devices' };
      }
    } catch (error) {
      console.error('Get light devices error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getDevicesPaginated(page: number = 1): Promise<{ 
    success: boolean; 
    data?: { devices: Device[]; pagination: { current_page: number; total_pages: number; total_items: number; has_next: boolean; has_previous: boolean } }; 
    error?: string 
  }> {
    try {
      const response = await apiClient.get(`/api/device/device/paginated?page=${page}`, {
        timeout: 120000 // 2 minutes for large responses
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch paginated devices' };
      }
    } catch (error) {
      console.error('Get paginated devices error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async searchDevices(query: string, page: number = 1): Promise<{ 
    success: boolean; 
    data?: { devices: Device[]; pagination: { current_page: number; total_pages: number; total_items: number; has_next: boolean; has_previous: boolean } }; 
    error?: string 
  }> {
    try {
      const response = await apiClient.get(`/api/device/device/search?q=${encodeURIComponent(query)}&page=${page}`, {
        timeout: 120000 // 2 minutes for large responses
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to search devices' };
      }
    } catch (error) {
      console.error('Search devices error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getDeviceByImei(imei: string): Promise<{ success: boolean; data?: Device; error?: string }> {
    try {
      const response = await apiClient.get(`/api/device/device/${imei}`);
      
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
      const response = await apiClient.post('/api/device/device/create', data);
      
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
      const response = await apiClient.put(`/api/device/device/update/${imei}`, data);
      
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
      const response = await apiClient.delete(`/api/device/device/delete/${imei}`);
      
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
      const response = await apiClient.post('/api/device/device/assign', {
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
      const response = await apiClient.delete('/api/device/device/assign', {
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

  async sendServerPoint(phone: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await apiClient.post('/api/device/device/server-point', {
        phone
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to send server point command' };
      }
    } catch (error) {
      console.error('Send server point error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async sendReset(phone: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await apiClient.post('/api/device/device/reset', {
        phone
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to send reset command' };
      }
    } catch (error) {
      console.error('Send reset error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async sendRelayOn(phone: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await apiClient.post('/api/device/device/relay-on', {
        phone
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to send relay on command' };
      }
    } catch (error) {
      console.error('Send relay on error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async sendRelayOff(phone: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await apiClient.post('/api/device/device/relay-off', {
        phone
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to send relay off command' };
      }
    } catch (error) {
      console.error('Send relay off error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getGpsDevicesPaginated(page: number = 1, query?: string): Promise<{ 
    success: boolean; 
    data?: { devices: Device[]; pagination: { current_page: number; total_pages: number; total_items: number; has_next: boolean; has_previous: boolean } }; 
    error?: string 
  }> {
    try {
      const url = query 
        ? `/api/device/device/gps/paginated?page=${page}&q=${encodeURIComponent(query)}`
        : `/api/device/device/gps/paginated?page=${page}`;
      
      const response = await apiClient.get(url, {
        timeout: 120000 // 2 minutes for large responses
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch GPS devices' };
      }
    } catch (error) {
      console.error('Get GPS devices error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getBuzzerDevicesPaginated(page: number = 1, query?: string): Promise<{ 
    success: boolean; 
    data?: { devices: Device[]; pagination: { current_page: number; total_pages: number; total_items: number; has_next: boolean; has_previous: boolean } }; 
    error?: string 
  }> {
    try {
      const url = query 
        ? `/api/device/device/buzzer/paginated?page=${page}&q=${encodeURIComponent(query)}`
        : `/api/device/device/buzzer/paginated?page=${page}`;
      
      const response = await apiClient.get(url, {
        timeout: 120000 // 2 minutes for large responses
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch Buzzer devices' };
      }
    } catch (error) {
      console.error('Get Buzzer devices error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getSosDevicesPaginated(page: number = 1, query?: string): Promise<{ 
    success: boolean; 
    data?: { devices: Device[]; pagination: { current_page: number; total_pages: number; total_items: number; has_next: boolean; has_previous: boolean } }; 
    error?: string 
  }> {
    try {
      const url = query 
        ? `/api/device/device/sos/paginated?page=${page}&q=${encodeURIComponent(query)}`
        : `/api/device/device/sos/paginated?page=${page}`;
      
      const response = await apiClient.get(url, {
        timeout: 120000 // 2 minutes for large responses
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch SOS devices' };
      }
    } catch (error) {
      console.error('Get SOS devices error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

}

export const deviceService = new DeviceService();
