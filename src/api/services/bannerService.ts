import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type { Banner, BannerCreateData, BannerUpdateData } from '../../types/banner';

class BannerService {
  async getAllBanners(): Promise<{ success: boolean; data?: Banner[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/shared/banner/all', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch banners' };
      }
    } catch (error) {
      console.error('Get banners error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getBannerById(id: number): Promise<{ success: boolean; data?: Banner; error?: string }> {
    try {
      const response = await apiClient.get(`/api/shared/banner/${id}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch banner' };
      }
    } catch (error) {
      console.error('Get banner error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createBanner(data: BannerCreateData): Promise<{ success: boolean; data?: Banner; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.url !== undefined) {
        formData.append('url', data.url || '');
      }
      formData.append('isActive', data.isActive.toString());
      formData.append('orderPosition', (data.orderPosition ?? 0).toString());
      
      if (data.image) {
        formData.append('image', data.image);
      }

      const response = await apiClient.post('/api/shared/banner/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create banner' };
      }
    } catch (error) {
      console.error('Create banner error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateBanner(id: number, data: BannerUpdateData): Promise<{ success: boolean; data?: Banner; error?: string }> {
    try {
      const formData = new FormData();
      
      if (data.title !== undefined) formData.append('title', data.title);
      // If url is explicitly provided (even if empty string), send it to clear/update
      // If undefined, don't send it (keep existing value)
      if (data.url !== undefined && data.url !== null) {
        // Ensure we never send the string "undefined"
        const urlValue = (data.url === 'undefined' || data.url === 'null') ? '' : (data.url || '');
        formData.append('url', urlValue);
      }
      if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());
      if (data.orderPosition !== undefined) formData.append('orderPosition', data.orderPosition.toString());
      
      if (data.image !== undefined) {
        if (data.image) {
          formData.append('image', data.image);
        }
      }

      const response = await apiClient.put(`/api/shared/banner/update/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update banner' };
      }
    } catch (error) {
      console.error('Update banner error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deleteBanner(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/shared/banner/delete/${id}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete banner' };
      }
    } catch (error) {
      console.error('Delete banner error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const bannerService = new BannerService();

