import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type {
  VehicleTag,
  VehicleTagAlert,
  VehicleTagAlertCreateData,
  VehicleTagListResponse,
  VehicleTagAlertListResponse,
} from '../../types/vehicleTag';

class VehicleTagService {
  async generateTags(count: number): Promise<{ success: boolean; data?: VehicleTag[]; error?: string }> {
    try {
      const response = await apiClient.post('/api/vehicle-tag/generate/', {
        count,
      }, {
        timeout: 30000,
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to generate tags' };
      }
    } catch (error) {
      console.error('Generate tags error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getAllTags(page: number = 1, pageSize: number = 25): Promise<{
    success: boolean;
    data?: VehicleTagListResponse;
    error?: string;
  }> {
    try {
      const response = await apiClient.get(`/api/vehicle-tag/?page=${page}&page_size=${pageSize}`, {
        timeout: 30000,
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch tags' };
      }
    } catch (error) {
      console.error('Get all tags error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getTagByVtid(vtid: string): Promise<{ success: boolean; data?: VehicleTag; error?: string }> {
    try {
      const response = await apiClient.get(`/api/vehicle-tag/${vtid}/`, {
        timeout: 30000,
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch tag' };
      }
    } catch (error) {
      console.error('Get tag by vtid error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createAlert(data: VehicleTagAlertCreateData): Promise<{
    success: boolean;
    data?: VehicleTagAlert;
    error?: string;
  }> {
    try {
      // Validate required fields
      if (data.latitude === undefined || data.longitude === undefined) {
        return { 
          success: false, 
          error: 'Location (latitude and longitude) is required to send alerts' 
        };
      }

      if (!data.person_image) {
        return { 
          success: false, 
          error: 'Image is required to send alerts' 
        };
      }

      const formData = new FormData();
      formData.append('vtid', data.vtid);
      formData.append('alert', data.alert);
      formData.append('latitude', data.latitude.toString());
      formData.append('longitude', data.longitude.toString());
      formData.append('person_image', data.person_image);

      const response = await apiClient.post('/api/vehicle-tag/alert/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create alert' };
      }
    } catch (error) {
      console.error('Create alert error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getTagsForBulkPrint(
    fromId: number,
    toId: number
  ): Promise<{ success: boolean; data?: VehicleTag[]; error?: string }> {
    try {
      const response = await apiClient.get(
        `/api/vehicle-tag/bulk-print/?from_id=${fromId}&to_id=${toId}`,
        {
          timeout: 30000,
        }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch tags for bulk print' };
      }
    } catch (error) {
      console.error('Get tags for bulk print error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateTag(id: number, data: Partial<VehicleTag>): Promise<{ success: boolean; data?: VehicleTag; error?: string }> {
    try {
      const response = await apiClient.put(`/api/vehicle-tag/update/${id}/`, data, {
        timeout: 30000,
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update tag' };
      }
    } catch (error) {
      console.error('Update tag error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deleteTag(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/vehicle-tag/delete/${id}/`, {
        timeout: 30000,
      });

      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete tag' };
      }
    } catch (error) {
      console.error('Delete tag error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getAlertHistory(
    page: number = 1,
    pageSize: number = 25,
    vtid?: string
  ): Promise<{ success: boolean; data?: VehicleTagAlertListResponse; error?: string }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (vtid) {
        params.append('vtid', vtid);
      }

      const response = await apiClient.get(`/api/vehicle-tag/history/?${params.toString()}`, {
        timeout: 30000,
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch alert history' };
      }
    } catch (error) {
      console.error('Get alert history error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getLatestAlertByVtid(vtid: string): Promise<{ success: boolean; data?: VehicleTagAlert; error?: string }> {
    try {
      const response = await apiClient.get(`/api/vehicle-tag/${vtid}/latest-alert/`, {
        timeout: 30000,
      });

      if (response.data.success) {
        return { success: true, data: response.data.data || undefined };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch latest alert' };
      }
    } catch (error) {
      console.error('Get latest alert error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  getQrImageUrl(vtid: string): string {
    const baseURL = apiClient.defaults.baseURL || '';
    return `${baseURL}/api/vehicle-tag/${vtid}/qr/`;
  }
}

export const vehicleTagService = new VehicleTagService();

